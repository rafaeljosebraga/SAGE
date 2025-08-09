<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendamentoRecurso extends Model
{
    protected $table = 'agendamentos_recursos';

    protected $fillable = [
        'agendamento_id',
        'recurso_id',
        'quantidade',
        'observacoes',
    ];

    protected $casts = [
        'quantidade' => 'integer',
    ];

    // Relacionamentos
    public function agendamento(): BelongsTo
    {
        return $this->belongsTo(Agendamento::class);
    }

    public function recurso(): BelongsTo
    {
        return $this->belongsTo(Recurso::class);
    }

    // Scopes
    public function scopePorAgendamento($query, $agendamentoId)
    {
        return $query->where('agendamento_id', $agendamentoId);
    }

    public function scopePorRecurso($query, $recursoId)
    {
        return $query->where('recurso_id', $recursoId);
    }

    public function scopeComQuantidade($query, $quantidade)
    {
        return $query->where('quantidade', '>=', $quantidade);
    }

    // Métodos auxiliares
    public function getValorTotalAttribute()
    {
        return $this->quantidade * ($this->recurso->valor ?? 0);
    }
}