<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Agendamento;
use App\Models\AgendamentoRecorrencia;
use App\Models\AgendamentoAprovacao;
use App\Models\AgendamentoRecurso;
use App\Models\User;
use App\Models\Espaco;
use App\Models\Recurso;

class ExemploNormalizacaoSeeder extends Seeder
{
    /**
     * Demonstra como usar a estrutura normalizada
     */
    public function run(): void
    {
        $this->command->info('Criando exemplos da estrutura normalizada...');
        
        // Buscar dados existentes
        $user = User::first();
        $espaco = Espaco::first();
        $recurso = Recurso::first();
        
        if (!$user || !$espaco) {
            $this->command->warn('Necessário ter pelo menos 1 usuário e 1 espaço cadastrados');
            return;
        }
        
        // 1. Agendamento simples (sem recorrência, sem recursos)
        $agendamentoSimples = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $user->id,
            'titulo' => 'Reunião Simples',
            'justificativa' => 'Reunião de equipe',
            'data_inicio' => now()->addDays(1)->toDateString(),
            'hora_inicio' => '09:00',
            'data_fim' => now()->addDays(1)->toDateString(),
            'hora_fim' => '10:00',
            'status' => 'pendente',
            'observacoes' => 'Reunião sem recursos extras',
        ]);
        
        $this->command->line("Agendamento simples criado (ID: {$agendamentoSimples->id})");
        
        // 2. Agendamento com recorrência
        $grupoRecorrencia = 'REC_' . uniqid();
        
        // Criar dados de recorrência
        $recorrencia = AgendamentoRecorrencia::create([
            'grupo_recorrencia' => $grupoRecorrencia,
            'tipo_recorrencia' => 'semanal',
            'data_fim_recorrencia' => now()->addMonths(3)->toDateString(),
            'is_representante_grupo' => true,
            'color_index' => 1,
        ]);
        
        // Criar agendamento recorrente
        $agendamentoRecorrente = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $user->id,
            'titulo' => 'Reunião Semanal',
            'justificativa' => 'Reunião recorrente da equipe',
            'data_inicio' => now()->addDays(2)->toDateString(),
            'hora_inicio' => '14:00',
            'data_fim' => now()->addDays(2)->toDateString(),
            'hora_fim' => '15:00',
            'status' => 'aprovado',
            'grupo_recorrencia' => $grupoRecorrencia,
        ]);
        
        $this->command->line("Agendamento recorrente criado (ID: {$agendamentoRecorrente->id})");
        
        // 3. Aprovar o agendamento recorrente
        $agendamentoRecorrente->aprovar($user->id);
        $this->command->line("Agendamento aprovado");
        
        // 4. Agendamento com recursos
        $agendamentoComRecursos = Agendamento::create([
            'espaco_id' => $espaco->id,
            'user_id' => $user->id,
            'titulo' => 'Apresentação com Recursos',
            'justificativa' => 'Apresentação que precisa de equipamentos',
            'data_inicio' => now()->addDays(3)->toDateString(),
            'hora_inicio' => '16:00',
            'data_fim' => now()->addDays(3)->toDateString(),
            'hora_fim' => '18:00',
            'status' => 'pendente',
        ]);
        
        // Adicionar recursos se existirem
        if ($recurso) {
            $agendamentoComRecursos->adicionarRecurso($recurso->id, 2, 'Necessário para apresentação');
            $this->command->line("Recurso adicionado ao agendamento (ID: {$agendamentoComRecursos->id})");
        }
        
        // 5. Demonstrar consultas otimizadas
        $this->demonstrarConsultas();
        
        // 6. Mostrar estatísticas de redução de nulos
        $this->mostrarEstatisticasNulos();
    }
    
    private function demonstrarConsultas()
    {
        $this->command->info('🔍 Demonstrando consultas otimizadas...');
        
        // Consulta apenas agendamentos simples (sem JOINs desnecessários)
        $simples = Agendamento::whereNull('grupo_recorrencia')->count();
        $this->command->line("  Agendamentos simples: {$simples}");
        
        // Consulta apenas agendamentos recorrentes (com dados de recorrência)
        $recorrentes = Agendamento::with('recorrencia')
            ->whereNotNull('grupo_recorrencia')
            ->count();
        $this->command->line("  Agendamentos recorrentes: {$recorrentes}");
        
        // Consulta apenas agendamentos aprovados (com dados de aprovação)
        $aprovados = Agendamento::with('aprovacao.aprovadoPor')
            ->where('status', 'aprovado')
            ->count();
        $this->command->line("  Agendamentos aprovados: {$aprovados}");
        
        // Consulta apenas agendamentos com recursos
        $comRecursos = Agendamento::has('recursosSolicitados')->count();
        $this->command->line("  Agendamentos com recursos: {$comRecursos}");
    }
    
    private function mostrarEstatisticasNulos()
    {
        $this->command->info('Estatísticas de redução de nulos:');
        
        $totalAgendamentos = Agendamento::count();
        $comRecorrencia = Agendamento::whereNotNull('grupo_recorrencia')->count();
        $comAprovacao = AgendamentoAprovacao::count();
        $comRecursos = AgendamentoRecurso::count();
        
        $this->command->table([
            'Métrica',
            'Estrutura Antiga (estimativa)',
            'Estrutura Nova',
            'Redução de Nulos'
        ], [
            [
                'Dados de Recorrência',
                "{$totalAgendamentos} linhas × 6 colunas = " . ($totalAgendamentos * 6) . " campos",
                "{$comRecorrencia} linhas × 6 colunas = " . ($comRecorrencia * 6) . " campos",
                $totalAgendamentos > 0 ? round((1 - ($comRecorrencia * 6) / ($totalAgendamentos * 6)) * 100, 1) . '%' : '0%'
            ],
            [
                'Dados de Aprovação',
                "{$totalAgendamentos} linhas × 3 colunas = " . ($totalAgendamentos * 3) . " campos",
                "{$comAprovacao} linhas × 3 colunas = " . ($comAprovacao * 3) . " campos",
                $totalAgendamentos > 0 ? round((1 - ($comAprovacao * 3) / ($totalAgendamentos * 3)) * 100, 1) . '%' : '0%'
            ],
            [
                'Recursos (JSON → Normalizado)',
                "{$totalAgendamentos} linhas × 1 coluna JSON",
                "{$comRecursos} linhas estruturadas",
                'Dados estruturados + sem nulos'
            ]
        ]);
        
        $this->command->info('💡 Benefícios adicionais:');
        $this->command->line('  • Consultas mais rápidas (menos dados por linha)');
        $this->command->line('  • Melhor integridade referencial');
        $this->command->line('  • Facilita relatórios e análises');
        $this->command->line('  • Estrutura mais flexível para futuras expansões');
    }
}