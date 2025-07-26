<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('agendamentos', function (Blueprint $table) {
            $table->string('grupo_recorrencia')->nullable()->after('data_fim_recorrencia');
            $table->boolean('is_representante_grupo')->default(false)->after('grupo_recorrencia');
            
            $table->index(['grupo_recorrencia']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agendamentos', function (Blueprint $table) {
            $table->dropIndex(['grupo_recorrencia']);
            $table->dropColumn(['grupo_recorrencia', 'is_representante_grupo']);
        });
    }
};