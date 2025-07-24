<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Agendamento;
use App\Models\Espaco;
use App\Models\User;
use Carbon\Carbon;

class AgendamentoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buscar usuários e espaços existentes
        $users = User::all();
        $espacos = Espaco::where('disponivel_reserva', true)->get();

        if ($users->isEmpty() || $espacos->isEmpty()) {
            $this->command->warn('Não há usuários ou espaços disponíveis para criar agendamentos.');
            return;
        }

        $diretor = $users->where('perfil_acesso', 'diretor_geral')->first();
        $coordenador = $users->where('perfil_acesso', 'coordenador')->first();
        $servidor = $users->where('perfil_acesso', 'servidor')->first();

        // Agendamentos de exemplo
        $agendamentos = [
            [
                'espaco_id' => $espacos->first()->id,
                'user_id' => $servidor?->id ?? $users->first()->id,
                'titulo' => 'Reunião de Equipe',
                'justificativa' => 'Reunião semanal para alinhamento das atividades da equipe e discussão de projetos em andamento.',
                'data_inicio' => Carbon::today()->addDays(1),
                'hora_inicio' => '09:00',
                'data_fim' => Carbon::today()->addDays(1),
                'hora_fim' => '11:00',
                'status' => 'aprovado',
                'aprovado_por' => $diretor?->id,
                'aprovado_em' => now(),
                'observacoes' => 'Necessário projetor para apresentação.',
                'recursos_solicitados' => [1, 2], // IDs de recursos, se existirem
            ],
            [
                'espaco_id' => $espacos->skip(1)->first()?->id ?? $espacos->first()->id,
                'user_id' => $coordenador?->id ?? $users->skip(1)->first()?->id ?? $users->first()->id,
                'titulo' => 'Treinamento de Capacitação',
                'justificativa' => 'Treinamento sobre novas tecnologias para a equipe de desenvolvimento.',
                'data_inicio' => Carbon::today()->addDays(3),
                'hora_inicio' => '14:00',
                'data_fim' => Carbon::today()->addDays(3),
                'hora_fim' => '17:00',
                'status' => 'pendente',
                'observacoes' => 'Treinamento para 15 pessoas.',
                'recursos_solicitados' => [1], // ID de recurso, se existir
            ],
            [
                'espaco_id' => $espacos->first()->id,
                'user_id' => $servidor?->id ?? $users->first()->id,
                'titulo' => 'Apresentação de Projeto',
                'justificativa' => 'Apresentação dos resultados do projeto de modernização do sistema.',
                'data_inicio' => Carbon::today()->addDays(5),
                'hora_inicio' => '10:00',
                'data_fim' => Carbon::today()->addDays(5),
                'hora_fim' => '12:00',
                'status' => 'rejeitado',
                'aprovado_por' => $diretor?->id,
                'aprovado_em' => now(),
                'motivo_rejeicao' => 'Conflito com evento já agendado. Favor reagendar.',
            ],
            [
                'espaco_id' => $espacos->skip(2)->first()?->id ?? $espacos->first()->id,
                'user_id' => $coordenador?->id ?? $users->skip(1)->first()?->id ?? $users->first()->id,
                'titulo' => 'Workshop de Inovação',
                'justificativa' => 'Workshop para discussão de ideias inovadoras e melhoria de processos.',
                'data_inicio' => Carbon::today()->addWeek(),
                'hora_inicio' => '08:30',
                'data_fim' => Carbon::today()->addWeek(),
                'hora_fim' => '12:00',
                'status' => 'aprovado',
                'aprovado_por' => $diretor?->id,
                'aprovado_em' => now(),
                'observacoes' => 'Coffee break incluído.',
                'recorrente' => true,
                'tipo_recorrencia' => 'semanal',
                'data_fim_recorrencia' => Carbon::today()->addMonth(),
            ],
            [
                'espaco_id' => $espacos->first()->id,
                'user_id' => $servidor?->id ?? $users->first()->id,
                'titulo' => 'Reunião com Fornecedores',
                'justificativa' => 'Reunião para negociação de contratos e avaliação de propostas.',
                'data_inicio' => Carbon::today()->addDays(7),
                'hora_inicio' => '15:00',
                'data_fim' => Carbon::today()->addDays(7),
                'hora_fim' => '16:30',
                'status' => 'pendente',
                'observacoes' => 'Reunião confidencial.',
            ],
            [
                'espaco_id' => $espacos->skip(1)->first()?->id ?? $espacos->first()->id,
                'user_id' => $diretor?->id ?? $users->first()->id,
                'titulo' => 'Assembleia Geral',
                'justificativa' => 'Assembleia geral para discussão do planejamento estratégico do próximo ano.',
                'data_inicio' => Carbon::today()->addDays(10),
                'hora_inicio' => '09:00',
                'data_fim' => Carbon::today()->addDays(10),
                'hora_fim' => '17:00',
                'status' => 'aprovado',
                'aprovado_por' => $diretor?->id,
                'aprovado_em' => now(),
                'observacoes' => 'Evento para todos os servidores. Almoço será servido.',
                'recursos_solicitados' => [1, 2, 3], // IDs de recursos, se existirem
            ],
        ];

        foreach ($agendamentos as $agendamentoData) {
            // Verificar se o espaço existe
            if (!Espaco::find($agendamentoData['espaco_id'])) {
                continue;
            }

            // Verificar se o usuário existe
            if (!User::find($agendamentoData['user_id'])) {
                continue;
            }

            Agendamento::create($agendamentoData);
        }

        $this->command->info('Agendamentos de exemplo criados com sucesso!');
    }
}