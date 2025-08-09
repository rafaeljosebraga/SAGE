<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Recurso extends Model
{
    use HasFactory;
    
    protected $table = 'recursos';

    protected $fillable = [
        'nome',
        'descricao',
        'status',
        'fixo',
        'marca',
        'modelo',
        'observacoes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'fixo' => 'boolean',
    ];

    // Relacionamentos
    public function espacos()
    {
        return $this->belongsToMany(Espaco::class, 'espaco_recurso', 'recurso_id', 'espaco_id')
            ->withPivot('quantidade', 'observacoes')
            ->withTimestamps();
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
