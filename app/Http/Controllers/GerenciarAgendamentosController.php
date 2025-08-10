<?php

namespace App\Http\Controllers;

use App\Models\Agendamento;
use App\Models\AgendamentoConflito;
use App\Models\Espaco;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class GerenciarAgendamentosController extends Controller
{
    /**
     * Página principal de gerenciamento de agendamentos com conflitos
     */
    public function index(Request $request)
    {
        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para acessar esta página.');
        }

        // Query base para TODOS os agendamentos (sempre buscar todos para separar corretamente)
        $queryTodos = Agendamento::with([
            'espaco.localizacao', 
            'user', 
            'aprovacao.aprovadoPor',
            'conflitoAtivo'
        ]);

        // Aplicar filtros básicos (exceto tipo_conflito que será tratado na separação)
        if ($request->filled('espaco_id')) {
            $queryTodos->where('espaco_id', $request->espaco_id);
        }

        if ($request->filled('status')) {
            if ($request->status !== 'all') {
                $queryTodos->where('status', $request->status);
            }
        }

        if ($request->filled('data_inicio')) {
            $queryTodos->whereDate('data_inicio', '>=', $request->data_inicio);
        }

        if ($request->filled('data_fim')) {
            $queryTodos->whereDate('data_fim', '<=', $request->data_fim);
        }

        if ($request->filled('solicitante')) {
            $queryTodos->whereHas('user', function ($userQuery) use ($request) {
                $userQuery->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($request->solicitante) . '%']);
            });
        }

        if ($request->filled('nome_agendamento')) {
            $queryTodos->whereRaw('LOWER(titulo) LIKE ?', ['%' . strtolower($request->nome_agendamento) . '%']);
        }

        // Buscar TODOS os agendamentos
        $todosAgendamentos = $queryTodos->orderBy('created_at', 'desc')->get();

        // Separar agendamentos por conflito
        $gruposConflito = [];
        $agendamentosSemConflito = [];

        foreach ($todosAgendamentos as $agendamento) {
            if ($agendamento->conflitoAtivo) {
                $grupoId = $agendamento->conflitoAtivo->grupo_conflito;
                if (!isset($gruposConflito[$grupoId])) {
                    $gruposConflito[$grupoId] = [
                        'grupo_conflito' => $grupoId,
                        'agendamentos' => [],
                        'espaco' => $agendamento->espaco,
                        'status_conflito' => $agendamento->conflitoAtivo->status_conflito,
                        'observacoes_conflito' => $agendamento->conflitoAtivo->observacoes_conflito,
                        'created_at' => $agendamento->conflitoAtivo->created_at,
                    ];
                }
                $gruposConflito[$grupoId]['agendamentos'][] = $agendamento;
            } else {
                $agendamentosSemConflito[] = $agendamento;
            }
        }

        // Converter grupos de conflito para array indexado
        $gruposConflito = array_values($gruposConflito);

        // Ordenar grupos por data de criação do conflito (mais recentes primeiro)
        usort($gruposConflito, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        $espacos = Espaco::where('disponivel_reserva', true)
            ->where('status', 'ativo')
            ->orderBy('nome')
            ->get(['id', 'nome']);

        // Estatísticas
        $estatisticas = [
            'conflitos_pendentes' => AgendamentoConflito::pendentes()
                ->distinct('grupo_conflito')
                ->count('grupo_conflito'),
            'agendamentos_em_conflito' => AgendamentoConflito::pendentes()->count(),
            'conflitos_resolvidos_hoje' => AgendamentoConflito::resolvidos()
                ->whereDate('resolvido_em', today())
                ->distinct('grupo_conflito')
                ->count('grupo_conflito'),
            'total_agendamentos_pendentes' => Agendamento::where('status', 'pendente')->count(),
        ];

        return Inertia::render('Agendamentos/GerenciarAgendamentos', [
            'gruposConflito' => $gruposConflito,
            'agendamentosSemConflito' => $agendamentosSemConflito,
            'espacos' => $espacos,
            'estatisticas' => $estatisticas,
            'filters' => $request->only([
                'espaco_id', 
                'status', 
                'tipo_conflito',
                'data_inicio', 
                'data_fim', 
                'solicitante', 
                'nome_agendamento'
            ]),
        ]);
    }

    /**
     * Resolver conflito aprovando um agendamento e rejeitando os outros
     */
    public function resolverConflito(Request $request)
    {
        $request->validate([
            'grupo_conflito' => 'required|string',
            'agendamento_aprovado_id' => 'required|exists:agendamentos,id',
            'motivo_rejeicao' => 'required|string|min:10',
        ]);

        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para resolver conflitos.');
        }

        DB::beginTransaction();

        try {
            // Obter todos os agendamentos do grupo de conflito
            $conflitos = AgendamentoConflito::obterGrupoConflito($request->grupo_conflito);
            
            if ($conflitos->isEmpty()) {
                return back()->withErrors(['grupo_conflito' => 'Grupo de conflito não encontrado.']);
            }

            $agendamentoAprovado = null;
            $agendamentosRejeitados = [];

            foreach ($conflitos as $conflito) {
                $agendamento = $conflito->agendamento;
                
                if ($agendamento->id == $request->agendamento_aprovado_id) {
                    // Aprovar o agendamento selecionado
                    $agendamento->update(['status' => 'aprovado']);
                    
                    $agendamento->aprovacao()->updateOrCreate(
                        ['agendamento_id' => $agendamento->id],
                        [
                            'aprovado_por' => auth()->id(),
                            'aprovado_em' => now(),
                            'motivo_rejeicao' => null,
                            'motivo_cancelamento' => null,
                        ]
                    );
                    
                    $agendamentoAprovado = $agendamento;
                } else {
                    // Rejeitar os outros agendamentos
                    $agendamento->update(['status' => 'rejeitado']);
                    
                    $agendamento->aprovacao()->updateOrCreate(
                        ['agendamento_id' => $agendamento->id],
                        [
                            'aprovado_por' => auth()->id(),
                            'aprovado_em' => now(),
                            'motivo_rejeicao' => $request->motivo_rejeicao,
                            'motivo_cancelamento' => null,
                        ]
                    );
                    
                    $agendamentosRejeitados[] = $agendamento;
                }

                // Marcar conflito como resolvido
                $conflito->resolver(auth()->id(), "Conflito resolvido: agendamento #{$request->agendamento_aprovado_id} aprovado, demais rejeitados.");
            }

            DB::commit();

            $message = "Conflito resolvido com sucesso! Agendamento '{$agendamentoAprovado->titulo}' foi aprovado e " . 
                      count($agendamentosRejeitados) . " agendamento(s) conflitante(s) foram rejeitados.";

            return back()->with('success', $message);

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Erro ao resolver conflito: ' . $e->getMessage()]);
        }
    }

    /**
     * Rejeitar todos os agendamentos de um conflito
     */
    public function rejeitarTodosConflito(Request $request)
    {
        $request->validate([
            'grupo_conflito' => 'required|string',
            'motivo_rejeicao' => 'required|string|min:10',
        ]);

        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para resolver conflitos.');
        }

        DB::beginTransaction();

        try {
            // Obter todos os agendamentos do grupo de conflito
            $conflitos = AgendamentoConflito::obterGrupoConflito($request->grupo_conflito);
            
            if ($conflitos->isEmpty()) {
                return back()->withErrors(['grupo_conflito' => 'Grupo de conflito não encontrado.']);
            }

            $totalRejeitados = 0;

            foreach ($conflitos as $conflito) {
                $agendamento = $conflito->agendamento;
                
                // Rejeitar o agendamento
                $agendamento->update(['status' => 'rejeitado']);
                
                $agendamento->aprovacao()->updateOrCreate(
                    ['agendamento_id' => $agendamento->id],
                    [
                        'aprovado_por' => auth()->id(),
                        'aprovado_em' => now(),
                        'motivo_rejeicao' => $request->motivo_rejeicao,
                        'motivo_cancelamento' => null,
                    ]
                );

                // Marcar conflito como resolvido
                $conflito->resolver(auth()->id(), "Conflito resolvido: todos os agendamentos foram rejeitados.");
                
                $totalRejeitados++;
            }

            DB::commit();

            $message = "Conflito resolvido com sucesso! Todos os {$totalRejeitados} agendamentos conflitantes foram rejeitados.";

            return back()->with('success', $message);

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Erro ao resolver conflito: ' . $e->getMessage()]);
        }
    }

    /**
     * Obter detalhes de um grupo de conflito
     */
    public function detalhesConflito(string $grupoConflito)
    {
        // Verificar permissão
        if (auth()->user()->perfil_acesso !== 'diretor_geral') {
            abort(403, 'Você não tem permissão para acessar esta informação.');
        }

        $conflitos = AgendamentoConflito::with([
            'agendamento.user',
            'agendamento.espaco.localizacao',
            'agendamento.aprovacao.aprovadoPor'
        ])
        ->where('grupo_conflito', $grupoConflito)
        ->get();

        if ($conflitos->isEmpty()) {
            abort(404, 'Grupo de conflito não encontrado.');
        }

        return response()->json([
            'grupo_conflito' => $grupoConflito,
            'conflitos' => $conflitos,
            'total_agendamentos' => $conflitos->count(),
            'espaco' => $conflitos->first()->agendamento->espaco,
            'status_conflito' => $conflitos->first()->status_conflito,
            'observacoes_conflito' => $conflitos->first()->observacoes_conflito,
        ]);
    }
}