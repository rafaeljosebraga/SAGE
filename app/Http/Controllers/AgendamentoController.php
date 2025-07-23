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

        // Se não for diretor geral, mostrar apenas agendamentos próprios ou do espaço que gerencia
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            $query->where(function ($q) {
                $q->where('user_id', auth()->id())
                  ->orWhereHas('espaco', function ($espacoQuery) {
                      $espacoQuery->where('responsavel_id', auth()->id());
                  });
            });
        }

        // Se for visualização de lista, usar paginação
        if ($request->get('view') === 'list') {
            $agendamentos = $query->orderBy('data_inicio', 'desc')
                                 ->orderBy('hora_inicio', 'desc')
                                 ->paginate(15);
        } else {
            // Para visualizações de calendário, buscar todos os agendamentos dos próximos 3 meses
            $dataInicio = now()->startOfMonth();
            $dataFim = now()->addMonths(3)->endOfMonth();
            
            $agendamentos = $query->whereDate('data_inicio', '>=', $dataInicio)
                                 ->whereDate('data_inicio', '<=', $dataFim)
                                 ->orderBy('data_inicio')
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
            'filters' => $request->only(['espaco_id', 'status', 'data_inicio', 'data_fim', 'view']),
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
            'data_inicio' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'data_fim' => 'required|date|after_or_equal:data_inicio',
            'hora_fim' => 'required|date_format:H:i',
            'observacoes' => 'nullable|string|max:500',
            'recursos_solicitados' => 'nullable|array',
            'recursos_solicitados.*' => 'exists:recursos,id',
            'recorrente' => 'boolean',
            'tipo_recorrencia' => 'nullable|in:diaria,semanal,mensal',
            'data_fim_recorrencia' => 'nullable|date|after:data_fim',
            'return_view' => 'nullable|string',
            'force_create' => 'boolean',
        ]);

        // Verificar se o espaço est�� disponível
        $espaco = Espaco::findOrFail($validated['espaco_id']);
        
        if (!$espaco->disponivel_reserva) {
            return back()->withErrors(['espaco_id' => 'Este espaço não está disponível para reserva.']);
        }

        // Validar horários (hora fim deve ser maior que hora início no mesmo dia)
        if ($validated['data_inicio'] === $validated['data_fim'] && 
            $validated['hora_fim'] <= $validated['hora_inicio']) {
            return back()->withErrors(['hora_fim' => 'A hora de fim deve ser posterior à hora de início.']);
        }

        // Verificar conflitos de horário
        $conflitos = Agendamento::where('espaco_id', $validated['espaco_id'])
            ->whereIn('status', ['pendente', 'aprovado'])
            ->where(function ($query) use ($validated) {
                $query->where(function ($q) use ($validated) {
                    // Início do novo agendamento está dentro de um agendamento existente
                    $q->where('data_inicio', '<=', $validated['data_inicio'])
                      ->where('data_fim', '>=', $validated['data_inicio'])
                      ->where(function ($timeQuery) use ($validated) {
                          $timeQuery->where(function ($tq) use ($validated) {
                              $tq->where('data_inicio', '<', $validated['data_inicio'])
                                 ->orWhere(function ($innerTq) use ($validated) {
                                     $innerTq->where('data_inicio', '=', $validated['data_inicio'])
                                            ->where('hora_inicio', '<=', $validated['hora_inicio']);
                                 });
                          })->where(function ($tq) use ($validated) {
                              $tq->where('data_fim', '>', $validated['data_inicio'])
                                 ->orWhere(function ($innerTq) use ($validated) {
                                     $innerTq->where('data_fim', '=', $validated['data_inicio'])
                                            ->where('hora_fim', '>', $validated['hora_inicio']);
                                 });
                          });
                      });
                })->orWhere(function ($q) use ($validated) {
                    // Fim do novo agendamento está dentro de um agendamento existente
                    $q->where('data_inicio', '<=', $validated['data_fim'])
                      ->where('data_fim', '>=', $validated['data_fim'])
                      ->where(function ($timeQuery) use ($validated) {
                          $timeQuery->where(function ($tq) use ($validated) {
                              $tq->where('data_inicio', '<', $validated['data_fim'])
                                 ->orWhere(function ($innerTq) use ($validated) {
                                     $innerTq->where('data_inicio', '=', $validated['data_fim'])
                                            ->where('hora_inicio', '<', $validated['hora_fim']);
                                 });
                          })->where(function ($tq) use ($validated) {
                              $tq->where('data_fim', '>', $validated['data_fim'])
                                 ->orWhere(function ($innerTq) use ($validated) {
                                     $innerTq->where('data_fim', '=', $validated['data_fim'])
                                            ->where('hora_fim', '>=', $validated['hora_fim']);
                                 });
                          });
                      });
                })->orWhere(function ($q) use ($validated) {
                    // Novo agendamento engloba um agendamento existente
                    $q->where('data_inicio', '>=', $validated['data_inicio'])
                      ->where('data_fim', '<=', $validated['data_fim'])
                      ->where(function ($timeQuery) use ($validated) {
                          $timeQuery->where(function ($tq) use ($validated) {
                              $tq->where('data_inicio', '>', $validated['data_inicio'])
                                 ->orWhere(function ($innerTq) use ($validated) {
                                     $innerTq->where('data_inicio', '=', $validated['data_inicio'])
                                            ->where('hora_inicio', '>=', $validated['hora_inicio']);
                                 });
                          })->where(function ($tq) use ($validated) {
                              $tq->where('data_fim', '<', $validated['data_fim'])
                                 ->orWhere(function ($innerTq) use ($validated) {
                                     $innerTq->where('data_fim', '=', $validated['data_fim'])
                                            ->where('hora_fim', '<=', $validated['hora_fim']);
                                 });
                          });
                      });
                });
            })
            ->with(['user', 'espaco'])
            ->get();

        // Se há conflitos e não foi forçado, retornar erro com os conflitos
        if ($conflitos->isNotEmpty() && !($validated['force_create'] ?? false)) {
            return back()->withErrors([
                'conflitos' => $conflitos->toArray()
            ])->withInput();
        }

        $validated['user_id'] = auth()->id();
        $validated['recursos_solicitados'] = $validated['recursos_solicitados'] ?? [];

        // Se foi forçado com conflitos, marcar como prioridade alta
        if ($conflitos->isNotEmpty() && ($validated['force_create'] ?? false)) {
            $validated['observacoes'] = ($validated['observacoes'] ?? '') . 
                "\n\n[SOLICITAÇÃO DE PRIORIDADE] Este agendamento foi solicitado com prioridade sobre agendamentos conflitantes.";
        }

        $agendamento = Agendamento::create($validated);

        $message = 'Solicitação de agendamento criada com sucesso! Aguarde aprovação.';
        if ($conflitos->isNotEmpty() && ($validated['force_create'] ?? false)) {
            $message = 'Solicitação de agendamento com prioridade criada! O diretor analisará os conflitos.';
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
        $agendamento->load(['espaco.localizacao', 'user', 'aprovadoPor']);

        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral' && 
            $agendamento->user_id !== auth()->id() &&
            $agendamento->espaco->responsavel_id !== auth()->id()) {
            abort(403, 'Você não tem permissão para visualizar este agendamento.');
        }

        return Inertia::render('Agendamentos/Show', [
            'agendamento' => $agendamento,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Agendamento $agendamento)
    {
        // Apenas o solicitante pode editar agendamentos pendentes
        if ($agendamento->user_id !== auth()->id() || $agendamento->status !== 'pendente') {
            abort(403, 'Você não pode editar este agendamento.');
        }

        $agendamento->load(['espaco']);

        $espacos = Espaco::with(['localizacao', 'recursos'])
                         ->where('disponivel_reserva', true)
                         ->where('status', 'ativo')
                         ->orderBy('nome')
                         ->get();

        $recursos = Recurso::where('status', 'disponivel')
                          ->orderBy('nome')
                          ->get(['id', 'nome', 'descricao']);

        return Inertia::render('Agendamentos/Edit', [
            'agendamento' => $agendamento,
            'espacos' => $espacos,
            'recursos' => $recursos,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Agendamento $agendamento)
    {
        // Apenas o solicitante pode editar agendamentos pendentes
        if ($agendamento->user_id !== auth()->id() || $agendamento->status !== 'pendente') {
            abort(403, 'Você não pode editar este agendamento.');
        }

        $validated = $request->validate([
            'espaco_id' => 'required|exists:espacos,id',
            'titulo' => 'required|string|max:255',
            'justificativa' => 'required|string|max:1000',
            'data_inicio' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'data_fim' => 'required|date|after_or_equal:data_inicio',
            'hora_fim' => 'required|date_format:H:i',
            'observacoes' => 'nullable|string|max:500',
            'recursos_solicitados' => 'nullable|array',
            'recursos_solicitados.*' => 'exists:recursos,id',
        ]);

        // Verificar conflitos de horário (excluindo o agendamento atual)
        if ($agendamento->temConflito(
            $validated['espaco_id'],
            $validated['data_inicio'],
            $validated['hora_inicio'],
            $validated['data_fim'],
            $validated['hora_fim'],
            $agendamento->id
        )) {
            return back()->withErrors(['horario' => 'Já existe um agendamento para este espaço no horário solicitado.']);
        }

        $validated['recursos_solicitados'] = $validated['recursos_solicitados'] ?? [];

        $agendamento->update($validated);

        return redirect()->route('agendamentos.index')
                        ->with('success', 'Agendamento atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Agendamento $agendamento)
    {
        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral' && 
            $agendamento->user_id !== auth()->id()) {
            abort(403, 'Você não tem permissão para cancelar este agendamento.');
        }

        $agendamento->update(['status' => 'cancelado']);

        return redirect()->route('agendamentos.index')
                        ->with('success', 'Agendamento cancelado com sucesso!');
    }

    /**
     * Página de gerenciamento de agendamentos para diretores
     */
    public function gerenciar(Request $request)
    {
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovadoPor']);

        // Filtros
        if ($request->filled('espaco_id')) {
            $query->where('espaco_id', $request->espaco_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Por padrão, mostrar apenas pendentes
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
                $userQuery->where('name', 'like', '%' . $request->solicitante . '%');
            });
        }

        $agendamentos = $query->orderBy('created_at', 'desc')
                             ->paginate(15);

        $espacos = Espaco::where('disponivel_reserva', true)
                         ->where('status', 'ativo')
                         ->orderBy('nome')
                         ->get(['id', 'nome']);

        // Estatísticas
        $estatisticas = [
            'pendentes' => Agendamento::where('status', 'pendente')->count(),
            'aprovados_hoje' => Agendamento::where('status', 'aprovado')
                                          ->whereDate('aprovado_em', today())
                                          ->count(),
            'rejeitados_hoje' => Agendamento::where('status', 'rejeitado')
                                           ->whereDate('aprovado_em', today())
                                           ->count(),
            'total_mes' => Agendamento::whereMonth('created_at', now()->month)
                                     ->whereYear('created_at', now()->year)
                                     ->count(),
        ];

        return Inertia::render('Agendamentos/Gerenciar', [
            'agendamentos' => $agendamentos,
            'espacos' => $espacos,
            'estatisticas' => $estatisticas,
            'filters' => $request->only(['espaco_id', 'status', 'data_inicio', 'data_fim', 'solicitante']),
        ]);
    }

    /**
     * Aprovar agendamento
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

        $agendamento->update([
            'status' => 'aprovado',
            'aprovado_por' => auth()->id(),
            'aprovado_em' => now(),
        ]);

        return back()->with('success', 'Agendamento aprovado com sucesso!');
    }

    /**
     * Rejeitar agendamento
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

        $agendamento->update([
            'status' => 'rejeitado',
            'motivo_rejeicao' => $validated['motivo_rejeicao'],
            'aprovado_por' => auth()->id(),
            'aprovado_em' => now(),
        ]);

        return back()->with('success', 'Agendamento rejeitado.');
    }

    /**
     * Página de calendário avançado
     */
    public function calendario(Request $request)
    {
        $query = Agendamento::with(['espaco.localizacao', 'user', 'aprovadoPor']);

        // Se não for diretor geral, mostrar apenas agendamentos próprios ou do espaço que gerencia
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            $query->where(function ($q) {
                $q->where('user_id', auth()->id())
                  ->orWhereHas('espaco', function ($espacoQuery) {
                      $espacoQuery->where('responsavel_id', auth()->id());
                  });
            });
        }

        // Buscar agendamentos dos próximos 3 meses para o calendário
        $dataInicio = now()->startOfMonth();
        $dataFim = now()->addMonths(3)->endOfMonth();
        
        $agendamentos = $query->whereDate('data_inicio', '>=', $dataInicio)
                             ->whereDate('data_inicio', '<=', $dataFim)
                             ->orderBy('data_inicio')
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
}