import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, MapPin, Users, AlertTriangle } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAgendamentoColors } from '@/components/ui/agend-colors';
import { useToast } from '@/hooks/use-toast';

import type { PageProps, Agendamento, Espaco, Recurso, BreadcrumbItem } from '@/types';

interface Props extends PageProps {
    agendamento: Agendamento;
    espacos: Espaco[];
    recursos: Recurso[];
}

export default function AgendamentosEdit({ agendamento, espacos, recursos }: Props) {
    // Usar o hook de cores
    const { getEventBorderColor } = useAgendamentoColors();
    
    // Usar o hook de toast
    const { toast } = useToast();
    
    const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(
        espacos.find(e => e.id === agendamento.espaco_id) || null
    );

    // Estado para modal de conflito de horário
    const [conflictTimeModal, setConflictTimeModal] = useState<{
        open: boolean;
        message: string;
    }>({ open: false, message: "" });

    // Função para obter URL de retorno baseada nos parâmetros da URL atual
    const getBackUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const from = urlParams.get('from');
        
        // Se veio da tela de detalhes, voltar para ela
        if (from === 'show') {
            // Preservar os parâmetros originais (exceto o 'from')
            const backParams = new URLSearchParams(urlParams);
            backParams.delete('from'); // Remover o indicador de origem
            
            const queryString = backParams.toString();
            return queryString ? `/agendamentos/${agendamento.id}?${queryString}` : `/agendamentos/${agendamento.id}`;
        }
        
        // Caso contrário, voltar para a lista/calendário
        const view = urlParams.get('view');
        const date = urlParams.get('date');
        const espacos = urlParams.get('espacos');
        const espaco_id = urlParams.get('espaco_id');
        const status = urlParams.get('status');
        const data_inicio = urlParams.get('data_inicio');
        const data_fim = urlParams.get('data_fim');
        const nome = urlParams.get('nome');
        
        // Construir URL de retorno com os parâmetros preservados
        const backParams = new URLSearchParams();
        
        // Preservar visualização (se não especificada, usar 'week' como padrão)
        if (view) {
            backParams.set('view', view);
        }
        
        // Preservar data se especificada
        if (date) {
            backParams.set('date', date);
        }
        
        // Preservar espaços selecionados (para visualizações de calendário)
        if (espacos) {
            backParams.set('espacos', espacos);
        }
        
        // Preservar filtros da lista (para visualização de lista)
        if (espaco_id) {
            backParams.set('espaco_id', espaco_id);
        }
        
        if (status) {
            backParams.set('status', status);
        }
        
        if (data_inicio) {
            backParams.set('data_inicio', data_inicio);
        }
        
        if (data_fim) {
            backParams.set('data_fim', data_fim);
        }
        
        if (nome) {
            backParams.set('nome', nome);
        }
        
        const queryString = backParams.toString();
        return queryString ? `/agendamentos?${queryString}` : '/agendamentos';
    };

    // Função para formatar data no formato YYYY-MM-DD
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        // Se já está no formato correto, retorna como está
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        // Se está em outro formato, tenta converter
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    // Função para formatar hora no formato HH:MM
    const formatTimeForInput = (timeString: string) => {
        if (!timeString) return '';
        // Se já está no formato correto, retorna como está
        if (timeString.match(/^\d{2}:\d{2}$/)) {
            return timeString;
        }
        // Se tem segundos, remove
        if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
            return timeString.substring(0, 5);
        }
        return timeString;
    };

    const { data, setData, put, processing, errors } = useForm({
        espaco_id: agendamento.espaco_id.toString(),
        titulo: agendamento.titulo,
        justificativa: agendamento.justificativa,
        data_inicio: formatDateForInput(agendamento.data_inicio),
        hora_inicio: formatTimeForInput(agendamento.hora_inicio),
        data_fim: formatDateForInput(agendamento.data_fim),
        hora_fim: formatTimeForInput(agendamento.hora_fim),
        observacoes: agendamento.observacoes || '',
        recursos_solicitados: agendamento.recursos_solicitados || [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação adicional no frontend
        if (!data.data_inicio || !data.hora_inicio || !data.data_fim || !data.hora_fim) {
            alert('Por favor, preencha todos os campos de data e horário.');
            return;
        }

        // Validar formato da hora
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(data.hora_inicio) || !timeRegex.test(data.hora_fim)) {
            alert('Por favor, insira horários válidos no formato HH:MM.');
            return;
        }

        // Validar se a hora de fim é posterior à hora de início no mesmo dia
        if (data.data_inicio === data.data_fim && data.hora_fim <= data.hora_inicio) {
            alert('A hora de fim deve ser posterior à hora de início.');
            return;
        }

        put(`/agendamentos/${agendamento.id}`, {
            onSuccess: () => {
                // Mostrar toast de sucesso
                toast({
                    title: "Agendamento atualizado com sucesso!",
                    description: "As alterações foram salvas.",
                });
                
                // Aguardar 1 segundo e redirecionar para a tela anterior
                setTimeout(() => {
                    router.get(getBackUrl());
                }, 1000);
            },
            onError: (errors) => {
                console.error('Erro ao atualizar agendamento:', errors);
                
                // Verificar se há conflitos de horário
                if (errors.horario) {
                    setConflictTimeModal({ 
                        open: true, 
                        message: errors.horario 
                    });
                }
            }
        });
    };

    const handleEspacoChange = (value: string) => {
        setData('espaco_id', value);
        const espaco = espacos.find(e => e.id.toString() === value);
        setSelectedEspaco(espaco || null);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Agendamentos', href: '/agendamentos' },
        { title: 'Editar Agendamento', href: `/agendamentos/${agendamento.id}/editar` }
    ];

    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Agendamento - ${agendamento.titulo}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link 
                        href={getBackUrl()}
                        className="
                                    ml-4
                                    bg-white dark:bg-white
                                    text-black dark:text-black
                                    hover:bg-[#EF7D4C] hover:text-white
                                    dark:hover:bg-[#EF7D4C] dark:hover:text-white
                                    transition-colors
                                "
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Editar Agendamento</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulário Principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Informações Básicas */}
                            <Card className={`border-l-4 ${getEventBorderColor({
                                ...agendamento,
                                data_inicio: data.data_inicio || agendamento.data_inicio,
                                hora_inicio: data.hora_inicio || agendamento.hora_inicio,
                                data_fim: data.data_fim || agendamento.data_fim,
                                hora_fim: data.hora_fim || agendamento.hora_fim
                            })}`}>
                                <CardHeader>
                                    <CardTitle>Informações do Agendamento</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="espaco_id">Espaço *</Label>
                                        <Select
                                            value={data.espaco_id}
                                            onValueChange={handleEspacoChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um espaço" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {espacos.map((espaco) => (
                                                    <SelectItem key={espaco.id} value={espaco.id.toString()}>
                                                        {espaco.nome} ({espaco.capacidade} pessoas)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.espaco_id && (
                                            <p className="text-sm text-red-600 mt-1">{errors.espaco_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="titulo">Título do Evento *</Label>
                                        <Input
                                            id="titulo"
                                            value={data.titulo}
                                            onChange={(e) => setData('titulo', e.target.value)}
                                            placeholder="Ex: Reunião de equipe, Treinamento..."
                                        />
                                        {errors.titulo && (
                                            <p className="text-sm text-red-600 mt-1">{errors.titulo}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="justificativa">Justificativa *</Label>
                                        <Textarea
                                            id="justificativa"
                                            value={data.justificativa}
                                            onChange={(e) => setData('justificativa', e.target.value)}
                                            placeholder="Descreva o motivo e objetivo do agendamento..."
                                            rows={4}
                                        />
                                        {errors.justificativa && (
                                            <p className="text-sm text-red-600 mt-1">{errors.justificativa}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="observacoes">Observações</Label>
                                        <Textarea
                                            id="observacoes"
                                            value={data.observacoes}
                                            onChange={(e) => setData('observacoes', e.target.value)}
                                            placeholder="Informações adicionais..."
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Data e Horário */}
                            <Card className={`border-l-4 ${getEventBorderColor({
                                ...agendamento,
                                data_inicio: data.data_inicio || agendamento.data_inicio,
                                hora_inicio: data.hora_inicio || agendamento.hora_inicio,
                                data_fim: data.data_fim || agendamento.data_fim,
                                hora_fim: data.hora_fim || agendamento.hora_fim
                            })}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Data e Horário
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="data_inicio">Data de Início *</Label>
                                            <Input
                                                id="data_inicio"
                                                type="date"
                                                value={data.data_inicio}
                                                onChange={(e) => setData('data_inicio', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.data_inicio && (
                                                <p className="text-sm text-red-600 mt-1">{errors.data_inicio}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="hora_inicio">Hora de Início *</Label>
                                            <Input
                                                id="hora_inicio"
                                                type="time"
                                                value={data.hora_inicio}
                                                onChange={(e) => setData('hora_inicio', e.target.value)}
                                            />
                                            {errors.hora_inicio && (
                                                <p className="text-sm text-red-600 mt-1">{errors.hora_inicio}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="data_fim">Data de Fim *</Label>
                                            <Input
                                                id="data_fim"
                                                type="date"
                                                value={data.data_fim}
                                                onChange={(e) => setData('data_fim', e.target.value)}
                                                min={data.data_inicio || new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.data_fim && (
                                                <p className="text-sm text-red-600 mt-1">{errors.data_fim}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="hora_fim">Hora de Fim *</Label>
                                            <Input
                                                id="hora_fim"
                                                type="time"
                                                value={data.hora_fim}
                                                onChange={(e) => setData('hora_fim', e.target.value)}
                                            />
                                            {errors.hora_fim && (
                                                <p className="text-sm text-red-600 mt-1">{errors.hora_fim}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recursos Adicionais */}
                            {recursos && recursos.length > 0 && (
                                
                                <Card className={`border-l-4 ${getEventBorderColor({
                                ...agendamento,
                                data_inicio: data.data_inicio || agendamento.data_inicio,
                                hora_inicio: data.hora_inicio || agendamento.hora_inicio,
                                data_fim: data.data_fim || agendamento.data_fim,
                                hora_fim: data.hora_fim || agendamento.hora_fim
                                })}`}>
                                    <CardHeader>
                                        <CardTitle>Recursos Adicionais</CardTitle>
                                        <CardDescription>
                                            Selecione recursos extras que você precisa para o evento
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {recursos.map((recurso) => (
                                                <div key={recurso.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`recurso-${recurso.id}`}
                                                        checked={data.recursos_solicitados.includes(recurso.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setData('recursos_solicitados', [
                                                                    ...data.recursos_solicitados,
                                                                    recurso.id
                                                                ]);
                                                            } else {
                                                                setData('recursos_solicitados',
                                                                    data.recursos_solicitados.filter((id: number) => id !== recurso.id)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Label
                                                        htmlFor={`recurso-${recurso.id}`}
                                                        className="cursor-pointer"
                                                    >
                                                        {recurso.nome}
                                                        {recurso.descricao && (
                                                            <span className="text-muted-foreground text-sm ml-2">
                                                                - {recurso.descricao}
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar - Informações do Espaço */}
                        <div className="space-y-6">
                            {selectedEspaco && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            {selectedEspaco.nome}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Capacidade: {selectedEspaco.capacidade} pessoas
                                            </span>
                                        </div>

                                        {selectedEspaco.localizacao && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {selectedEspaco.localizacao.nome}
                                                </span>
                                            </div>
                                        )}

                                        {selectedEspaco.descricao && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedEspaco.descricao}
                                                </p>
                                            </div>
                                        )}

                                        {selectedEspaco.observacoes && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-1">Observações:</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedEspaco.observacoes}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Ações */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing ? 'Salvando...' : 'Salvar Alterações'}
                                        </Button>

                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href={getBackUrl()}>
                                                Cancelar
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">
                                            <strong>Nota:</strong> Apenas agendamentos com status "Pendente" podem ser editados.
                                            Após a aprovação, entre em contato com o responsável para alterações.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* Modal de Conflito de Horário */}
                <Dialog open={conflictTimeModal.open} onOpenChange={(open) => setConflictTimeModal({ open, message: "" })}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                Conflito de Horário
                            </DialogTitle>
                            <DialogDescription className="py-4 text-base">
                                Existe(m) agendamento(s) conflitante(s) no horário solicitado.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                onClick={() => setConflictTimeModal({ open: false, message: "" })}
                                className="w-full"
                            >
                                OK
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}