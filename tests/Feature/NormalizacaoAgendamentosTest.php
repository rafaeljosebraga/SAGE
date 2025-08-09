<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Agendamento;
use App\Models\AgendamentoRecorrencia;
use App\Models\AgendamentoAprovacao;
use App\Models\AgendamentoRecurso;
use App\Models\User;
use App\Models\Espaco;
use App\Models\Recurso;

class NormalizacaoAgendamentosTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Espaco $espaco;
    private Recurso $recurso;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->espaco = Espaco::factory()->create();
        $this->recurso = Recurso::factory()->create();
    }

    /** @test */
    public function pode_criar_agendamento_simples_sem_nulos_desnecessarios()
    {
        $agendamento = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Reunião Simples',
            'justificativa' => 'Teste',
            'data_inicio' => now()->addDay()->toDateString(),
            'hora_inicio' => '09:00',
            'data_fim' => now()->addDay()->toDateString(),
            'hora_fim' => '10:00',
            'status' => 'pendente',
        ]);

        $this->assertDatabaseHas('agendamentos', [
            'id' => $agendamento->id,
            'titulo' => 'Reunião Simples',
            'grupo_recorrencia' => null, // Sem dados de recorrência
        ]);

        // Não deve ter dados relacionados
        $this->assertDatabaseMissing('agendamentos_recorrencia', [
            'grupo_recorrencia' => $agendamento->grupo_recorrencia
        ]);
        
        $this->assertDatabaseMissing('agendamentos_aprovacao', [
            'agendamento_id' => $agendamento->id
        ]);
        
        $this->assertDatabaseMissing('agendamentos_recursos', [
            'agendamento_id' => $agendamento->id
        ]);
    }

    /** @test */
    public function pode_criar_agendamento_recorrente_com_dados_normalizados()
    {
        $grupoRecorrencia = 'TEST_' . uniqid();
        
        // Criar dados de recorrência
        $recorrencia = AgendamentoRecorrencia::create([
            'grupo_recorrencia' => $grupoRecorrencia,
            'tipo_recorrencia' => 'semanal',
            'data_fim_recorrencia' => now()->addMonths(2)->toDateString(),
            'is_representante_grupo' => true,
        ]);

        // Criar agendamento
        $agendamento = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Reunião Recorrente',
            'justificativa' => 'Teste recorrência',
            'data_inicio' => now()->addDay()->toDateString(),
            'hora_inicio' => '14:00',
            'data_fim' => now()->addDay()->toDateString(),
            'hora_fim' => '15:00',
            'status' => 'pendente',
            'grupo_recorrencia' => $grupoRecorrencia,
            'color_index' => 2,
        ]);

        // Verificar dados na tabela principal
        $this->assertDatabaseHas('agendamentos', [
            'id' => $agendamento->id,
            'grupo_recorrencia' => $grupoRecorrencia,
        ]);

        // Verificar dados na tabela de recorrência
        $this->assertDatabaseHas('agendamentos_recorrencia', [
            'grupo_recorrencia' => $grupoRecorrencia,
            'tipo_recorrencia' => 'semanal',
            'is_representante_grupo' => true,
        ]);

        // Testar accessors de compatibilidade
        $agendamento->refresh();
        $this->assertTrue($agendamento->recorrente);
        $this->assertEquals('semanal', $agendamento->tipo_recorrencia);
        $this->assertTrue($agendamento->is_representante_grupo);
        $this->assertEquals(2, $agendamento->color_index);
    }

    /** @test */
    public function pode_aprovar_agendamento_com_dados_normalizados()
    {
        $agendamento = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Reunião para Aprovação',
            'justificativa' => 'Teste aprovação',
            'data_inicio' => now()->addDay()->toDateString(),
            'hora_inicio' => '10:00',
            'data_fim' => now()->addDay()->toDateString(),
            'hora_fim' => '11:00',
            'status' => 'pendente',
        ]);

        // Aprovar usando o método do modelo
        $aprovacao = $agendamento->aprovar($this->user->id);

        // Verificar status atualizado
        $this->assertDatabaseHas('agendamentos', [
            'id' => $agendamento->id,
            'status' => 'aprovado',
        ]);

        // Verificar dados na tabela de aprovação
        $this->assertDatabaseHas('agendamentos_aprovacao', [
            'agendamento_id' => $agendamento->id,
            'aprovado_por' => $this->user->id,
            'motivo_rejeicao' => null,
        ]);

        // Testar accessors de compatibilidade
        $agendamento->refresh();
        $this->assertEquals($this->user->id, $agendamento->aprovado_por);
        $this->assertNotNull($agendamento->aprovado_em);
        $this->assertNull($agendamento->motivo_rejeicao);
    }

    /** @test */
    public function pode_rejeitar_agendamento_com_motivo()
    {
        $agendamento = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Reunião para Rejeição',
            'justificativa' => 'Teste rejeição',
            'data_inicio' => now()->addDay()->toDateString(),
            'hora_inicio' => '12:00',
            'data_fim' => now()->addDay()->toDateString(),
            'hora_fim' => '13:00',
            'status' => 'pendente',
        ]);

        $motivo = 'Conflito de horário';
        $agendamento->rejeitar($this->user->id, $motivo);

        // Verificar status atualizado
        $this->assertDatabaseHas('agendamentos', [
            'id' => $agendamento->id,
            'status' => 'rejeitado',
        ]);

        // Verificar dados na tabela de aprovação
        $this->assertDatabaseHas('agendamentos_aprovacao', [
            'agendamento_id' => $agendamento->id,
            'aprovado_por' => $this->user->id,
            'motivo_rejeicao' => $motivo,
        ]);

        // Testar accessors de compatibilidade
        $agendamento->refresh();
        $this->assertEquals($motivo, $agendamento->motivo_rejeicao);
    }

    /** @test */
    public function pode_adicionar_recursos_normalizados()
    {
        $agendamento = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Reunião com Recursos',
            'justificativa' => 'Teste recursos',
            'data_inicio' => now()->addDay()->toDateString(),
            'hora_inicio' => '15:00',
            'data_fim' => now()->addDay()->toDateString(),
            'hora_fim' => '16:00',
            'status' => 'pendente',
        ]);

        // Adicionar recurso
        $agendamento->adicionarRecurso($this->recurso->id, 3, 'Observação teste');

        // Verificar dados na tabela de recursos
        $this->assertDatabaseHas('agendamentos_recursos', [
            'agendamento_id' => $agendamento->id,
            'recurso_id' => $this->recurso->id,
            'quantidade' => 3,
            'observacoes' => 'Observação teste',
        ]);

        // Testar relacionamentos
        $agendamento->refresh();
        $recursosSolicitados = $agendamento->recursosSolicitados()->get();
        $this->assertCount(1, $recursosSolicitados);
        $this->assertCount(1, $agendamento->recursos);
        
        $recursoSolicitado = $recursosSolicitados->first();
        $this->assertEquals($this->recurso->id, $recursoSolicitado->recurso_id);
        $this->assertEquals(3, $recursoSolicitado->quantidade);
    }

    /** @test */
    public function relacionamentos_funcionam_corretamente()
    {
        $grupoRecorrencia = 'REL_' . uniqid();
        
        // Criar recorrência
        $recorrencia = AgendamentoRecorrencia::create([
            'grupo_recorrencia' => $grupoRecorrencia,
            'tipo_recorrencia' => 'mensal',
            'data_fim_recorrencia' => now()->addMonths(6)->toDateString(),
            'is_representante_grupo' => false,
        ]);

        // Criar agendamento
        $agendamento = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Teste Relacionamentos',
            'justificativa' => 'Teste',
            'data_inicio' => now()->addDay()->toDateString(),
            'hora_inicio' => '08:00',
            'data_fim' => now()->addDay()->toDateString(),
            'hora_fim' => '09:00',
            'status' => 'aprovado',
            'grupo_recorrencia' => $grupoRecorrencia,
            'color_index' => 3,
        ]);

        // Aprovar e adicionar recurso
        $agendamento->aprovar($this->user->id);
        $agendamento->adicionarRecurso($this->recurso->id, 1);

        // Testar relacionamentos
        $agendamento = Agendamento::with(['recorrencia', 'aprovacao', 'recursos'])->find($agendamento->id);
        
        $this->assertNotNull($agendamento->recorrencia);
        $this->assertEquals('mensal', $agendamento->recorrencia->tipo_recorrencia);
        
        $this->assertNotNull($agendamento->aprovacao);
        $this->assertEquals($this->user->id, $agendamento->aprovacao->aprovado_por);
        
        $this->assertCount(1, $agendamento->recursos);
        $this->assertEquals($this->recurso->id, $agendamento->recursos->first()->id);
    }

    /** @test */
    public function consultas_otimizadas_funcionam()
    {
        // Criar agendamentos de diferentes tipos
        $simples = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Simples',
            'justificativa' => 'Teste',
            'data_inicio' => now()->addDay()->toDateString(),
            'hora_inicio' => '09:00',
            'data_fim' => now()->addDay()->toDateString(),
            'hora_fim' => '10:00',
            'status' => 'pendente',
        ]);

        $grupoRecorrencia = 'OPT_' . uniqid();
        AgendamentoRecorrencia::create([
            'grupo_recorrencia' => $grupoRecorrencia,
            'tipo_recorrencia' => 'diaria',
            'data_fim_recorrencia' => now()->addWeek()->toDateString(),
            'is_representante_grupo' => true,
        ]);

        $recorrente = Agendamento::create([
            'espaco_id' => $this->espaco->id,
            'user_id' => $this->user->id,
            'titulo' => 'Recorrente',
            'justificativa' => 'Teste',
            'data_inicio' => now()->addDays(2)->toDateString(),
            'hora_inicio' => '14:00',
            'data_fim' => now()->addDays(2)->toDateString(),
            'hora_fim' => '15:00',
            'status' => 'aprovado',
            'grupo_recorrencia' => $grupoRecorrencia,
            'color_index' => 1,
        ]);

        $recorrente->aprovar($this->user->id);

        // Testar consultas otimizadas
        $simplesCount = Agendamento::whereNull('grupo_recorrencia')->count();
        $this->assertEquals(1, $simplesCount);

        $recorrentesCount = Agendamento::whereNotNull('grupo_recorrencia')->count();
        $this->assertEquals(1, $recorrentesCount);

        $aprovadosCount = Agendamento::whereHas('aprovacao')->count();
        $this->assertEquals(1, $aprovadosCount);

        // Testar eager loading
        $agendamentos = Agendamento::with(['recorrencia', 'aprovacao'])->get();
        $this->assertCount(2, $agendamentos);
        
        // Verificar que apenas o recorrente tem dados de recorrência
        $agendamentoRecorrente = $agendamentos->where('grupo_recorrencia', $grupoRecorrencia)->first();
        $this->assertNotNull($agendamentoRecorrente->recorrencia);
        
        $agendamentoSimples = $agendamentos->whereNull('grupo_recorrencia')->first();
        $this->assertNull($agendamentoSimples->recorrencia);
    }
}