<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CanManageAgendamentos
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        
        // Verificar se o usuário tem permissão para gerenciar agendamentos
        if (!$user || !$user->canAccessManagement()) {
            abort(403, 'Você não tem permissão para acessar esta funcionalidade. Nenhum espaço foi atribuído a você.');
        }
        
        return $next($request);
    }
}
