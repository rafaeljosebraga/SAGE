<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Criar tabela espaco_fotos se não existir
        if (!Schema::hasTable('espaco_fotos')) {
            Schema::create('espaco_fotos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('espaco_id')->constrained('espacos')->onDelete('cascade');
                $table->string('url'); // Caminho/URL da foto
                $table->string('nome_original'); // Nome original do arquivo
                $table->string('nome_arquivo'); // Nome do arquivo no storage
                $table->string('caminho'); // Caminho completo do arquivo
                $table->integer('tamanho'); // Tamanho em bytes
                $table->string('tipo_mime'); // Tipo MIME (image/jpeg, image/png, etc.)
                $table->integer('ordem')->default(0); // Ordem de exibição
                $table->text('descricao')->nullable(); // Descrição da foto
                $table->foreignId('created_by')->nullable()->constrained('users');
                $table->foreignId('updated_by')->nullable()->constrained('users');
                $table->timestamps();

                // Índices
                $table->index(['espaco_id', 'ordem']);
            });
        }

        // Migrar dados da coluna fotos (JSON) para a tabela espaco_fotos
        if (Schema::hasColumn('espacos', 'fotos')) {
            $espacos = DB::table('espacos')->whereNotNull('fotos')->get();
            
            foreach ($espacos as $espaco) {
                if (!empty($espaco->fotos)) {
                    $fotos = json_decode($espaco->fotos, true);
                    
                    if (is_array($fotos)) {
                        foreach ($fotos as $index => $fotoUrl) {
                            if (!empty($fotoUrl)) {
                                // Extrair informações do arquivo
                                $nomeArquivo = basename($fotoUrl);
                                $caminho = $fotoUrl;
                                
                                // Inserir na tabela espaco_fotos
                                DB::table('espaco_fotos')->insert([
                                    'espaco_id' => $espaco->id,
                                    'url' => $fotoUrl,
                                    'nome_original' => $nomeArquivo,
                                    'nome_arquivo' => $nomeArquivo,
                                    'caminho' => $caminho,
                                    'tamanho' => 0, // Não temos essa informação
                                    'tipo_mime' => 'image/jpeg', // Assumir JPEG por padrão
                                    'ordem' => $index,
                                    'descricao' => null,
                                    'created_by' => $espaco->created_by ?? null,
                                    'updated_by' => $espaco->updated_by ?? null,
                                    'created_at' => $espaco->created_at ?? now(),
                                    'updated_at' => $espaco->updated_at ?? now(),
                                ]);
                            }
                        }
                    }
                }
            }
            
            // Agora remover a coluna fotos da tabela espacos
            Schema::table('espacos', function (Blueprint $table) {
                $table->dropColumn('fotos');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recriar coluna fotos na tabela espacos
        if (!Schema::hasColumn('espacos', 'fotos')) {
            Schema::table('espacos', function (Blueprint $table) {
                $table->json('fotos')->nullable();
            });
        }

        // Migrar dados de volta para a coluna fotos se a tabela existir
        if (Schema::hasTable('espaco_fotos')) {
            $espacos = DB::table('espacos')->get();
            
            foreach ($espacos as $espaco) {
                $fotos = DB::table('espaco_fotos')
                    ->where('espaco_id', $espaco->id)
                    ->orderBy('ordem')
                    ->pluck('url')
                    ->toArray();
                
                if (!empty($fotos)) {
                    DB::table('espacos')
                        ->where('id', $espaco->id)
                        ->update(['fotos' => json_encode($fotos)]);
                }
            }
        }

        // Remover tabela espaco_fotos
        Schema::dropIfExists('espaco_fotos');
    }
};