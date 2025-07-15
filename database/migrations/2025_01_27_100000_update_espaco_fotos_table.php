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
        // Verificar se a tabela espaco_fotos existe e tem a estrutura correta
        if (!Schema::hasTable('espaco_fotos')) {
            // Se não existe, criar a tabela
            Schema::create('espaco_fotos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('espaco_id')->constrained('espacos')->onDelete('cascade');
                $table->string('url'); // Caminho/URL da foto
                $table->string('nome_original'); // Nome original do arquivo
                $table->integer('tamanho'); // Tamanho em bytes
                $table->string('tipo_mime'); // Tipo MIME (image/jpeg, image/png, etc.)
                $table->integer('ordem')->default(0); // Ordem de exibição
                $table->text('descricao')->nullable(); // Descrição da foto
                $table->foreignId('created_by')->nullable()->constrained('users');
                $table->foreignId('updated_by')->nullable()->constrained('users');
                $table->timestamps();

                // Índices
                $table->index(['espaco_id', 'ordem']);
            });
        } else {
            // Se existe, verificar e adicionar colunas que podem estar faltando
            Schema::table('espaco_fotos', function (Blueprint $table) {
                if (!Schema::hasColumn('espaco_fotos', 'nome_original')) {
                    $table->string('nome_original')->after('url');
                }
                if (!Schema::hasColumn('espaco_fotos', 'tamanho')) {
                    $table->integer('tamanho')->after('nome_original');
                }
                if (!Schema::hasColumn('espaco_fotos', 'tipo_mime')) {
                    $table->string('tipo_mime')->after('tamanho');
                }
                if (!Schema::hasColumn('espaco_fotos', 'ordem')) {
                    $table->integer('ordem')->default(0)->after('tipo_mime');
                }
                if (!Schema::hasColumn('espaco_fotos', 'descricao')) {
                    $table->text('descricao')->nullable()->after('ordem');
                }
                if (!Schema::hasColumn('espaco_fotos', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->after('descricao');
                }
                if (!Schema::hasColumn('espaco_fotos', 'updated_by')) {
                    $table->foreignId('updated_by')->nullable()->constrained('users')->after('created_by');
                }
            });

            // Adicionar índice se não existir
            if (!Schema::hasIndex('espaco_fotos', ['espaco_id', 'ordem'])) {
                Schema::table('espaco_fotos', function (Blueprint $table) {
                    $table->index(['espaco_id', 'ordem']);
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remover apenas as colunas que adicionamos, não a tabela inteira
        if (Schema::hasTable('espaco_fotos')) {
            Schema::table('espaco_fotos', function (Blueprint $table) {
                $table->dropIndex(['espaco_id', 'ordem']);
                
                if (Schema::hasColumn('espaco_fotos', 'updated_by')) {
                    $table->dropForeign(['updated_by']);
                    $table->dropColumn('updated_by');
                }
                if (Schema::hasColumn('espaco_fotos', 'created_by')) {
                    $table->dropForeign(['created_by']);
                    $table->dropColumn('created_by');
                }
                if (Schema::hasColumn('espaco_fotos', 'descricao')) {
                    $table->dropColumn('descricao');
                }
                if (Schema::hasColumn('espaco_fotos', 'ordem')) {
                    $table->dropColumn('ordem');
                }
                if (Schema::hasColumn('espaco_fotos', 'tipo_mime')) {
                    $table->dropColumn('tipo_mime');
                }
                if (Schema::hasColumn('espaco_fotos', 'tamanho')) {
                    $table->dropColumn('tamanho');
                }
                if (Schema::hasColumn('espaco_fotos', 'nome_original')) {
                    $table->dropColumn('nome_original');
                }
            });
        }
    }
};