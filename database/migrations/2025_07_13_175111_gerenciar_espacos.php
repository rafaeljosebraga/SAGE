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
        // Tabela de Localizações Cadastráveis
        Schema::create('localizacoes', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 100); // Nome da localização (ex: "Prédio A", "Bloco Central")
            $table->text('descricao')->nullable(); // Descrição da localização

            // Campos para auditoria
            $table->foreignId('created_by')->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->foreignId('updated_by')->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            
            $table->timestamps();
        });

        // Tabela de Recursos Cadastráveis
        Schema::create('recursos', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 100); // Nome do recurso
            $table->text('descricao')->nullable(); // Descrição do recurso
            $table->enum('status', ['disponivel', 'manutencao', 'indisponivel'])->default('disponivel');
            $table->boolean('fixo')->default(true); // Se é fixo no espaço ou móvel
            $table->string('marca', 100)->nullable(); // Marca do equipamento
            $table->string('modelo', 100)->nullable(); // Modelo do equipamento
            $table->text('observacoes')->nullable(); // Observações gerais
            
            // Campos para auditoria
            $table->foreignId('created_by')->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->foreignId('updated_by')->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            
            $table->timestamps();
            
            // Índices
            $table->index(['status']);
            $table->index(['fixo']);
        });

        // Tabela de Espaços
        Schema::create('espacos', function (Blueprint $table) {
            $table->id();
            
            // Campos básicos conforme caso de uso
            $table->string('nome', 100); // Nome do espaço (aceita texto e números)
            $table->integer('capacidade')->unsigned(); // Capacidade de pessoas
            $table->text('descricao')->nullable(); // Descrição do espaço
            
            // Relacionamento com localização
            $table->foreignId('localizacao_id')->nullable()
                  ->constrained('localizacoes')
                  ->onDelete('set null'); // Localização cadastrável
            
            // Recursos fixos (JSON para armazenar lista de IDs de recursos)
            $table->json('recursos_fixos')->nullable(); // IDs dos recursos fixos associados
            
            // Fotos/Imagens (para upload de fotos mencionado no caso de uso)
            $table->json('fotos')->nullable(); // URLs das fotos do espaço
            
            // Campos de controle e gerenciamento
            $table->enum('status', ['ativo', 'inativo', 'manutencao'])->default('ativo');
            
            // Responsável pelo espaço (Diretor Geral ou delegado)
            $table->foreignId('responsavel_id')->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            
            // Controle de disponibilidade para reservas
            $table->boolean('disponivel_reserva')->default(true);
            $table->text('observacoes')->nullable(); // Observações gerais
            
            // Campos para auditoria
            $table->foreignId('created_by')->nullable()
                  ->constrained('users')
                  ->onDelete('set null'); // Quem criou
            $table->foreignId('updated_by')->nullable()
                  ->constrained('users')
                  ->onDelete('set null'); // Quem atualizou por último
            
            $table->timestamps();
            
            // Índices para melhor performance
            $table->index(['status', 'disponivel_reserva']);
            $table->index(['responsavel_id']);
            $table->index(['localizacao_id']);
        });

        // Tabela pivot para relacionamento muitos-para-muitos entre espaços e recursos
        Schema::create('espaco_recurso', function (Blueprint $table) {
            $table->id();
            $table->foreignId('espaco_id')->constrained('espacos')->onDelete('cascade');
            $table->foreignId('recurso_id')->constrained('recursos')->onDelete('cascade');
            $table->integer('quantidade')->default(1); // Quantidade deste recurso no espaço
            $table->text('observacoes')->nullable(); // Observações específicas da relação
            $table->timestamps();
            
            // Índice composto para evitar duplicatas
            $table->unique(['espaco_id', 'recurso_id']);
            $table->index(['espaco_id']);
            $table->index(['recurso_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('espaco_recurso');
        Schema::dropIfExists('espacos');
        Schema::dropIfExists('recursos');
        Schema::dropIfExists('localizacoes');
    }
};
