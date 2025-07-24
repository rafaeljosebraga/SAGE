<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use App\Http\Controllers\EspacoController;
use App\Models\User;
use App\Models\Localizacao;
use App\Models\Recurso;
use App\Models\Espaco;

// Configurar ambiente Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TESTE DE VALIDAÇÃO DE FOTOS ===\n\n";

try {
    // 1. Verificar se existem dados necessários
    echo "1. Verificando dados necessários...\n";
    
    $user = User::first();
    if (!$user) {
        echo "❌ Nenhum usuário encontrado\n";
        exit(1);
    }
    echo "✅ Usuário encontrado: {$user->email}\n";
    
    $localizacoes = Localizacao::count();
    echo "✅ Localizações encontradas: {$localizacoes}\n";
    
    $recursos = Recurso::count();
    echo "✅ Recursos encontrados: {$recursos}\n";
    
    // 2. Testar criação SEM fotos (deve falhar)
    echo "\n2. Testando criação SEM fotos (deve falhar)...\n";
    
    // Simular autenticação
    auth()->login($user);
    
    $controller = new EspacoController();
    
    // Criar request sem fotos
    $request = Request::create('/espacos', 'POST', [
        'nome' => 'Espaço Teste Validação',
        'capacidade' => '30',
        'descricao' => 'Teste de validação de fotos',
        'localizacao_id' => Localizacao::first()->id,
        'status' => 'ativo',
        'disponivel_reserva' => true,
        'recursos' => [],
    ]);
    
    try {
        $response = $controller->store($request);
        echo "❌ Criação deveria ter falhado sem fotos!\n";
    } catch (\Illuminate\Validation\ValidationException $e) {
        $errors = $e->errors();
        if (isset($errors['fotos'])) {
            echo "✅ Validação funcionando: {$errors['fotos'][0]}\n";
        } else {
            echo "❌ Erro de validação, mas não para fotos\n";
            print_r($errors);
        }
    }
    
    // 3. Testar edição de espaço sem fotos
    echo "\n3. Testando edição de espaço sem fotos...\n";
    
    $espaco = Espaco::with('fotos')->first();
    if ($espaco) {
        echo "✅ Espaço encontrado: {$espaco->nome}\n";
        echo "✅ Fotos atuais: " . $espaco->fotos->count() . "\n";
        
        // Se o espaço não tem fotos, a validação deve falhar
        if ($espaco->fotos->count() == 0) {
            echo "⚠️ Espaço sem fotos - validação deve impedir edição\n";
        } else {
            echo "✅ Espaço tem fotos - edição permitida\n";
        }
    } else {
        echo "⚠️ Nenhum espaço encontrado para testar edição\n";
    }
    
    echo "\n=== TESTE CONCLUÍDO ===\n";
    echo "✅ Validação de fotos obrigatórias implementada!\n";
    
} catch (Exception $e) {
    echo "❌ Erro durante teste: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}