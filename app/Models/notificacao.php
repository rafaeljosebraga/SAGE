<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class notificacao extends Model
{
    //
    protected $fillable = [
        'titulo',
        'mensagem',
        'lida',
        'user_id',
        'excluido',
    ];
}
