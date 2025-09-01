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
        Schema::create('deco_notificacaos', function (Blueprint $table) {
            $table->id();
            $table->string('tipo');
            $table->foreignId('notificacao_id')->constrained('notificacaos')->onDelete('cascade');
            $table->json('dados_json')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deco_notificacaos');
    }
};
