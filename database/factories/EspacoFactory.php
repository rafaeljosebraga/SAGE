<?php

namespace Database\Factories;

use App\Models\Espaco;
use App\Models\User;
use App\Models\Localizacao;
use Illuminate\Database\Eloquent\Factories\Factory;

class EspacoFactory extends Factory
{
    protected $model = Espaco::class;

    public function definition(): array
    {
        // Usar usuário existente ou criar um
        $user = User::first() ?: User::factory()->create();
        
        // Criar localização de teste se não existir
        $localizacao = Localizacao::first();
        if (!$localizacao) {
            $localizacao = Localizacao::create([
                'nome' => 'Prédio de Teste',
                'descricao' => 'Localização criada para testes',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);
        }

        return [
            'nome' => 'Sala ' . $this->faker->numberBetween(1, 100),
            'descricao' => $this->faker->sentence,
            'capacidade' => $this->faker->numberBetween(10, 50),
            'localizacao_id' => $localizacao->id,
            'disponivel_reserva' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ];
    }
}