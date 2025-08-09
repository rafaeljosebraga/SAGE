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
        Schema::table('agendamentos', function (Blueprint $table) {
            // Verificar se as colunas já existem antes de adicionar
            if (!Schema::hasColumn('agendamentos', 'grupo_recorrencia')) {
                $table->string('grupo_recorrencia')->nullable()->after('data_fim_recorrencia');
            }
            
            if (!Schema::hasColumn('agendamentos', 'is_representante_grupo')) {
                $table->boolean('is_representante_grupo')->default(false)->after('grupo_recorrencia');
            }
            
            if (!Schema::hasColumn('agendamentos', 'color_index')) {
                $table->integer('color_index')->nullable()->after('recursos_solicitados');
            }
        });
        
        // Adicionar índice apenas se não existir
        $indexExists = DB::select("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'agendamentos_grupo_recorrencia_index' AND n.nspname = 'public'");
        if (empty($indexExists) && Schema::hasColumn('agendamentos', 'grupo_recorrencia')) {
            Schema::table('agendamentos', function (Blueprint $table) {
                $table->index(['grupo_recorrencia']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Verificar se o índice existe antes de removê-lo
        $indexExists = DB::select("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'agendamentos_grupo_recorrencia_index' AND n.nspname = 'public'");
        
        Schema::table('agendamentos', function (Blueprint $table) use ($indexExists) {
            // Remover índice apenas se existir
            if (!empty($indexExists)) {
                $table->dropIndex(['grupo_recorrencia']);
            }
            
            // Verificar se as colunas existem antes de removê-las
            $colunasParaRemover = [];
            if (Schema::hasColumn('agendamentos', 'grupo_recorrencia')) {
                $colunasParaRemover[] = 'grupo_recorrencia';
            }
            if (Schema::hasColumn('agendamentos', 'is_representante_grupo')) {
                $colunasParaRemover[] = 'is_representante_grupo';
            }
            if (Schema::hasColumn('agendamentos', 'color_index')) {
                $colunasParaRemover[] = 'color_index';
            }
            
            if (!empty($colunasParaRemover)) {
                $table->dropColumn($colunasParaRemover);
            }
        });
    }
};

