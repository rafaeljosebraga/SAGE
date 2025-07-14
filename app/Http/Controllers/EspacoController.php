<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Espaco;
use App\Models\Localizacao;
use App\Models\Recurso;
use App\Traits\ManipulaFotos;

class EspacoController extends Controller
{
    use ManipulaFotos;
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $espacos = Espaco::with(['localizacao', 'responsavel', 'recursos'])->get();
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
        $users = \App\Models\User::all();
        
        return inertia('Espacos/Create', [
            'localizacoes' => $localizacoes,
            'recursos' => $recursos,
            'users' => $users,
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
            'localizacao_id' => 'nullable|exists:localizacoes,id',
            'recursos_fixos' => 'nullable|array',
            'fotos' => 'nullable|array',
            'fotos.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max por foto
            'status' => 'required|in:ativo,inativo,manutencao',
            'responsavel_id' => 'nullable|exists:users,id',
            'disponivel_reserva' => 'sometimes|boolean',
            'observacoes' => 'nullable|string',
        ]);

        // Processa upload das fotos usando método reutilizável
        if ($request->hasFile('fotos')) {
            $data['fotos'] = $this->uploadFotos($request->file('fotos'), 'espacos/fotos');
        } else {
            $data['fotos'] = [];
        }

        // Adiciona campos de auditoria
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();
        
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
        $espaco = Espaco::with(['localizacao', 'responsavel', 'recursos'])->findOrFail($id);
        return response()->json($espaco);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $espaco = Espaco::with(['recursos'])->findOrFail($id);
        $localizacoes = Localizacao::all();
        $recursos = Recurso::all();
        $users = \App\Models\User::all();
        
        return inertia('Espacos/Edit', [
            'espaco' => $espaco,
            'localizacoes' => $localizacoes,
            'recursos' => $recursos,
            'users' => $users,
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
            'localizacao_id' => 'nullable|exists:localizacoes,id',
            'recursos_fixos' => 'nullable|array',
            'fotos' => 'nullable|array',
            'fotos.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max por foto
            'status' => 'required|in:ativo,inativo,manutencao',
            'responsavel_id' => 'nullable|exists:users,id',
            'disponivel_reserva' => 'sometimes|boolean',
            'observacoes' => 'nullable|string',
        ]);

        // Se novas fotos foram enviadas, processa o upload
        if ($request->hasFile('fotos')) {
            // Remove fotos antigas se existirem
            if ($espaco->fotos) {
                $this->removerFotos($espaco->fotos);
            }
            
            // Faz upload das novas fotos
            $data['fotos'] = $this->uploadFotos($request->file('fotos'), 'espacos/fotos');
        }

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
        $espaco = Espaco::findOrFail($id);
        
        // Remove fotos associadas antes de deletar o espaço
        if ($espaco->fotos) {
            $this->removerFotos($espaco->fotos);
        }
        
        $espaco->delete();
        return redirect()->route('espacos.index')->with('success', 'Espaço removido com sucesso!');
    }
}
