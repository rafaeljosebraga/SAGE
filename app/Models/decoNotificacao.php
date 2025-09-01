<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class decoNotificacao extends Model
{
    protected $fillable = [
        'tipo',
        'notificacao_id',
        'dados_json'
    ];
}
