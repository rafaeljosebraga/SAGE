<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Espaco;
use App\Models\Localizacao;
use App\Models\Recurso;

class EspacoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $espacos = Espaco::with(['localizacao', 'responsavel', 'recursos', 'fotos', 'createdBy', 'updatedBy'])->get();
        return inertia('Espacos/Index', ['espacos' => $espacos]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Retorna dados necessários para formulário de criação
        $localizacoes = Localizacao::all();
        $recursos = Recurso::all();
        
        return inertia('Espacos/Create', [
            'localizacoes' => $localizacoes,
            'recursos' => $recursos,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nome' => 'required|string|max:100',
            'capacidade' => 'required|integer|min:1',
            'descricao' => 'nullable|string',
            'localizacao_id' => 'required|exists:localizacoes,id',
            'recursos_fixos' => 'nullable|array',
            'status' => 'required|in:ativo,inativo,manutencao',
            'disponivel_reserva' => 'sometimes|boolean',
            'observacoes' => 'nullable|string',
        ]);

        // Adiciona campos de auditoria
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();
        
        // Define o responsável como o usuário logado que está criando o espaço
        $data['responsavel_id'] = Auth::id();
        
        // Define valor padrão para disponivel_reserva se não foi enviado
        if (!isset($data['disponivel_reserva'])) {
            $data['disponivel_reserva'] = true;
        }

        $espaco = Espaco::create($data);

        // Sincroniza recursos se enviados
        if ($request->has('recursos')) {
            $espaco->recursos()->sync($request->input('recursos'));
        }

        return redirect()->route('espacos.index')->with('success', 'Espaço criado com sucesso!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // Redirect to index instead of showing individual space
        return redirect()->route('espacos.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $espaco = Espaco::with(['recursos', 'fotos', 'createdBy', 'responsavel'])->findOrFail($id);
        $localizacoes = Localizacao::all();
        $recursos = Recurso::all();
        
        return inertia('Espacos/Edit', [
            'espaco' => $espaco,
            'localizacoes' => $localizacoes,
            'recursos' => $recursos,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $espaco = Espaco::findOrFail($id);
        $data = $request->validate([
            'nome' => 'required|string|max:100',
            'capacidade' => 'required|integer|min:1',
            'descricao' => 'nullable|string',
            'localizacao_id' => 'required|exists:localizacoes,id',
            'recursos_fixos' => 'nullable|array',
            'status' => 'required|in:ativo,inativo,manutencao',
            'disponivel_reserva' => 'sometimes|boolean',
            'observacoes' => 'nullable|string',
        ]);

        // Adiciona campo de auditoria para atualização
        $data['updated_by'] = Auth::id();

        $espaco->update($data);

        // Sincroniza recursos se enviados
        if ($request->has('recursos')) {
            $espaco->recursos()->sync($request->input('recursos'));
        }

        return redirect()->route('espacos.index')->with('success', 'Espaço atualizado com sucesso!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $espaco = Espaco::with('fotos')->findOrFail($id);
        
        // Remover todas as fotos do storage individualmente (para garantia)
        foreach ($espaco->fotos as $foto) {
            $caminhoArquivo = str_replace('/storage/', '', $foto->url);
            if (Storage::disk('public')->exists($caminhoArquivo)) {
                Storage::disk('public')->delete($caminhoArquivo);
            }
        }
        
        // Remover a pasta completa do espaço
        $pastaEspaco = 'espacos/' . $id;
        if (Storage::disk('public')->exists($pastaEspaco)) {
            Storage::disk('public')->deleteDirectory($pastaEspaco);
        }
        
        // Deletar o espaço (as fotos serão deletadas automaticamente pelo cascade)
        $espaco->delete();
        
        return redirect()->route('espacos.index')->with('success', 'Espaço, suas fotos e pasta removidos com sucesso!');
    }
}