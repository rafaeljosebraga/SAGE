<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Agendamento;
use App\Models\AgendamentoConflito;
use App\Models\User;
use App\Models\Espaco;
use Carbon\Carbon;

class ConflitosTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buscar usuários e espaços existentes
        $users = User::where('perfil_acesso', '!=', 'diretor_geral')->take(3)->get();
        $espaco = Espaco::where('disponivel_reserva', true)->first();

        if ($users->count() < 3 || !$espaco) {
            $this->command->info('Não há usuários ou espaços suficientes para criar conflitos de teste.');
            return;
        }

        // Criar agendamentos conflitantes para hoje
        $hoje = Carbon::today();
        $horaInicio = '14:00';
        $horaFim = '16:00';

        $agendamentos = [];

        // Primeiro agendamento
        $agendamento1 = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $users[0]->id,
            'titulo' => 'Reunião de Planejamento Estratégico',
            'justificativa' => 'Reunião trimestral obrigatória para definição de metas e estratégias do departamento. Participação de todos os coordenadores é essencial.',
            'data_inicio' => $hoje->format('Y-m-d'),
            'hora_inicio' => $horaInicio,
            'data_fim' => $hoje->format('Y-m-d'),
            'hora_fim' => $horaFim,
            'status' => 'pendente',
            'observacoes' => 'Necessário projetor e sistema de videoconferência.',
        ]);

        // Segundo agendamento (conflitante)
        $agendamento2 = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $users[1]->id,
            'titulo' => 'Treinamento de Capacitação',
            'justificativa' => 'Treinamento obrigatório de segurança do trabalho conforme normas regulamentadoras. Data já agendada com instrutor externo.',
            'data_inicio' => $hoje->format('Y-m-d'),
            'hora_inicio' => '13:30',
            'data_fim' => $hoje->format('Y-m-d'),
            'hora_fim' => '15:30',
            'status' => 'pendente',
            'observacoes' => 'Instrutor externo já confirmado. Cancelamento gerará custos.',
        ]);

        // Terceiro agendamento (conflitante)
        $agendamento3 = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $users[2]->id,
            'titulo' => 'Apresentação de Projeto Final',
            'justificativa' => 'Apresentação final do projeto de pesquisa com prazo definido pela coordenação acadêmica. Presença da banca examinadora é obrigatória.',
            'data_inicio' => $hoje->format('Y-m-d'),
            'hora_inicio' => '15:00',
            'data_fim' => $hoje->format('Y-m-d'),
            'hora_fim' => '17:00',
            'status' => 'pendente',
            'observacoes' => 'Banca examinadora externa já confirmada.',
        ]);

        $agendamentos = [$agendamento1, $agendamento2, $agendamento3];

        // Criar grupo de conflito
        $grupoConflito = AgendamentoConflito::criarGrupoConflito(
            collect($agendamentos)->pluck('id')->toArray(),
            "Conflito de horário detectado automaticamente para o espaço {$espaco->nome} no período de {$hoje->format('d/m/Y')} das 13:30 às 17:00"
        );

        $this->command->info("Conflito de teste criado com sucesso!");
        $this->command->info("Grupo de conflito: {$grupoConflito}");
        $this->command->info("Espaço: {$espaco->nome}");
        $this->command->info("Agendamentos conflitantes: " . count($agendamentos));
    }
}