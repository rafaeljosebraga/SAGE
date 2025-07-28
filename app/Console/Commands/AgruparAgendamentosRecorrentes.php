<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Agendamento;
use Carbon\Carbon;

class AgruparAgendamentosRecorrentes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'agendamentos:agrupar-recorrentes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Agrupa agendamentos recorrentes existentes que não possuem grupo_recorrencia';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando agrupamento de agendamentos recorrentes...');

        // Buscar agendamentos recorrentes sem grupo
        $agendamentosRecorrentes = Agendamento::where('recorrente', true)
                                             ->whereNull('grupo_recorrencia')
                                             ->orderBy('user_id')
                                             ->orderBy('espaco_id')
                                             ->orderBy('titulo')
                                             ->orderBy('created_at')
                                             ->get();

        if ($agendamentosRecorrentes->isEmpty()) {
            $this->info('Nenhum agendamento recorrente sem grupo encontrado.');
            return;
        }

        $this->info("Encontrados {$agendamentosRecorrentes->count()} agendamentos recorrentes para agrupar.");

        $grupos = [];
        $agendamentosProcessados = 0;

        // Agrupar agendamentos por características similares
        foreach ($agendamentosRecorrentes as $agendamento) {
            $chaveGrupo = $this->gerarChaveGrupo($agendamento);
            
            if (!isset($grupos[$chaveGrupo])) {
                $grupos[$chaveGrupo] = [];
            }
            
            $grupos[$chaveGrupo][] = $agendamento;
        }

        $this->info("Identificados " . count($grupos) . " grupos de agendamentos recorrentes.");

        // Processar cada grupo
        foreach ($grupos as $chaveGrupo => $agendamentosDoGrupo) {
            if (count($agendamentosDoGrupo) < 2) {
                // Se há apenas um agendamento, não é realmente recorrente
                continue;
            }

            // Ordenar por data de início
            usort($agendamentosDoGrupo, function($a, $b) {
                return $a->data_inicio <=> $b->data_inicio;
            });

            // Gerar ID único para o grupo
            $grupoRecorrencia = 'rec_' . uniqid() . '_' . time();
            
            $this->info("Processando grupo: {$chaveGrupo} com " . count($agendamentosDoGrupo) . " agendamentos");

            // Atualizar agendamentos do grupo
            foreach ($agendamentosDoGrupo as $index => $agendamento) {
                $agendamento->update([
                    'grupo_recorrencia' => $grupoRecorrencia,
                    'is_representante_grupo' => $index === 0, // Primeiro agendamento é o representante
                ]);
                $agendamentosProcessados++;
            }
        }

        $this->info("Agrupamento concluído! {$agendamentosProcessados} agendamentos foram processados em " . count($grupos) . " grupos.");
    }

    /**
     * Gera uma chave única para agrupar agendamentos similares
     */
    private function gerarChaveGrupo(Agendamento $agendamento): string
    {
        return sprintf(
            '%d_%d_%s_%s_%s_%s_%s',
            $agendamento->user_id,
            $agendamento->espaco_id,
            $agendamento->titulo,
            $agendamento->hora_inicio,
            $agendamento->hora_fim,
            $agendamento->tipo_recorrencia ?? 'unknown',
            $agendamento->created_at->format('Y-m-d H:i')
        );
    }
}