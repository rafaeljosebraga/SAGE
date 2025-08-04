import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, MapPin, User, Users, Edit, MessageSquare, X, Image as ImageIcon, ZoomIn, AlertTriangle, RotateCcw, Ban, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAgendamentoColors, StatusBadge } from '@/components/ui/agend-colors';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { PageProps, Agendamento, Foto, BreadcrumbItem } from '@/types';

interface Props extends PageProps {
    agendamento: Agendamento;
    recursosSolicitados?: Array<{
        id: number;
        nome: string;
        descricao?: string;
    }>;
}

export default function AgendamentosShow({ agendamento, auth, recursosSolicitados }: Props) {
    // Estado para modal de confirmação de cancelamento
    const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    }>({ open: false });
    
    // Estado para modal de confirmação de descancelamento
    const [uncancelModal, setUncancelModal] = useState<{
    open: boolean;
    }>({ open: false });
    
    // Estado para modal de confirmação de exclusão permanente
    const [forceDeleteModal, setForceDeleteModal] = useState<{
    open: boolean;
    }>({ open: false });
    
    // Usar o hook de cores
    const { getStatusColor, getStatusText, getEventBorderColor } = useAgendamentoColors();
    // Usar o hook de toast
    const { toast } = useToast();
    
    const [isEspacoModalOpen, setIsEspacoModalOpen] = useState(false);
    const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);
    const [isFotoModalOpen, setIsFotoModalOpen] = useState(false);

    // Função para obter URL de retorno baseada nos parâmetros da URL atual
    const getBackUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const from = urlParams.get('from');
        
        // Se veio da página de gerenciar agendamentos, retornar para lá com os filtros
        if (from === 'gerenciar') {
            const backParams = new URLSearchParams();
            
            // Preservar todos os filtros de gerenciamento
            const gerenciarParams = [
                'status', 'espaco_id', 'data_inicio', 'data_fim', 
                'solicitante', 'nome_agendamento', 'page', 
                'mes_atual', 'aprovado_hoje', 'rejeitado_hoje'
            ];
            
            gerenciarParams.forEach(param => {
                const value = urlParams.get(param);
                if (value) {
                    backParams.set(param, value);
                }
            });
            
            const queryString = backParams.toString();
            return queryString ? `/gerenciar-agendamentos?${queryString}` : '/gerenciar-agendamentos';
        }
        
        // Caso contrário, usar a lógica original para agendamentos
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

    const handleDelete = () => {
        setDeleteModal({ open: true });
    };

    const confirmDelete = () => {
        router.delete(`/agendamentos/${agendamento.id}`, {
            onSuccess: () => {
                setDeleteModal({ open: false });
                toast({
                    title: "Agendamento cancelado com sucesso!",
                    // description: "O agendamento foi cancelado.",
                });
                // Recarregar a página para atualizar os dados
                router.reload({ only: ['agendamento'] });
            },
            onError: () => {
                setDeleteModal({ open: false });
                toast({
                    title: "Erro ao cancelar agendamento",
                    description: "Ocorreu um erro ao tentar cancelar o agendamento. Tente novamente.",
                    variant: "destructive",
                });
            }
        });
    };

    const handleUncancel = () => {
        setUncancelModal({ open: true });
    };

    const confirmUncancel = () => {
        router.post(`/agendamentos/${agendamento.id}/descancelar`, {}, {
            onSuccess: () => {
                setUncancelModal({ open: false });
                toast({
                    title: "Agendamento descancelado com sucesso!",
                    description: "O status foi alterado para pendente.",
                });
                // Recarregar a página para atualizar os dados
                router.reload({ only: ['agendamento'] });
            },
            onError: () => {
                setUncancelModal({ open: false });
                toast({
                    title: "Erro ao descancelar agendamento",
                    description: "Ocorreu um erro ao tentar descancelar o agendamento. Tente novamente.",
                    variant: "destructive",
                });
            }
        });
    };

    const handleForceDelete = () => {
        setForceDeleteModal({ open: true });
    };

    const confirmForceDelete = () => {
        router.delete(`/agendamentos/${agendamento.id}/force-delete`, {
            onSuccess: () => {
                setForceDeleteModal({ open: false });
                toast({
                    title: "Agendamento excluído com sucesso!",
                    // description: "O agendamento foi removido do sistema.",
                    duration: 5000,
                });
                // Redirecionar para a lista de agendamentos
                router.visit('/agendamentos');
            },
            onError: () => {
                setForceDeleteModal({ open: false });
                toast({
                    title: "Erro ao excluir agendamento",
                    description: "Ocorreu um erro ao tentar excluir o agendamento. Tente novamente.",
                    variant: "destructive",
                });
            }
        });
    };

    // Diretor geral pode editar qualquer agendamento, usuários comuns só podem editar seus próprios agendamentos pendentes
    const canEdit = auth.user.perfil_acesso === 'diretor_geral' || (agendamento.user_id === auth.user.id && agendamento.status === 'pendente');
    
    // Verificar se pode cancelar (agendamentos pendentes ou aprovados, mas não cancelados)
    const canDelete = auth.user.perfil_acesso === 'diretor_geral' && 
                     (agendamento.status === 'pendente' || agendamento.status === 'aprovado');
    
    // Verificar se pode descancelar (apenas agendamentos cancelados)
    const canUncancel = auth.user.perfil_acesso === 'diretor_geral' && 
                       agendamento.status === 'cancelado';
    
    // Verificar se pode excluir permanentemente (apenas diretor geral pode excluir a qualquer momento)
    const canForceDelete = auth.user.perfil_acesso === 'diretor_geral';

    const formatDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        try {
            return format(parseISO(`2000-01-01T${timeString}`), 'HH:mm');
        } catch {
            return timeString;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ativo':
                return 'default';
            case 'inativo':
                return 'secondary';
            case 'manutencao':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getEspacoStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ativo':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'inativo':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'manutencao':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatus = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ativo':
                return 'Ativo';
            case 'inativo':
                return 'Inativo';
            case 'manutencao':
                return 'Manutenção';
            default:
                return status;
        }
    };

    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return "Não definido";
        return perfil.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const getPerfilColor = (perfil: string | undefined) => {
        if (!perfil) return "bg-gray-100 text-gray-800 border-gray-200";
        
        switch (perfil.toLowerCase()) {
            case "administrador":
                return "bg-[#EF7D4C] text-white border-transparent";
            case "coordenador":
                return "bg-[#957157] text-white border-transparent";
            case "diretor_geral":
                return "bg-[#F1DEC5] text-gray-600 border-transparent";
            case "servidores":
                return "bg-[#285355] text-white border-transparent";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const handleViewFoto = (foto: Foto) => {
        setSelectedFoto(foto);
        setIsFotoModalOpen(true);
    };

    const closeFotoModal = () => {
        setIsFotoModalOpen(false);
        setSelectedFoto(null);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Agendamentos', href: '/agendamentos' },
        { title: 'Detalhes do Agendamento', href: `/agendamentos/${agendamento.id}` }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Agendamento - ${agendamento.titulo}`} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            asChild
                            variant="ghost"
                            type="button"
                            >
                            <Link
                                href={getBackUrl()}
                        className="
                                    ml-4
                                    bg-white dark:bg-white
                                    text-black dark:text-black
                                    hover:!bg-[#EF7D4C] hover:!text-white
                                    dark:hover:!bg-[#EF7D4C] dark:hover:!text-white
                                    transition-colors
                        "
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Link>
                            </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{agendamento.titulo}</h1>
                            <p className="text-muted-foreground text-sm">
                                Detalhes do agendamento
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <StatusBadge status={agendamento.status} agendamento={agendamento} />

                        {canEdit && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => {
                                            // Preservar os parâmetros da URL atual e adicionar indicador de origem
                                            const urlParams = new URLSearchParams(window.location.search);
                                            urlParams.set('from', 'show'); // Indicar que veio da tela de detalhes
                                            
                                            router.get(`/agendamentos/${agendamento.id}/editar?${urlParams.toString()}`);
                                        }}
                                        className="bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-700 dark:hover:border-blue-600 dark:text-blue-300 dark:hover:text-blue-200"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Editar</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* Mostrar botão Excluir apenas para diretor geral */}
                        {canForceDelete && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleForceDelete}
                                        className="bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300 text-orange-700 hover:text-orange-800 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:border-orange-700 dark:hover:border-orange-600 dark:text-orange-300 dark:hover:text-orange-200"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Excluir</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* Mostrar botão Cancelar apenas se não estiver cancelado */}
                        {canDelete && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDelete}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none  [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-black/50 hover:bg-black/60 shadow-xs h-8 rounded-md px-3 has-[>svg]:px-2.5 text-white hover:text-white border-slate-200 hover:border-slate-300 dark:text-white dark:hover:text-white dark:border-slate-600 dark:hover:border-slate-500"
                                    >
                                        <Ban className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Cancelar</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* Mostrar botão Voltar Agendamento apenas se estiver cancelado */}
                        {canUncancel && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleUncancel}
                                        className="bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300 text-green-700 hover:text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:border-green-700 dark:hover:border-green-600 dark:text-green-300 dark:hover:text-green-200"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Voltar Agendamento
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Voltar Agendamento</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Informações Principais */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Detalhes do Agendamento */}
                        <Card className={`border-l-4 ${getEventBorderColor(agendamento)}`}>
                            <CardHeader>
                                <CardTitle>Informações do Agendamento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Data de Início</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(agendamento.data_inicio)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Hora de Início</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatTime(agendamento.hora_inicio)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Data de Fim</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(agendamento.data_fim)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Hora de Fim</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatTime(agendamento.hora_fim)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium mb-1">Justificativa</p>
                                    <p className="text-sm text-muted-foreground">
                                        {agendamento.justificativa}
                                    </p>
                                </div>

                                {agendamento.observacoes && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Observações</p>
                                        <p className="text-sm text-muted-foreground">
                                            {agendamento.observacoes}
                                        </p>
                                    </div>
                                )}

                                {agendamento.recorrente && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Recorrência</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">
                                                {agendamento.tipo_recorrencia === 'diaria' && 'Diária'}
                                                {agendamento.tipo_recorrencia === 'semanal' && 'Semanal'}
                                                {agendamento.tipo_recorrencia === 'mensal' && 'Mensal'}
                                            </Badge>
                                            {agendamento.data_fim_recorrencia && (
                                                <span className="text-sm text-muted-foreground">
                                                    até {formatDate(agendamento.data_fim_recorrencia)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {recursosSolicitados && recursosSolicitados.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Recursos Solicitados</p>
                                        <div className="flex flex-wrap gap-1">
                                            {recursosSolicitados.map((recurso) => (
                                                <Badge key={recurso.id} variant="outline">
                                                    {recurso.nome}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status e Aprovação */}
                        {agendamento.status === 'pendente' && (
                            <Card className="border-l-4 border-l-orange-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Aguardando Aprovação
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Status</p>
                                            <p className="text-sm text-muted-foreground">
                                                Aguardando análise do diretor geral
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Solicitado em</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDateTime(agendamento.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <p className="text-sm text-orange-800 dark:text-orange-200">
                                            <strong>Informação:</strong> Seu agendamento está na fila de aprovação. 
                                            Você receberá uma notificação quando houver uma decisão.
                                        </p>
                                    </div> */}
                                </CardContent>
                            </Card>
                        )}

                        {(agendamento.status === 'rejeitado' || agendamento.status === 'aprovado' || agendamento.status === 'cancelado') && (
                            <Card className={`border-l-4 ${
                                agendamento.status === 'aprovado' ? 'border-l-emerald-500' : 
                                agendamento.status === 'rejeitado' ? 'border-l-rose-500' : 
                                'border-l-black dark:bg-gray-100 dark:bg-gray-700'
                            }`}>
                                {agendamento.status === 'cancelado' ? (
                                    <div className="border-l border-l-white -ml-[5px] rounded-lg -my-6 py-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5" />
                                                Cancelamento
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {(() => {
                                                const aprovador = agendamento.aprovadoPor || (agendamento as any).aprovado_por;
                                                return aprovador ? (
                                                    <div>
                                                        <p className="text-sm font-medium mb-3">Cancelado por</p>
                                                        <div className="flex items-start gap-3">
                                                            <UserAvatar user={aprovador} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-medium">{aprovador.name}</p>
                                                                    {aprovador.perfil_acesso && (
                                                                        <Badge 
                                                                            variant="outline" 
                                                                            className={`${getPerfilColor(aprovador.perfil_acesso)}`}
                                                                        >
                                                                            {formatPerfil(aprovador.perfil_acesso)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {aprovador.email && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {aprovador.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Cancelado por</p>
                                                            <p className="text-sm text-muted-foreground">Não informado</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {agendamento.aprovado_em && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Data</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDateTime(agendamento.aprovado_em)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {agendamento.motivo_rejeicao && (
                                                <div>
                                                    <p className="text-sm font-medium mb-1">Motivo da Rejeição</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {agendamento.motivo_rejeicao}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </div>
                                ) : (
                                    <>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5" />
                                                {agendamento.status === 'aprovado' ? 'Aprovação' : 'Rejeição'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {(() => {
                                                const aprovador = agendamento.aprovadoPor || (agendamento as any).aprovado_por;
                                                return aprovador ? (
                                                    <div>
                                                        <p className="text-sm font-medium mb-3">
                                                            {agendamento.status === 'aprovado' ? 'Aprovado por' : 'Rejeitado por'}
                                                        </p>
                                                        <div className="flex items-start gap-3">
                                                            <UserAvatar user={aprovador} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-medium">{aprovador.name}</p>
                                                                    {aprovador.perfil_acesso && (
                                                                        <Badge 
                                                                            variant="outline" 
                                                                            className={`${getPerfilColor(aprovador.perfil_acesso)}`}
                                                                        >
                                                                            {formatPerfil(aprovador.perfil_acesso)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {aprovador.email && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {aprovador.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {agendamento.status === 'aprovado' ? 'Aprovado por' : 'Rejeitado por'}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">Não informado</p>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {agendamento.aprovado_em && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">Data</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDateTime(agendamento.aprovado_em)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {agendamento.motivo_rejeicao && (
                                                <div>
                                                    <p className="text-sm font-medium mb-1">Motivo da Rejeição</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {agendamento.motivo_rejeicao}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Informações do Espaço */}
                        {agendamento.espaco && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Espaço
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="font-medium">{agendamento.espaco.nome}</p>
                                        {agendamento.espaco.localizacao && (
                                            <p className="text-sm text-muted-foreground">
                                                {agendamento.espaco.localizacao.nome}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            Capacidade: {agendamento.espaco.capacidade} pessoas
                                        </span>
                                    </div>

                                    {agendamento.espaco.descricao && (
                                        <p className="text-sm text-muted-foreground">
                                            {agendamento.espaco.descricao}
                                        </p>
                                    )}

                                    {agendamento.espaco.responsavel && (
                                        <div>
                                            <p className="text-sm font-medium">Responsável</p>
                                            <p className="text-sm text-muted-foreground">
                                                {agendamento.espaco.responsavel.name}
                                            </p>
                                        </div>
                                    )}

                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => setIsEspacoModalOpen(true)}
                                    >
                                        Ver Detalhes do Espaço
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Informações do Solicitante */}
                        {agendamento.user && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Solicitante
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start gap-3">
                                        <UserAvatar user={agendamento.user} size="lg" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium">{agendamento.user.name}</p>
                                                {agendamento.user.perfil_acesso && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`${getPerfilColor(agendamento.user.perfil_acesso)}`}
                                                    >
                                                        {formatPerfil(agendamento.user.perfil_acesso)}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {agendamento.user.email}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Informações de Criação */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm font-medium">Criado em</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDateTime(agendamento.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Última atualização</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDateTime(agendamento.updated_at)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes do Espaço */}
            {isEspacoModalOpen && agendamento.espaco && (
                <div 
                    className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setIsEspacoModalOpen(false)}
                >
                    <div 
                        className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
                            <h2 className="text-2xl font-bold text-card-foreground">
                                Detalhes do Espaço
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEspacoModalOpen(false)}
                                className="text-muted-foreground hover:text-card-foreground rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-card">
                            {/* Informações Básicas */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                                    <p className="text-lg font-semibold text-card-foreground mt-1">{agendamento.espaco.nome}</p>
                                </div>
                            </div>

                            {/* Capacidade e Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Capacidade</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-lg text-card-foreground">{agendamento.espaco.capacidade} pessoas</p>
                                    </div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        <Badge 
                                            variant={getStatusVariant(agendamento.espaco.status)}
                                            className={`${getEspacoStatusColor(agendamento.espaco.status)} text-sm rounded-full`}
                                        >
                                            {formatStatus(agendamento.espaco.status)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Localização */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="text-sm font-medium text-muted-foreground">Localização</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                    <p className="text-lg text-card-foreground">
                                        {agendamento.espaco.localizacao?.nome || 'Não definida'}
                                    </p>
                                </div>
                            </div>

                            {/* Responsáveis */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="text-sm font-medium text-muted-foreground">Responsáveis</label>
                                {(() => {
                                    const responsaveis: Array<any> = [];
                                    
                                    // Adicionar o criador do espaço
                                    if (agendamento.espaco.createdBy) {
                                        responsaveis.push({
                                            ...agendamento.espaco.createdBy,
                                            tipo: 'Criador'
                                        });
                                    }
                                    
                                    // Adicionar usuários com permissão (excluindo o criador se já estiver na lista)
                                    if (agendamento.espaco.users && agendamento.espaco.users.length > 0) {
                                        agendamento.espaco.users.forEach((user: any) => {
                                            if (!responsaveis.find(r => r.id === user.id)) {
                                                responsaveis.push({
                                                    ...user,
                                                    tipo: 'Com Permissão'
                                                });
                                            }
                                        });
                                    }
                                    
                                    return responsaveis.length > 0 ? (
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {responsaveis.map((responsavel, index) => (
                                                <div key={responsavel.id} className="bg-background/50 p-3 rounded-md border border-border">
                                                    <div className="flex items-start gap-2">
                                                        <UserAvatar user={responsavel} size="md" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-sm font-medium text-card-foreground break-words">
                                                                    {responsavel.name}
                                                                </p>
                                                                <Badge variant="outline" className="text-xs self-start">
                                                                    {responsavel.tipo}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground break-words mt-1">
                                                                {responsavel.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(responsavel.perfil_acesso)}`}>
                                                            {formatPerfil(responsavel.perfil_acesso)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-lg text-card-foreground mt-1">Não definido</p>
                                    );
                                })()}
                            </div>

                            {/* Disponibilidade para Reserva */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="text-sm font-medium text-muted-foreground">Disponível para Reserva</label>
                                <div className="mt-1">
                                    <Badge 
                                        variant={agendamento.espaco.disponivel_reserva ? 'default' : 'secondary'}
                                        className={`text-sm rounded-full ${
                                            agendamento.espaco.disponivel_reserva 
                                                ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                                                : 'bg-muted text-muted-foreground border-border'
                                        }`}
                                    >
                                        {agendamento.espaco.disponivel_reserva ? 'Sim' : 'Não'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Descrição */}
                            {agendamento.espaco.descricao && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                                    <p className="text-card-foreground mt-1 leading-relaxed">{agendamento.espaco.descricao}</p>
                                </div>
                            )}

                            {/* Observações */}
                            {agendamento.espaco.observacoes && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                                    <p className="text-card-foreground mt-1 leading-relaxed">{agendamento.espaco.observacoes}</p>
                                </div>
                            )}

                            {/* Recursos */}
                            {agendamento.espaco.recursos && agendamento.espaco.recursos.length > 0 && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Recursos Disponíveis</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {agendamento.espaco.recursos.map((recurso) => (
                                            <Badge 
                                                key={recurso.id} 
                                                variant="outline"
                                                className="text-sm rounded-full border-border text-card-foreground"
                                            >
                                                {recurso.nome}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fotos do Espaço */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Fotos do Espaço
                                        {agendamento.espaco.fotos && agendamento.espaco.fotos.length > 0 && (
                                            <span className="ml-1">({agendamento.espaco.fotos.length})</span>
                                        )}
                                    </label>
                                </div>
                                
                                {agendamento.espaco.fotos && agendamento.espaco.fotos.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {agendamento.espaco.fotos.filter(foto => foto.url && foto.url !== '/storage/' && foto.url.length > 10).map((foto) => (
                                            <div 
                                                key={foto.id} 
                                                className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                                                onClick={() => handleViewFoto(foto)}
                                            >
                                                <img
                                                    src={foto.url}
                                                    alt={foto.nome_original}
                                                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ZoomIn className="h-6 w-6 text-white" />
                                                </div>
                                                {/* Descrição sempre visível na parte inferior */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                                                    {foto.descricao ? foto.descricao : 'Sem descrição'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhuma foto cadastrada para este espaço</p>
                                    </div>
                                )}
                            </div>

                            {/* Informações de Auditoria */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border border-t">
                                <h3 className="text-lg font-medium text-card-foreground mb-3">Informações de Auditoria</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-background/50 p-3 rounded-md border border-border">
                                        <label className="text-muted-foreground font-medium">Criado em</label>
                                        <p className="text-card-foreground mt-1">{formatDateTime(agendamento.espaco.created_at)}</p>
                                    </div>
                                    <div className="bg-background/50 p-3 rounded-md border border-border">
                                        <label className="text-muted-foreground font-medium">Atualizado em</label>
                                        <p className="text-card-foreground mt-1">{formatDateTime(agendamento.espaco.updated_at)}</p>
                                    </div>
                                    {agendamento.espaco.createdBy && (
                                        <div className="bg-background/50 p-3 rounded-md border border-border">
                                            <label className="text-muted-foreground font-medium">Criado por</label>
                                            <p className="text-card-foreground mt-1">{agendamento.espaco.createdBy.name}</p>
                                        </div>
                                    )}
                                    {agendamento.espaco.updatedBy && (
                                        <div className="bg-background/50 p-3 rounded-md border border-border">
                                            <label className="text-muted-foreground font-medium">Atualizado por</label>
                                            <p className="text-card-foreground mt-1">{agendamento.espaco.updatedBy.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal de Visualização de Foto - APENAS IMAGEM */}
            {isFotoModalOpen && selectedFoto && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-60"
                    onClick={closeFotoModal}
                >
                    <div 
                        className="bg-card border border-border rounded-xl shadow-2xl max-w-5xl max-h-[95vh] w-full mx-4 overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header do Modal de Foto */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
                            <h3 className="text-lg font-semibold text-card-foreground">
                                {selectedFoto.nome_original}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeFotoModal}
                                className="text-muted-foreground hover:text-card-foreground rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Imagem - Ocupa todo o espaço disponível */}
                        <div className="flex-1 flex items-center justify-center p-6 bg-muted/10">
                            <img
                                src={selectedFoto.url}
                                alt={selectedFoto.nome_original}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Confirmação de Cancelamento */}
            <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Confirmar Cancelamento
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py">
                        <p className="text-muted-foreground">
                            Tem certeza que deseja cancelar este agendamento?
                        </p>
                        <div className="mt p-3 bg-muted/30 rounded-lg">
                            <p className="font-medium text-sm">{agendamento.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                                {agendamento.espaco?.nome} • {formatDate(agendamento.data_inicio)}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModal({ open: false })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            Sim, Cancelar Agendamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Volta do evento */}
            <Dialog open={uncancelModal.open} onOpenChange={(open) => setUncancelModal({ open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-green-600" />
                            Voltar Agendamento
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py">
                        <p className="text-muted-foreground">
                            Tem certeza que deseja voltar este agendamento? O status será alterado para pendente.
                        </p>
                        <div className="mt p-3 bg-muted/30 rounded-lg">
                            <p className="font-medium text-sm">{agendamento.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                                {agendamento.espaco?.nome} • {formatDate(agendamento.data_inicio)}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setUncancelModal({ open: false })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="default"
                            onClick={confirmUncancel}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Sim, Voltar Agendamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Exclusão Permanente */}
            <Dialog open={forceDeleteModal.open} onOpenChange={(open) => setForceDeleteModal({ open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Excluir Agendamento Permanentemente
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py">
                        <p className="text-muted-foreground mb-3">
                            <strong>ATENÇÃO:</strong> Esta ação é irreversível! Tem certeza que deseja excluir permanentemente este agendamento?
                        </p>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="font-medium text-sm text-red-800 dark:text-red-200">{agendamento.titulo}</p>
                            <p className="text-xs text-red-600 dark:text-red-300">
                                {agendamento.espaco?.nome} • {formatDate(agendamento.data_inicio)}
                            </p>
                        </div>          
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setForceDeleteModal({ open: false })}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmForceDelete}
                        >
                            Sim, Excluir Permanentemente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}