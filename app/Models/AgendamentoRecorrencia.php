<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgendamentoRecorrencia extends Model
{
    protected $table = 'agendamentos_recorrencia';

    protected $fillable = [
        'grupo_recorrencia',
        'tipo_recorrencia',
        'data_fim_recorrencia',
        'is_representante_grupo',
        'color_index',
    ];

    protected $casts = [
        'data_fim_recorrencia' => 'date',
        'is_representante_grupo' => 'boolean',
    ];

    // Relacionamento com agendamentos
    public function agendamentos(): HasMany
    {
        return $this->hasMany(Agendamento::class, 'grupo_recorrencia', 'grupo_recorrencia');
    }

    // Relacionamento com o agendamento representante
    public function agendamentoRepresentante()
    {
        return $this->agendamentos()->where('is_representante_grupo', true)->first();
    }

    // Scopes
    public function scopePorTipo($query, $tipo)
    {
        return $query->where('tipo_recorrencia', $tipo);
    }

    public function scopeAtivas($query)
    {
        return $query->where('data_fim_recorrencia', '>=', now()->toDateString());
    }

    // Métodos auxiliares
    public function getTotalAgendamentosAttribute()
    {
        return $this->agendamentos()->count();
    }

    public function getStatusResumoAttribute()
    {
        $agendamentos = $this->agendamentos;
        
        return [
            'total' => $agendamentos->count(),
            'pendentes' => $agendamentos->where('status', 'pendente')->count(),
            'aprovados' => $agendamentos->where('status', 'aprovado')->count(),
            'rejeitados' => $agendamentos->where('status', 'rejeitado')->count(),
            'cancelados' => $agendamentos->where('status', 'cancelado')->count(),
        ];
    }
}