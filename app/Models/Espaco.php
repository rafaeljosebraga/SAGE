<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Espaco extends Model
{
    protected $table = 'espacos';

    protected $fillable = [
        'nome',
        'capacidade',
        'descricao',
        'localizacao_id',
        'recursos_fixos',
        'fotos',
        'status',
        'responsavel_id',
        'disponivel_reserva',
        'observacoes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'recursos_fixos' => 'array',
        'fotos' => 'array',
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
}
