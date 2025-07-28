import React, { useState, useEffect, useRef } from 'react';
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
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
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
        nome_agendamento?: string;
        page?: string;
        mes_atual?: string;
        aprovado_hoje?: string;
        rejeitado_hoje?: string;
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
    
    // Estados locais para os campos de busca
    const safeFilters = Array.isArray(filters) ? {} : filters;
    const [searchValues, setSearchValues] = useState({
        solicitante: safeFilters.solicitante || '',
        nome_agendamento: safeFilters.nome_agendamento || ''
    });
    
    // Estados para ordenação
    const [nomeSortOrder, setNomeSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [solicitanteSortOrder, setSolicitanteSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [dataInicioSortOrder, setDataInicioSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [dataFimSortOrder, setDataFimSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    
    // Refs para controlar os timers
    const timersRef = useRef<{
        solicitante?: NodeJS.Timeout;
        nome_agendamento?: NodeJS.Timeout;
    }>({});
    
    // Função para fazer a busca
    const performSearch = (newFilters: any, searchType: string) => {
        try {
            router.get('/gerenciar-agendamentos', newFilters, {
                preserveState: true,
                preserveScroll: true,
                onError: (errors) => {
                    console.error(`Erro na busca - ${searchType}:`, errors);
                }
            });
        } catch (error) {
            console.error(`Erro ao executar busca - ${searchType}:`, error);
        }
    };
    
    // Função para lidar com mudanças nos campos de busca
    const handleSearchChange = (field: 'solicitante' | 'nome_agendamento', value: string) => {
        // Atualizar o estado local imediatamente
        setSearchValues(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Limpar timer anterior se existir
        if (timersRef.current[field]) {
            clearTimeout(timersRef.current[field]);
        }
        
        // Configurar novo timer
        timersRef.current[field] = setTimeout(() => {
            const currentValue = safeFilters[field] || '';
            const newValue = value.trim();
            
            if (newValue !== currentValue) {
                const newFilters = {
                    ...safeFilters,
                    [field]: newValue || undefined
                };
                performSearch(newFilters, field === 'solicitante' ? 'Solicitante' : 'Nome do Agendamento');
            }
        }, 800);
    };
    
    // Sincronizar com filtros externos apenas quando necessário
    useEffect(() => {
        const newSolicitante = safeFilters.solicitante || '';
        const newNomeAgendamento = safeFilters.nome_agendamento || '';
        
        // Só atualizar se realmente mudou externamente
        if (newSolicitante !== searchValues.solicitante || newNomeAgendamento !== searchValues.nome_agendamento) {
            setSearchValues({
                solicitante: newSolicitante,
                nome_agendamento: newNomeAgendamento
            });
        }
    }, [safeFilters.solicitante, safeFilters.nome_agendamento]);
    
    // Cleanup dos timers
    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach(timer => {
                if (timer) clearTimeout(timer);
            });
        };
    }, []);

    // Função para alternar ordenação de nome
    const toggleNomeSort = () => {
        if (nomeSortOrder === 'none') {
            setNomeSortOrder('asc');
            setSolicitanteSortOrder('none');
            setDataInicioSortOrder('none');
            setDataFimSortOrder('none');
        } else if (nomeSortOrder === 'asc') {
            setNomeSortOrder('desc');
        } else {
            setNomeSortOrder('none');
        }
    };

    // Função para obter ícone de ordenação de nome
    const getNomeSortIcon = () => {
        switch (nomeSortOrder) {
            case 'asc':
                return <ArrowUp className="h-3 w-3" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3" />;
            default:
                return <ArrowUpDown className="h-3 w-3" />;
        }
    };

    // Função para alternar ordenação de solicitante
    const toggleSolicitanteSort = () => {
        if (solicitanteSortOrder === 'none') {
            setSolicitanteSortOrder('asc');
            setNomeSortOrder('none');
            setDataInicioSortOrder('none');
            setDataFimSortOrder('none');
        } else if (solicitanteSortOrder === 'asc') {
            setSolicitanteSortOrder('desc');
        } else {
            setSolicitanteSortOrder('none');
        }
    };

    // Função para obter ícone de ordenação de solicitante
    const getSolicitanteSortIcon = () => {
        switch (solicitanteSortOrder) {
            case 'asc':
                return <ArrowUp className="h-3 w-3" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3" />;
            default:
                return <ArrowUpDown className="h-3 w-3" />;
        }
    };

    // Função para alternar ordenação de data início
    const toggleDataInicioSort = () => {
        if (dataInicioSortOrder === 'none') {
            setDataInicioSortOrder('asc');
            setNomeSortOrder('none');
            setSolicitanteSortOrder('none');
            setDataFimSortOrder('none');
        } else if (dataInicioSortOrder === 'asc') {
            setDataInicioSortOrder('desc');
        } else {
            setDataInicioSortOrder('none');
        }
    };

    // Função para obter ícone de ordenação de data início
    const getDataInicioSortIcon = () => {
        switch (dataInicioSortOrder) {
            case 'asc':
                return <ArrowUp className="h-3 w-3" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3" />;
            default:
                return <ArrowUpDown className="h-3 w-3" />;
        }
    };

    // Função para alternar ordenação de data fim
    const toggleDataFimSort = () => {
        if (dataFimSortOrder === 'none') {
            setDataFimSortOrder('asc');
            setNomeSortOrder('none');
            setSolicitanteSortOrder('none');
            setDataInicioSortOrder('none');
        } else if (dataFimSortOrder === 'asc') {
            setDataFimSortOrder('desc');
        } else {
            setDataFimSortOrder('none');
        }
    };

    // Função para obter ícone de ordenação de data fim
    const getDataFimSortIcon = () => {
        switch (dataFimSortOrder) {
            case 'asc':
                return <ArrowUp className="h-3 w-3" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3" />;
            default:
                return <ArrowUpDown className="h-3 w-3" />;
        }
    };

    // Filtrar e ordenar agendamentos
    const filteredAndSortedAgendamentos = (() => {
        let filtered = [...agendamentos.data];

        // Aplicar ordenação por nome se ativa
        if (nomeSortOrder !== 'none') {
            filtered.sort((a, b) => {
                const nomeA = a.titulo.toLowerCase();
                const nomeB = b.titulo.toLowerCase();
                return nomeSortOrder === 'asc'
                    ? nomeA.localeCompare(nomeB)
                    : nomeB.localeCompare(nomeA);
            });
        }
        // Aplicar ordenação por solicitante se ativa
        else if (solicitanteSortOrder !== 'none') {
            filtered.sort((a, b) => {
                const solicitanteA = (a.user?.name || 'Usuário não encontrado').toLowerCase();
                const solicitanteB = (b.user?.name || 'Usuário não encontrado').toLowerCase();
                return solicitanteSortOrder === 'asc'
                    ? solicitanteA.localeCompare(solicitanteB)
                    : solicitanteB.localeCompare(solicitanteA);
            });
        }
        // Aplicar ordenação por data início se ativa
        else if (dataInicioSortOrder !== 'none') {
            filtered.sort((a, b) => {
                // Normalizar as datas para garantir formato correto
                const dateStrA = a.data_inicio.split('T')[0]; // Pegar apenas YYYY-MM-DD
                const timeStrA = a.hora_inicio.split(':').slice(0, 2).join(':'); // Pegar apenas HH:MM
                const dateStrB = b.data_inicio.split('T')[0];
                const timeStrB = b.hora_inicio.split(':').slice(0, 2).join(':');
                
                const dateA = new Date(`${dateStrA}T${timeStrA}:00`);
                const dateB = new Date(`${dateStrB}T${timeStrB}:00`);
                
                // Verificar se as datas são válidas
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    console.warn('Data inválida encontrada:', { a: a.data_inicio, b: b.data_inicio });
                    return 0;
                }
                
                return dataInicioSortOrder === 'asc' 
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            });
        }
        // Aplicar ordenação por data fim se ativa
        else if (dataFimSortOrder !== 'none') {
            filtered.sort((a, b) => {
                // Normalizar as datas para garantir formato correto
                const dateStrA = a.data_fim.split('T')[0]; // Pegar apenas YYYY-MM-DD
                const timeStrA = a.hora_fim.split(':').slice(0, 2).join(':'); // Pegar apenas HH:MM
                const dateStrB = b.data_fim.split('T')[0];
                const timeStrB = b.hora_fim.split(':').slice(0, 2).join(':');
                
                const dateA = new Date(`${dateStrA}T${timeStrA}:00`);
                const dateB = new Date(`${dateStrB}T${timeStrB}:00`);
                
                // Verificar se as datas são válidas
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    console.warn('Data inválida encontrada:', { a: a.data_fim, b: b.data_fim });
                    return 0;
                }
                
                return dataFimSortOrder === 'asc' 
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            });
        }
        // Ordenação padrão: priorizar agendamentos futuros mais recentes, depois os que já passaram
        else {
            filtered.sort((a, b) => {
                const now = new Date();
                
                // Criar datas de início dos agendamentos
                const dateStrA = a.data_inicio.split('T')[0];
                const timeStrA = a.hora_inicio.split(':').slice(0, 2).join(':');
                const dateStrB = b.data_inicio.split('T')[0];
                const timeStrB = b.hora_inicio.split(':').slice(0, 2).join(':');
                
                const dateA = new Date(`${dateStrA}T${timeStrA}:00`);
                const dateB = new Date(`${dateStrB}T${timeStrB}:00`);
                
                // Verificar se as datas são válidas
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    return 0;
                }
                
                // Verificar se os agendamentos já passaram
                const aPassou = dateA < now;
                const bPassou = dateB < now;
                
                // Se um passou e outro não, priorizar o que não passou
                if (aPassou && !bPassou) return 1;
                if (!aPassou && bPassou) return -1;
                
                // Se ambos não passaram, ordenar por data mais próxima primeiro
                if (!aPassou && !bPassou) {
                    return dateA.getTime() - dateB.getTime();
                }
                
                // Se ambos já passaram, ordenar por mais recente primeiro
                if (aPassou && bPassou) {
                    return dateB.getTime() - dateA.getTime();
                }
                
                return 0;
            });
        }

        return filtered;
    })();

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
    }

    // Função para formatar o perfil do usuário (igual aos responsáveis)
    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return "Não definido";
        return perfil.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    // Função para obter as cores do perfil (igual aos responsáveis)
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
                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-yellow-100/60 dark:hover:bg-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-800 group"
                        onClick={() => {
                            // Limpar outros filtros e aplicar apenas o filtro de pendentes
                            setSearchValues({
                                solicitante: '',
                                nome_agendamento: ''
                            });
                            setNomeSortOrder('none');
                            setSolicitanteSortOrder('none');
                            setDataInicioSortOrder('none');
                            setDataFimSortOrder('none');
                            
                            router.get('/gerenciar-agendamentos', { status: 'pendente' });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                            <AlertCircle 
                                className={`h-4 w-4 text-yellow-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-yellow-500 ${
                                    estatisticas.pendentes > 0 
                                        ? 'animate-bounce duration-[0.4s] scale-110 drop-shadow-lg' 
                                        : ''
                                }`} 
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
                            <p className="text-xs text-muted-foreground">
                                Aguardando aprovação
                            </p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-green-100/60 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 group"
                        onClick={() => {
                            // Limpar outros filtros e aplicar filtro de aprovados hoje
                            setSearchValues({
                                solicitante: '',
                                nome_agendamento: ''
                            });
                            setNomeSortOrder('none');
                            setSolicitanteSortOrder('none');
                            setDataInicioSortOrder('none');
                            setDataFimSortOrder('none');
                            
                            router.get('/gerenciar-agendamentos', { 
                                status: 'aprovado',
                                aprovado_hoje: 'true'
                            });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aprovados Hoje</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{estatisticas.aprovados_hoje}</div>
                            <p className="text-xs text-muted-foreground">
                                Aprovações do dia
                            </p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-red-100/60 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 group"
                        onClick={() => {
                            // Limpar outros filtros e aplicar filtro de rejeitados hoje
                            setSearchValues({
                                solicitante: '',
                                nome_agendamento: ''
                            });
                            setNomeSortOrder('none');
                            setSolicitanteSortOrder('none');
                            setDataInicioSortOrder('none');
                            setDataFimSortOrder('none');
                            
                            router.get('/gerenciar-agendamentos', { 
                                status: 'rejeitado',
                                rejeitado_hoje: 'true'
                            });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejeitados Hoje</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{estatisticas.rejeitados_hoje}</div>
                            <p className="text-xs text-muted-foreground">
                                Rejeições do dia
                            </p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 group"
                        onClick={() => {
                            // Limpar outros filtros e aplicar filtro do mês atual com status "all"
                            setSearchValues({
                                solicitante: '',
                                nome_agendamento: ''
                            });
                            setNomeSortOrder('none');
                            setSolicitanteSortOrder('none');
                            setDataInicioSortOrder('none');
                            setDataFimSortOrder('none');
                            
                            router.get('/gerenciar-agendamentos', { 
                                mes_atual: 'true',
                                status: 'all'
                            });
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-blue-500" />
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
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="nome_agendamento">Nome do Agendamento</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nome..."
                                        value={searchValues.nome_agendamento}
                                        onChange={(e) => handleSearchChange('nome_agendamento', e.target.value)}
                                        className="pl-8 pr-10"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={toggleNomeSort}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                                        title={`Ordenar por nome ${nomeSortOrder === 'none' ? 'crescente' : nomeSortOrder === 'asc' ? 'decrescente' : 'padrão'}`}
                                    >
                                        {getNomeSortIcon()}
                                    </Button>
                                </div>
                            </div>

                            <div className="min-w-[120px]">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={filters.status || 'pendente'}
                                    onValueChange={(value) => {
                                        const status = value === 'all' ? 'all' : value;
                                        router.get('/gerenciar-agendamentos', { ...filters, status });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="min-w-[140px]">
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

                            <div className="flex-1 min-w-[180px]">
                                <Label htmlFor="solicitante">Solicitante</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Nome do solicitante"
                                        value={searchValues.solicitante}
                                        onChange={(e) => handleSearchChange('solicitante', e.target.value)}
                                        className="pl-8 pr-10"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={toggleSolicitanteSort}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                                        title={`Ordenar por solicitante ${solicitanteSortOrder === 'none' ? 'crescente' : solicitanteSortOrder === 'asc' ? 'decrescente' : 'padrão'}`}
                                    >
                                        {getSolicitanteSortIcon()}
                                    </Button>
                                </div>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_inicio">Data Início</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={filters.data_inicio || ''}
                                        onChange={(e) => {
                                            const dataInicio = e.target.value || undefined;
                                            router.get('/gerenciar-agendamentos', { ...filters, data_inicio: dataInicio });
                                        }}
                                        className="pr-10"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={toggleDataInicioSort}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted pointer-events-auto z-10"
                                        title={`Ordenar por data início ${dataInicioSortOrder === 'none' ? 'crescente' : dataInicioSortOrder === 'asc' ? 'decrescente' : 'padrão'}`}
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        {getDataInicioSortIcon()}
                                    </Button>
                                </div>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_fim">Data Fim</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={filters.data_fim || ''}
                                        onChange={(e) => {
                                            const dataFim = e.target.value || undefined;
                                            router.get('/gerenciar-agendamentos', { ...filters, data_fim: dataFim });
                                        }}
                                        className="pr-10"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={toggleDataFimSort}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted pointer-events-auto z-10"
                                        title={`Ordenar por data fim ${dataFimSortOrder === 'none' ? 'crescente' : dataFimSortOrder === 'asc' ? 'decrescente' : 'padrão'}`}
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        {getDataFimSortIcon()}
                                    </Button>
                                </div>
                            </div>

                            {/* Botão Limpar Filtros - só aparece quando há filtros ativos */}
                            {(searchValues.nome_agendamento || searchValues.solicitante || filters.espaco_id || 
                              filters.status || filters.data_inicio || filters.data_fim || 
                              nomeSortOrder !== 'none' || solicitanteSortOrder !== 'none' || 
                              dataInicioSortOrder !== 'none' || dataFimSortOrder !== 'none') && (
                                <div className="flex flex-col">
                                    <Label className="mb-2 opacity-0">Ações</Label>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            // Limpar todos os filtros e ordenações
                                            setSearchValues({
                                                solicitante: '',
                                                nome_agendamento: ''
                                            });
                                            setNomeSortOrder('none');
                                            setSolicitanteSortOrder('none');
                                            setDataInicioSortOrder('none');
                                            setDataFimSortOrder('none');
                                            
                                            // Redirecionar para a página sem filtros (mostrando todos os status)
                                            router.get('/gerenciar-agendamentos', {});
                                        }}
                                        className="h-10 w-10 p-0"
                                        title="Limpar filtros"
                                        >
                                        <X className="h-4 w-4" />
                                        </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Agendamentos */}
                <div className="space-y-4">
                    {filteredAndSortedAgendamentos.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhum agendamento encontrado com os filtros aplicados.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredAndSortedAgendamentos.map((agendamento) => {
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
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{agendamento.espaco?.nome || 'Espaço não encontrado'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                                                    {agendamento.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{agendamento.user?.name || 'Usuário não encontrado'}</span>
                                                                {agendamento.user?.email && (
                                                                    <span className="text-xs text-muted-foreground">{agendamento.user.email}</span>
                                                                )}
                                                            </div>
                                                            {agendamento.user?.perfil_acesso && (
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(agendamento.user.perfil_acesso)}`}>
                                                                    {formatPerfil(agendamento.user.perfil_acesso)}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                    <Link href={`/agendamentos/${agendamento.id}?from=gerenciar&${new URLSearchParams(filters).toString()}`}>
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
                                    onClick={() => {
                                        if (link.url) {
                                            // Extrair apenas o número da página da URL
                                            const url = new URL(link.url, window.location.origin);
                                            const page = url.searchParams.get('page');
                                            
                                            // Manter todos os filtros atuais e adicionar apenas a página
                                            const currentFilters = { ...filters };
                                            if (page) {
                                                currentFilters.page = page;
                                            }
                                            
                                            router.get('/gerenciar-agendamentos', currentFilters);
                                        }
                                    }}
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