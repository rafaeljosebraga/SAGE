<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Recurso;

class RecursoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $recursos = Recurso::with(['createdBy'])->get();
        return inertia('Recursos/Index', ['recursos' => $recursos]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Recursos/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nome' => 'required|string|max:100',
            'descricao' => 'nullable|string',
            'status' => 'required|in:disponivel,manutencao,indisponivel',
            'fixo' => 'sometimes|boolean',
            'marca' => 'nullable|string|max:100',
            'modelo' => 'nullable|string|max:100',
            'observacoes' => 'nullable|string',
        ]);
        
        // Adiciona campos de auditoria
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();
        
        // Define valor padrão para fixo se não foi enviado
        if (!isset($data['fixo'])) {
            $data['fixo'] = true;
        }
        
        $recurso = Recurso::create($data);
        return redirect()->route('recursos.index')->with('success', 'Recurso criado com sucesso!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $recurso = Recurso::with(['createdBy', 'updatedBy'])->findOrFail($id);
        return response()->json($recurso);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $recurso = Recurso::findOrFail($id);
        return inertia('Recursos/Edit', ['recurso' => $recurso]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $recurso = Recurso::findOrFail($id);
        $data = $request->validate([
            'nome' => 'required|string|max:100',
            'descricao' => 'nullable|string',
            'status' => 'required|in:disponivel,manutencao,indisponivel',
            'fixo' => 'sometimes|boolean',
            'marca' => 'nullable|string|max:100',
            'modelo' => 'nullable|string|max:100',
            'observacoes' => 'nullable|string',
        ]);
        
        // Adiciona campo de auditoria para atualização
        $data['updated_by'] = Auth::id();
        
        $recurso->update($data);
        return redirect()->route('recursos.index')->with('success', 'Recurso atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $recurso = Recurso::findOrFail($id);
        $recurso->delete();
        return redirect()->route('recursos.index')->with('success', 'Recurso removido com sucesso!');
    }
}
