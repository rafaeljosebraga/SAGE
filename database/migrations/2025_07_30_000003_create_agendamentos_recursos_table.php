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
        Schema::create('agendamentos_recursos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agendamento_id')->constrained('agendamentos')->onDelete('cascade');
            $table->foreignId('recurso_id')->constrained('recursos')->onDelete('cascade');
            $table->integer('quantidade')->default(1);
            $table->text('observacoes')->nullable();
            $table->timestamps();
            
            // Índices
            $table->index(['agendamento_id']);
            $table->index(['recurso_id']);
            
            // Evitar duplicatas
            $table->unique(['agendamento_id', 'recurso_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agendamentos_recursos');
    }
};