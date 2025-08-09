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
        // Esta migration é executada após a normalização para garantir
        // que todos os dados foram migrados corretamente
        
        // Verificar se há dados órfãos e corrigir
        $this->verificarDadosOrfaos();
        
        // Criar índices adicionais para performance
        $this->criarIndicesAdicionais();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remover índices adicionais
        $this->removerIndicesAdicionais();
    }
    
    private function verificarDadosOrfaos(): void
    {
        // Verificar agendamentos com grupo_recorrencia que não existe na tabela de recorrência
        $agendamentosOrfaos = DB::table('agendamentos')
            ->whereNotNull('grupo_recorrencia')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('agendamentos_recorrencia')
                      ->whereColumn('agendamentos_recorrencia.grupo_recorrencia', 'agendamentos.grupo_recorrencia');
            })
            ->get();
            
        foreach ($agendamentosOrfaos as $agendamento) {
            // Criar entrada na tabela de recorrência para agendamentos órfãos
            DB::table('agendamentos_recorrencia')->insertOrIgnore([
                'grupo_recorrencia' => $agendamento->grupo_recorrencia,
                'tipo_recorrencia' => 'semanal', // valor padrão
                'data_fim_recorrencia' => now()->addMonths(3)->toDateString(),
                'is_representante_grupo' => false,
                'color_index' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Log dos dados migrados
        $totalRecorrencia = DB::table('agendamentos_recorrencia')->count();
        $totalAprovacao = DB::table('agendamentos_aprovacao')->count();
        $totalRecursos = DB::table('agendamentos_recursos')->count();
        
        \Log::info("Normalização concluída:", [
            'recorrencias_criadas' => $totalRecorrencia,
            'aprovacoes_migradas' => $totalAprovacao,
            'recursos_migrados' => $totalRecursos,
            'agendamentos_orfaos_corrigidos' => count($agendamentosOrfaos)
        ]);
    }
    
    private function criarIndicesAdicionais(): void
    {
        // Índices para melhor performance nas consultas com JOINs
        Schema::table('agendamentos_aprovacao', function (Blueprint $table) {
            $table->index(['aprovado_em', 'aprovado_por']);
        });
        
        Schema::table('agendamentos_recursos', function (Blueprint $table) {
            $table->index(['recurso_id', 'quantidade']);
        });
        
        Schema::table('agendamentos_recorrencia', function (Blueprint $table) {
            $table->index(['data_fim_recorrencia', 'tipo_recorrencia']);
        });
    }
    
    private function removerIndicesAdicionais(): void
    {
        Schema::table('agendamentos_aprovacao', function (Blueprint $table) {
            $table->dropIndex(['aprovado_em', 'aprovado_por']);
        });
        
        Schema::table('agendamentos_recursos', function (Blueprint $table) {
            $table->dropIndex(['recurso_id', 'quantidade']);
        });
        
        Schema::table('agendamentos_recorrencia', function (Blueprint $table) {
            $table->dropIndex(['data_fim_recorrencia', 'tipo_recorrencia']);
        });
    }
};