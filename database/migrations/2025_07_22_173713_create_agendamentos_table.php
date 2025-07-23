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
        Schema::create('agendamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('espaco_id')->constrained('espacos')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Solicitante
            $table->string('titulo');
            $table->text('justificativa');
            $table->date('data_inicio');
            $table->time('hora_inicio');
            $table->date('data_fim');
            $table->time('hora_fim');
            $table->enum('status', ['pendente', 'aprovado', 'rejeitado', 'cancelado'])->default('pendente');
            $table->text('observacoes')->nullable();
            $table->foreignId('aprovado_por')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('aprovado_em')->nullable();
            $table->text('motivo_rejeicao')->nullable();
            $table->boolean('recorrente')->default(false);
            $table->enum('tipo_recorrencia', ['diaria', 'semanal', 'mensal'])->nullable();
            $table->date('data_fim_recorrencia')->nullable();
            $table->json('recursos_solicitados')->nullable(); // Array de recursos extras solicitados
            $table->timestamps();

            // Índices para melhor performance
            $table->index(['espaco_id', 'data_inicio', 'data_fim']);
            $table->index(['user_id']);
            $table->index(['status']);
            $table->index(['data_inicio', 'data_fim']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agendamentos');
    }
};