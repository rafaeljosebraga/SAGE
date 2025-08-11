<?php

require_once 'vendor/autoload.php';

use App\Models\Agendamento;
use App\Models\AgendamentoConflito;

// Configurar Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Verificando agendamentos com conflitos não registrados...\n";

// Buscar todos os agendamentos pendentes ou aprovados
$agendamentos = Agendamento::whereIn('status', ['pendente', 'aprovado'])
    ->with(['espaco', 'user', 'conflitoAtivo'])
    ->get();

$conflitosEncontrados = 0;

foreach ($agendamentos as $agendamento) {
    // Verificar se tem conflito ativo registrado
    if (!$agendamento->conflitoAtivo) {
        // Detectar conflitos reais
        $conflitosReais = $agendamento->detectarConflitos();
        
        if ($conflitosReais->isNotEmpty()) {
            $conflitosEncontrados++;
            echo "Agendamento {$agendamento->id} ({$agendamento->titulo}) tem {$conflitosReais->count()} conflitos não registrados\n";
            
            // Criar conflito
            $grupoConflito = $agendamento->criarConflito($conflitosReais);
            echo "  -> Conflito criado - Grupo: {$grupoConflito}\n";
        }
    }
}

echo "\nTotal de conflitos corrigidos: {$conflitosEncontrados}\n";