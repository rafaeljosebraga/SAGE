<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recurso;
use App\Models\User;

class RecursoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buscar um usuário para ser o created_by/updated_by
        $user = User::first();
        
        if (!$user) {
            $this->command->warn('Nenhum usuário encontrado. Execute AdminUserSeeder primeiro.');
            return;
        }

        $recursos = [
            [
                'nome' => 'Projetor',
                'descricao' => 'Projetor multimídia para apresentações',
                'status' => 'disponivel',
                'fixo' => false,
                'marca' => 'Epson',
                'modelo' => 'PowerLite X41+',
                'observacoes' => 'Projetor portátil, resolução XGA',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ],
            [
                'nome' => 'Notebook',
                'descricao' => 'Notebook para apresentações e trabalho',
                'status' => 'disponivel',
                'fixo' => false,
                'marca' => 'Dell',
                'modelo' => 'Inspiron 15 3000',
                'observacoes' => 'Notebook com Windows 11, Office instalado',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ],
            [
                'nome' => 'Mesa de Som',
                'descricao' => 'Mesa de som para eventos e apresentações',
                'status' => 'disponivel',
                'fixo' => true,
                'marca' => 'Yamaha',
                'modelo' => 'MG10XU',
                'observacoes' => 'Mesa fixa na sala de eventos',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ],
            [
                'nome' => 'Microfone',
                'descricao' => 'Microfone sem fio para apresentações',
                'status' => 'disponivel',
                'fixo' => false,
                'marca' => 'Shure',
                'modelo' => 'SM58',
                'observacoes' => 'Microfone dinâmico cardioide',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ],
            [
                'nome' => 'Tela de Projeção',
                'descricao' => 'Tela retrátil para projeção',
                'status' => 'disponivel',
                'fixo' => true,
                'marca' => 'Elmo',
                'modelo' => 'SC-A100',
                'observacoes' => 'Tela fixa instalada na parede',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ],
            [
                'nome' => 'Quadro Branco',
                'descricao' => 'Quadro branco móvel',
                'status' => 'disponivel',
                'fixo' => false,
                'marca' => 'Stalo',
                'modelo' => 'QB-120',
                'observacoes' => 'Quadro com rodízios e canetas incluídas',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]
        ];

        foreach ($recursos as $recursoData) {
            // Verificar se o recurso já existe
            $exists = Recurso::where('nome', $recursoData['nome'])
                            ->where('marca', $recursoData['marca'])
                            ->where('modelo', $recursoData['modelo'])
                            ->exists();
            
            if (!$exists) {
                Recurso::create($recursoData);
                $this->command->line("Recurso '{$recursoData['nome']}' criado com sucesso!");
            } else {
                $this->command->line("Recurso '{$recursoData['nome']}' já existe, pulando...");
            }
        }

        $this->command->info('Recursos de exemplo criados com sucesso!');
    }
}