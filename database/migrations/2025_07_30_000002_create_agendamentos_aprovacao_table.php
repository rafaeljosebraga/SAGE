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
        Schema::create('agendamentos_aprovacao', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agendamento_id')->constrained('agendamentos')->onDelete('cascade');
            $table->foreignId('aprovado_por')->constrained('users')->onDelete('cascade');
            $table->timestamp('aprovado_em');
            $table->text('motivo_rejeicao')->nullable(); // Só terá valor se for rejeição
            $table->timestamps();
            
            // Índices
            $table->index(['agendamento_id']);
            $table->index(['aprovado_por']);
            $table->index(['aprovado_em']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agendamentos_aprovacao');
    }
};