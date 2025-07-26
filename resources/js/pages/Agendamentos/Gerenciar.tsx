import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    User, 
    Filter, 
    Eye, 
    Check, 
    X, 
    AlertCircle,
    TrendingUp,
    Users,
    CheckCircle,
    XCircle,
    Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAgendamentoColors, StatusBadge } from '@/components/ui/agend-colors';

import type { PageProps, Agendamento, Espaco, BreadcrumbItem } from '@/types';

interface Props extends PageProps {
    agendamentos: {
        data: Agendamento[];
        links: any[];
        meta: any;
    };
    espacos: Espaco[];
    estatisticas: {
        pendentes: number;
        aprovados_hoje: number;
        rejeitados_hoje: number;
        total_mes: number;
    };
    filters: {
        espaco_id?: string;
        status?: string;
        data_inicio?: string;
        data_fim?: string;
        solicitante?: string;
    };
}

export default function GerenciarAgendamentos({ agendamentos, espacos, estatisticas, filters, auth }: Props) {
    // Usar o hook de cores
    const { getStatusColor, getStatusText, getEventBorderColor } = useAgendamentoColors();
    
    const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; agendamento: Agendamento | null }>({
        open: false,
        agendamento: null
    });
    const [rejectionReason, setRejectionReason] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gerenciar Agendamentos', href: '/gerenciar-agendamentos' }
    ];

    const handleApprove = (agendamento: Agendamento) => {
        const isRecorrente = agendamento.grupo_recorrencia;
        const totalAgendamentos = agendamento.total_grupo || agendamento.info_grupo?.total || 1;
        
        const confirmMessage = isRecorrente 
            ? `Tem certeza que deseja aprovar o grupo de agendamentos recorrentes "${agendamento.titulo}"?\n\nTodos os ${totalAgendamentos} agendamentos deste grupo serão aprovados.`
            : `Tem certeza que deseja aprovar o agendamento "${agendamento.titulo}"?`;
            
        if (confirm(confirmMessage)) {
            router.post(`/agendamentos/${agendamento.id}/aprovar`, {}, {
                onSuccess: () => {
                    router.reload();
                },
                onError: (errors) => {
                    console.error('Erro ao aprovar agendamento:', errors);
                    alert('Erro ao aprovar agendamento. Verifique se não há conflitos de horário.');
                }
            });
        }
    };

    const handleReject = (agendamento: Agendamento) => {
        setRejectionDialog({ open: true, agendamento });
        setRejectionReason('');
    };

    const confirmReject = () => {
        if (!rejectionDialog.agendamento || !rejectionReason.trim()) {
            alert('Por favor, informe o motivo da rejeição.');
            return;
        }

        router.post(`/agendamentos/${rejectionDialog.agendamento.id}/rejeitar`, {
            motivo_rejeicao: rejectionReason
        }, {
            onSuccess: () => {
                setRejectionDialog({ open: false, agendamento: null });
                setRejectionReason('');
                router.reload();
            },
            onError: (errors) => {
                console.error('Erro ao rejeitar agendamento:', errors);
                alert('Erro ao rejeitar agendamento.');
            }
        });
    };

    const formatDateTime = (date: string, time: string) => {
        try {
            // Criar data apenas com a parte da data (sem timezone)
            const [year, month, day] = date.split('-');
            const [hour, minute] = time.split(':');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch {
            // Fallback para formato manual
            const [year, month, day] = date.split('-');
            return `${day}/${month}/${year} às ${time}`;
        }
    };

    const formatPeriod = (agendamento: Agendamento) => {
        const dataInicio = formatDateTime(agendamento.data_inicio, agendamento.hora_inicio);
        const dataFim = formatDateTime(agendamento.data_fim, agendamento.hora_fim);
        
        // Se for o mesmo dia, mostrar apenas uma data
        if (agendamento.data_inicio === agendamento.data_fim) {
            const [year, month, day] = agendamento.data_inicio.split('-');
            return `${day}/${month}/${year} das ${agendamento.hora_inicio} às ${agendamento.hora_fim}`;
        }
        
        return `${dataInicio} até ${dataFim}`;
    };

    const getPriorityLevel = (agendamento: Agendamento) => {
        const dataInicio = new Date(agendamento.data_inicio);
        const hoje = new Date();
        const diffDays = Math.ceil((dataInicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) return 'alta';
        if (diffDays <= 3) return 'media';
        return 'baixa';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'alta':
                return 'text-red-600';
            case 'media':
                return 'text-yellow-600';
            case 'baixa':
                return 'text-green-600';
            default:
                return 'text-gray-600';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'alta':
                return 'Alta';
            case 'media':
                return 'Média';
            case 'baixa':
                return 'Baixa';
            default:
                return 'Normal';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gerenciar Agendamentos" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Agendamentos</h1>
                    </div>

                    <Button asChild variant="outline">
                        <Link href="/agendamentos">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Todos os Agendamentos
                        </Link>
                    </Button>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
                            <p className="text-xs text-muted-foreground">
                                Aguardando aprovação
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aprovados Hoje</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{estatisticas.aprovados_hoje}</div>
                            <p className="text-xs text-muted-foreground">
                                Aprovações do dia
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejeitados Hoje</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{estatisticas.rejeitados_hoje}</div>
                            <p className="text-xs text-muted-foreground">
                                Rejeições do dia
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{estatisticas.total_mes}</div>
                            <p className="text-xs text-muted-foreground">
                                Solicitações no mês
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={filters.status || 'pendente'}
                                    onValueChange={(value) => {
                                        const status = value === 'all' ? undefined : value;
                                        router.get('/gerenciar-agendamentos', { ...filters, status });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                        <SelectItem value="all">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="espaco">Espaço</Label>
                                <Select
                                    value={filters.espaco_id || 'all'}
                                    onValueChange={(value) => {
                                        const espacoId = value === 'all' ? undefined : value;
                                        router.get('/gerenciar-agendamentos', { ...filters, espaco_id: espacoId });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos os espaços" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os espaços</SelectItem>
                                        {espacos.map((espaco) => (
                                            <SelectItem key={espaco.id} value={espaco.id.toString()}>
                                                {espaco.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="solicitante">Solicitante</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Nome do solicitante"
                                        value={filters.solicitante || ''}
                                        onChange={(e) => {
                                            const solicitante = e.target.value || undefined;
                                            router.get('/gerenciar-agendamentos', { ...filters, solicitante });
                                        }}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="data_inicio">Data Início</Label>
                                <Input
                                    type="date"
                                    value={filters.data_inicio || ''}
                                    onChange={(e) => {
                                        const dataInicio = e.target.value || undefined;
                                        router.get('/gerenciar-agendamentos', { ...filters, data_inicio: dataInicio });
                                    }}
                                />
                            </div>

                            <div>
                                <Label htmlFor="data_fim">Data Fim</Label>
                                <Input
                                    type="date"
                                    value={filters.data_fim || ''}
                                    onChange={(e) => {
                                        const dataFim = e.target.value || undefined;
                                        router.get('/gerenciar-agendamentos', { ...filters, data_fim: dataFim });
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Agendamentos */}
                <div className="space-y-4">
                    {agendamentos.data.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhum agendamento encontrado com os filtros aplicados.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        agendamentos.data.map((agendamento) => {
                            const priority = getPriorityLevel(agendamento);
                            const isRecorrente = agendamento.grupo_recorrencia;
                            const infoGrupo = agendamento.info_grupo;
                            
                            return (
                                <Card key={agendamento.id} className={`border-l-4 ${getEventBorderColor(agendamento)}`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-semibold text-lg">{agendamento.titulo}</h3>
                                                    <StatusBadge status={agendamento.status} agendamento={agendamento} />
                                                    {isRecorrente && (
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                            Recorrente ({agendamento.total_grupo || infoGrupo?.total || 1} agendamentos)
                                                        </Badge>
                                                    )}
                                                    {agendamento.status === 'pendente' && (
                                                        <Badge variant="outline" className={getPriorityColor(priority)}>
                                                            Prioridade {getPriorityText(priority)}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{agendamento.espaco?.nome || 'Espaço não encontrado'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        <span>{agendamento.user?.name || 'Usuário não encontrado'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            Início: {formatDateTime(agendamento.data_inicio, agendamento.hora_inicio)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            Fim: {formatDateTime(agendamento.data_fim, agendamento.hora_fim)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div>
                                                        <strong className="text-sm">Justificativa:</strong>
                                                        <p className="text-sm mt-1">{agendamento.justificativa}</p>
                                                    </div>
                                                    
                                                    {agendamento.observacoes && (
                                                        <div>
                                                            <strong className="text-sm">Observações:</strong>
                                                            <p className="text-sm mt-1">{agendamento.observacoes}</p>
                                                        </div>
                                                    )}

                                                    {agendamento.recursos_solicitados && agendamento.recursos_solicitados.length > 0 && (
                                                        <div>
                                                            <strong className="text-sm">Recursos Solicitados:</strong>
                                                            <p className="text-sm mt-1">
                                                                {agendamento.recursos_solicitados.join(', ')}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {agendamento.status === 'rejeitado' && agendamento.motivo_rejeicao && (
                                                        <Alert>
                                                            <XCircle className="h-4 w-4" />
                                                            <AlertDescription>
                                                                <strong>Motivo da rejeição:</strong> {agendamento.motivo_rejeicao}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    {agendamento.aprovadoPor && agendamento.aprovado_em && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {agendamento.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'} por {agendamento.aprovadoPor.name} em {format(new Date(agendamento.aprovado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/agendamentos/${agendamento.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                {agendamento.status === 'pendente' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleApprove(agendamento)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleReject(agendamento)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Paginação */}
                {agendamentos.links && agendamentos.links.length > 3 && (
                    <div className="flex justify-center">
                        <div className="flex gap-2">
                            {agendamentos.links.map((link: any, index: number) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Dialog de Rejeição */}
                <Dialog open={rejectionDialog.open} onOpenChange={(open) => setRejectionDialog({ open, agendamento: null })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Rejeitar Agendamento</DialogTitle>
                            <DialogDescription>
                                {rejectionDialog.agendamento?.grupo_recorrencia ? (
                                    <>
                                        Informe o motivo da rejeição para o grupo de agendamentos recorrentes "{rejectionDialog.agendamento?.titulo}".
                                        <br />
                                        <strong>Atenção:</strong> Todos os {rejectionDialog.agendamento?.total_grupo || rejectionDialog.agendamento?.info_grupo?.total || 1} agendamentos deste grupo serão rejeitados.
                                        <br />
                                        Esta informação será enviada ao solicitante.
                                    </>
                                ) : (
                                    <>
                                        Informe o motivo da rejeição para o agendamento "{rejectionDialog.agendamento?.titulo}".
                                        Esta informação será enviada ao solicitante.
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="motivo">Motivo da Rejeição *</Label>
                                <Textarea
                                    id="motivo"
                                    placeholder="Descreva o motivo da rejeição..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => setRejectionDialog({ open: false, agendamento: null })}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={confirmReject}
                                disabled={!rejectionReason.trim()}
                            >
                                {rejectionDialog.agendamento?.grupo_recorrencia ? 'Rejeitar Grupo' : 'Rejeitar Agendamento'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}