<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Espaco;

class EspacoUserController extends Controller
{
    //
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
