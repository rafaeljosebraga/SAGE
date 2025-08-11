import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, MapPin, Users, AlertTriangle, User as UserIcon } from 'lucide-react';

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
import { useAgendamentoColors, StatusBadge } from '@/components/ui/agend-colors';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/user-avatar';

import type { PageProps, Agendamento, Espaco, Recurso, BreadcrumbItem, User } from '@/types';

interface ConflictingAgendamento {
    id: number;
    titulo: string;
    justificativa?: string;
    data_inicio: string;
    hora_inicio: string;
    data_fim: string;
    hora_fim: string;
    status: string;
    color_index?: number;
    user: User;
    espaco: {
        id: number;
        nome: string;
    };
}

interface Props extends PageProps {
    agendamento: Agendamento;
    espacos: Espaco[];
    recursos: Recurso[];
}

export default function AgendamentosEdit({ agendamento, espacos, recursos }: Props) {
    // Usar o hook de cores
    const { getEventBorderColor, getEventColors } = useAgendamentoColors();
    
    // Usar o hook de toast
    const { toast } = useToast();
    
    const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(
        espacos.find(e => e.id === agendamento.espaco_id) || null
    );

    // Estado para modal de conflito de horário
    const [conflictModal, setConflictModal] = useState<{
        open: boolean;
        conflitos: ConflictingAgendamento[];
    }>({ open: false, conflitos: [] });

    // Estado para modal de erro de validação
    const [validationErrorModal, setValidationErrorModal] = useState<{
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
        force_update: false as boolean,
    });

    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação adicional no frontend
        if (!data.data_inicio || !data.hora_inicio || !data.data_fim || !data.hora_fim) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, preencha todos os campos de data e horário.",
                variant: "destructive",
            });
            return;
        }

        // Validar formato da hora
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(data.hora_inicio) || !timeRegex.test(data.hora_fim)) {
            toast({
                title: "Formato de hora inválido",
                description: "Por favor, insira horários válidos no formato HH:MM.",
                variant: "destructive",
            });
            return;
        }

        // Validar se a hora de fim é posterior à hora de início no mesmo dia
        if (data.data_inicio === data.data_fim && data.hora_fim <= data.hora_inicio) {
            toast({
                title: "Horário inválido",
                description: "A hora de fim deve ser posterior à hora de início.",
                variant: "destructive",
            });
            return;
        }

        // Garantir que recursos_solicitados seja um array válido
        const dataToSend = {
            ...data,
            recursos_solicitados: Array.isArray(data.recursos_solicitados) ? data.recursos_solicitados : []
        };
        

        
        // Usar router.put diretamente com os dados
        router.put(`/agendamentos/${agendamento.id}`, dataToSend, {
            onSuccess: () => {
                // Mostrar toast de sucesso
                toast({
                    title: "Agendamento atualizado com sucesso!",
                    description: "As alterações foram salvas.",
                    variant: 'success',
                    duration: 5000,
                    className: 'bg-green-500 text-white',
                });
                
                // Aguardar 1 segundo e redirecionar para a tela anterior
                setTimeout(() => {
                    router.get(getBackUrl());
                }, 1000);
            },
            onError: (errors: any) => {

                
                // Verificar se há conflitos de horário
                if (errors.conflitos) {
                    try {
                        const conflitos = JSON.parse(errors.conflitos as string) as ConflictingAgendamento[];
                        setConflictModal({ 
                            open: true, 
                            conflitos: conflitos 
                        });
                        return; // Não mostrar toast de erro quando há conflitos
                    } catch (e) {

                        toast({
                            title: "Erro de conflito",
                            description: "Há conflitos de horário, mas não foi possível carregá-los.",
                            variant: "destructive",
                        });
                        return;
                    }
                } else if (errors.horario) {
                    // Fallback para o formato antigo
                    toast({
                        title: "Conflito de horário",
                        description: errors.horario as string,
                        variant: "destructive",
                    });
                } else {
                    // Mostrar erro genérico com mais detalhes se possível
                    let errorMessage = "Ocorreu um erro ao atualizar o agendamento.";
                    let errorDetails = "";
                    
                    if (typeof errors === 'object' && errors !== null) {
                        const errorKeys = Object.keys(errors);
                        if (errorKeys.length > 0) {
                            const firstError = errors[errorKeys[0]];
                            if (Array.isArray(firstError)) {
                                errorMessage = firstError[0];
                                errorDetails = `Campo: ${errorKeys[0]}`;
                            } else if (typeof firstError === 'string') {
                                errorMessage = firstError;
                                errorDetails = `Campo: ${errorKeys[0]}`;
                            }
                        }
                        
                        // Se há múltiplos erros, mostrar todos
                        if (errorKeys.length > 1) {
                            errorDetails += ` (e mais ${errorKeys.length - 1} erro(s))`;
                        }
                    }
                    
                    toast({
                        title: "Erro ao atualizar",
                        description: errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage,
                        variant: "destructive",
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

    // Função para confirmar edição com conflitos
    const handleConfirmWithConflicts = () => {
        setConflictModal({ open: false, conflitos: [] });
        
        // Criar dados com force_update = true de forma explícita
        const dataWithForce = {
            espaco_id: data.espaco_id,
            titulo: data.titulo,
            justificativa: data.justificativa,
            data_inicio: data.data_inicio,
            hora_inicio: data.hora_inicio,
            data_fim: data.data_fim,
            hora_fim: data.hora_fim,
            observacoes: data.observacoes,
            recursos_solicitados: Array.isArray(data.recursos_solicitados) ? data.recursos_solicitados : [],
            force_update: true
        };
        

        
        // Tentar com FormData para garantir que os dados sejam enviados corretamente
        const formData = new FormData();
        Object.keys(dataWithForce).forEach(key => {
            const value = dataWithForce[key as keyof typeof dataWithForce];
            if (key === 'recursos_solicitados' && Array.isArray(value)) {
                value.forEach((recurso, index) => {
                    formData.append(`recursos_solicitados[${index}]`, recurso.toString());
                });
            } else if (key === 'force_update') {
                formData.append(key, value ? '1' : '0');
            } else {
                formData.append(key, value?.toString() || '');
            }
        });
        
        // Adicionar método PUT para Laravel
        formData.append('_method', 'PUT');
        
        // Usar router.post com FormData
        router.post(`/agendamentos/${agendamento.id}`, formData, {
            onSuccess: () => {
                toast({
                    title: "Agendamento atualizado com sucesso!",
                    description: "As alterações foram salvas. O conflito será analisado.",
                    variant: 'success',
                    duration: 5000,
                    className: 'bg-green-500 text-white',
                });
                
                setTimeout(() => {
                    router.get(getBackUrl());
                }, 1000);
            },
            onError: (errors: any) => {

                
                // Verificar se há conflitos (não deveria acontecer aqui, mas por segurança)
                if (errors.conflitos) {
                    toast({
                        title: "Conflito persistente",
                        description: "Ainda há conflitos de horário. Tente novamente ou contate o administrador.",
                        variant: "destructive",
                    });
                    return;
                }
                
                // Mostrar detalhes do erro se disponível
                let errorMessage = "Ocorreu um erro inesperado.";
                let errorDetails = "";
                
                if (typeof errors === 'object' && errors !== null) {
                    // Tentar extrair mensagem de erro mais específica
                    const errorKeys = Object.keys(errors);
                    if (errorKeys.length > 0) {
                        const firstError = errors[errorKeys[0]];
                        if (Array.isArray(firstError)) {
                            errorMessage = firstError[0];
                            errorDetails = `Campo: ${errorKeys[0]}`;
                        } else if (typeof firstError === 'string') {
                            errorMessage = firstError;
                            errorDetails = `Campo: ${errorKeys[0]}`;
                        }
                    }
                    
                    // Se há múltiplos erros, mostrar todos
                    if (errorKeys.length > 1) {
                        errorDetails += ` (e mais ${errorKeys.length - 1} erro(s))`;
                    }
                }
                
                toast({
                    title: "Erro ao atualizar",
                    description: errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage,
                    variant: "destructive",
                });
            }
        });
    };

    // Função para formatar data para exibição
    const formatDateForDisplay = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch {
            return dateString;
        }
    };

    // Função para formatar horário para exibição
    const formatTimeForDisplay = (timeString: string) => {
        return timeString.substring(0, 5); // Remove segundos se houver
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
                                ml-1
                                bg-white dark:bg-white 
                                text-black dark:text-black
                                hover:bg-gray-100 dark:hover:bg-gray-200
                                cursor-pointer
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
                            })} mx-4`}>
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
                            })} mx-4`}>
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
                                })} mx-4 mb-8`}>
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
                                <Card className="mx-4">
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
                            <Card className="mx-4">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <Button
                                            type="submit"
                                            className="w-full cursor-pointer"
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
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* Modal de Conflito de Horário */}
                <Dialog open={conflictModal.open} onOpenChange={(open) => setConflictModal({ open, conflitos: [] })}>
                    <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[95vh] overflow-hidden rounded-lg flex flex-col">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                Conflito de Horário Detectado
                            </DialogTitle>
                            <DialogDescription>
                                Existem agendamentos que conflitam com o horário solicitado. Você pode cancelar ou confirmar mesmo assim.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex flex-col gap-2 flex-1 min-h-0">
                            {/* Área de visualização de agendamentos com scroll personalizado */}
                            <div className="flex flex-col gap-0 flex-1 min-h-0">
                                <div className="flex items-center justify-between flex-shrink-0">
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        Agendamentos em conflito ({conflictModal.conflitos.length}):
                                    </h4>
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[70vh] pr-2 rounded-md flex-1 min-h-0 mb-1 last:-mb-2">
                                    {conflictModal.conflitos.map((conflito) => {
                                        // Usar as cores reais do agendamento
                                        const colors = getEventColors(conflito as any);
                                        
                                        // Função para formatar data para exibição
                                        const formatDateForDisplay = (dateString: string) => {
                                            try {
                                                const dateOnly = dateString.split("T")[0];
                                                const [year, month, day] = dateOnly.split("-");
                                                return `${day}/${month}/${year}`;
                                            } catch {
                                                return dateString;
                                            }
                                        };

                                        // Função para formatar hora para exibição
                                        const formatTimeForDisplay = (timeString: string) => {
                                            return timeString.substring(0, 5);
                                        };

                                        // Função para formatar período - ajustada para dados limitados
                                        const formatPeriod = (agendamento: any) => {
                                            const dataInicioFormatada = formatDateForDisplay(agendamento.data_inicio);
                                            const horaInicioFormatada = formatTimeForDisplay(agendamento.hora_inicio);
                                            const horaFimFormatada = formatTimeForDisplay(agendamento.hora_fim);
                                            
                                            // Se não tem data_fim ou é igual à data_inicio, assumir mesmo dia
                                            if (!agendamento.data_fim || agendamento.data_inicio === agendamento.data_fim || 
                                                (agendamento.data_inicio.includes('T') && agendamento.data_fim?.includes('T') && 
                                                 agendamento.data_inicio.split('T')[0] === agendamento.data_fim.split('T')[0])) {
                                                return `${dataInicioFormatada} das ${horaInicioFormatada} às ${horaFimFormatada}`;
                                            }
                                            
                                            // Se são dias diferentes
                                            const dataFimFormatada = formatDateForDisplay(agendamento.data_fim);
                                            return `${dataInicioFormatada} às ${horaInicioFormatada} até ${dataFimFormatada} às ${horaFimFormatada}`;
                                        };

                                        // Funções auxiliares para formatação
                                        const formatPerfil = (perfil: string | undefined) => {
                                            if (!perfil) return "Não definido";
                                            return perfil.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                                        };

                                        const getPerfilColor = (perfil: string | undefined) => {
                                            if (!perfil) return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
                                            
                                            switch (perfil.toLowerCase()) {
                                                case "administrador":
                                                    return "bg-[#EF7D4C] dark:bg-[#D16A3A] text-white border-transparent";
                                                case "coordenador":
                                                    return "bg-[#957157] dark:bg-[#7A5D47] text-white border-transparent";
                                                case "diretor_geral":
                                                    return "bg-[#F1DEC5] dark:bg-[#8B7355] text-gray-600 dark:text-gray-200 border-transparent";
                                                case "servidores":
                                                    return "bg-[#285355] dark:bg-[#1F4142] text-white border-transparent";
                                                default:
                                                    return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
                                            }
                                        };
                                        
                                        return (
                                            <Card
                                                key={conflito.id}
                                                className={`transition-all duration-200 hover:shadow-md hover:bg-muted/30 ${colors.border} border-l-4 rounded-lg overflow-hidden`}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-start justify-between">
                                                                <h5 className="font-medium">{conflito.titulo}</h5>
                                                                <StatusBadge status={conflito.status} />
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    {conflito.user && <UserAvatar user={conflito.user} size="sm" />}
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{conflito.user?.name || 'Usuário não encontrado'}</span>
                                                                        {conflito.user?.email && (
                                                                            <span className="text-xs text-muted-foreground">{conflito.user.email}</span>
                                                                        )}
                                                                    </div>
                                                                    {conflito.user?.perfil_acesso && (
                                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(conflito.user.perfil_acesso)}`}>
                                                                            {formatPerfil(conflito.user.perfil_acesso)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm opacity-80">
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="h-4 w-4" />
                                                                        {formatPeriod(conflito)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin className="h-4 w-4" />
                                                                        {conflito.espaco?.nome || 'Mesmo espaço solicitado'}
                                                                    </div>
                                                                </div>
                                                                
                                                                {conflito.justificativa && (
                                                                    <div className="mt-1 text-sm">
                                                                        <span className="font-medium">Justificativa:</span>
                                                                        <p className="text-muted-foreground">{conflito.justificativa}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Botões de ação - fixos na parte inferior */}
                            <div className="flex-shrink-0 border-t border-border pt-4">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setConflictModal({ open: false, conflitos: [] })}
                                        className="flex-1 rounded-lg"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleConfirmWithConflicts}
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                                    >
                                        Confirmar Conflito
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal de Erro de Validação */}
                <Dialog open={validationErrorModal.open} onOpenChange={(open) => setValidationErrorModal({ open, message: "" })}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Erro de Validação
                            </DialogTitle>
                            <DialogDescription className="py-4 text-base">
                                {validationErrorModal.message}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                onClick={() => setValidationErrorModal({ open: false, message: "" })}
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