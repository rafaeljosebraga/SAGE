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
            'recursos' => 'nullable|array',
            'status' => 'required|in:ativo,inativo,manutencao',
            'disponivel_reserva' => 'sometimes|boolean',
            'observacoes' => 'nullable|string',
            'fotos' => 'nullable|array',
            'fotos.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'descricoes' => 'nullable|array',
            'descricoes.*' => 'nullable|string|max:255',
        ]);

        // Adiciona campos de auditoria
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();
        
        // Define o responsável como o usuário logado que está criando o espaço
        $data['responsavel_id'] = Auth::id();
        
        // Converter disponivel_reserva de string para boolean se necessário
        if (isset($data['disponivel_reserva'])) {
            $data['disponivel_reserva'] = filter_var($data['disponivel_reserva'], FILTER_VALIDATE_BOOLEAN);
        } else {
            $data['disponivel_reserva'] = true;
        }

        // Remover campos que não pertencem à tabela espacos
        $espacoData = collect($data)->except(['recursos', 'fotos', 'descricoes'])->toArray();
        
        $espaco = Espaco::create($espacoData);
        
        // Criar diretório para fotos do espaço
        $diretorioEspaco = 'espacos/' . $espaco->id;
        try {
            if (!Storage::disk('public')->exists($diretorioEspaco)) {
                Storage::disk('public')->makeDirectory($diretorioEspaco);
            }
        } catch (\Exception $e) {
            // Fallback para mkdir nativo
            $caminhoCompleto = storage_path('app/public/' . $diretorioEspaco);
            if (!file_exists($caminhoCompleto)) {
                @mkdir($caminhoCompleto, 0777, true);
            }
        }

        // Sincroniza recursos se enviados
        if (isset($data['recursos']) && is_array($data['recursos'])) {
            $espaco->recursos()->sync($data['recursos']);
        }

        // Processar fotos se foram enviadas
        if ($request->hasFile('fotos')) {
            $fotos = $request->file('fotos');
            $descricoes = $data['descricoes'] ?? [];
            
            // Se for um único arquivo, transformar em array
            if (!is_array($fotos)) {
                $fotos = [$fotos];
            }
            
            foreach ($fotos as $index => $foto) {
                if ($foto && $foto->isValid()) {
                    $diretorio = 'espacos/' . $espaco->id;
                    $nomeArquivo = time() . '_' . $index . '_' . $foto->getClientOriginalName();
                    
                    // Salvar arquivo
                    $caminhoArquivo = $foto->storeAs($diretorio, $nomeArquivo, 'public');
                    
                    if ($caminhoArquivo) {
                        // Gerar URL pública para a foto
                        $urlFoto = '/storage/' . $caminhoArquivo;
                        
                        $espaco->fotos()->create([
                            'url' => $urlFoto,
                            'nome_original' => $foto->getClientOriginalName(),
                            'nome_arquivo' => $nomeArquivo,
                            'caminho' => $caminhoArquivo,
                            'tamanho' => $foto->getSize(),
                            'tipo_mime' => $foto->getMimeType(),
                            'ordem' => $index,
                            'descricao' => $descricoes[$index] ?? null,
                            'created_by' => Auth::id(),
                            'updated_by' => Auth::id(),
                        ]);
                    }
                }
            }
        }

        return redirect('/espacos')->with('success', 'Espaço criado com sucesso!');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // Redirect to index instead of showing individual space
        return redirect('/espacos');
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
            'recursos' => 'nullable|array',
            'status' => 'required|in:ativo,inativo,manutencao',
            'disponivel_reserva' => 'sometimes|boolean',
            'observacoes' => 'nullable|string',
        ]);

        // Adiciona campo de auditoria para atualização
        $data['updated_by'] = Auth::id();

        // Converter disponivel_reserva se necessário
        if (isset($data['disponivel_reserva'])) {
            $data['disponivel_reserva'] = filter_var($data['disponivel_reserva'], FILTER_VALIDATE_BOOLEAN);
        }

        // Remover campos que não pertencem à tabela espacos
        $espacoData = collect($data)->except(['recursos'])->toArray();
        
        $espaco->update($espacoData);

        // Sincroniza recursos se enviados
        if (isset($data['recursos']) && is_array($data['recursos'])) {
            $espaco->recursos()->sync($data['recursos']);
        }

        return redirect('/espacos')->with('success', 'Espaço atualizado com sucesso!');
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
        
        return redirect('/espacos')->with('success', 'Espaço, suas fotos e pasta removidos com sucesso!');
    }
}