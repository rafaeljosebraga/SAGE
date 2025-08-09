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
        // 1. Adicionar color_index na tabela agendamentos se não existir
        if (!Schema::hasColumn('agendamentos', 'color_index')) {
            Schema::table('agendamentos', function (Blueprint $table) {
                $table->integer('color_index')->nullable()->after('grupo_recorrencia');
            });
        }
        
        // Adicionar índice se não existir
        $indexExists = DB::select("SELECT 1 FROM pg_class WHERE relname = 'agendamentos_color_index_index'");
        if (empty($indexExists)) {
            Schema::table('agendamentos', function (Blueprint $table) {
                $table->index(['color_index']);
            });
        }
        
        // 2. Migrar dados existentes de color_index da tabela recorrencia para agendamentos
        if (Schema::hasColumn('agendamentos_recorrencia', 'color_index')) {
            $agendamentosRecorrentes = DB::table('agendamentos')
                ->join('agendamentos_recorrencia', 'agendamentos.grupo_recorrencia', '=', 'agendamentos_recorrencia.grupo_recorrencia')
                ->whereNotNull('agendamentos_recorrencia.color_index')
                ->select([
                    'agendamentos.id as agendamento_id',
                    'agendamentos_recorrencia.color_index'
                ])
                ->get();
                
            foreach ($agendamentosRecorrentes as $agendamento) {
                DB::table('agendamentos')
                    ->where('id', $agendamento->agendamento_id)
                    ->update(['color_index' => $agendamento->color_index]);
            }
        }
        
        // 3. Gerar color_index para agendamentos não recorrentes que não têm
        $agendamentosSimples = DB::table('agendamentos')
            ->whereNull('color_index')
            ->get();
            
        foreach ($agendamentosSimples as $agendamento) {
            // Gerar um color_index baseado no ID do agendamento
            $colorIndex = ($agendamento->id % 10) + 1; // Valores de 1 a 10
            
            DB::table('agendamentos')
                ->where('id', $agendamento->id)
                ->update(['color_index' => $colorIndex]);
        }
        
        // 4. Remover color_index da tabela agendamentos_recorrencia se existir
        if (Schema::hasColumn('agendamentos_recorrencia', 'color_index')) {
            Schema::table('agendamentos_recorrencia', function (Blueprint $table) {
                $table->dropColumn('color_index');
            });
        }
        
        \Log::info('Color index movido da tabela agendamentos_recorrencia para agendamentos');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Adicionar color_index de volta na tabela recorrencia se não existir
        if (!Schema::hasColumn('agendamentos_recorrencia', 'color_index')) {
            Schema::table('agendamentos_recorrencia', function (Blueprint $table) {
                $table->integer('color_index')->nullable();
            });
        }
        
        // 2. Migrar dados de volta para recorrencia (apenas agendamentos recorrentes)
        if (Schema::hasColumn('agendamentos', 'color_index')) {
            $agendamentosRecorrentes = DB::table('agendamentos')
                ->whereNotNull('grupo_recorrencia')
                ->whereNotNull('color_index')
                ->get();
                
            foreach ($agendamentosRecorrentes as $agendamento) {
                DB::table('agendamentos_recorrencia')
                    ->where('grupo_recorrencia', $agendamento->grupo_recorrencia)
                    ->update(['color_index' => $agendamento->color_index]);
            }
        }
        
        // 3. Remover color_index da tabela agendamentos se existir
        if (Schema::hasColumn('agendamentos', 'color_index')) {
            // Verificar se o índice existe antes de tentar removê-lo
            $indexExists = DB::select("SELECT 1 FROM pg_class WHERE relname = 'agendamentos_color_index_index'");
            
            Schema::table('agendamentos', function (Blueprint $table) use ($indexExists) {
                if (!empty($indexExists)) {
                    $table->dropIndex(['color_index']);
                }
                $table->dropColumn('color_index');
            });
        }
    }
};
