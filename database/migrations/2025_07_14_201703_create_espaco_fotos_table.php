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
        // A tabela espaco_fotos já existe, então só vamos remover a coluna fotos da tabela espacos
        if (Schema::hasColumn('espacos', 'fotos')) {
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
    }
};