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
        
        // Remover as colunas que foram normalizadas apenas se existirem
        Schema::table('agendamentos', function (Blueprint $table) {
            // Remover índice grupo_recorrencia se existir
            if (Schema::hasColumn('agendamentos', 'grupo_recorrencia')) {
                $indexExists = DB::select("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'agendamentos_grupo_recorrencia_index' AND n.nspname = 'public'");
                if (!empty($indexExists)) {
                    $table->dropIndex(['grupo_recorrencia']);
                }
            }
        });
        
        // Remover colunas de recorrência se existirem
        $colunasRecorrencia = ['recorrente', 'tipo_recorrencia', 'data_fim_recorrencia', 'grupo_recorrencia', 'is_representante_grupo', 'color_index'];
        $colunasParaRemover = [];
        foreach ($colunasRecorrencia as $coluna) {
            if (Schema::hasColumn('agendamentos', $coluna)) {
                $colunasParaRemover[] = $coluna;
            }
        }
        if (!empty($colunasParaRemover)) {
            Schema::table('agendamentos', function (Blueprint $table) use ($colunasParaRemover) {
                $table->dropColumn($colunasParaRemover);
            });
        }
        
        // Remover colunas de aprovação se existirem
        if (Schema::hasColumn('agendamentos', 'aprovado_por')) {
            Schema::table('agendamentos', function (Blueprint $table) {
                // Verificar se a foreign key existe
                try {
                    $table->dropForeign(['aprovado_por']);
                } catch (\Exception $e) {
                    // Foreign key pode não existir, continuar
                }
                
                $colunasAprovacao = ['aprovado_por', 'aprovado_em', 'motivo_rejeicao'];
                $colunasAprovacaoParaRemover = [];
                foreach ($colunasAprovacao as $coluna) {
                    if (Schema::hasColumn('agendamentos', $coluna)) {
                        $colunasAprovacaoParaRemover[] = $coluna;
                    }
                }
                if (!empty($colunasAprovacaoParaRemover)) {
                    $table->dropColumn($colunasAprovacaoParaRemover);
                }
            });
        }
        
        // Remover coluna de recursos se existir
        if (Schema::hasColumn('agendamentos', 'recursos_solicitados')) {
            Schema::table('agendamentos', function (Blueprint $table) {
                $table->dropColumn('recursos_solicitados');
            });
        }
        
        // Adicionar referência opcional para recorrência se não existir
        if (!Schema::hasColumn('agendamentos', 'grupo_recorrencia')) {
            Schema::table('agendamentos', function (Blueprint $table) {
                $table->string('grupo_recorrencia')->nullable()->after('status');
            });
        }
        
        // Adicionar índice se não existir
        $indexExists = DB::select("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'agendamentos_grupo_recorrencia_index' AND n.nspname = 'public'");
        if (empty($indexExists)) {
            Schema::table('agendamentos', function (Blueprint $table) {
                $table->index(['grupo_recorrencia']);
            });
        }
        
        // Verificar se a foreign key já existe antes de criá-la
        $foreignKeyExists = DB::select("
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name = 'agendamentos' 
            AND constraint_name LIKE '%grupo_recorrencia%'
        ");
        
        if (empty($foreignKeyExists) && Schema::hasTable('agendamentos_recorrencia')) {
            Schema::table('agendamentos', function (Blueprint $table) {
                // Foreign key para grupo de recorrência (opcional)
                $table->foreign('grupo_recorrencia')
                      ->references('grupo_recorrencia')
                      ->on('agendamentos_recorrencia')
                      ->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restaurar a estrutura original apenas se necessário
        if (Schema::hasColumn('agendamentos', 'grupo_recorrencia')) {
            // Verificar se a foreign key existe antes de tentar removê-la
            $foreignKeyExists = DB::select("
                SELECT 1 
                FROM information_schema.table_constraints 
                WHERE constraint_type = 'FOREIGN KEY' 
                AND table_name = 'agendamentos' 
                AND constraint_name = 'agendamentos_grupo_recorrencia_foreign'
            ");
            
            Schema::table('agendamentos', function (Blueprint $table) use ($foreignKeyExists) {
                // Remover foreign key se existir
                if (!empty($foreignKeyExists)) {
                    $table->dropForeign(['grupo_recorrencia']);
                }
                
                // Remover índice se existir
                $indexExists = DB::select("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'agendamentos_grupo_recorrencia_index' AND n.nspname = 'public'");
                if (!empty($indexExists)) {
                    $table->dropIndex(['grupo_recorrencia']);
                }
                
                $table->dropColumn('grupo_recorrencia');
            });
        }
        
        // Adicionar colunas originais apenas se não existirem
        $colunasOriginais = [
            'recorrente' => 'boolean',
            'tipo_recorrencia' => 'enum',
            'data_fim_recorrencia' => 'date',
            'recursos_solicitados' => 'json',
            'grupo_recorrencia_old' => 'string',
            'is_representante_grupo' => 'boolean',
            'color_index' => 'integer',
            'aprovado_por' => 'foreignId',
            'aprovado_em' => 'timestamp',
            'motivo_rejeicao' => 'text'
        ];
        
        Schema::table('agendamentos', function (Blueprint $table) use ($colunasOriginais) {
            // Adicionar apenas as colunas que não existem
            if (!Schema::hasColumn('agendamentos', 'recorrente')) {
                $table->boolean('recorrente')->default(false);
            }
            if (!Schema::hasColumn('agendamentos', 'tipo_recorrencia')) {
                $table->enum('tipo_recorrencia', ['diaria', 'semanal', 'mensal'])->nullable();
            }
            if (!Schema::hasColumn('agendamentos', 'data_fim_recorrencia')) {
                $table->date('data_fim_recorrencia')->nullable();
            }
            if (!Schema::hasColumn('agendamentos', 'recursos_solicitados')) {
                $table->json('recursos_solicitados')->nullable();
            }
            if (!Schema::hasColumn('agendamentos', 'grupo_recorrencia_old')) {
                $table->string('grupo_recorrencia_old')->nullable();
            }
            if (!Schema::hasColumn('agendamentos', 'is_representante_grupo')) {
                $table->boolean('is_representante_grupo')->default(false);
            }
            if (!Schema::hasColumn('agendamentos', 'color_index')) {
                $table->integer('color_index')->nullable();
            }
            if (!Schema::hasColumn('agendamentos', 'aprovado_por')) {
                $table->foreignId('aprovado_por')->nullable()->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('agendamentos', 'aprovado_em')) {
                $table->timestamp('aprovado_em')->nullable();
            }
            if (!Schema::hasColumn('agendamentos', 'motivo_rejeicao')) {
                $table->text('motivo_rejeicao')->nullable();
            }
        });
        
        // Adicionar índice se não existir
        $indexExists = DB::select("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'agendamentos_grupo_recorrencia_old_index' AND n.nspname = 'public'");
        if (empty($indexExists) && Schema::hasColumn('agendamentos', 'grupo_recorrencia_old')) {
            Schema::table('agendamentos', function (Blueprint $table) {
                $table->index(['grupo_recorrencia_old']);
            });
        }
        
        // Migrar dados de volta (implementar se necessário)
        $this->restoreData();
    }
    
    private function migrateExistingData(): void
    {
        // Verificar se as colunas existem antes de migrar dados de recorrência
        if (Schema::hasColumn('agendamentos', 'grupo_recorrencia') && 
            Schema::hasColumn('agendamentos', 'tipo_recorrencia')) {
            
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
        }
        
        // Migrar dados de aprovação apenas se as colunas existirem
        if (Schema::hasColumn('agendamentos', 'aprovado_por')) {
            $agendamentosAprovados = DB::table('agendamentos')
                ->whereNotNull('aprovado_por')
                ->select(['id', 'aprovado_por', 'aprovado_em', 'motivo_rejeicao'])
                ->get();
                
            foreach ($agendamentosAprovados as $aprovacao) {
                DB::table('agendamentos_aprovacao')->insertOrIgnore([
                    'agendamento_id' => $aprovacao->id,
                    'aprovado_por' => $aprovacao->aprovado_por,
                    'aprovado_em' => $aprovacao->aprovado_em,
                    'motivo_rejeicao' => $aprovacao->motivo_rejeicao,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // Migrar recursos solicitados apenas se a coluna existir
        if (Schema::hasColumn('agendamentos', 'recursos_solicitados')) {
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
                                DB::table('agendamentos_recursos')->insertOrIgnore([
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
    }
    
    private function restoreData(): void
    {
        // Implementar restauração de dados se necessário
        // Por enquanto, deixar vazio pois é uma operação complexa
        // e geralmente não é necessária em produção
    }
};