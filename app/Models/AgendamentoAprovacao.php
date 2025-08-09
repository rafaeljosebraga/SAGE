<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendamentoAprovacao extends Model
{
    protected $table = 'agendamentos_aprovacao';

    protected $fillable = [
        'agendamento_id',
        'aprovado_por',
        'aprovado_em',
        'motivo_rejeicao',
        'motivo_cancelamento',
    ];

    protected $casts = [
        'aprovado_em' => 'datetime',
    ];

    // Incluir relacionamentos na serialização JSON
    protected $with = ['aprovadoPor'];

    // Relacionamentos
    public function agendamento(): BelongsTo
    {
        return $this->belongsTo(Agendamento::class);
    }

    public function aprovadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprovado_por');
    }

    // Scopes
    public function scopeAprovacoes($query)
    {
        return $query->whereNull('motivo_rejeicao');
    }

    public function scopeRejeicoes($query)
    {
        return $query->whereNotNull('motivo_rejeicao');
    }

    public function scopePorAprovador($query, $userId)
    {
        return $query->where('aprovado_por', $userId);
    }

    public function scopePorPeriodo($query, $dataInicio, $dataFim)
    {
        return $query->whereBetween('aprovado_em', [$dataInicio, $dataFim]);
    }

    // Métodos auxiliares
    public function getIsAprovacaoAttribute()
    {
        return is_null($this->motivo_rejeicao);
    }

    public function getIsRejeicaoAttribute()
    {
        return !is_null($this->motivo_rejeicao);
    }
}