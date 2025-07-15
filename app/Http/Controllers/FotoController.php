<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Foto;
use App\Models\Espaco;

class FotoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $espacoId = $request->get('espaco_id');
        
        if ($espacoId) {
            $fotos = Foto::where('espaco_id', $espacoId)
                         ->orderBy('ordem')
                         ->get();
        } else {
            $fotos = Foto::with('espaco')->orderBy('created_at', 'desc')->get();
        }
        
        return response()->json($fotos);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'espaco_id' => 'required|exists:espacos,id',
            'fotos' => 'required|array|max:10',
            'fotos.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'descricoes' => 'nullable|array',
            'descricoes.*' => 'nullable|string|max:255',
        ]);

        $espacoId = $request->input('espaco_id');
        $fotos = $request->file('fotos');
        $descricoes = $request->input('descricoes', []);
        
        // Verificar se a pasta existe
        $pastaDestino = 'espacos/' . $espacoId;
        if (!Storage::disk('public')->exists($pastaDestino)) {
            Storage::disk('public')->makeDirectory($pastaDestino);
        }
        
        // Buscar a próxima ordem disponível
        $proximaOrdem = Foto::where('espaco_id', $espacoId)->max('ordem') ?? 0;
        $proximaOrdem = $proximaOrdem + 1;
        
        $fotosUpload = [];
        
        foreach ($fotos as $index => $foto) {
            // Gerar nome único para o arquivo
            $nomeArquivo = time() . '_' . $index . '.' . $foto->getClientOriginalExtension();
            
            // Salvar arquivo no storage
            $caminhoArquivo = $foto->storeAs($pastaDestino, $nomeArquivo, 'public');
            
            // Criar registro no banco
            $fotoModel = Foto::create([
                'espaco_id' => $espacoId,
                'url' => '/storage/' . $caminhoArquivo,
                'nome_original' => $foto->getClientOriginalName(),
                'nome_arquivo' => $nomeArquivo,
                'caminho' => $caminhoArquivo,
                'tamanho' => $foto->getSize(),
                'tipo_mime' => $foto->getMimeType(),
                'ordem' => $proximaOrdem + $index,
                'descricao' => $descricoes[$index] ?? null,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
            
            $fotosUpload[] = $fotoModel;
        }
        
        return response()->json([
            'message' => 'Fotos enviadas com sucesso!',
            'fotos' => $fotosUpload
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Foto $foto)
    {
        return response()->json($foto->load(['espaco', 'createdBy', 'updatedBy']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Foto $foto)
    {
        $request->validate([
            'descricao' => 'nullable|string|max:255',
            'ordem' => 'nullable|integer|min:0',
        ]);

        $foto->update([
            'descricao' => $request->input('descricao'),
            'ordem' => $request->input('ordem', $foto->ordem),
            'updated_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Foto atualizada com sucesso!',
            'foto' => $foto
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Foto $foto)
    {
        // Remover arquivo do storage
        $caminhoArquivo = str_replace('/storage/', '', $foto->url);
        if (Storage::disk('public')->exists($caminhoArquivo)) {
            Storage::disk('public')->delete($caminhoArquivo);
        }

        // Remover registro do banco
        $foto->delete();

        return response()->json([
            'message' => 'Foto removida com sucesso!'
        ]);
    }

    /**
     * Reordenar fotos de um espaço
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'espaco_id' => 'required|exists:espacos,id',
            'fotos' => 'required|array',
            'fotos.*.id' => 'required|exists:espaco_fotos,id',
            'fotos.*.ordem' => 'required|integer|min:0',
        ]);

        $espacoId = $request->input('espaco_id');
        $fotos = $request->input('fotos');

        foreach ($fotos as $fotoData) {
            Foto::where('id', $fotoData['id'])
                ->where('espaco_id', $espacoId)
                ->update([
                    'ordem' => $fotoData['ordem'],
                    'updated_by' => Auth::id(),
                ]);
        }

        return response()->json([
            'message' => 'Ordem das fotos atualizada com sucesso!'
        ]);
    }
}