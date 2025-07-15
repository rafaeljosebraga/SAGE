<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Espaco;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Foto>
 */
class FotoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'espaco_id' => Espaco::factory(),
            'url' => '/storage/espacos/' . $this->faker->uuid() . '.jpg',
            'nome_original' => $this->faker->word() . '.jpg',
            'tamanho' => $this->faker->numberBetween(500000, 5000000), // 500KB a 5MB
            'tipo_mime' => $this->faker->randomElement(['image/jpeg', 'image/png', 'image/gif']),
            'ordem' => $this->faker->numberBetween(0, 10),
            'descricao' => $this->faker->optional()->sentence(),
            'created_by' => User::factory(),
            'updated_by' => User::factory(),
        ];
    }
}