<?php

namespace App\Http\Controllers;

use App\Models\Agendamento;
use App\Models\AgendamentoConflito;
use App\Models\Espaco;
use App\Models\Recurso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AgendamentoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovacao.aprovadoPor']);

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

        // Verificar se já existe um agendamento com o mesmo título, espaço e período exato
        $agendamentoDuplicado = Agendamento::where('espaco_id', $validated['espaco_id'])
            ->where('titulo', $validated['titulo'])
            ->where('data_inicio', $validated['data_inicio'])
            ->where('hora_inicio', $validated['hora_inicio'])
            ->where('data_fim', $validated['data_fim'])
            ->where('hora_fim', $validated['hora_fim'])
            ->whereIn('status', ['pendente', 'aprovado'])
            ->first();

        if ($agendamentoDuplicado) {
            return back()->withErrors([
                'titulo' => 'Já existe um agendamento com o mesmo nome, local, data e horário. Por favor, altere pelo menos um desses dados para criar um novo agendamento.'
            ])->withInput();
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
            // Simplificar os dados dos conflitos para o frontend
            $conflitosSimplificados = $conflitos->map(function ($conflito) {
                return [
                    'id' => $conflito->id,
                    'titulo' => $conflito->titulo,
                    'data_inicio' => $conflito->data_inicio,
                    'hora_inicio' => $conflito->hora_inicio,
                    'hora_fim' => $conflito->hora_fim,
                    'status' => $conflito->status,
                    'user' => [
                        'name' => $conflito->user->name ?? 'Usuário não encontrado'
                    ]
                ];
            })->toArray();
            
            // Retornar como string JSON que o frontend pode parsear
            throw \Illuminate\Validation\ValidationException::withMessages([
                'conflitos' => json_encode($conflitosSimplificados)
            ]);
        }

        $validated['user_id'] = auth()->id();
        $validated['recursos_solicitados'] = $validated['recursos_solicitados'] ?? [];

        // Gerar índice de cor único baseado em dados únicos do agendamento
        $colorSeed = $validated['titulo'] . $validated['espaco_id'] . $validated['user_id'] . 
                     $validated['hora_inicio'] . $validated['hora_fim'] . $validated['justificativa'];
        
        // Obter color_index único (sem duplicatas)
        $validated['color_index'] = \App\Helpers\ColorHelper::generateUniqueColorIndex($colorSeed);

        // Se foi forçado com conflitos, apenas prosseguir sem modificar observações
        // A solicitação de prioridade será registrada através dos conflitos criados

        // Criar agendamentos (único ou recorrentes)
        $agendamentos = $this->criarAgendamentos($validated);
        $agendamento = $agendamentos->first(); // Para compatibilidade com o código existente

        // Se há conflitos, criar registros de conflito para cada agendamento criado
        if ($conflitos->isNotEmpty()) {
            foreach ($agendamentos as $novoAgendamento) {
                // Detectar conflitos específicos para este agendamento
                $conflitosEspecificos = $novoAgendamento->detectarConflitos();
                if ($conflitosEspecificos->isNotEmpty()) {
                    $novoAgendamento->criarConflito($conflitosEspecificos);
                }
            }
        }

        // Personalizar mensagem baseada na quantidade de agendamentos criados
        if ($agendamentos->count() > 1) {
            $message = "Solicitações de agendamento criadas com sucesso! {$agendamentos->count()} agendamentos recorrentes foram criados. Aguarde aprovação.";
        } else {
            $message = 'Solicitação de agendamento criada com sucesso! Aguarde aprovação.';
        }

        if ($conflitos->isNotEmpty()) {
            $message = $agendamentos->count() > 1
                ? "Solicitações de agendamento criadas! {$agendamentos->count()} agendamentos recorrentes foram criados. Há conflitos de horário que serão analisados pelo diretor."
                : 'Solicitação de agendamento criada! Há conflito de horário que será analisado pelo diretor.';
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
            'aprovacao.aprovadoPor',
            'recorrencia'
        ]);

        // Carregar recursos solicitados
        $recursosSolicitados = $agendamento->recursosSolicitados();

        // Todos os usuários podem visualizar agendamentos

        return Inertia::render('Agendamentos/Show', [
            'agendamento' => $agendamento,
            'recursosSolicitados' => $recursosSolicitados,
            'return_url' => request('return_url'),
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
        
        // Formatar data_inicio
        if ($agendamento->data_inicio) {
            if ($agendamento->data_inicio instanceof \Carbon\Carbon) {
                $agendamentoFormatado['data_inicio'] = $agendamento->data_inicio->format('Y-m-d');
            } else {
                // Se é uma string, tentar converter para o formato correto
                try {
                    $agendamentoFormatado['data_inicio'] = \Carbon\Carbon::parse($agendamento->data_inicio)->format('Y-m-d');
                } catch (\Exception $e) {
                    $agendamentoFormatado['data_inicio'] = $agendamento->data_inicio;
                }
            }
        } else {
            $agendamentoFormatado['data_inicio'] = '';
        }
        
        // Formatar data_fim
        if ($agendamento->data_fim) {
            if ($agendamento->data_fim instanceof \Carbon\Carbon) {
                $agendamentoFormatado['data_fim'] = $agendamento->data_fim->format('Y-m-d');
            } else {
                // Se é uma string, tentar converter para o formato correto
                try {
                    $agendamentoFormatado['data_fim'] = \Carbon\Carbon::parse($agendamento->data_fim)->format('Y-m-d');
                } catch (\Exception $e) {
                    $agendamentoFormatado['data_fim'] = $agendamento->data_fim;
                }
            }
        } else {
            $agendamentoFormatado['data_fim'] = '';
        }
        
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
            'force_update' => 'boolean',
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

        // Verificar se já existe um agendamento com o mesmo título, espaço e período exato (excluindo o atual)
        $agendamentoDuplicado = Agendamento::where('espaco_id', $validated['espaco_id'])
            ->where('titulo', $validated['titulo'])
            ->where('data_inicio', $validated['data_inicio'])
            ->where('hora_inicio', $validated['hora_inicio'])
            ->where('data_fim', $validated['data_fim'])
            ->where('hora_fim', $validated['hora_fim'])
            ->where('id', '!=', $agendamento->id)
            ->whereIn('status', ['pendente', 'aprovado'])
            ->first();

        if ($agendamentoDuplicado) {
            return back()->withErrors([
                'titulo' => 'Já existe um agendamento com o mesmo nome, local, data e horário. Por favor, altere pelo menos um desses dados para atualizar o agendamento.'
            ])->withInput();
        }

        // Verificar se realmente houve mudanças nos campos que podem gerar conflito
        $mudancasRelevantes = (
            $agendamento->espaco_id != $validated['espaco_id'] ||
            $agendamento->data_inicio != $validated['data_inicio'] ||
            $agendamento->hora_inicio != $validated['hora_inicio'] ||
            $agendamento->data_fim != $validated['data_fim'] ||
            $agendamento->hora_fim != $validated['hora_fim']
        );

        // Verificar conflitos atuais antes da edição
        $conflitosAnteriores = $agendamento->detectarConflitos();
        $tinhaConflito = $conflitosAnteriores->isNotEmpty();

        // Só verificar conflitos se houve mudanças relevantes
        $conflitos = collect();
        if ($mudancasRelevantes) {
            $temConflito = (new Agendamento())->temConflito(
                (int)$validated['espaco_id'],
                $validated['data_inicio'],
                $validated['hora_inicio'],
                $validated['data_fim'],
                $validated['hora_fim'],
                (int)$agendamento->id
            );

            if ($temConflito) {
                // Buscar os agendamentos conflitantes para mostrar ao usuário (PostgreSQL)
                $conflitos = Agendamento::where('espaco_id', $validated['espaco_id'])
                    ->whereIn('status', ['pendente', 'aprovado'])
                    ->where('id', '!=', $agendamento->id)
                    ->whereRaw("(data_inicio::text || ' ' || hora_inicio::text)::timestamp < (? || ' ' || ?)::timestamp", [$validated['data_fim'], $validated['hora_fim']])
                    ->whereRaw("(data_fim::text || ' ' || hora_fim::text)::timestamp > (? || ' ' || ?)::timestamp", [$validated['data_inicio'], $validated['hora_inicio']])
                    ->with(['user', 'espaco'])
                    ->get();
            }
        }

        // Verificar force_update de forma mais explícita
        $forceUpdate = $validated['force_update'] ?? false;
        if (is_string($forceUpdate)) {
            $forceUpdate = $forceUpdate === 'true' || $forceUpdate === '1';
        }
        

        
        // Se há conflitos e não foi forçado, retornar erro com os conflitos
        if ($conflitos->isNotEmpty() && !$forceUpdate) {
            // Simplificar os dados dos conflitos para o frontend
            $conflitosSimplificados = $conflitos->map(function ($conflito) {
                return [
                    'id' => $conflito->id,
                    'titulo' => $conflito->titulo,
                    'data_inicio' => $conflito->data_inicio,
                    'hora_inicio' => $conflito->hora_inicio,
                    'data_fim' => $conflito->data_fim,
                    'hora_fim' => $conflito->hora_fim,
                    'status' => $conflito->status,
                    'color_index' => $conflito->color_index,
                    'user' => [
                        'name' => $conflito->user->name ?? 'Usuário não encontrado'
                    ],
                    'espaco' => [
                        'nome' => $conflito->espaco->nome ?? 'Espaço não encontrado'
                    ]
                ];
            })->toArray();
            
            // Retornar como string JSON que o frontend pode parsear
            throw \Illuminate\Validation\ValidationException::withMessages([
                'conflitos' => json_encode($conflitosSimplificados)
            ]);
        }

        $validated['recursos_solicitados'] = $validated['recursos_solicitados'] ?? [];

        // Regenerar color_index único se houve mudança nos dados que afetam a cor
        $colorSeed = $validated['titulo'] . $validated['espaco_id'] . auth()->id() . 
                     $validated['hora_inicio'] . $validated['hora_fim'] . $validated['justificativa'];
        $validated['color_index'] = \App\Helpers\ColorHelper::generateUniqueColorIndex($colorSeed, $agendamento->id);

        // Remover force_update dos dados antes de salvar
        unset($validated['force_update']);

        // Atualizar o agendamento
        $agendamento->update($validated);

        // Gerenciar conflitos após a atualização (apenas se houve mudanças relevantes)
        if ($mudancasRelevantes) {
            $this->gerenciarConflitosAposEdicao($agendamento, $tinhaConflito, $conflitos, $conflitosAnteriores);
        }

        // Para requisições Inertia, retornar back() para permitir o redirecionamento pelo frontend
        if (request()->header('X-Inertia')) {
            return back()->with('success', 'Agendamento atualizado com sucesso!');
        }

        return redirect()->route('agendamentos.index')
            ->with('success', 'Agendamento atualizado com sucesso!');
    }

    /**
     * Gerenciar conflitos após edição do agendamento
     */
    private function gerenciarConflitosAposEdicao($agendamento, $tinhaConflito, $conflitosNovos, $conflitosAnteriores)
    {
        // Se tinha conflito antes e agora não tem mais, resolver conflitos antigos
        if ($tinhaConflito && $conflitosNovos->isEmpty()) {
            // Remover este agendamento dos conflitos antigos
            $agendamento->conflitos()->where('status_conflito', 'pendente')->delete();
            
            // Verificar se os agendamentos que estavam em conflito ainda têm conflitos entre si
            foreach ($conflitosAnteriores as $conflitanteAnterior) {
                $conflitosRestantes = $conflitanteAnterior->detectarConflitos();
                if ($conflitosRestantes->isEmpty()) {
                    // Se não tem mais conflitos, remover dos conflitos
                    $conflitanteAnterior->conflitos()->where('status_conflito', 'pendente')->delete();
                }
            }
        }

        // Se não tinha conflito antes e agora tem, criar novos conflitos
        if (!$tinhaConflito && $conflitosNovos->isNotEmpty()) {
            $agendamento->criarConflito($conflitosNovos);
        }

        // Se tinha conflito antes e ainda tem (mas possivelmente com agendamentos diferentes)
        if ($tinhaConflito && $conflitosNovos->isNotEmpty()) {
            // Usar transação para garantir atomicidade
            DB::transaction(function () use ($agendamento, $conflitosNovos) {
                // Remover TODOS os conflitos pendentes relacionados a este agendamento
                // para evitar duplicatas
                AgendamentoConflito::where('agendamento_id', $agendamento->id)
                    ->where('status_conflito', 'pendente')
                    ->delete();
                
                // Criar novos conflitos
                $agendamento->criarConflito($conflitosNovos);
            });
        }
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
        ]);

        // Criar ou atualizar registro de aprovação para cancelamento
        $agendamento->aprovacao()->updateOrCreate(
            ['agendamento_id' => $agendamento->id],
            [
                'aprovado_por' => auth()->id(),
                'aprovado_em' => now(),
                'motivo_rejeicao' => null, // Cancelamento não tem motivo de rejeição
                'motivo_cancelamento' => request('motivo_cancelamento'), // Motivo do cancelamento
            ]
        );

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

        
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovacao.aprovadoPor', 'conflitoAtivo'])
            ->representantesDeGrupo()
            ->comContadorGrupo();

        // Filtros
        if ($request->filled('espaco_id')) {
            $query->where('espaco_id', $request->espaco_id);
        }

        // Aplicar filtro de status apenas se não houver filtros específicos de aprovado_hoje ou rejeitado_hoje
        if ($request->filled('status') && !$request->filled('aprovado_hoje') && !$request->filled('rejeitado_hoje')) {
            // Se status for 'all', não aplicar filtro de status (mostrar todos)
            if ($request->status !== 'all') {
                $query->where('status', $request->status);
            }
        } else if (!$request->filled('status') && !$request->filled('aprovado_hoje') && !$request->filled('rejeitado_hoje') && !$request->filled('mes_atual')) {
            // Se não há filtro de status específico e não há filtros especiais, mostrar apenas pendentes por padrão
            $query->where('status', 'pendente');
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
                ->where(function($subQuery) {
                    // Tentar primeiro com a tabela de aprovacao
                    $subQuery->whereHas('aprovacao', function ($q) {
                        $q->whereDate('aprovado_em', today());
                    })
                    // Fallback: usar updated_at se não houver registro na tabela aprovacao
                    ->orWhere(function($fallbackQuery) {
                        $fallbackQuery->whereDoesntHave('aprovacao')
                            ->whereDate('updated_at', today());
                    });
                });
        }

        // Filtro específico para rejeitados hoje
        if ($request->filled('rejeitado_hoje') && $request->rejeitado_hoje === 'true') {
            $query->where('status', 'rejeitado')
                ->where(function($subQuery) {
                    // Tentar primeiro com a tabela de aprovacao
                    $subQuery->whereHas('aprovacao', function ($q) {
                        $q->whereDate('aprovado_em', today());
                    })
                    // Fallback: usar updated_at se não houver registro na tabela aprovacao
                    ->orWhere(function($fallbackQuery) {
                        $fallbackQuery->whereDoesntHave('aprovacao')
                            ->whereDate('updated_at', today());
                    });
                });
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
                ->whereHas('aprovacao', function ($q) use ($hoje) {
                    $q->whereRaw('DATE(aprovado_em) = ?', [$hoje]);
                })
                ->count(),
            'rejeitados_hoje' => Agendamento::representantesDeGrupo()
                ->where('status', 'rejeitado')
                ->whereHas('aprovacao', function ($q) use ($hoje) {
                    $q->whereRaw('DATE(aprovado_em) = ?', [$hoje]);
                })
                ->count(),
            'total_mes' => Agendamento::representantesDeGrupo()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'conflitos_pendentes' => \App\Models\AgendamentoConflito::pendentes()
                ->distinct('grupo_conflito')
                ->count('grupo_conflito'),
        ];

        return Inertia::render('Agendamentos/Avaliar', [
            'agendamentos' => $paginatedAgendamentos,
            'espacos' => $espacos,
            'estatisticas' => $estatisticas,
            'filters' => $request->only(['espaco_id', 'status', 'data_inicio', 'data_fim', 'solicitante', 'nome_agendamento', 'aprovado_hoje', 'rejeitado_hoje', 'mes_atual']),
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
                ]);

                // Criar registro de aprovação
                $agendamentoGrupo->aprovacao()->updateOrCreate(
                    ['agendamento_id' => $agendamentoGrupo->id],
                    [
                        'aprovado_por' => auth()->id(),
                        'aprovado_em' => now(),
                        'motivo_rejeicao' => null,
                        'motivo_cancelamento' => null,
                    ]
                );
            }

            $message = $totalAprovados > 1
                ? "Grupo de agendamentos recorrentes aprovado com sucesso! {$totalAprovados} agendamentos foram aprovados."
                : 'Agendamento aprovado com sucesso!';
        } else {
            // Agendamento individual
            $agendamento->update([
                'status' => 'aprovado',
            ]);

            // Criar registro de aprovação
            $agendamento->aprovacao()->updateOrCreate(
                ['agendamento_id' => $agendamento->id],
                [
                    'aprovado_por' => auth()->id(),
                    'aprovado_em' => now(),
                    'motivo_rejeicao' => null,
                    'motivo_cancelamento' => null,
                ]
            );

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
                ]);

                // Criar registro de rejeição
                $agendamentoGrupo->aprovacao()->updateOrCreate(
                    ['agendamento_id' => $agendamentoGrupo->id],
                    [
                        'aprovado_por' => auth()->id(),
                        'aprovado_em' => now(),
                        'motivo_rejeicao' => $validated['motivo_rejeicao'],
                        'motivo_cancelamento' => null,
                    ]
                );
            }

            $message = $totalRejeitados > 1
                ? "Grupo de agendamentos recorrentes rejeitado. {$totalRejeitados} agendamentos foram rejeitados."
                : 'Agendamento rejeitado.';
        } else {
            // Agendamento individual
            $agendamento->update([
                'status' => 'rejeitado',
            ]);

            // Criar registro de rejeição
            $agendamento->aprovacao()->updateOrCreate(
                ['agendamento_id' => $agendamento->id],
                [
                    'aprovado_por' => auth()->id(),
                    'aprovado_em' => now(),
                    'motivo_rejeicao' => $validated['motivo_rejeicao'],
                    'motivo_cancelamento' => null,
                ]
            );

            $message = 'Agendamento rejeitado.';
        }

        return back()->with('success', $message);
    }

    /**
     * Página de calendário avançado
     */
    public function calendario(Request $request)
    {
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovacao.aprovadoPor']);

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
        ]);

        // Remover registro de aprovação/cancelamento
        $agendamento->aprovacao()->delete();

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
                $agendamento = Agendamento::create($validated);
                $agendamentos->push($agendamento);
                return $agendamentos;
            } catch (\Exception $e) {
                throw $e;
            }
        }

        // Para agendamentos recorrentes, gerar um ID único para o grupo
        $grupoRecorrencia = 'rec_' . uniqid() . '_' . time();

        // Criar registro de recorrência PRIMEIRO (devido à foreign key constraint)
        try {
            \App\Models\AgendamentoRecorrencia::create([
                'grupo_recorrencia' => $grupoRecorrencia,
                'tipo_recorrencia' => $validated['tipo_recorrencia'],
                'data_fim_recorrencia' => $validated['data_fim_recorrencia'],
                'is_representante_grupo' => true,
            ]);
        } catch (\Exception $e) {
            throw new \Exception('Erro ao criar agendamento recorrente: ' . $e->getMessage());
        }

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

            try {
                $agendamento = Agendamento::create($dadosAgendamento);
                $agendamentos->push($agendamento);
                $primeiroAgendamento = false;
            } catch (\Exception $e) {
                // Continua criando os próximos agendamentos
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

