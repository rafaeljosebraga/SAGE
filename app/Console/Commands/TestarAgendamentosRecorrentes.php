<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Agendamento;
use App\Models\User;
use App\Models\Espaco;
use Carbon\Carbon;

class TestarAgendamentosRecorrentes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'agendamentos:testar-recorrentes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Testa a criação de agendamentos recorrentes com grupos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testando criação de agendamentos recorrentes...');

        // Buscar um usuário e espaço para teste
        $user = User::first();
        $espaco = Espaco::where('disponivel_reserva', true)->first();

        if (!$user || !$espaco) {
            $this->error('Usuário ou espaço não encontrado para teste.');
            return;
        }

        // Simular dados de um agendamento recorrente
        $validated = [
            'user_id' => $user->id,
            'espaco_id' => $espaco->id,
            'titulo' => 'Teste Agendamento Recorrente - ' . now()->format('H:i:s'),
            'justificativa' => 'Teste da funcionalidade de agendamentos recorrentes',
            'data_inicio' => now()->addDays(1)->format('Y-m-d'),
            'hora_inicio' => '09:00',
            'data_fim' => now()->addDays(1)->format('Y-m-d'),
            'hora_fim' => '10:00',
            'observacoes' => 'Agendamento de teste criado via comando',
            'recursos_solicitados' => [],
            'recorrente' => true,
            'tipo_recorrencia' => 'semanal',
            'data_fim_recorrencia' => now()->addDays(22)->format('Y-m-d'), // 3 semanas
        ];

        $this->info('Criando agendamentos recorrentes...');
        $this->info("Título: {$validated['titulo']}");
        $this->info("Período: {$validated['data_inicio']} até {$validated['data_fim_recorrencia']}");
        $this->info("Recorrência: {$validated['tipo_recorrencia']}");

        // Usar a mesma lógica do controller
        $agendamentos = $this->criarAgendamentos($validated);

        $this->info("Criados {$agendamentos->count()} agendamentos!");

        // Verificar se foram criados corretamente
        $primeiro = $agendamentos->first();
        if ($primeiro && $primeiro->grupo_recorrencia) {
            $this->info("Grupo de recorrência: {$primeiro->grupo_recorrencia}");
            
            $agendamentosDoGrupo = Agendamento::where('grupo_recorrencia', $primeiro->grupo_recorrencia)->get();
            $this->info("Total de agendamentos no grupo: {$agendamentosDoGrupo->count()}");
            
            $representante = $agendamentosDoGrupo->where('is_representante_grupo', true)->first();
            $this->info("Representante do grupo: ID {$representante->id}");
            
            // Mostrar as datas dos agendamentos
            $this->info("Datas dos agendamentos:");
            foreach ($agendamentosDoGrupo as $agendamento) {
                $this->info("  - ID {$agendamento->id}: {$agendamento->data_inicio} {$agendamento->hora_inicio} (Representante: " . ($agendamento->is_representante_grupo ? 'Sim' : 'Não') . ")");
            }
        }

        $this->info('Teste concluído!');
    }

    /**
     * Criar agendamentos (copiado do controller)
     */
    private function criarAgendamentos(array $validated)
    {
        $agendamentos = collect();

        // Se não é recorrente, criar apenas um agendamento
        if (!($validated['recorrente'] ?? false) || empty($validated['tipo_recorrencia']) || empty($validated['data_fim_recorrencia'])) {
            $agendamento = Agendamento::create($validated);
            $agendamentos->push($agendamento);
            return $agendamentos;
        }

        // Para agendamentos recorrentes, gerar um ID único para o grupo
        $grupoRecorrencia = 'rec_' . uniqid() . '_' . time();

        // Para agendamentos recorrentes, calcular as datas e horários
        $dataInicio = Carbon::parse($validated['data_inicio']);
        $dataFim = Carbon::parse($validated['data_fim']);
        $dataFimRecorrencia = Carbon::parse($validated['data_fim_recorrencia']);
        
        // Criar datetime completo com horários
        $horaInicio = Carbon::parse($validated['hora_inicio']);
        $horaFim = Carbon::parse($validated['hora_fim']);
        
        $dataHoraInicio = $dataInicio->copy()->setTime($horaInicio->hour, $horaInicio->minute);
        $dataHoraFim = $dataFim->copy()->setTime($horaFim->hour, $horaFim->minute);
        
        // Calcular a duração do agendamento original
        $duracaoEmMinutos = $dataHoraInicio->diffInMinutes($dataHoraFim);
        
        $dataHoraAtual = $dataHoraInicio->copy();
        $contador = 0;
        $maxAgendamentos = 8760; // Limite de segurança (365 dias * 24 horas)
        $primeiroAgendamento = true;

        while ($dataHoraAtual->toDateString() <= $dataFimRecorrencia->toDateString() && $contador < $maxAgendamentos) {
            // Calcular data e hora fim para este agendamento
            $dataHoraFimAtual = $dataHoraAtual->copy()->addMinutes($duracaoEmMinutos);

            // Criar dados para este agendamento
            $dadosAgendamento = $validated;
            $dadosAgendamento['data_inicio'] = $dataHoraAtual->toDateString();
            $dadosAgendamento['hora_inicio'] = $dataHoraAtual->format('H:i');
            $dadosAgendamento['data_fim'] = $dataHoraFimAtual->toDateString();
            $dadosAgendamento['hora_fim'] = $dataHoraFimAtual->format('H:i');
            $dadosAgendamento['grupo_recorrencia'] = $grupoRecorrencia;
            $dadosAgendamento['is_representante_grupo'] = $primeiroAgendamento;

            try {
                $agendamento = Agendamento::create($dadosAgendamento);
                $agendamentos->push($agendamento);
                $primeiroAgendamento = false;
            } catch (\Exception $e) {
                $this->error("Erro ao criar agendamento recorrente para {$dataHoraAtual->format('Y-m-d H:i')}: " . $e->getMessage());
            }

            // Avançar para a próxima data/hora baseado no tipo de recorrência
            switch ($validated['tipo_recorrencia']) {
                case 'diaria':
                    $dataHoraAtual->addDay();
                    break;
                case 'semanal':
                    $dataHoraAtual->addWeek();
                    break;
                case 'mensal':
                    $dataHoraAtual->addMonth();
                    break;
            }

            $contador++;
        }

        return $agendamentos;
    }
}