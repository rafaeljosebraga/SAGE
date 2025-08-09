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
        Schema::create('agendamentos_recorrencia', function (Blueprint $table) {
            $table->id();
            $table->string('grupo_recorrencia')->unique();
            $table->enum('tipo_recorrencia', ['diaria', 'semanal', 'mensal']);
            $table->date('data_fim_recorrencia');
            $table->boolean('is_representante_grupo')->default(false);
            $table->integer('color_index')->nullable();
            $table->timestamps();
            
            // Índices
            $table->index(['grupo_recorrencia']);
            $table->index(['tipo_recorrencia']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agendamentos_recorrencia');
    }
};