<?php

namespace Database\Seeders;

use App\Models\Espaco;
use App\Models\Localizacao;
use App\Models\User;
use Illuminate\Database\Seeder;

class EspacoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Primeiro, criar algumas localizações se não existirem
        $localizacoes = [
            ['nome' => 'Prédio Principal', 'descricao' => 'Prédio principal da instituição'],
            ['nome' => 'Anexo A', 'descricao' => 'Anexo A - Salas de aula'],
            ['nome' => 'Biblioteca', 'descricao' => 'Prédio da biblioteca'],
        ];

        foreach ($localizacoes as $localizacao) {
            Localizacao::updateOrCreate(
                ['nome' => $localizacao['nome']],
                $localizacao + ['created_by' => 1, 'updated_by' => 1]
            );
        }

        // Buscar usuários para usar como criadores
        $diretor = User::where('email', 'diretor@sage.com')->first();
        $admin = User::where('email', 'admin@sage.com')->first();
        $coordenador = User::where('email', 'coordenador@sage.com')->first();

        // Buscar localizações criadas
        $predioMain = Localizacao::where('nome', 'Prédio Principal')->first();
        $anexoA = Localizacao::where('nome', 'Anexo A')->first();
        $biblioteca = Localizacao::where('nome', 'Biblioteca')->first();

        // Criar espaços de exemplo
        $espacos = [
            [
                'nome' => 'Auditório Principal',
                'capacidade' => 200,
                'descricao' => 'Auditório principal com equipamentos audiovisuais completos',
                'localizacao_id' => $predioMain?->id,
                'status' => 'ativo',
                'disponivel_reserva' => true,
                'observacoes' => 'Necessário agendamento prévio para eventos',
                'created_by' => $diretor?->id ?? 1,
                'updated_by' => $diretor?->id ?? 1,
                'responsavel_id' => $diretor?->id ?? 1,
            ],
            [
                'nome' => 'Sala de Reuniões A1',
                'capacidade' => 12,
                'descricao' => 'Sala de reuniões com mesa para 12 pessoas',
                'localizacao_id' => $anexoA?->id,
                'status' => 'ativo',
                'disponivel_reserva' => true,
                'observacoes' => 'Equipada com projetor e sistema de videoconferência',
                'created_by' => $admin?->id ?? 1,
                'updated_by' => $admin?->id ?? 1,
                'responsavel_id' => $admin?->id ?? 1,
            ],
            [
                'nome' => 'Laboratório de Informática',
                'capacidade' => 30,
                'descricao' => 'Laboratório com 30 computadores para aulas práticas',
                'localizacao_id' => $anexoA?->id,
                'status' => 'ativo',
                'disponivel_reserva' => true,
                'observacoes' => 'Disponível para aulas de segunda a sexta',
                'created_by' => $coordenador?->id ?? 1,
                'updated_by' => $coordenador?->id ?? 1,
                'responsavel_id' => $coordenador?->id ?? 1,
            ],
            [
                'nome' => 'Sala de Estudos Coletivos',
                'capacidade' => 8,
                'descricao' => 'Sala para estudos em grupo na biblioteca',
                'localizacao_id' => $biblioteca?->id,
                'status' => 'ativo',
                'disponivel_reserva' => true,
                'observacoes' => 'Uso livre para estudantes',
                'created_by' => $diretor?->id ?? 1,
                'updated_by' => $diretor?->id ?? 1,
                'responsavel_id' => $diretor?->id ?? 1,
            ],
            [
                'nome' => 'Sala de Manutenção',
                'capacidade' => 5,
                'descricao' => 'Sala em manutenção - temporariamente indisponível',
                'localizacao_id' => $predioMain?->id,
                'status' => 'manutencao',
                'disponivel_reserva' => false,
                'observacoes' => 'Em reforma até o final do mês',
                'created_by' => $admin?->id ?? 1,
                'updated_by' => $admin?->id ?? 1,
                'responsavel_id' => $admin?->id ?? 1,
            ],
        ];

        foreach ($espacos as $espaco) {
            Espaco::updateOrCreate(
                ['nome' => $espaco['nome']],
                $espaco
            );
        }

        $this->command->info('Espaços de exemplo criados com sucesso!');
    }
}