<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\notificacao;
use App\Models\Espaco;

class notificacaoController extends Controller
{
    //
    public function notificaUser($user_id, $titulo, $mensagem)
    {
        $notificacao = new notificacao();
        $notificacao->user_id = $user_id;
        $notificacao->titulo = $titulo;
        $notificacao->mensagem = $mensagem;
        $notificacao->lida = false;
        $notificacao->save();
        return $notificacao;
    }

    public function notificaEspacoManagers($espaco_id, $titulo, $mensagem)
    {
        $users = espaco::find($espaco_id)->users();
        foreach ($users as $user) {
            $this->notificaUser($user->id, $titulo, $mensagem);
        }
    }

    public function markAsRead($notificacao_id)
    {
        $notificacao = notificacao::find($notificacao_id);
        if ($notificacao) {
            $notificacao->lida = true;
            $notificacao->save();
            return response()->json(['message' => 'Notificação marcada como lida.'], 200);
        } else {
            return response()->json(['message' => 'Notificação não encontrada.'], 404);
        }
    }

    public function getUserNotifications($user_id)
    {
        return notificacao::where('user_id', $user_id)
            ->where('excluido', false)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function deleteNotification($notificacao_id)
    {
        $notificacao = notificacao::find($notificacao_id);
        if ($notificacao) {
            $notificacao->excluido = true;
            $notificacao->save();
            return response()->json(['message' => 'Notificação excluída.'], 200);
        } else {
            return response()->json(['message' => 'Notificação não encontrada.'], 404);
        }
    }
}
