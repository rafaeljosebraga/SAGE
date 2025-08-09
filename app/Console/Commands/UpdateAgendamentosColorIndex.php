<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Agendamento;

class UpdateAgendamentosColorIndex extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'agendamentos:update-color-index';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Atualiza agendamentos existentes com color_index fixo';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Atualizando agendamentos existentes com color_index...');

        $agendamentos = Agendamento::whereNull('color_index')->get();
        $total = $agendamentos->count();

        if ($total === 0) {
            $this->info('Nenhum agendamento precisa ser atualizado.');
            return;
        }

        $this->info("Encontrados {$total} agendamentos para atualizar.");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($agendamentos as $agendamento) {
            // Gerar índice de cor único baseado em dados únicos do agendamento
            $colorSeed = $agendamento->titulo . $agendamento->espaco_id . $agendamento->user_id . 
                         $agendamento->hora_inicio . $agendamento->hora_fim . $agendamento->justificativa;
            
            // Obter color_index único
            $colorIndex = \App\Helpers\ColorHelper::generateUniqueColorIndex($colorSeed, $agendamento->id);

            $agendamento->update(['color_index' => $colorIndex]);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$total} agendamentos atualizados com sucesso!");
    }
}