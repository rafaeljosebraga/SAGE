<?php

namespace Database\Factories;

use App\Models\Recurso;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecursoFactory extends Factory
{
    protected $model = Recurso::class;

    public function definition(): array
    {
        // Usar usuário existente ou criar um
        $user = User::first() ?: User::factory()->create();

        $recursos = ['Projetor', 'Notebook', 'Mesa de Som', 'Microfone', 'Tela', 'Quadro Branco'];

        return [
            'nome' => $this->faker->randomElement($recursos),
            'descricao' => $this->faker->sentence,
            'status' => 'disponivel',
            'fixo' => $this->faker->boolean(30), // 30% chance de ser fixo
            'marca' => $this->faker->company,
            'modelo' => $this->faker->bothify('Model-##??'),
            'observacoes' => $this->faker->optional()->sentence,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ];
    }
}