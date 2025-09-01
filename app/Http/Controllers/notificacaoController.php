<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\notificacao;
use App\Models\Espaco;
use App\Models\decoNotificacao;

class notificacaoController extends Controller
{
    public function index($user_id)
    {
        return inertia('Notificacoes/Index', [
            'notificacoes' => $this->getUserNotifications($user_id)
        ]);
    }
    //
    public function notificaUser(Request $request, $user_id)
    {
        $titulo = $request->input('titulo');
        $mensagem = $request->input('mensagem');
        $notificacao = new notificacao();
        $notificacao->user_id = $user_id;
        $notificacao->titulo = $titulo;
        $notificacao->mensagem = $mensagem;
        $notificacao->lida = false;
        $notificacao->excluido = false;
        $notificacao->save();
        return redirect()->back()->with([
            'success' => 'Notificação enviada com sucesso!',
            'notificacao' => $notificacao
        ]);
    }

    public function notificaEspacoManagers($espaco_id, Request $request)
    {
        $espaco = Espaco::findOrFail($espaco_id);
        $users = $espaco->users;

        // Get the title and message from the initial request
        $titulo = $request->input('titulo');
        $mensagem = $request->input('mensagem');

        foreach ($users as $user) {
            // 1. Create a new Request instance for each notification.
            //    Populate it with the data that the notificaUser method expects.
            $notificationRequest = new Request([
                'titulo'   => $titulo,
                'mensagem' => $mensagem,
            ]);

            // 2. Call notificaUser with the new request and the user's ID.
            //    This now matches the expected signature: (Request, integer).
            $this->notificaUser($notificationRequest, $user->id);
        }

        return redirect()->back()->with('success', 'Notificações enviadas com sucesso!');
    }

    public function markAsRead($notificacao_id)
    {
        $notificacao = Notificacao::find($notificacao_id);

        if ($notificacao) {
            $notificacao->lida = true;
            $notificacao->save();
        }

        // Redireciona de volta e recarrega as notificações
        return redirect()->back()->with('success', 'Notificação marcada como lida.');
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
        $notificacao = Notificacao::find($notificacao_id);

        if ($notificacao) {
            $notificacao->excluido = true;
            $notificacao->save();
        }

        return redirect()->back()->with('success', 'Notificação excluída.');
    }
}
