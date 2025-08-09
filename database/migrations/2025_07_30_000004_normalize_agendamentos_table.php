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
        // Primeiro, migrar os dados existentes para as novas tabelas
        $this->migrateExistingData();
        
        // Remover as colunas que foram normalizadas
        Schema::table('agendamentos', function (Blueprint $table) {
            // Remover índices primeiro
            $table->dropIndex(['grupo_recorrencia']);
            
            // Remover colunas de recorrência (movidas para agendamentos_recorrencia)
            $table->dropColumn([
                'recorrente',
                'tipo_recorrencia', 
                'data_fim_recorrencia',
                'grupo_recorrencia',
                'is_representante_grupo',
                'color_index'
            ]);
            
            // Remover colunas de aprovação (movidas para agendamentos_aprovacao)
            $table->dropForeign(['aprovado_por']);
            $table->dropColumn([
                'aprovado_por',
                'aprovado_em', 
                'motivo_rejeicao'
            ]);
            
            // Remover coluna de recursos (normalizada em agendamentos_recursos)
            $table->dropColumn('recursos_solicitados');
        });
        
        // Adicionar referência opcional para recorrência
        Schema::table('agendamentos', function (Blueprint $table) {
            $table->string('grupo_recorrencia')->nullable()->after('status');
            $table->index(['grupo_recorrencia']);
            
            // Foreign key para grupo de recorrência (opcional)
            $table->foreign('grupo_recorrencia')
                  ->references('grupo_recorrencia')
                  ->on('agendamentos_recorrencia')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restaurar a estrutura original
        Schema::table('agendamentos', function (Blueprint $table) {
            // Remover a nova referência
            $table->dropForeign(['grupo_recorrencia']);
            $table->dropIndex(['grupo_recorrencia']);
            $table->dropColumn('grupo_recorrencia');
            
            // Restaurar colunas originais
            $table->boolean('recorrente')->default(false)->after('motivo_rejeicao');
            $table->enum('tipo_recorrencia', ['diaria', 'semanal', 'mensal'])->nullable()->after('recorrente');
            $table->date('data_fim_recorrencia')->nullable()->after('tipo_recorrencia');
            $table->json('recursos_solicitados')->nullable()->after('data_fim_recorrencia');
            $table->string('grupo_recorrencia_old')->nullable()->after('recursos_solicitados');
            $table->boolean('is_representante_grupo')->default(false)->after('grupo_recorrencia_old');
            $table->integer('color_index')->nullable()->after('is_representante_grupo');
            
            // Restaurar colunas de aprovação
            $table->foreignId('aprovado_por')->nullable()->constrained('users')->onDelete('set null')->after('observacoes');
            $table->timestamp('aprovado_em')->nullable()->after('aprovado_por');
            $table->text('motivo_rejeicao')->nullable()->after('aprovado_em');
            
            // Restaurar índices
            $table->index(['grupo_recorrencia_old']);
        });
        
        // Migrar dados de volta (implementar se necessário)
        $this->restoreData();
    }
    
    private function migrateExistingData(): void
    {
        // Migrar dados de recorrência
        $agendamentosRecorrentes = DB::table('agendamentos')
            ->whereNotNull('grupo_recorrencia')
            ->select([
                'grupo_recorrencia',
                'tipo_recorrencia', 
                'data_fim_recorrencia',
                'is_representante_grupo',
                'color_index'
            ])
            ->groupBy([
                'grupo_recorrencia',
                'tipo_recorrencia', 
                'data_fim_recorrencia',
                'is_representante_grupo',
                'color_index'
            ])
            ->get();
            
        foreach ($agendamentosRecorrentes as $recorrencia) {
            DB::table('agendamentos_recorrencia')->insertOrIgnore([
                'grupo_recorrencia' => $recorrencia->grupo_recorrencia,
                'tipo_recorrencia' => $recorrencia->tipo_recorrencia,
                'data_fim_recorrencia' => $recorrencia->data_fim_recorrencia,
                'is_representante_grupo' => $recorrencia->is_representante_grupo,
                'color_index' => $recorrencia->color_index,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Migrar dados de aprovação
        $agendamentosAprovados = DB::table('agendamentos')
            ->whereNotNull('aprovado_por')
            ->select(['id', 'aprovado_por', 'aprovado_em', 'motivo_rejeicao'])
            ->get();
            
        foreach ($agendamentosAprovados as $aprovacao) {
            DB::table('agendamentos_aprovacao')->insert([
                'agendamento_id' => $aprovacao->id,
                'aprovado_por' => $aprovacao->aprovado_por,
                'aprovado_em' => $aprovacao->aprovado_em,
                'motivo_rejeicao' => $aprovacao->motivo_rejeicao,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Migrar recursos solicitados (apenas se o recurso existir)
        $agendamentosComRecursos = DB::table('agendamentos')
            ->whereNotNull('recursos_solicitados')
            ->select(['id', 'recursos_solicitados'])
            ->get();
            
        foreach ($agendamentosComRecursos as $agendamento) {
            $recursos = json_decode($agendamento->recursos_solicitados, true);
            if (is_array($recursos)) {
                foreach ($recursos as $recursoId) {
                    if (is_numeric($recursoId)) {
                        // Verificar se o recurso existe antes de inserir
                        $recursoExiste = DB::table('recursos')->where('id', $recursoId)->exists();
                        if ($recursoExiste) {
                            DB::table('agendamentos_recursos')->insert([
                                'agendamento_id' => $agendamento->id,
                                'recurso_id' => $recursoId,
                                'quantidade' => 1,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            // Log do recurso não encontrado
                            \Log::warning("Recurso ID {$recursoId} não encontrado para agendamento ID {$agendamento->id}");
                        }
                    }
                }
            }
        }
    }
    
    private function restoreData(): void
    {
        // Implementar restauração de dados se necessário
        // Por enquanto, deixar vazio pois é uma operação complexa
        // e geralmente não é necessária em produção
    }
};