<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Foto;
use App\Models\Espaco;

class FotoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Este seeder é opcional - apenas para demonstração
        // Em produção, as fotos serão enviadas pelos usuários
        
        $espacos = Espaco::all();
        
        if ($espacos->count() > 0) {
            foreach ($espacos->take(3) as $index => $espaco) {
                // Criar algumas fotos de exemplo para os primeiros espaços
                for ($i = 1; $i <= 2; $i++) {
                    $nomeArquivo = 'foto_exemplo_' . ($index + 1) . '_' . $i . '.jpg';
                    $caminho = 'espacos/exemplo/' . $nomeArquivo;
                    $url = '/storage/' . $caminho;
                    
                    Foto::create([
                        'espaco_id' => $espaco->id,
                        'url' => $url,
                        'nome_original' => $nomeArquivo,
                        'nome_arquivo' => $nomeArquivo,
                        'caminho' => $caminho,
                        'tamanho' => rand(500000, 2000000), // 500KB a 2MB
                        'tipo_mime' => 'image/jpeg',
                        'ordem' => $i,
                        'descricao' => 'Foto de exemplo ' . $i . ' do ' . $espaco->nome,
                        'created_by' => 1,
                        'updated_by' => 1,
                    ]);
                }
            }
        }
    }
}