<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AgendamentoConflito extends Model
{
    protected $table = 'agendamentos_conflitos';

    protected $fillable = [
        'grupo_conflito',
        'agendamento_id',
        'status_conflito',
        'observacoes_conflito',
        'resolvido_por',
        'resolvido_em',
    ];

    protected $casts = [
        'resolvido_em' => 'datetime',
    ];

    // Relacionamento com Agendamento
    public function agendamento(): BelongsTo
    {
        return $this->belongsTo(Agendamento::class);
    }

    // Relacionamento com User (quem resolveu)
    public function resolvidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolvido_por');
    }

    // Método estático para criar um grupo de conflito
    public static function criarGrupoConflito(array $agendamentosIds, ?string $observacoes = null): string
    {
        $grupoConflito = Str::uuid()->toString();
        
        foreach ($agendamentosIds as $agendamentoId) {
            self::create([
                'grupo_conflito' => $grupoConflito,
                'agendamento_id' => $agendamentoId,
                'observacoes_conflito' => $observacoes,
            ]);
        }
        
        return $grupoConflito;
    }

    // Método para resolver conflito
    public function resolver(int $resolvidoPor, ?string $observacoes = null): void
    {
        $this->update([
            'status_conflito' => 'resolvido',
            'resolvido_por' => $resolvidoPor,
            'resolvido_em' => now(),
            'observacoes_conflito' => $observacoes ?? $this->observacoes_conflito,
        ]);
    }

    // Método para obter todos os conflitos de um grupo
    public static function obterGrupoConflito(string $grupoConflito)
    {
        return self::with(['agendamento.user', 'agendamento.espaco'])
            ->where('grupo_conflito', $grupoConflito)
            ->get();
    }

    // Scopes
    public function scopePendentes($query)
    {
        return $query->where('status_conflito', 'pendente');
    }

    public function scopeResolvidos($query)
    {
        return $query->where('status_conflito', 'resolvido');
    }
}