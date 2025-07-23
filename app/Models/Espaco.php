<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Espaco extends Model
{
    protected $table = 'espacos';

    protected $fillable = [
        'nome',
        'capacidade',
        'descricao',
        'localizacao_id',
        'recursos_fixos',
        'status',
        'responsavel_id',
        'disponivel_reserva',
        'observacoes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'recursos_fixos' => 'array',
        'disponivel_reserva' => 'boolean',
        'capacidade' => 'integer',
    ];

    // Relacionamento com Localizacao
    public function localizacao(): BelongsTo
    {
        return $this->belongsTo(Localizacao::class, 'localizacao_id');
    }

    // Relacionamento com User (responsável)
    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsavel_id');
    }

    // Relacionamento com recursos (muitos para muitos)
    public function recursos(): BelongsToMany
    {
        return $this->belongsToMany(Recurso::class, 'espaco_recurso', 'espaco_id', 'recurso_id')
            ->withPivot('quantidade', 'observacoes')
            ->withTimestamps();
    }

    // Relacionamento com usuário que criou
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relacionamento com usuário que atualizou
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }


    public function users()
    {
        return $this->belongsToMany(User::class, 'espaco_user')
            ->withPivot('created_by', 'updated_by')
            ->withTimestamps();
    }

    // Relacionamento com fotos
    public function fotos(): HasMany
    {
        return $this->hasMany(Foto::class, 'espaco_id')->orderBy('ordem');
    }

    // Relacionamento com agendamentos
    public function agendamentos(): HasMany
    {
        return $this->hasMany(Agendamento::class, 'espaco_id');
    }

    // Método para verificar disponibilidade em um período
    public function estaDisponivel($dataInicio, $horaInicio, $dataFim, $horaFim, $excludeAgendamentoId = null)
    {
        if (!$this->disponivel_reserva) {
            return false;
        }

        $query = $this->agendamentos()
            ->whereIn('status', ['pendente', 'aprovado'])
            ->where(function ($q) use ($dataInicio, $horaInicio, $dataFim, $horaFim) {
                $q->where('data_inicio', '<=', $dataFim)
                  ->where('data_fim', '>=', $dataInicio);
            });

        if ($excludeAgendamentoId) {
            $query->where('id', '!=', $excludeAgendamentoId);
        }

        return !$query->exists();
    }

    // Método para obter agendamentos de um dia específico
    public function agendamentosDoDia($data)
    {
        return $this->agendamentos()
            ->whereIn('status', ['pendente', 'aprovado'])
            ->where(function ($q) use ($data) {
                $q->where('data_inicio', '<=', $data)
                  ->where('data_fim', '>=', $data);
            })
            ->orderBy('hora_inicio')
            ->get();
    }
}
