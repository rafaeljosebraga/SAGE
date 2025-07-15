<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Foto extends Model
{
    protected $table = 'espaco_fotos';

    protected $fillable = [
        'espaco_id',
        'url',
        'nome_original',
        'nome_arquivo',
        'caminho',
        'tamanho',
        'tipo_mime',
        'ordem',
        'descricao',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tamanho' => 'integer',
        'ordem' => 'integer',
    ];

    // Relacionamento com Espaco
    public function espaco(): BelongsTo
    {
        return $this->belongsTo(Espaco::class, 'espaco_id');
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