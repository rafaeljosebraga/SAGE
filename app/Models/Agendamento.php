<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Agendamento extends Model
{
    protected $table = 'agendamentos';

    protected $fillable = [
        'espaco_id',
        'user_id',
        'titulo',
        'justificativa',
        'data_inicio',
        'hora_inicio',
        'data_fim',
        'hora_fim',
        'status',
        'observacoes',
        'grupo_recorrencia',
        'color_index',
    ];

    protected $casts = [
        'data_inicio' => 'date',
        'data_fim' => 'date',
    ];

    // Incluir accessors na serialização JSON
    protected $appends = [
        'aprovado_por',
        'aprovado_em',
        'motivo_rejeicao',
        'motivo_cancelamento',
        'recorrente',
        'tipo_recorrencia',
        'data_fim_recorrencia',
        'is_representante_grupo',
        'recursos_solicitados',
        'tem_conflito',
    ];

    // Accessor para garantir que as horas sejam retornadas no formato correto
    public function getHoraInicioAttribute($value)
    {
        if (!$value) return null;
        // Se já está no formato HH:MM, retorna como está
        if (preg_match('/^\d{2}:\d{2}$/', $value)) {
            return $value;
        }
        // Se tem segundos, remove
        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $value)) {
            return substr($value, 0, 5);
        }
        return $value;
    }

    public function getHoraFimAttribute($value)
    {
        if (!$value) return null;
        // Se já está no formato HH:MM, retorna como está
        if (preg_match('/^\d{2}:\d{2}$/', $value)) {
            return $value;
        }
        // Se tem segundos, remove
        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $value)) {
            return substr($value, 0, 5);
        }
        return $value;
    }

    // Accessor para formatar data_inicio para JSON
    public function getDataInicioAttribute($value)
    {
        if (!$value) return null;
        
        // Se é uma instância de Carbon, formatar como Y-m-d
        if ($value instanceof \Carbon\Carbon) {
            return $value->format('Y-m-d');
        }
        
        // Se é uma string de data, tentar converter
        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return $value;
        }
    }

    // Accessor para formatar data_fim para JSON
    public function getDataFimAttribute($value)
    {
        if (!$value) return null;
        
        // Se é uma instância de Carbon, formatar como Y-m-d
        if ($value instanceof \Carbon\Carbon) {
            return $value->format('Y-m-d');
        }
        
        // Se é uma string de data, tentar converter
        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return $value;
        }
    }

    // Relacionamento com Espaço
    public function espaco(): BelongsTo
    {
        return $this->belongsTo(Espaco::class, 'espaco_id');
    }

    // Relacionamento com User (solicitante)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relacionamento com dados de recorrência
    public function recorrencia(): BelongsTo
    {
        return $this->belongsTo(AgendamentoRecorrencia::class, 'grupo_recorrencia', 'grupo_recorrencia');
    }

    // Relacionamento com dados de aprovação
    public function aprovacao(): HasOne
    {
        return $this->hasOne(AgendamentoAprovacao::class);
    }

    // Relacionamento com recursos solicitados
    public function recursosSolicitados(): HasMany
    {
        return $this->hasMany(AgendamentoRecurso::class);
    }

    // Relacionamento com recursos através da tabela pivot
    public function recursos()
    {
        return $this->belongsToMany(Recurso::class, 'agendamentos_recursos')
                    ->withPivot(['quantidade', 'observacoes'])
                    ->withTimestamps();
    }

    // Relacionamento com conflitos
    public function conflitos(): HasMany
    {
        return $this->hasMany(AgendamentoConflito::class);
    }

    // Relacionamento para obter conflito ativo
    public function conflitoAtivo(): HasOne
    {
        return $this->hasOne(AgendamentoConflito::class)->where('status_conflito', 'pendente');
    }

    // Accessor para compatibilidade - aprovado_por
    public function getAprovadoPorAttribute()
    {
        return $this->aprovacao?->aprovado_por;
    }

    // Accessor para compatibilidade - aprovado_em
    public function getAprovadoEmAttribute()
    {
        return $this->aprovacao?->aprovado_em;
    }

    // Accessor para compatibilidade - motivo_rejeicao
    public function getMotivoRejeicaoAttribute()
    {
        return $this->aprovacao?->motivo_rejeicao;
    }

    // Accessor para compatibilidade - motivo_cancelamento
    public function getMotivoCancelamentoAttribute()
    {
        return $this->aprovacao?->motivo_cancelamento;
    }

    // Accessor para recursos solicitados (array de IDs)
    public function getRecursosSolicitadosAttribute()
    {
        return $this->recursosSolicitados()->pluck('recurso_id')->toArray();
    }

    // Accessor para compatibilidade - recorrente
    public function getRecorrenteAttribute()
    {
        return !is_null($this->grupo_recorrencia);
    }

    // Accessor para compatibilidade - tipo_recorrencia
    public function getTipoRecorrenciaAttribute()
    {
        return $this->recorrencia?->tipo_recorrencia;
    }

    // Accessor para compatibilidade - data_fim_recorrencia
    public function getDataFimRecorrenciaAttribute()
    {
        return $this->recorrencia?->data_fim_recorrencia;
    }

    // Accessor para compatibilidade - is_representante_grupo
    public function getIsRepresentanteGrupoAttribute()
    {
        return $this->recorrencia?->is_representante_grupo ?? false;
    }



    // Relacionamento com User (aprovador) - através da aprovação
    public function aprovadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprovado_por');
    }

    // Scopes para consultas comuns
    public function scopePendentes($query)
    {
        return $query->where('status', 'pendente');
    }

    public function scopeAprovados($query)
    {
        return $query->where('status', 'aprovado');
    }

    public function scopeRejeitados($query)
    {
        return $query->where('status', 'rejeitado');
    }

    public function scopeAtivos($query)
    {
        return $query->whereIn('status', ['pendente', 'aprovado']);
    }

    public function scopePorPeriodo($query, $dataInicio, $dataFim)
    {
        return $query->where(function ($q) use ($dataInicio, $dataFim) {
            $q->whereBetween('data_inicio', [$dataInicio, $dataFim])
              ->orWhereBetween('data_fim', [$dataInicio, $dataFim])
              ->orWhere(function ($q2) use ($dataInicio, $dataFim) {
                  $q2->where('data_inicio', '<=', $dataInicio)
                     ->where('data_fim', '>=', $dataFim);
              });
        });
    }

    // Método para verificar conflitos de horário
    public function temConflito($espacoId, $dataInicio, $horaInicio, $dataFim, $horaFim, $excludeId = null)
    {
        try {
            // Converter para Carbon para comparação mais robusta
            $inicioNovo = Carbon::createFromFormat('Y-m-d H:i', $dataInicio . ' ' . $horaInicio);
            $fimNovo = Carbon::createFromFormat('Y-m-d H:i', $dataFim . ' ' . $horaFim);
            
            $query = self::where('espaco_id', $espacoId)
                ->whereIn('status', ['pendente', 'aprovado']);
                
            // Excluir o agendamento atual se especificado
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
            
            // Buscar todos os agendamentos que podem conflitar
            $agendamentos = $query->get(['id', 'data_inicio', 'hora_inicio', 'data_fim', 'hora_fim']);
            
            foreach ($agendamentos as $agendamento) {
                try {
                    // Formatar datas do agendamento existente
                    $dataInicioExistente = $agendamento->data_inicio;
                    $dataFimExistente = $agendamento->data_fim;
                    
                    // Se são objetos Carbon, converter para string
                    if ($dataInicioExistente instanceof Carbon) {
                        $dataInicioExistente = $dataInicioExistente->format('Y-m-d');
                    }
                    if ($dataFimExistente instanceof Carbon) {
                        $dataFimExistente = $dataFimExistente->format('Y-m-d');
                    }
                    
                    $inicioExistente = Carbon::createFromFormat('Y-m-d H:i', $dataInicioExistente . ' ' . $agendamento->hora_inicio);
                    $fimExistente = Carbon::createFromFormat('Y-m-d H:i', $dataFimExistente . ' ' . $agendamento->hora_fim);
                    
                    // Verificar se há sobreposição
                    // Dois períodos se sobrepõem se:
                    // - O início do novo é antes do fim do existente E
                    // - O fim do novo é depois do início do existente
                    if ($inicioNovo->lt($fimExistente) && $fimNovo->gt($inicioExistente)) {
                        return true;
                    }
                } catch (\Exception $e) {
                    // Se houver erro na conversão de data, pular este agendamento
                    continue;
                }
            }
            
            return false;
        } catch (\Exception $e) {
            // Se houver erro na conversão das datas novas, retornar true para segurança
            return true;
        }
    }

    // Método para formatar período
    public function getPeriodoFormatadoAttribute()
    {
        return $this->data_inicio . ' às ' . $this->hora_inicio . ' - ' . 
               $this->data_fim . ' às ' . $this->hora_fim;
    }

    // Método para verificar se está ativo
    public function getAtivoAttribute()
    {
        return in_array($this->status, ['pendente', 'aprovado']);
    }

    // Métodos para trabalhar com grupos de recorrência
    public function agendamentosDoGrupo()
    {
        if (!$this->grupo_recorrencia) {
            return collect([$this]);
        }
        
        return self::where('grupo_recorrencia', $this->grupo_recorrencia)->get();
    }

    public function countAgendamentosDoGrupo()
    {
        if (!$this->grupo_recorrencia) {
            return 1;
        }
        
        return self::where('grupo_recorrencia', $this->grupo_recorrencia)->count();
    }

    public function scopeRepresentantesDeGrupo($query)
    {
        return $query->where(function ($q) {
            // Agendamentos não recorrentes (sempre representantes de si mesmos)
            $q->whereNull('grupo_recorrencia')
            // OU agendamentos recorrentes que são os primeiros do grupo (representantes)
            ->orWhereIn('id', function ($subQuery) {
                $subQuery->select(DB::raw('MIN(id)'))
                    ->from('agendamentos')
                    ->whereNotNull('grupo_recorrencia')
                    ->groupBy('grupo_recorrencia');
            });
        });
    }

    public function scopeComContadorGrupo($query)
    {
        return $query->selectRaw('*, (
            CASE 
                WHEN grupo_recorrencia IS NOT NULL 
                THEN (SELECT COUNT(*) FROM agendamentos a2 WHERE a2.grupo_recorrencia = agendamentos.grupo_recorrencia)
                ELSE 1 
            END
        ) as total_grupo');
    }

    // Método para obter informações do grupo
    public function getInfoGrupoAttribute()
    {
        if (!$this->grupo_recorrencia) {
            return null;
        }

        $agendamentos = $this->agendamentosDoGrupo();
        $primeiro = $agendamentos->sortBy('data_inicio')->first();
        $ultimo = $agendamentos->sortBy('data_inicio')->last();

        return [
            'total' => $agendamentos->count(),
            'data_inicio' => $primeiro->data_inicio,
            'data_fim' => $ultimo->data_fim,
            'tipo_recorrencia' => $this->tipo_recorrencia,
            'pendentes' => $agendamentos->where('status', 'pendente')->count(),
            'aprovados' => $agendamentos->where('status', 'aprovado')->count(),
            'rejeitados' => $agendamentos->where('status', 'rejeitado')->count(),
        ];
    }

    // Métodos para trabalhar com aprovação
    public function aprovar($aprovadoPor, $observacoes = null)
    {
        $this->update(['status' => 'aprovado']);
        
        return $this->aprovacao()->create([
            'aprovado_por' => $aprovadoPor,
            'aprovado_em' => now(),
            'motivo_rejeicao' => null,
        ]);
    }

    public function rejeitar($rejeitadoPor, $motivo)
    {
        $this->update(['status' => 'rejeitado']);
        
        return $this->aprovacao()->create([
            'aprovado_por' => $rejeitadoPor,
            'aprovado_em' => now(),
            'motivo_rejeicao' => $motivo,
        ]);
    }

    // Métodos para trabalhar com recursos
    public function adicionarRecurso($recursoId, $quantidade = 1, $observacoes = null)
    {
        return $this->recursosSolicitados()->create([
            'recurso_id' => $recursoId,
            'quantidade' => $quantidade,
            'observacoes' => $observacoes,
        ]);
    }

    public function removerRecurso($recursoId)
    {
        return $this->recursosSolicitados()->where('recurso_id', $recursoId)->delete();
    }

    // Métodos para trabalhar com conflitos
    public function detectarConflitos()
    {
        return self::where('espaco_id', $this->espaco_id)
            ->where('id', '!=', $this->id)
            ->whereIn('status', ['pendente', 'aprovado'])
            ->where(function ($q) {
                $q->where(function ($dateQuery) {
                    // Verifica sobreposição de períodos (data + hora)
                    $dateQuery->where(function ($subQuery) {
                        $subQuery->where('data_inicio', '<', $this->data_inicio)
                                ->orWhere(function ($timeQuery) {
                                    $timeQuery->where('data_inicio', '=', $this->data_inicio)
                                             ->where('hora_inicio', '<=', $this->hora_inicio);
                                });
                    })->where(function ($subQuery) {
                        $subQuery->where('data_fim', '>', $this->data_inicio)
                                ->orWhere(function ($timeQuery) {
                                    $timeQuery->where('data_fim', '=', $this->data_inicio)
                                             ->where('hora_fim', '>', $this->hora_inicio);
                                });
                    });
                })->orWhere(function ($dateQuery) {
                    // Caso 2: O fim do novo agendamento está dentro de um período existente
                    $dateQuery->where(function ($subQuery) {
                        $subQuery->where('data_inicio', '<', $this->data_fim)
                                ->orWhere(function ($timeQuery) {
                                    $timeQuery->where('data_inicio', '=', $this->data_fim)
                                             ->where('hora_inicio', '<', $this->hora_fim);
                                });
                    })->where(function ($subQuery) {
                        $subQuery->where('data_fim', '>', $this->data_fim)
                                ->orWhere(function ($timeQuery) {
                                    $timeQuery->where('data_fim', '=', $this->data_fim)
                                             ->where('hora_fim', '>=', $this->hora_fim);
                                });
                    });
                })->orWhere(function ($dateQuery) {
                    // Caso 3: O novo agendamento engloba completamente um período existente
                    $dateQuery->where(function ($subQuery) {
                        $subQuery->where('data_inicio', '>', $this->data_inicio)
                                ->orWhere(function ($timeQuery) {
                                    $timeQuery->where('data_inicio', '=', $this->data_inicio)
                                             ->where('hora_inicio', '>=', $this->hora_inicio);
                                });
                    })->where(function ($subQuery) {
                        $subQuery->where('data_fim', '<', $this->data_fim)
                                ->orWhere(function ($timeQuery) {
                                    $timeQuery->where('data_fim', '=', $this->data_fim)
                                             ->where('hora_fim', '<=', $this->hora_fim);
                                });
                    });
                });
            })
            ->get();
    }

    public function criarConflito($agendamentosConflitantes = null)
    {
        if (!$agendamentosConflitantes) {
            $agendamentosConflitantes = $this->detectarConflitos();
        }

        if ($agendamentosConflitantes->isEmpty()) {
            return null;
        }

        // Incluir o próprio agendamento na lista de conflitos
        $todosIds = $agendamentosConflitantes->pluck('id')->push($this->id)->toArray();
        
        $observacoes = "Conflito de horário detectado para o espaço {$this->espaco->nome} no período de {$this->data_inicio} {$this->hora_inicio} até {$this->data_fim} {$this->hora_fim}";
        
        return AgendamentoConflito::criarGrupoConflito($todosIds, $observacoes);
    }

    public function temConflitoPendente()
    {
        return $this->conflitoAtivo()->exists();
    }

    public function obterGrupoConflito()
    {
        $conflito = $this->conflitoAtivo;
        if (!$conflito) {
            return collect();
        }

        return AgendamentoConflito::obterGrupoConflito($conflito->grupo_conflito);
    }

    // Accessor para verificar se tem conflito
    public function getTemConflitoAttribute()
    {
        return $this->temConflitoPendente();
    }
}