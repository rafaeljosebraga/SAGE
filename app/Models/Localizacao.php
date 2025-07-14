<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Localizacao extends Model
{
    protected $table = 'localizacoes';
    
    protected $fillable = [
        'nome',
        'descricao',
        'created_by',
        'updated_by',
    ];

    // Relacionamentos
    public function espacos()
    {
        return $this->hasMany(Espaco::class, 'localizacao_id');
    }

    // Relacionamento com usuário que criou
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relacionamento com usuário que atualizou
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
