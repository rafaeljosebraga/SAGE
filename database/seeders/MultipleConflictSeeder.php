<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Agendamento;
use App\Models\AgendamentoConflito;
use App\Models\User;
use App\Models\Espaco;
use Carbon\Carbon;

class MultipleConflictSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buscar usuários e espaços existentes
        $users = User::where('perfil_acesso', '!=', 'diretor_geral')->take(6)->get();
        $espacos = Espaco::where('disponivel_reserva', true)->take(3)->get();

        if ($users->count() < 6 || $espacos->count() < 3) {
            $this->command->info('Não há usuários ou espaços suficientes para criar múltiplos conflitos.');
            return;
        }

        $this->command->info('🔥 Criando múltiplos conflitos de teste...');

        // === CONFLITO 1: Auditório hoje (4 agendamentos) ===
        $this->criarConflito1($users, $espacos[0]);
        
        // === CONFLITO 2: Sala de reuniões amanhã (2 agendamentos) ===
        $this->criarConflito2($users, $espacos[1]);
        
        // === CONFLITO 3: Laboratório depois de amanhã (3 agendamentos) ===  
        $this->criarConflito3($users, $espacos[2]);

        // === CONFLITO 4: Mesmo espaço, horário diferente (5 agendamentos) ===
        if ($espacos->count() > 0) {
            $this->criarConflito4($users, $espacos[0]);
        }

        $this->command->info('✅ Múltiplos conflitos criados com sucesso!');
    }

    private function criarConflito1($users, $espaco)
    {
        $hoje = Carbon::today();
        $agendamentos = [];

        // 4 agendamentos conflitantes das 9h às 12h
        $titulos = [
            'Palestra sobre Inovação Tecnológica',
            'Apresentação do Projeto Integrador',
            'Cerimônia de Formatura - Turma A',
            'Workshop de Empreendedorismo'
        ];

        $justificativas = [
            'Palestra com especialista internacional já confirmado. Evento aberto ao público.',
            'Apresentação obrigatória do projeto final. Banca avaliadora externa.',
            'Cerimônia de formatura já agendada há 6 meses. Famílias confirmadas.',
            'Workshop prático obrigatório para conclusão do curso. Facilitador externo.'
        ];

        $horarios = [
            ['09:00', '12:00'],
            ['09:30', '11:30'], 
            ['10:00', '12:30'],
            ['08:30', '11:00']
        ];

        for ($i = 0; $i < 4; $i++) {
            $agendamentos[] = Agendamento::create([
                'espaco_id' => $espaco->id,
                'user_id' => $users[$i]->id,
                'titulo' => $titulos[$i],
                'justificativa' => $justificativas[$i],
                'data_inicio' => $hoje->format('Y-m-d'),
                'hora_inicio' => $horarios[$i][0],
                'data_fim' => $hoje->format('Y-m-d'),
                'hora_fim' => $horarios[$i][1],
                'status' => 'pendente',
                'observacoes' => 'Conflito criado pelo seeder de teste.',
            ]);
        }

        $grupoConflito = AgendamentoConflito::criarGrupoConflito(
            collect($agendamentos)->pluck('id')->toArray(),
            "Múltiplos eventos importantes no {$espaco->nome} em {$hoje->format('d/m/Y')} entre 08:30-12:30"
        );

        $this->command->info("🔴 Conflito 1: {$espaco->nome} - 4 agendamentos (Grupo: {$grupoConflito})");
    }

    private function criarConflito2($users, $espaco)
    {
        $amanha = Carbon::tomorrow();
        $agendamentos = [];

        // 2 agendamentos conflitantes das 14h às 16h
        $agendamentos[] = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $users[2]->id,
            'titulo' => 'Reunião Diretoria Executiva',
            'justificativa' => 'Reunião mensal obrigatória da diretoria. Decisões estratégicas importantes.',
            'data_inicio' => $amanha->format('Y-m-d'),
            'hora_inicio' => '14:00',
            'data_fim' => $amanha->format('Y-m-d'),
            'hora_fim' => '16:00',
            'status' => 'pendente',
            'observacoes' => 'Participação de toda diretoria necessária.',
        ]);

        $agendamentos[] = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $users[3]->id,
            'titulo' => 'Entrevista de Emprego - Processo Seletivo',
            'justificativa' => 'Processo seletivo para nova contratação. Candidatos já agendados.',
            'data_inicio' => $amanha->format('Y-m-d'),
            'hora_inicio' => '14:30',
            'data_fim' => $amanha->format('Y-m-d'),
            'hora_fim' => '17:00',
            'status' => 'pendente',
            'observacoes' => 'Candidatos já confirmados presença.',
        ]);

        $grupoConflito = AgendamentoConflito::criarGrupoConflito(
            collect($agendamentos)->pluck('id')->toArray(),
            "Conflito executivo vs RH no {$espaco->nome} em {$amanha->format('d/m/Y')}"
        );

        $this->command->info("🟠 Conflito 2: {$espaco->nome} - 2 agendamentos (Grupo: {$grupoConflito})");
    }

    private function criarConflito3($users, $espaco)
    {
        $depoisAmanha = Carbon::today()->addDays(2);
        $agendamentos = [];

        // 3 agendamentos conflitantes das 8h às 11h
        $titulos = [
            'Aula Prática - Laboratório de Química',
            'Experimento de Física Aplicada',
            'Teste de Equipamentos Novos'
        ];

        $horarios = [
            ['08:00', '10:00'],
            ['09:00', '11:00'],
            ['08:30', '10:30']
        ];

        for ($i = 0; $i < 3; $i++) {
            $agendamentos[] = Agendamento::create([
                'espaco_id' => $espaco->id,
                'user_id' => $users[$i + 1]->id,
                'titulo' => $titulos[$i],
                'justificativa' => 'Atividade acadêmica obrigatória prevista no cronograma do semestre.',
                'data_inicio' => $depoisAmanha->format('Y-m-d'),
                'hora_inicio' => $horarios[$i][0],
                'data_fim' => $depoisAmanha->format('Y-m-d'),
                'hora_fim' => $horarios[$i][1],
                'status' => 'pendente',
                'observacoes' => 'Conflito no laboratório criado para teste.',
            ]);
        }

        $grupoConflito = AgendamentoConflito::criarGrupoConflito(
            collect($agendamentos)->pluck('id')->toArray(),
            "Conflito acadêmico no {$espaco->nome} em {$depoisAmanha->format('d/m/Y')}"
        );

        $this->command->info("🟡 Conflito 3: {$espaco->nome} - 3 agendamentos (Grupo: {$grupoConflito})");
    }

    private function criarConflito4($users, $espaco)
    {
        $proximaSemana = Carbon::today()->addWeek();
        $agendamentos = [];

        // 5 agendamentos conflitantes das 18h às 21h (horário noturno)
        $titulos = [
            'Curso de Extensão - Gestão de Projetos',
            'Palestra sobre Sustentabilidade',
            'Reunião do Conselho Acadêmico',
            'Workshop de Design Thinking',
            'Apresentação TCC - Turma Noturna'
        ];

        $horarios = [
            ['18:00', '21:00'],
            ['18:30', '20:30'],
            ['19:00', '21:00'],
            ['18:00', '20:00'],
            ['19:30', '21:30']
        ];

        for ($i = 0; $i < 5; $i++) {
            $userIndex = $i < count($users) ? $i : 0;
            $agendamentos[] = Agendamento::create([
                'espaco_id' => $espaco->id,
                'user_id' => $users[$userIndex]->id,
                'titulo' => $titulos[$i],
                'justificativa' => 'Evento noturno importante com público específico já confirmado.',
                'data_inicio' => $proximaSemana->format('Y-m-d'),
                'hora_inicio' => $horarios[$i][0],
                'data_fim' => $proximaSemana->format('Y-m-d'),
                'hora_fim' => $horarios[$i][1],
                'status' => 'pendente',
                'observacoes' => 'Conflito múltiplo no período noturno.',
            ]);
        }

        $grupoConflito = AgendamentoConflito::criarGrupoConflito(
            collect($agendamentos)->pluck('id')->toArray(),
            "Grande conflito noturno no {$espaco->nome} em {$proximaSemana->format('d/m/Y')} - 5 eventos simultâneos"
        );

        $this->command->info("🔵 Conflito 4: {$espaco->nome} - 5 agendamentos (Grupo: {$grupoConflito})");
    }
}