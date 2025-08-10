<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AgendamentoConflito;
use Illuminate\Support\Facades\DB;

class LimparConflitosOrfaos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'conflitos:limpar-orfaos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove grupos de conflito que têm apenas 1 agendamento (conflitos órfãos)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando limpeza de conflitos órfãos...');

        // Buscar grupos de conflito com apenas 1 agendamento
        $gruposOrfaos = DB::table('agendamentos_conflitos')
            ->select('grupo_conflito', DB::raw('COUNT(*) as total'))
            ->groupBy('grupo_conflito')
            ->havingRaw('COUNT(*) = 1')
            ->get();

        if ($gruposOrfaos->isEmpty()) {
            $this->info('Nenhum conflito órfão encontrado.');
            return;
        }

        $totalRemovidos = 0;
        foreach ($gruposOrfaos as $grupo) {
            $removidos = AgendamentoConflito::where('grupo_conflito', $grupo->grupo_conflito)->delete();
            $totalRemovidos += $removidos;
            $this->line("Removido grupo órfão: {$grupo->grupo_conflito}");
        }

        $this->info("Limpeza concluída! {$totalRemovidos} registros de conflitos órfãos foram removidos.");
    }
}
