<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::select(['id', 'name', 'email', 'perfil_acesso', 'created_at'])
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'perfilAcesso' => [
                'administrador' => 'Administrador',
                'diretor_geral' => 'Diretor Geral',
                'coordenador' => 'Coordenador',
                'servidores' => 'Servidores',
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Users/Create', [
            'perfilAcesso' => [
                'administrador' => 'Administrador',
                'diretor_geral' => 'Diretor Geral',
                'coordenador' => 'Coordenador',
                'servidores' => 'Servidores',
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'perfil_acesso' => 'required|in:administrador,diretor_geral,coordenador,servidores',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'perfil_acesso' => $validated['perfil_acesso'],
                'password' => Hash::make($validated['password']),
            ]);

            return redirect()->route('users.index')
                ->with('success', 'Usuário criado com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erro ao criar usuário. Tente novamente.'])
                ->withInput();
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'perfilAcesso' => [
                'administrador' => 'Administrador',
                'diretor_geral' => 'Diretor Geral',
                'coordenador' => 'Coordenador',
                'servidores' => 'Servidores',
            ],
        ]);
    }
    public function all()
    {
        return response()->json(User::select('id', 'name')->get());
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'perfil_acesso' => 'required|in:administrador,diretor_geral,coordenador,servidores',
        ]);

        try {
            $user->update($validated);

            return redirect()->route('users.index')
                ->with('success', 'Usuário atualizado com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erro ao atualizar usuário. Tente novamente.'])
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        try {
            if ($user->id === Auth::id()) {
                return back()->withErrors(['error' => 'Você não pode excluir sua própria conta.']);
            }

            $user->delete();

            return redirect()->route('users.index')
                ->with('success', 'Usuário removido com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erro ao remover usuário. Tente novamente.']);
        }
    }
}
