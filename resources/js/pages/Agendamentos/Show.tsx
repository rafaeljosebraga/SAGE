import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, MapPin, User, Users, Edit, Trash2, MessageSquare, X, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    const [isEspacoModalOpen, setIsEspacoModalOpen] = useState(false);
    const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);
    const [isFotoModalOpen, setIsFotoModalOpen] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
            case 'aprovado':
                return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
            case 'rejeitado':
                return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700';
            case 'cancelado':
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'Pendente';
            case 'aprovado':
                return 'Aprovado';
            case 'rejeitado':
                return 'Rejeitado';
            case 'cancelado':
                return 'Cancelado';
            default:
                return status;
        }
    };

    // Função para gerar hash simples de uma string
    const generateHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    // Paleta de cores 
    const colorPalette = [
        // Blues 
        { bg: 'bg-blue-100 dark:bg-blue-600', border: 'border-l-blue-400' },
        { bg: 'bg-blue-200 dark:bg-blue-700', border: 'border-l-blue-500' },
        { bg: 'bg-blue-300 dark:bg-blue-800', border: 'border-l-blue-600' },
        { bg: 'bg-sky-100 dark:bg-sky-600', border: 'border-l-sky-400' },
        { bg: 'bg-sky-200 dark:bg-sky-700', border: 'border-l-sky-500' },
        { bg: 'bg-sky-300 dark:bg-sky-800', border: 'border-l-sky-600' },
        { bg: 'bg-cyan-100 dark:bg-cyan-600', border: 'border-l-cyan-400' },
        { bg: 'bg-cyan-200 dark:bg-cyan-700', border: 'border-l-cyan-500' },
        { bg: 'bg-cyan-300 dark:bg-cyan-800', border: 'border-l-cyan-600' },
        
        // Purples 
        { bg: 'bg-purple-100 dark:bg-purple-600', border: 'border-l-purple-400' },
        { bg: 'bg-purple-200 dark:bg-purple-700', border: 'border-l-purple-500' },
        { bg: 'bg-purple-300 dark:bg-purple-800', border: 'border-l-purple-600' },
        { bg: 'bg-violet-100 dark:bg-violet-600', border: 'border-l-violet-400' },
        { bg: 'bg-violet-200 dark:bg-violet-700', border: 'border-l-violet-500' },
        { bg: 'bg-violet-300 dark:bg-violet-800', border: 'border-l-violet-600' },
        { bg: 'bg-indigo-100 dark:bg-indigo-600', border: 'border-l-indigo-400' },
        { bg: 'bg-indigo-200 dark:bg-indigo-700', border: 'border-l-indigo-500' },
        { bg: 'bg-indigo-300 dark:bg-indigo-800', border: 'border-l-indigo-600' },
        
        // Pinks
        { bg: 'bg-pink-100 dark:bg-pink-600', border: 'border-l-pink-400' },
        { bg: 'bg-pink-200 dark:bg-pink-700', border: 'border-l-pink-500' },
        { bg: 'bg-pink-300 dark:bg-pink-800', border: 'border-l-pink-600' },
        { bg: 'bg-rose-100 dark:bg-rose-600', border: 'border-l-rose-400' },
        { bg: 'bg-rose-200 dark:bg-rose-700', border: 'border-l-rose-500' },
        { bg: 'bg-rose-300 dark:bg-rose-800', border: 'border-l-rose-600' },
        { bg: 'bg-fuchsia-100 dark:bg-fuchsia-600', border: 'border-l-fuchsia-400' },
        { bg: 'bg-fuchsia-200 dark:bg-fuchsia-700', border: 'border-l-fuchsia-500' },
        { bg: 'bg-fuchsia-300 dark:bg-fuchsia-800', border: 'border-l-fuchsia-600' },
        
        // Greens
        { bg: 'bg-green-100 dark:bg-green-600', border: 'border-l-green-400' },
        { bg: 'bg-green-200 dark:bg-green-700', border: 'border-l-green-500' },
        { bg: 'bg-green-300 dark:bg-green-800', border: 'border-l-green-600' },
        { bg: 'bg-emerald-100 dark:bg-emerald-600', border: 'border-l-emerald-400' },
        { bg: 'bg-emerald-200 dark:bg-emerald-700', border: 'border-l-emerald-500' },
        { bg: 'bg-emerald-300 dark:bg-emerald-800', border: 'border-l-emerald-600' },
        { bg: 'bg-teal-100 dark:bg-teal-600', border: 'border-l-teal-400' },
        { bg: 'bg-teal-200 dark:bg-teal-700', border: 'border-l-teal-500' },
        { bg: 'bg-teal-300 dark:bg-teal-800', border: 'border-l-teal-600' },
        
        // Yellows
        { bg: 'bg-yellow-100 dark:bg-yellow-600', border: 'border-l-yellow-400' },
        { bg: 'bg-yellow-200 dark:bg-yellow-700', border: 'border-l-yellow-500' },
        { bg: 'bg-yellow-300 dark:bg-yellow-800', border: 'border-l-yellow-600' },
        { bg: 'bg-amber-100 dark:bg-amber-600', border: 'border-l-amber-400' },
        { bg: 'bg-amber-200 dark:bg-amber-700', border: 'border-l-amber-500' },
        { bg: 'bg-amber-300 dark:bg-amber-800', border: 'border-l-amber-600' },
        { bg: 'bg-orange-100 dark:bg-orange-600', border: 'border-l-orange-400' },
        { bg: 'bg-orange-200 dark:bg-orange-700', border: 'border-l-orange-500' },
        { bg: 'bg-orange-300 dark:bg-orange-800', border: 'border-l-orange-600' },
        
        // Reds 
        { bg: 'bg-red-100 dark:bg-red-600', border: 'border-l-red-400' },
        { bg: 'bg-red-200 dark:bg-red-700', border: 'border-l-red-500' },
        { bg: 'bg-red-300 dark:bg-red-800', border: 'border-l-red-600' },
        
        // Limes 
        { bg: 'bg-lime-100 dark:bg-lime-600', border: 'border-l-lime-400' },
        { bg: 'bg-lime-200 dark:bg-lime-700', border: 'border-l-lime-500' },
        { bg: 'bg-lime-300 dark:bg-lime-800', border: 'border-l-lime-600' },
        
        // Tons neutros 
        { bg: 'bg-slate-100 dark:bg-slate-600', border: 'border-l-slate-400' },
        { bg: 'bg-slate-200 dark:bg-slate-700', border: 'border-l-slate-500' },
        { bg: 'bg-stone-100 dark:bg-stone-600', border: 'border-l-stone-400' },
        { bg: 'bg-stone-200 dark:bg-stone-700', border: 'border-l-stone-500' },
        { bg: 'bg-zinc-100 dark:bg-zinc-600', border: 'border-l-zinc-400' },
        { bg: 'bg-zinc-200 dark:bg-zinc-700', border: 'border-l-zinc-500' },
        
        // Tons vibrantes 
        { bg: 'bg-blue-400 dark:bg-blue-500', border: 'border-l-blue-600' },
        { bg: 'bg-purple-400 dark:bg-purple-500', border: 'border-l-purple-600' },
        { bg: 'bg-pink-400 dark:bg-pink-500', border: 'border-l-pink-600' },
        { bg: 'bg-green-400 dark:bg-green-500', border: 'border-l-green-600' },
        { bg: 'bg-yellow-400 dark:bg-yellow-500', border: 'border-l-yellow-600' },
        { bg: 'bg-red-400 dark:bg-red-500', border: 'border-l-red-600' },
        { bg: 'bg-indigo-400 dark:bg-indigo-500', border: 'border-l-indigo-600' },
        { bg: 'bg-teal-400 dark:bg-teal-500', border: 'border-l-teal-600' },
        { bg: 'bg-cyan-400 dark:bg-cyan-500', border: 'border-l-cyan-600' },
        { bg: 'bg-emerald-400 dark:bg-emerald-500', border: 'border-l-emerald-600' },
    ];

    // Função para verificar se um agendamento já passou
    const isEventPast = (agendamento: Agendamento) => {
        try {
            const eventDateTime = new Date(`${agendamento.data_fim}T${agendamento.hora_fim}`);
            return eventDateTime < new Date();
        } catch {
            return false;
        }
    };

    // Função para obter cor do agendamento baseada em hash
    const getEventBorderColor = (agendamento: Agendamento) => {
        // Se o evento já passou, usar cinza
        if (isEventPast(agendamento)) {
            return 'border-l-4 border-l-gray-500';
        }

        // Gerar hash baseado na data e hora do agendamento
        const hashString = `${agendamento.data_inicio}-${agendamento.hora_inicio}`;
        const hash = generateHash(hashString);
        const colorIndex = hash % colorPalette.length;
        const color = colorPalette[colorIndex];
        
        return `border-l-4 ${color.border}`;
    };

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            router.delete(`/agendamentos/${agendamento.id}`, {
                onSuccess: () => {
                    alert('Agendamento cancelado com sucesso!');
                    router.get('/agendamentos');
                },
                onError: () => {
                    alert('Erro ao cancelar agendamento');
                }
            });
        }
    };

    const canEdit = agendamento.user_id === auth.user.id && agendamento.status === 'pendente';
    const canDelete = auth.user.perfil_acesso === 'diretor_geral' || agendamento.user_id === auth.user.id;

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

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/agendamentos">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{agendamento.titulo}</h1>
                            <p className="text-muted-foreground">
                                Detalhes do agendamento
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(agendamento.status)}>
                            {getStatusText(agendamento.status)}
                        </Badge>

                        {canEdit && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/agendamentos/${agendamento.id}/editar`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                </Link>
                            </Button>
                        )}

                        
                        {canDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDelete}
                                className="text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informações Principais */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Detalhes do Agendamento */}
                        <Card className={getEventBorderColor(agendamento)}>
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
                        {(agendamento.status === 'rejeitado' || agendamento.status === 'aprovado' || agendamento.status === 'cancelado') && (
                            <Card className={`border-l-4 ${
                                agendamento.status === 'aprovado' ? 'border-l-emerald-500' : 
                                agendamento.status === 'rejeitado' ? 'border-l-rose-500' : 
                                'border-l-slate-500'
                            }`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        {agendamento.status === 'aprovado' ? 'Aprovação' : 
                                         agendamento.status === 'rejeitado' ? 'Rejeição' : 
                                         'Cancelamento'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {agendamento.status === 'aprovado' ? 'Aprovado por' : 'Rejeitado por'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {(agendamento.aprovadoPor?.name || (agendamento as any).aprovado_por?.name) || 'Não informado'}
                                            </p>
                                        </div>
                                    </div>

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
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
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
                                    <div>
                                        <p className="font-medium">{agendamento.user.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {agendamento.user.email}
                                        </p>
                                        {agendamento.user.perfil_acesso && (
                                            <Badge 
                                                variant="outline" 
                                                className={`mt-2 ${getPerfilColor(agendamento.user.perfil_acesso)}`}
                                            >
                                                {formatPerfil(agendamento.user.perfil_acesso)}
                                            </Badge>
                                        )}
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
                                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm font-medium text-primary">
                                                                {responsavel.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
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
        </AppLayout>
    );
}