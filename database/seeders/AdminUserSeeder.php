<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Criar conta do diretor (você)
        User::updateOrCreate(
            ['email' => 'diretor@sage.com'],
            [
                'name' => 'João (Diretor)',
                'email' => 'diretor@sage.com',
                'perfil_acesso' => 'diretor_geral',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        // Criar administrador principal
        User::updateOrCreate(
            ['email' => 'admin@sage.com'],
            [
                'name' => 'Administrador do Sistema',
                'email' => 'admin@sage.com',
                'perfil_acesso' => 'administrador',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
            ]
        );

        // Criar alguns usuários de exemplo
        User::updateOrCreate(
            ['email' => 'coordenador@sage.com'],
            [
                'name' => 'Maria Coordenadora',
                'email' => 'coordenador@sage.com',
                'perfil_acesso' => 'coordenador',
                'password' => Hash::make('coordenador123'),
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'servidor@sage.com'],
            [
                'name' => 'Carlos Servidor',
                'email' => 'servidor@sage.com',
                'perfil_acesso' => 'servidores',
                'password' => Hash::make('servidor123'),
                'email_verified_at' => now(),
            ]
        );
    }
}
