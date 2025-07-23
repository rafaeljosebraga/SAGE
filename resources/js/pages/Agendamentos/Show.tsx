import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, MapPin, User, Users, Edit, Trash2, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { PageProps, Agendamento } from '@/types';

interface Props extends PageProps {
    agendamento: Agendamento;
}

export default function AgendamentosShow({ agendamento, auth }: Props) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'aprovado':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejeitado':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'cancelado':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
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

    return (
        <AppLayout>
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
                        <Card>
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

                                {agendamento.recursos_solicitados && agendamento.recursos_solicitados.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Recursos Solicitados</p>
                                        <div className="flex flex-wrap gap-1">
                                            {agendamento.recursos_solicitados.map((recursoId, index) => (
                                                <Badge key={index} variant="outline">
                                                    Recurso #{recursoId}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status e Aprovação */}
                        {(agendamento.status === 'rejeitado' || agendamento.status === 'aprovado') && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        {agendamento.status === 'aprovado' ? 'Aprovação' : 'Rejeição'}
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
                                                {agendamento.aprovadoPor?.name || 'Sistema'}
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

                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/espacos/${agendamento.espaco.id}`}>
                                            Ver Detalhes do Espaço
                                        </Link>
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
                                            <Badge variant="outline" className="mt-2">
                                                {agendamento.user.perfil_acesso.replace('_', ' ')}
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
        </AppLayout>
    );
}