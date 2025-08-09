<?php

namespace App\Http\Controllers;

use App\Models\Agendamento;
use App\Models\Espaco;
use App\Models\Recurso;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AgendamentoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovadoPor']);

        // Filtros
        if ($request->filled('espaco_id')) {
            $query->where('espaco_id', $request->espaco_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('data_inicio')) {
            $query->whereDate('data_inicio', '>=', $request->data_inicio);
        }

        if ($request->filled('data_fim')) {
            $query->whereDate('data_fim', '<=', $request->data_fim);
        }

        if ($request->filled('nome')) {
            $query->whereRaw('LOWER(titulo) LIKE ?', ['%' . strtolower($request->nome) . '%']);
        }

        // Todos os usuários podem ver todos os agendamentos

        // Se for visualização de lista, usar paginação
        if ($request->get('view') === 'list') {
            $agendamentos = $query->orderBy('created_at', 'desc')
                ->orderBy('data_inicio', 'desc')
                ->orderBy('hora_inicio', 'desc')
                ->paginate(15);
        } else {
            // Para visualizações de calendário, buscar todos os agendamentos sem limitação de tempo
            $agendamentos = $query->orderBy('data_inicio')
                ->orderBy('hora_inicio')
                ->get();
        }

        $espacos = Espaco::where('disponivel_reserva', true)
            ->where('status', 'ativo')
            ->with('localizacao')
            ->orderBy('nome')
            ->get();

        return Inertia::render('Agendamentos/Index', [
            'agendamentos' => $agendamentos,
            'espacos' => $espacos,
            'filters' => $request->only(['espaco_id', 'status', 'data_inicio', 'data_fim', 'nome', 'view']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $espacos = Espaco::with(['localizacao', 'recursos'])
            ->where('disponivel_reserva', true)
            ->where('status', 'ativo')
            ->orderBy('nome')
            ->get();

        $recursos = Recurso::where('status', 'disponivel')
            ->orderBy('nome')
            ->get(['id', 'nome', 'descricao']);

        $espacoSelecionado = null;
        if ($request->filled('espaco_id')) {
            $espacoSelecionado = Espaco::with(['localizacao', 'recursos'])
                ->find($request->espaco_id);
        }

        return Inertia::render('Agendamentos/Create', [
            'espacos' => $espacos,
            'recursos' => $recursos,
            'espacoSelecionado' => $espacoSelecionado,
            'returnView' => $request->get('return_view'),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        \Log::info('🔍 [AGENDAMENTO DEBUG] Store method iniciado', [
            'timestamp' => now()->toISOString(),
            'user_id' => auth()->id(),
            'request_all' => $request->all(),
            'request_method' => $request->method(),
            'request_url' => $request->url(),
            'headers' => $request->headers->all()
        ]);

        $validated = $request->validate([
            'espaco_id' => 'required|exists:espacos,id',
            'titulo' => 'required|string|max:255',
            'justificativa' => 'required|string|max:1000',
            'data_inicio' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'data_fim' => 'required|date|after_or_equal:data_inicio',
            'hora_fim' => 'required|date_format:H:i',
            'observacoes' => 'nullable|string|max:500',
            'recursos_solicitados' => 'nullable|array',
            'recursos_solicitados.*' => 'exists:recursos,id',
            'recorrente' => 'boolean',
            'tipo_recorrencia' => 'nullable|in:diaria,semanal,mensal|required_if:recorrente,true',
            'data_fim_recorrencia' => 'nullable|date|after:data_fim|required_if:recorrente,true',
            'return_view' => 'nullable|string',
            'force_create' => 'boolean',
        ]);

        // Verificar se o espaço est�� disponível
        $espaco = Espaco::findOrFail($validated['espaco_id']);

        if (!$espaco->disponivel_reserva) {
            return back()->withErrors(['espaco_id' => 'Este espaço não está disponível para reserva.']);
        }

        // Validar horários (hora fim deve ser maior que hora início no mesmo dia)
        if (
            $validated['data_inicio'] === $validated['data_fim'] &&
            $validated['hora_fim'] <= $validated['hora_inicio']
        ) {
            return back()->withErrors(['hora_fim' => 'A hora de fim deve ser posterior à hora de início.']);
        }

        // Verificar conflitos de horário usando o método do modelo
        $temConflito = (new Agendamento())->temConflito(
            $validated['espaco_id'],
            $validated['data_inicio'],
            $validated['hora_inicio'],
            $validated['data_fim'],
            $validated['hora_fim']
        );

        $conflitos = collect();
        if ($temConflito) {
            // Buscar os agendamentos conflitantes para mostrar ao usuário
            $conflitos = Agendamento::where('espaco_id', $validated['espaco_id'])
                ->whereIn('status', ['pendente', 'aprovado'])
                ->where(function ($query) use ($validated) {
                    // Verificar sobreposição de períodos
                    $query->where(function ($q) use ($validated) {
                        // Caso 1: Agendamento existente começa antes e termina depois do início do novo
                        $q->where('data_inicio', '<=', $validated['data_inicio'])
                            ->where('data_fim', '>=', $validated['data_inicio'])
                            ->where(function ($timeQ) use ($validated) {
                                $timeQ->where('data_inicio', '<', $validated['data_inicio'])
                                    ->orWhere(function ($innerQ) use ($validated) {
                                        $innerQ->where('data_inicio', '=', $validated['data_inicio'])
                                            ->where('hora_inicio', '<', $validated['hora_fim']);
                                    });
                            })
                            ->where(function ($timeQ) use ($validated) {
                                $timeQ->where('data_fim', '>', $validated['data_inicio'])
                                    ->orWhere(function ($innerQ) use ($validated) {
                                        $innerQ->where('data_fim', '=', $validated['data_inicio'])
                                            ->where('hora_fim', '>', $validated['hora_inicio']);
                                    });
                            });
                    })->orWhere(function ($q) use ($validated) {
                        // Caso 2: Agendamento existente começa antes do fim do novo e termina depois
                        $q->where('data_inicio', '<=', $validated['data_fim'])
                            ->where('data_fim', '>=', $validated['data_fim'])
                            ->where(function ($timeQ) use ($validated) {
                                $timeQ->where('data_inicio', '<', $validated['data_fim'])
                                    ->orWhere(function ($innerQ) use ($validated) {
                                        $innerQ->where('data_inicio', '=', $validated['data_fim'])
                                            ->where('hora_inicio', '<', $validated['hora_fim']);
                                    });
                            });
                    })->orWhere(function ($q) use ($validated) {
                        // Caso 3: Agendamento existente está completamente dentro do novo período
                        $q->where('data_inicio', '>=', $validated['data_inicio'])
                            ->where('data_fim', '<=', $validated['data_fim'])
                            ->where(function ($timeQ) use ($validated) {
                                $timeQ->where('data_inicio', '>', $validated['data_inicio'])
                                    ->orWhere(function ($innerQ) use ($validated) {
                                        $innerQ->where('data_inicio', '=', $validated['data_inicio'])
                                            ->where('hora_inicio', '>=', $validated['hora_inicio']);
                                    });
                            })
                            ->where(function ($timeQ) use ($validated) {
                                $timeQ->where('data_fim', '<', $validated['data_fim'])
                                    ->orWhere(function ($innerQ) use ($validated) {
                                        $innerQ->where('data_fim', '=', $validated['data_fim'])
                                            ->where('hora_fim', '<=', $validated['hora_fim']);
                                    });
                            });
                    });
                })
                ->with(['user', 'espaco'])
                ->get();
        }

        // Se há conflitos e não foi forçado, retornar erro com os conflitos
        if ($conflitos->isNotEmpty() && !($validated['force_create'] ?? false)) {
            return back()->withErrors([
                'conflitos' => $conflitos
            ])->withInput();
        }

        $validated['user_id'] = auth()->id();
        $validated['recursos_solicitados'] = $validated['recursos_solicitados'] ?? [];

        // Se foi forçado com conflitos, marcar como prioridade alta
        if ($conflitos->isNotEmpty() && ($validated['force_create'] ?? false)) {
            $validated['observacoes'] = ($validated['observacoes'] ?? '') .
                "\n\n[SOLICITAÇÃO DE PRIORIDADE] Este agendamento foi solicitado com prioridade sobre agendamentos conflitantes.";
        }

        // Criar agendamentos (único ou recorrentes)
        $agendamentos = $this->criarAgendamentos($validated);
        $agendamento = $agendamentos->first(); // Para compatibilidade com o código existente

        // Personalizar mensagem baseada na quantidade de agendamentos criados
        if ($agendamentos->count() > 1) {
            $message = "Solicitações de agendamento criadas com sucesso! {$agendamentos->count()} agendamentos recorrentes foram criados. Aguarde aprovação.";
        } else {
            $message = 'Solicitação de agendamento criada com sucesso! Aguarde aprovação.';
        }

        if ($conflitos->isNotEmpty() && ($validated['force_create'] ?? false)) {
            $message = $agendamentos->count() > 1
                ? "Solicitações de agendamento com prioridade criadas! {$agendamentos->count()} agendamentos recorrentes foram criados. O diretor analisará os conflitos."
                : 'Solicitação de agendamento com prioridade criada! O diretor analisará os conflitos.';
        }

        // Verificar se deve voltar para o calendário
        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        $redirectRoute = 'agendamentos.index';
        if ($request->get('return_view') === 'calendar') {
            $redirectRoute = 'agendamentos.calendario';
        }

        return redirect()->route($redirectRoute)->with('success', $message);
    }

    /**
     * Display the specified resource.
     */
    public function show(Agendamento $agendamento)
    {
        $agendamento->load([
            'espaco.localizacao',
            'espaco.fotos',
            'espaco.recursos',
            'espaco.users',
            'espaco.createdBy',
            'espaco.updatedBy',
            'user',
            'aprovadoPor'
        ]);

        // Carregar recursos solicitados
        $recursosSolicitados = $agendamento->recursosSolicitados();

        // Todos os usuários podem visualizar agendamentos

        return Inertia::render('Agendamentos/Show', [
            'agendamento' => $agendamento,
            'recursosSolicitados' => $recursosSolicitados,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Agendamento $agendamento)
    {
        // Diretor geral pode editar qualquer agendamento, usuários comuns só podem editar seus próprios agendamentos pendentes
        if (auth()->user()->perfil_acesso !== 'diretor_geral' && ($agendamento->user_id !== auth()->id() || $agendamento->status !== 'pendente')) {
            abort(403, 'Você não pode editar este agendamento.');
        }

        $agendamento->load(['espaco']);

        // Garantir que as datas e horas estejam no formato correto
        $agendamentoFormatado = $agendamento->toArray();
        $agendamentoFormatado['data_inicio'] = $agendamento->data_inicio ? $agendamento->data_inicio->format('Y-m-d') : '';
        $agendamentoFormatado['data_fim'] = $agendamento->data_fim ? $agendamento->data_fim->format('Y-m-d') : '';
        $agendamentoFormatado['hora_inicio'] = $agendamento->hora_inicio ? substr($agendamento->hora_inicio, 0, 5) : '';
        $agendamentoFormatado['hora_fim'] = $agendamento->hora_fim ? substr($agendamento->hora_fim, 0, 5) : '';

        $espacos = Espaco::with(['localizacao', 'recursos'])
            ->where('disponivel_reserva', true)
            ->where('status', 'ativo')
            ->orderBy('nome')
            ->get();

        $recursos = Recurso::where('status', 'disponivel')
            ->orderBy('nome')
            ->get(['id', 'nome', 'descricao']);

        return Inertia::render('Agendamentos/Edit', [
            'agendamento' => $agendamentoFormatado,
            'espacos' => $espacos,
            'recursos' => $recursos,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Agendamento $agendamento)
    {
        // Diretor geral pode editar qualquer agendamento, usuários comuns só podem editar seus próprios agendamentos pendentes
        if (auth()->user()->perfil_acesso !== 'diretor_geral' && ($agendamento->user_id !== auth()->id() || $agendamento->status !== 'pendente')) {
            abort(403, 'Você não pode editar este agendamento.');
        }

        $validated = $request->validate([
            'espaco_id' => 'required|exists:espacos,id',
            'titulo' => 'required|string|max:255',
            'justificativa' => 'required|string|max:1000',
            'data_inicio' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'data_fim' => 'required|date|after_or_equal:data_inicio',
            'hora_fim' => 'required|date_format:H:i',
            'observacoes' => 'nullable|string|max:500',
            'recursos_solicitados' => 'nullable|array',
            'recursos_solicitados.*' => 'exists:recursos,id',
        ], [
            'hora_inicio.date_format' => 'O campo hora início deve corresponder ao formato H:i.',
            'hora_fim.date_format' => 'O campo hora fim deve corresponder ao formato H:i.',
            'data_fim.after_or_equal' => 'A data de fim deve ser igual ou posterior à data de início.',
        ]);

        // Verificar se o espaço está disponível
        $espaco = Espaco::findOrFail($validated['espaco_id']);

        if (!$espaco->disponivel_reserva) {
            return back()->withErrors(['espaco_id' => 'Este espaço não está disponível para reserva.']);
        }

        // Validar horários (hora fim deve ser maior que hora início no mesmo dia)
        if (
            $validated['data_inicio'] === $validated['data_fim'] &&
            $validated['hora_fim'] <= $validated['hora_inicio']
        ) {
            return back()->withErrors(['hora_fim' => 'A hora de fim deve ser posterior à hora de início.']);
        }

        // Verificar conflitos de horário (excluindo o agendamento atual)
        $temConflito = (new Agendamento())->temConflito(
            $validated['espaco_id'],
            $validated['data_inicio'],
            $validated['hora_inicio'],
            $validated['data_fim'],
            $validated['hora_fim'],
            $agendamento->id
        );

        if ($temConflito) {
            return back()->withErrors(['horario' => 'Já existe um agendamento para este espaço no horário solicitado.']);
        }

        $validated['recursos_solicitados'] = $validated['recursos_solicitados'] ?? [];

        $agendamento->update($validated);

        // Para requisições Inertia, retornar back() para permitir o redirecionamento pelo frontend
        if (request()->header('X-Inertia')) {
            return back()->with('success', 'Agendamento atualizado com sucesso!');
        }

        return redirect()->route('agendamentos.index')
            ->with('success', 'Agendamento atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Agendamento $agendamento)
    {
        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para cancelar este agendamento.');
        }

        $agendamento->update([
            'status' => 'cancelado',
            'aprovado_por' => auth()->id(),
            'aprovado_em' => now(),
        ]);

        // Para requisições Inertia, retornar back() para permanecer na mesma página
        if (request()->header('X-Inertia')) {
            return back()->with('success', 'Agendamento cancelado com sucesso!');
        }

        return redirect()->route('agendamentos.index')
            ->with('success', 'Agendamento cancelado com sucesso!');
    }

    /**
     * Página de gerenciamento de agendamentos para diretores
     */
    public function gerenciar(Request $request)
    {
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovadoPor'])
            ->representantesDeGrupo()
            ->comContadorGrupo();

        // Filtros
        if ($request->filled('espaco_id')) {
            $query->where('espaco_id', $request->espaco_id);
        }

        if ($request->filled('status')) {
            // Se status for 'all', não aplicar filtro de status (mostrar todos)
            if ($request->status !== 'all') {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('data_inicio')) {
            $query->whereDate('data_inicio', '>=', $request->data_inicio);
        }

        if ($request->filled('data_fim')) {
            $query->whereDate('data_fim', '<=', $request->data_fim);
        }

        if ($request->filled('solicitante')) {
            $query->whereHas('user', function ($userQuery) use ($request) {
                $userQuery->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($request->solicitante) . '%']);
            });
        }


        if ($request->filled('nome_agendamento')) {
            $query->whereRaw('LOWER(titulo) LIKE ?', ['%' . strtolower($request->nome_agendamento) . '%']);
        }

        // Filtro específico para aprovados hoje
        if ($request->filled('aprovado_hoje') && $request->aprovado_hoje === 'true') {
            $query->where('status', 'aprovado')
                ->whereDate('aprovado_em', today());
        }

        // Filtro específico para rejeitados hoje
        if ($request->filled('rejeitado_hoje') && $request->rejeitado_hoje === 'true') {
            $query->where('status', 'rejeitado')
                ->whereDate('aprovado_em', today());
        }

        // Filtro específico para agendamentos do mês atual
        if ($request->filled('mes_atual') && $request->mes_atual === 'true') {
            $query->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);
        }

        // Ordenação por agendamentos mais recentemente criados primeiro
        $agendamentos = $query->orderBy('created_at', 'desc')
            ->get();

        // Simular estrutura de paginação para compatibilidade com o frontend
        $perPage = max($agendamentos->count(), 1); //Impedir crash por quantidade de agendamentos == 0
        $paginatedAgendamentos = new \Illuminate\Pagination\LengthAwarePaginator(
            $agendamentos,
            $agendamentos->count(),
            $perPage,
            1,
            ['path' => request()->url()]
        );

        // Adicionar informações do grupo para cada agendamento
        $paginatedAgendamentos->getCollection()->transform(function ($agendamento) {
            $agendamento->info_grupo = $agendamento->info_grupo;
            return $agendamento;
        });

        $espacos = Espaco::where('disponivel_reserva', true)
            ->where('status', 'ativo')
            ->orderBy('nome')
            ->get(['id', 'nome']);

        // Estatísticas - contar apenas representantes de grupo para evitar duplicação
        $hoje = now()->format('Y-m-d');

        $estatisticas = [
            'pendentes' => Agendamento::representantesDeGrupo()->where('status', 'pendente')->count(),
            'aprovados_hoje' => Agendamento::representantesDeGrupo()
                ->where('status', 'aprovado')
                ->whereNotNull('aprovado_em')
                ->whereRaw('DATE(aprovado_em) = ?', [$hoje])
                ->count(),
            'rejeitados_hoje' => Agendamento::representantesDeGrupo()
                ->where('status', 'rejeitado')
                ->whereNotNull('aprovado_em')
                ->whereRaw('DATE(aprovado_em) = ?', [$hoje])
                ->count(),
            'total_mes' => Agendamento::representantesDeGrupo()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        return Inertia::render('Agendamentos/Gerenciar', [
            'agendamentos' => $paginatedAgendamentos,
            'espacos' => $espacos,
            'estatisticas' => $estatisticas,
            'filters' => $request->only(['espaco_id', 'status', 'data_inicio', 'data_fim', 'solicitante', 'nome_agendamento']),
        ]);
    }

    /**
     * Aprovar agendamento (individual ou grupo completo)
     */
    public function aprovar(Agendamento $agendamento)
    {
        // Apenas diretor geral pode aprovar
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para aprovar este agendamento.');
        }

        if ($agendamento->status !== 'pendente') {
            return back()->withErrors(['status' => 'Apenas agendamentos pendentes podem ser aprovados.']);
        }

        // Se faz parte de um grupo de recorrência, aprovar todos os agendamentos do grupo
        if ($agendamento->grupo_recorrencia) {
            $agendamentosDoGrupo = Agendamento::where('grupo_recorrencia', $agendamento->grupo_recorrencia)
                ->where('status', 'pendente')
                ->get();

            $totalAprovados = $agendamentosDoGrupo->count();

            foreach ($agendamentosDoGrupo as $agendamentoGrupo) {
                $agendamentoGrupo->update([
                    'status' => 'aprovado',
                    'aprovado_por' => auth()->id(),
                    'aprovado_em' => now(),
                ]);
            }

            $message = $totalAprovados > 1
                ? "Grupo de agendamentos recorrentes aprovado com sucesso! {$totalAprovados} agendamentos foram aprovados."
                : 'Agendamento aprovado com sucesso!';
        } else {
            // Agendamento individual
            $agendamento->update([
                'status' => 'aprovado',
                'aprovado_por' => auth()->id(),
                'aprovado_em' => now(),
            ]);

            $message = 'Agendamento aprovado com sucesso!';
        }

        return back()->with('success', $message);
    }

    /**
     * Rejeitar agendamento (individual ou grupo completo)
     */
    public function rejeitar(Request $request, Agendamento $agendamento)
    {
        // Apenas diretor geral pode rejeitar
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para rejeitar este agendamento.');
        }

        if ($agendamento->status !== 'pendente') {
            return back()->withErrors(['status' => 'Apenas agendamentos pendentes podem ser rejeitados.']);
        }

        $validated = $request->validate([
            'motivo_rejeicao' => 'required|string|max:500',
        ]);

        // Se faz parte de um grupo de recorrência, rejeitar todos os agendamentos do grupo
        if ($agendamento->grupo_recorrencia) {
            $agendamentosDoGrupo = Agendamento::where('grupo_recorrencia', $agendamento->grupo_recorrencia)
                ->where('status', 'pendente')
                ->get();

            $totalRejeitados = $agendamentosDoGrupo->count();

            foreach ($agendamentosDoGrupo as $agendamentoGrupo) {
                $agendamentoGrupo->update([
                    'status' => 'rejeitado',
                    'motivo_rejeicao' => $validated['motivo_rejeicao'],
                    'aprovado_por' => auth()->id(),
                    'aprovado_em' => now(),
                ]);
            }

            $message = $totalRejeitados > 1
                ? "Grupo de agendamentos recorrentes rejeitado. {$totalRejeitados} agendamentos foram rejeitados."
                : 'Agendamento rejeitado.';
        } else {
            // Agendamento individual
            $agendamento->update([
                'status' => 'rejeitado',
                'motivo_rejeicao' => $validated['motivo_rejeicao'],
                'aprovado_por' => auth()->id(),
                'aprovado_em' => now(),
            ]);

            $message = 'Agendamento rejeitado.';
        }

        return back()->with('success', $message);
    }

    /**
     * Página de calendário avançado
     */
    public function calendario(Request $request)
    {
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovadoPor']);

        // Todos os usuários podem ver todos os agendamentos no calendário

        // Buscar todos os agendamentos sem limitação de tempo para o calendário
        $agendamentos = $query->orderBy('data_inicio')
            ->orderBy('hora_inicio')
            ->get();

        $espacos = Espaco::where('disponivel_reserva', true)
            ->where('status', 'ativo')
            ->with('localizacao')
            ->orderBy('nome')
            ->get();

        return Inertia::render('Agendamentos/Calendar', [
            'agendamentos' => $agendamentos,
            'espacos' => $espacos,
            'filters' => $request->only(['espaco_id', 'view']),
        ]);
    }

    /**
     * Verificar disponibilidade de um espaço
     */
    public function verificarDisponibilidade(Request $request)
    {
        $validated = $request->validate([
            'espaco_id' => 'required|exists:espacos,id',
            'data_inicio' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'data_fim' => 'required|date',
            'hora_fim' => 'required|date_format:H:i',
            'agendamento_id' => 'nullable|exists:agendamentos,id',
        ]);

        $espaco = Espaco::findOrFail($validated['espaco_id']);

        $disponivel = $espaco->estaDisponivel(
            $validated['data_inicio'],
            $validated['hora_inicio'],
            $validated['data_fim'],
            $validated['hora_fim'],
            $validated['agendamento_id'] ?? null
        );

        return response()->json([
            'disponivel' => $disponivel,
            'espaco' => $espaco->nome,
        ]);
    }

    /**
     * Descancelar agendamento (voltar de cancelado para pendente)
     */
    public function descancelar(Agendamento $agendamento)
    {
        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para descancelar este agendamento.');
        }

        // Verificar se o agendamento está cancelado
        if ($agendamento->status !== 'cancelado') {
            return back()->withErrors(['status' => 'Apenas agendamentos cancelados podem ser descancelados.']);
        }

        $agendamento->update([
            'status' => 'pendente',
            'aprovado_por' => null,
            'aprovado_em' => null,
            'motivo_rejeicao' => null,
        ]);

        // Para requisições Inertia, retornar back() para permanecer na mesma página
        if (request()->header('X-Inertia')) {
            return back()->with('success', 'Agendamento descancelado com sucesso! Status alterado para pendente.');
        }

        return redirect()->route('agendamentos.index')
            ->with('success', 'Agendamento descancelado com sucesso! Status alterado para pendente.');
    }

    /**
     * Excluir agendamento permanentemente (apenas diretor geral)
     */
    public function forceDelete(Agendamento $agendamento)
    {
        // Verificar permissão - apenas diretor geral pode excluir permanentemente
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para excluir este agendamento.');
        }

        // Salvar informações para a mensagem
        $titulo = $agendamento->titulo;
        $espaco = $agendamento->espaco->nome ?? 'Espaço não encontrado';

        // Excluir permanentemente o agendamento
        $agendamento->delete();

        // Para requisições Inertia, redirecionar para a lista de agendamentos
        if (request()->header('X-Inertia')) {
            return redirect()->route('agendamentos.index')
                ->with('success', "Agendamento '{$titulo}' foi excluído permanentemente.");
        }

        return redirect()->route('agendamentos.index')
            ->with('success', "Agendamento '{$titulo}' foi excluído permanentemente.");
    }

    /**
     * Criar agendamentos (único ou recorrentes)
     */
    private function criarAgendamentos(array $validated)
    {
        $agendamentos = collect();

        // Se não é recorrente, criar apenas um agendamento
        if (!($validated['recorrente'] ?? false) || empty($validated['tipo_recorrencia']) || empty($validated['data_fim_recorrencia'])) {
            try {
                \Log::info('Criando agendamento único', $validated);
                $agendamento = Agendamento::create($validated);
                $agendamentos->push($agendamento);
                \Log::info('Agendamento criado com sucesso', ['id' => $agendamento->id]);
                return $agendamentos;
            } catch (\Exception $e) {
                \Log::error('Erro ao criar agendamento único: ' . $e->getMessage(), [
                    'validated' => $validated,
                    'exception' => $e->getTraceAsString()
                ]);
                throw $e;
            }
        }

        // Para agendamentos recorrentes, gerar um ID único para o grupo
        $grupoRecorrencia = 'rec_' . uniqid() . '_' . time();

        // Para agendamentos recorrentes, calcular as datas e horários
        $dataInicio = Carbon::parse($validated['data_inicio']);
        $dataFim = Carbon::parse($validated['data_fim']);
        $dataFimRecorrencia = Carbon::parse($validated['data_fim_recorrencia']);

        // Criar datetime completo com horários
        $horaInicio = Carbon::parse($validated['hora_inicio']);
        $horaFim = Carbon::parse($validated['hora_fim']);

        $dataHoraInicio = $dataInicio->copy()->setTime($horaInicio->hour, $horaInicio->minute);
        $dataHoraFim = $dataFim->copy()->setTime($horaFim->hour, $horaFim->minute);

        // Calcular a duração do agendamento original
        $duracaoEmMinutos = $dataHoraInicio->diffInMinutes($dataHoraFim);

        $dataHoraAtual = $dataHoraInicio->copy();
        $contador = 0;
        $maxAgendamentos = 8760; // Limite de segurança (365 dias * 24 horas)
        $primeiroAgendamento = true;

        while ($dataHoraAtual->toDateString() <= $dataFimRecorrencia->toDateString() && $contador < $maxAgendamentos) {
            // Calcular data e hora fim para este agendamento
            $dataHoraFimAtual = $dataHoraAtual->copy()->addMinutes($duracaoEmMinutos);

            // Criar dados para este agendamento
            $dadosAgendamento = $validated;
            $dadosAgendamento['data_inicio'] = $dataHoraAtual->toDateString();
            $dadosAgendamento['hora_inicio'] = $dataHoraAtual->format('H:i');
            $dadosAgendamento['data_fim'] = $dataHoraFimAtual->toDateString();
            $dadosAgendamento['hora_fim'] = $dataHoraFimAtual->format('H:i');
            $dadosAgendamento['grupo_recorrencia'] = $grupoRecorrencia;
            $dadosAgendamento['is_representante_grupo'] = $primeiroAgendamento;

            try {
                $agendamento = Agendamento::create($dadosAgendamento);
                $agendamentos->push($agendamento);
                $primeiroAgendamento = false;
            } catch (\Exception $e) {
                // Log do erro mas continua criando os próximos agendamentos
                \Log::warning("Erro ao criar agendamento recorrente para {$dataHoraAtual->format('Y-m-d H:i')}: " . $e->getMessage());
            }

            // Avançar para a próxima data/hora baseado no tipo de recorrência
            switch ($validated['tipo_recorrencia']) {
                case 'diaria':
                    $dataHoraAtual->addDay();
                    break;
                case 'semanal':
                    $dataHoraAtual->addWeek();
                    break;
                case 'mensal':
                    $dataHoraAtual->addMonth();
                    break;
            }

            $contador++;
        }

        return $agendamentos;
    }
}

