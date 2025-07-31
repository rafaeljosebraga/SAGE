<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Espaco;
use Inertia\Inertia;

class EspacoUserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::with('espacos:id,nome')->get();
        $espacos = Espaco::with(['localizacao', 'responsavel', 'recursos', 'fotos', 'createdBy', 'updatedBy', 'users'])->get();

        return Inertia::render('AtribuirPermissoes/Index', [
            'users' => $users,
            'espacos' => $espacos,
            'userEspacoConnections' => $users->map(function ($user) {
                return [
                    'user' => $user,
                    'espacos' => $user->espacos
                ];
            })
        ]);
    }

    public function create(string $userID)
    {
        $users = User::select()->get();
        $user = User::findOrFail($userID);
        $espacos = Espaco::with(['localizacao', 'responsavel', 'recursos', 'fotos', 'createdBy', 'updatedBy', 'users'])->get();
        $espacosAtribuidos = $user->espacos();

        return Inertia::render('AtribuirPermissoes/Create', [
            'users' => $users,
            'espacos' => $espacos,
            'usID' => $userID,
            'espacosAtribuidos' => $espacosAtribuidos->pluck('id')->toArray(),
        ]);
    }
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'user_id' => 'required|exists:users,id',
            'espaco_ids' => 'required|array',
            'espaco_ids.*' => 'exists:espacos,id',
            'espaco_ids_removidos' => 'array', // opcional, pode não vir
            'espaco_ids_removidos.*' => 'exists:espacos,id',
        ]);

        $user = User::find($validatedData['user_id']);

        // Remover associações desmarcadas, se houver
        if (!empty($validatedData['espaco_ids_removidos'])) {
            $user->espacos()->detach($validatedData['espaco_ids_removidos']);
        }

        // Preparar dados com auditoria para cada espaço a adicionar
        $espacosData = [];
        foreach ($validatedData['espaco_ids'] as $espacoId) {
            $espacosData[$espacoId] = [
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ];
        }

        // Adicionar associações sem remover as já existentes
        $user->espacos()->syncWithoutDetaching($espacosData);

        return redirect()->route('espaco-users.index')
            ->with('success', 'Permissões atribuídas/removidas com sucesso!');
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        if (!ctype_digit($id)) {
            abort(404, 'ID inválido');
        }

        $user = User::with('espacos')->findOrFail($id);
        return Inertia::render('EspacoUser/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        if (!ctype_digit($id)) {
            abort(404, 'ID inválido');
        }

        $user = User::with('espacos')->findOrFail($id);
        $espacos = Espaco::all();

        return Inertia::render('EspacoUser/Edit', [
            'user' => $user,
            'espacos' => $espacos,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if (!ctype_digit($id)) {
            abort(404, 'ID inválido');
        }

        $validatedData = $request->validate([
            'espaco_ids' => 'required|array',
            'espaco_ids.*' => 'exists:espacos,id',
        ]);

        $user = User::findOrFail($id);

        // Preparar dados com auditoria para cada espaço
        $espacosData = [];
        foreach ($validatedData['espaco_ids'] as $espacoId) {
            $espacosData[$espacoId] = [
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ];
        }

        $user->espacos()->sync($espacosData);

        return redirect()->route('espaco-users.index')
            ->with('success', 'Espaços do usuário atualizados com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        if (!ctype_digit($id)) {
            abort(404, 'ID inválido');
        }

        $user = User::findOrFail($id);

        try {
            $user->espacos()->detach();
            $user->delete();

            return redirect()->route('espaco-users.index')
                ->with('success', 'Usuário e suas associações de espaços removidos com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erro ao remover usuário e associações. Tente novamente.']);
        }
    }
    public function assignEspacoToUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'espaco_id' => 'required|exists:espacos,id',
        ]);

        $user = User::find($request->user_id);
        $user->espacos()->attach($request->espaco_id, [
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        return response()->json(['message' => 'Espaco assigned to user']);
    }

    public function removeEspacoFromUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'espaco_id' => 'required|exists:espacos,id',
        ]);

        $user = User::find($request->user_id);
        $user->espacos()->detach($request->espaco_id);

        return response()->json(['message' => 'Espaco removed from user']);
    }

    public function listUsers()
    {
        $users = User::select('id', 'name')->get();
        return Inertia::render('Users/List', [
            'users' => $users
        ]);
    }

    public function getEspacosForUser($userId)
    {
        $espacos = Espaco::with(['localizacao', 'users', 'createdBy'])
            ->whereHas('users', function ($query) use ($userId) {
                $query->where('users.id', $userId);
            })
            ->get();
        return response()->json($espacos);
    }

    public function getUsersForEspaco($espacoId)
    {

        $espaco = Espaco::with('users')->findOrFail($espacoId);
        return response()->json($espaco->users);
    }

    public function syncEspacos(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'espaco_ids' => 'required|array',
            'espaco_ids.*' => 'exists:espacos,id',
        ]);

        $user = User::find($request->user_id);

        // Preparar dados com auditoria para cada espaço
        $espacosData = [];
        foreach ($request->espaco_ids as $espacoId) {
            $espacosData[$espacoId] = [
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ];
        }

        $user->espacos()->sync($espacosData);

        return response()->json(['message' => 'Espacos synced for user']);
    }
}
