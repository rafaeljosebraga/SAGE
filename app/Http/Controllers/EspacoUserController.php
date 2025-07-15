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
        $users = User::select('id', 'name')->get();
        $espacos = Espaco::select('id', 'nome')->get();

        return Inertia::render('EspacoUser/Index', [
            'users' => $users,
            'espacos' => $espacos,
        ]);
    }

    public function create()
    {
        $users = User::select('id', 'name')->get();
        $espacos = Espaco::select('id', 'nome')->get();

        return Inertia::render('EspacoUser/Create', [
            'users' => $users,
            'espacos' => $espacos,
        ]);
    }
    /**

     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
    public function assignEspacoToUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'espaco_id' => 'required|exists:espacos,id',
        ]);

        $user = User::find($request->user_id);
        $user->espacos()->attach($request->espaco_id);

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

    public function getEspacosForUser($userId)
    {
        $user = User::with('espacos')->findOrFail($userId);
        return response()->json($user->espacos);
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
        $user->espacos()->sync($request->espaco_ids);

        return response()->json(['message' => 'Espacos synced for user']);
    }
}
