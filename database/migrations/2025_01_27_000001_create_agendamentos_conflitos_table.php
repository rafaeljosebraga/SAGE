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
        Schema::create('agendamentos_conflitos', function (Blueprint $table) {
            $table->id();
            $table->string('grupo_conflito'); // UUID para agrupar agendamentos conflitantes
            $table->foreignId('agendamento_id')->constrained('agendamentos')->onDelete('cascade');
            $table->enum('status_conflito', ['pendente', 'resolvido'])->default('pendente');
            $table->text('observacoes_conflito')->nullable();
            $table->foreignId('resolvido_por')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolvido_em')->nullable();
            $table->timestamps();
            
            // Índices
            $table->index(['grupo_conflito']);
            $table->index(['agendamento_id']);
            $table->index(['status_conflito']);
            $table->unique(['grupo_conflito', 'agendamento_id']); // Evitar duplicatas
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agendamentos_conflitos');
    }
};