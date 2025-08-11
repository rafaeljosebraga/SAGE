<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            EspacoSeeder::class,
            FotoSeeder::class,
            RecursoSeeder::class,
            // AgendamentoSeeder::class, // Descomente se precisar de agendamentos base
            // MultipleConflictSeeder::class, // Descomente para criar conflitos de teste
        ]);
    }
}
