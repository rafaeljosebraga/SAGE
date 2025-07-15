<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Localizacao;

class LocalizacaoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $localizacoes = Localizacao::with(['createdBy'])->get();
        return inertia('Localizacoes/Index', ['localizacoes' => $localizacoes]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Localizacoes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nome' => 'required|string|max:100',
            'descricao' => 'nullable|string',
        ]);
        
        // Adiciona campos de auditoria
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();
        
        $localizacao = Localizacao::create($data);
        return redirect()->route('localizacoes.index')->with('success', 'Localização criada com sucesso!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // Redirect to index instead of showing individual location
        return redirect()->route('localizacoes.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $localizacao = Localizacao::findOrFail($id);
        return inertia('Localizacoes/Edit', ['localizacao' => $localizacao]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $localizacao = Localizacao::findOrFail($id);
        $data = $request->validate([
            'nome' => 'required|string|max:100',
            'descricao' => 'nullable|string',
        ]);
        
        // Adiciona campo de auditoria para atualização
        $data['updated_by'] = Auth::id();
        
        $localizacao->update($data);
        return redirect()->route('localizacoes.index')->with('success', 'Localização atualizada com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $localizacao = Localizacao::findOrFail($id);
        $localizacao->delete();
        return redirect()->route('localizacoes.index')->with('success', 'Localização removida com sucesso!');
    }
}
