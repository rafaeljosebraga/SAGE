<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'aprovado_por',
        'aprovado_em',
        'motivo_rejeicao',
        'recorrente',
        'tipo_recorrencia',
        'data_fim_recorrencia',
        'recursos_solicitados',
    ];

    protected $casts = [
        'data_inicio' => 'date',
        'data_fim' => 'date',
        'aprovado_em' => 'datetime',
        'data_fim_recorrencia' => 'date',
        'recorrente' => 'boolean',
        'recursos_solicitados' => 'array',
    ];

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

    // Relacionamento com User (aprovador)
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
        $query = self::where('espaco_id', $espacoId)
            ->whereIn('status', ['pendente', 'aprovado'])
            ->where(function ($q) use ($dataInicio, $horaInicio, $dataFim, $horaFim) {
                // Verifica sobreposição de datas e horários
                $q->where('data_inicio', '<=', $dataFim)
                  ->where('data_fim', '>=', $dataInicio);
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
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
}