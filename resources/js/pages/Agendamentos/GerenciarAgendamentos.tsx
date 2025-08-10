import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import React, { useState, useEffect } from 'react';
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
    AlertTriangle,
    TrendingUp,
    Users,
    CheckCircle,
    XCircle,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    AlertCircle,
    FileText,
    Zap,
    Building
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
import { UserAvatar } from '@/components/user-avatar';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { PageProps, Agendamento, Espaco, BreadcrumbItem, GrupoConflito } from '@/types';

interface Props extends PageProps {
    gruposConflito: GrupoConflito[];
    agendamentosSemConflito: Agendamento[];
    espacos: Espaco[];
    estatisticas: {
        conflitos_pendentes: number;
        agendamentos_em_conflito: number;
        conflitos_resolvidos_hoje: number;
        total_agendamentos_pendentes: number;
    };
    filters: {
        espaco_id?: string;
        status?: string;
        tipo_conflito?: string;
        data_inicio?: string;
        data_fim?: string;
        solicitante?: string;
        nome_agendamento?: string;
    };
}

export default function GerenciarAgendamentos({ 
    gruposConflito, 
    agendamentosSemConflito, 
    espacos, 
    estatisticas, 
    filters, 
    auth 
}: Props) {
    const { getStatusColor, getStatusText, getEventBorderColor } = useAgendamentoColors();
    const { toast } = useToast();
    
    // Estados locais para os filtros - apenas client-side como em Avaliar Agendamentos
    const [nomeAgendamentoFilter, setNomeAgendamentoFilter] = useState('');
    const [solicitanteFilter, setSolicitanteFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tipoConflitoFilter, setTipoConflitoFilter] = useState('com_conflito');
    const [espacoFilter, setEspacoFilter] = useState('all');
    const [dataInicioFilter, setDataInicioFilter] = useState('');
    const [dataFimFilter, setDataFimFilter] = useState('');

    // Números fixos das estatísticas - calculados uma vez e nunca mudam
    const [totalConflitosFixo] = useState(estatisticas.conflitos_pendentes);
    const [totalAgendamentosConflitantesFixo] = useState(estatisticas.agendamentos_em_conflito);
    const [totalConflitosResolvidosFixo] = useState(estatisticas.conflitos_resolvidos_hoje);
    const [totalSemConflitoFixo] = useState(agendamentosSemConflito.length);
    
    // Estado para paginação dos agendamentos sem conflito
    const [currentPageSemConflito, setCurrentPageSemConflito] = useState(1);
    const itemsPerPageSemConflito = 15;

    // Estados para diálogos
    const [resolverDialog, setResolverDialog] = useState<{ 
        open: boolean; 
        grupoConflito: GrupoConflito | null;
        agendamentoSelecionado: number | null;
    }>({
        open: false,
        grupoConflito: null,
        agendamentoSelecionado: null
    });
    
    const [rejeitarTodosDialog, setRejeitarTodosDialog] = useState<{ 
        open: boolean; 
        grupoConflito: GrupoConflito | null;
    }>({
        open: false,
        grupoConflito: null
    });
    
    const [motivoRejeicao, setMotivoRejeicao] = useState('');
    
    // Estados para ordenação
    const [nomeSortOrder, setNomeSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [solicitanteSortOrder, setSolicitanteSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [dataInicioSortOrder, setDataInicioSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [dataFimSortOrder, setDataFimSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

    // Sincronizar estado local com parâmetros da URL apenas na primeira carga
    useEffect(() => {
        if (filters.tipo_conflito) {
            setTipoConflitoFilter(filters.tipo_conflito);
        }
        if (filters.status) {
            setStatusFilter(filters.status);
        }
        if (filters.espaco_id) {
            setEspacoFilter(filters.espaco_id);
        }
        if (filters.data_inicio) {
            setDataInicioFilter(filters.data_inicio);
        }
        if (filters.data_fim) {
            setDataFimFilter(filters.data_fim);
        }
        if (filters.solicitante) {
            setSolicitanteFilter(filters.solicitante);
        }
        if (filters.nome_agendamento) {
            setNomeAgendamentoFilter(filters.nome_agendamento);
        }
    }, []); // Executar apenas uma vez na montagem do componente

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gerenciar Agendamentos', href: '/gerenciar-agendamentos' }
    ];

    // Resetar página quando filtros mudarem (para agendamentos sem conflito)
    useEffect(() => {
        setCurrentPageSemConflito(1);
    }, [nomeAgendamentoFilter, solicitanteFilter, statusFilter, espacoFilter, dataInicioFilter, dataFimFilter, nomeSortOrder, solicitanteSortOrder, dataInicioSortOrder, dataFimSortOrder]);





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
                return <ArrowUp className="h-3 w-3 text-blue-600" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3 text-blue-600" />;
            default:
                return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
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
                return <ArrowUp className="h-3 w-3 text-blue-600" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3 text-blue-600" />;
            default:
                return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
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
                return <ArrowUp className="h-3 w-3 text-blue-600" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3 text-blue-600" />;
            default:
                return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
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
                return <ArrowUp className="h-3 w-3 text-blue-600" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3 text-blue-600" />;
            default:
                return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
        }
    };

    // Resolver conflito
    const handleResolverConflito = () => {
        if (!resolverDialog.grupoConflito || !resolverDialog.agendamentoSelecionado || !motivoRejeicao.trim()) {
            toast({
                title: 'Dados incompletos',
                description: 'Selecione um agendamento para aprovar e informe o motivo da rejeição dos demais.',
                variant: 'destructive',
            });
            return;
        }

        router.post('/conflitos/resolver', {
            grupo_conflito: resolverDialog.grupoConflito.grupo_conflito,
            agendamento_aprovado_id: resolverDialog.agendamentoSelecionado,
            motivo_rejeicao: motivoRejeicao
        }, {
            onSuccess: () => {
                toast({
                    title: 'Conflito resolvido!',
                    description: 'O conflito foi resolvido com sucesso.',
                    variant: 'success',
                    duration: 5000,
                });
                setResolverDialog({ open: false, grupoConflito: null, agendamentoSelecionado: null });
                setMotivoRejeicao('');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] as string || 'Erro ao resolver conflito.';
                toast({
                    title: 'Erro ao resolver conflito',
                    description: errorMessage,
                    variant: 'destructive',
                });
            }
        });
    };

    // Rejeitar todos os agendamentos do conflito
    const handleRejeitarTodos = () => {
        if (!rejeitarTodosDialog.grupoConflito || !motivoRejeicao.trim()) {
            toast({
                title: 'Motivo obrigatório',
                description: 'Por favor, informe o motivo da rejeição.',
                variant: 'destructive',
            });
            return;
        }

        router.post('/conflitos/rejeitar-todos', {
            grupo_conflito: rejeitarTodosDialog.grupoConflito.grupo_conflito,
            motivo_rejeicao: motivoRejeicao
        }, {
            onSuccess: () => {
                toast({
                    title: 'Conflito resolvido!',
                    description: 'Todos os agendamentos conflitantes foram rejeitados.',
                    variant: 'success',
                    duration: 5000,
                });
                setRejeitarTodosDialog({ open: false, grupoConflito: null });
                setMotivoRejeicao('');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] as string || 'Erro ao rejeitar agendamentos.';
                toast({
                    title: 'Erro ao rejeitar agendamentos',
                    description: errorMessage,
                    variant: 'destructive',
                });
            }
        });
    };

    // Filtrar e ordenar grupos de conflito e agendamentos sem conflito
    const filteredGruposConflito = (() => {
        // Se o filtro de tipo é especificamente "sem_conflito", não mostrar grupos de conflito
        if (tipoConflitoFilter === 'sem_conflito') {
            return [];
        }

        let filtered = [...gruposConflito];

        // Aplicar filtros
        if (nomeAgendamentoFilter.trim()) {
            // Filtrar grupos que têm pelo menos um agendamento com correspondência
            filtered = filtered.filter(grupo => 
                grupo.agendamentos.some(agendamento => {
                    const titulo = agendamento.titulo || '';
                    const justificativa = agendamento.justificativa || '';
                    return titulo.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase()) ||
                           justificativa.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase());
                })
            );
            
            // Ordenar agendamentos dentro de cada grupo para mostrar os que têm correspondência primeiro
            filtered = filtered.map(grupo => ({
                ...grupo,
                agendamentos: [...grupo.agendamentos].sort((a, b) => {
                    const tituloA = a.titulo || '';
                    const justificativaA = a.justificativa || '';
                    const tituloB = b.titulo || '';
                    const justificativaB = b.justificativa || '';
                    
                    const matchA = tituloA.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase()) ||
                                  justificativaA.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase());
                    const matchB = tituloB.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase()) ||
                                  justificativaB.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase());
                    
                    // Agendamentos com correspondência vêm primeiro
                    if (matchA && !matchB) return -1;
                    if (!matchA && matchB) return 1;
                    return 0;
                })
            }));
        }

        if (solicitanteFilter.trim()) {
            // Filtrar grupos que têm pelo menos um agendamento com correspondência
            filtered = filtered.filter(grupo => 
                grupo.agendamentos.some(agendamento => {
                    const userName = agendamento.user?.name || '';
                    const userEmail = agendamento.user?.email || '';
                    return userName.toLowerCase().includes(solicitanteFilter.toLowerCase()) ||
                           userEmail.toLowerCase().includes(solicitanteFilter.toLowerCase());
                })
            );
            
            // Ordenar agendamentos dentro de cada grupo para mostrar os que têm correspondência primeiro
            filtered = filtered.map(grupo => ({
                ...grupo,
                agendamentos: [...grupo.agendamentos].sort((a, b) => {
                    const userNameA = a.user?.name || '';
                    const userEmailA = a.user?.email || '';
                    const userNameB = b.user?.name || '';
                    const userEmailB = b.user?.email || '';
                    
                    const matchA = userNameA.toLowerCase().includes(solicitanteFilter.toLowerCase()) ||
                                  userEmailA.toLowerCase().includes(solicitanteFilter.toLowerCase());
                    const matchB = userNameB.toLowerCase().includes(solicitanteFilter.toLowerCase()) ||
                                  userEmailB.toLowerCase().includes(solicitanteFilter.toLowerCase());
                    
                    // Agendamentos com correspondência vêm primeiro
                    if (matchA && !matchB) return -1;
                    if (!matchA && matchB) return 1;
                    return 0;
                })
            }));
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(grupo => 
                grupo.agendamentos.some(agendamento => agendamento.status === statusFilter)
            );
        }

        if (espacoFilter !== 'all') {
            filtered = filtered.filter(grupo => 
                grupo.espaco.id.toString() === espacoFilter
            );
        }

        if (dataInicioFilter) {
            filtered = filtered.filter(grupo => 
                grupo.agendamentos.some(agendamento => {
                    const agendamentoDataInicio = agendamento.data_inicio.split('T')[0];
                    return agendamentoDataInicio >= dataInicioFilter;
                })
            );
        }

        if (dataFimFilter) {
            filtered = filtered.filter(grupo => 
                grupo.agendamentos.some(agendamento => {
                    const agendamentoDataFim = agendamento.data_fim.split('T')[0];
                    return agendamentoDataFim <= dataFimFilter;
                })
            );
        }



        // Aplicar ordenação aos grupos de conflito
        if (nomeSortOrder !== 'none') {
            // Ordenar grupos pelo primeiro agendamento
            filtered.sort((a, b) => {
                const tituloA = a.agendamentos[0]?.titulo || '';
                const tituloB = b.agendamentos[0]?.titulo || '';
                const comparison = tituloA.localeCompare(tituloB);
                return nomeSortOrder === 'asc' ? comparison : -comparison;
            });
            // Ordenar agendamentos dentro de cada grupo
            filtered.forEach(grupo => {
                grupo.agendamentos.sort((a, b) => {
                    const comparison = a.titulo.localeCompare(b.titulo);
                    return nomeSortOrder === 'asc' ? comparison : -comparison;
                });
            });
        } else if (solicitanteSortOrder !== 'none') {
            // Ordenar grupos pelo primeiro solicitante
            filtered.sort((a, b) => {
                const nameA = a.agendamentos[0]?.user?.name || '';
                const nameB = b.agendamentos[0]?.user?.name || '';
                const comparison = nameA.localeCompare(nameB);
                return solicitanteSortOrder === 'asc' ? comparison : -comparison;
            });
            // Ordenar agendamentos dentro de cada grupo
            filtered.forEach(grupo => {
                grupo.agendamentos.sort((a, b) => {
                    const nameA = a.user?.name || '';
                    const nameB = b.user?.name || '';
                    const comparison = nameA.localeCompare(nameB);
                    return solicitanteSortOrder === 'asc' ? comparison : -comparison;
                });
            });
        } else if (dataInicioSortOrder !== 'none') {
            // Ordenar grupos pela primeira data de início
            filtered.sort((a, b) => {
                const dataA = a.agendamentos[0]?.data_inicio || '';
                const dataB = b.agendamentos[0]?.data_inicio || '';
                const comparison = dataA.localeCompare(dataB);
                return dataInicioSortOrder === 'asc' ? comparison : -comparison;
            });
            // Ordenar agendamentos dentro de cada grupo
            filtered.forEach(grupo => {
                grupo.agendamentos.sort((a, b) => {
                    const comparison = a.data_inicio.localeCompare(b.data_inicio);
                    return dataInicioSortOrder === 'asc' ? comparison : -comparison;
                });
            });
        } else if (dataFimSortOrder !== 'none') {
            // Ordenar grupos pela primeira data de fim
            filtered.sort((a, b) => {
                const dataA = a.agendamentos[0]?.data_fim || '';
                const dataB = b.agendamentos[0]?.data_fim || '';
                const comparison = dataA.localeCompare(dataB);
                return dataFimSortOrder === 'asc' ? comparison : -comparison;
            });
            // Ordenar agendamentos dentro de cada grupo
            filtered.forEach(grupo => {
                grupo.agendamentos.sort((a, b) => {
                    const comparison = a.data_fim.localeCompare(b.data_fim);
                    return dataFimSortOrder === 'asc' ? comparison : -comparison;
                });
            });
        }

        return filtered;
    })();

    const filteredAgendamentosSemConflito = (() => {
        // Se o filtro de tipo é especificamente "com_conflito", não mostrar agendamentos sem conflito
        if (tipoConflitoFilter === 'com_conflito') {
            return [];
        }

        let filtered = [...agendamentosSemConflito];

        // Aplicar filtros
        if (nomeAgendamentoFilter.trim()) {
            // Filtrar apenas agendamentos que têm correspondência
            filtered = filtered.filter(agendamento => {
                const titulo = agendamento.titulo || '';
                const justificativa = agendamento.justificativa || '';
                return titulo.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase()) ||
                       justificativa.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase());
            });
            
            // Ordenar para mostrar os que têm correspondência mais relevante primeiro
            filtered = filtered.sort((a, b) => {
                const tituloA = a.titulo || '';
                const justificativaA = a.justificativa || '';
                const tituloB = b.titulo || '';
                const justificativaB = b.justificativa || '';
                
                const titleMatchA = tituloA.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase());
                const titleMatchB = tituloB.toLowerCase().includes(nomeAgendamentoFilter.toLowerCase());
                
                // Priorizar correspondências no título sobre justificativa
                if (titleMatchA && !titleMatchB) return -1;
                if (!titleMatchA && titleMatchB) return 1;
                return 0;
            });
        }

        if (solicitanteFilter.trim()) {
            // Filtrar apenas agendamentos que têm correspondência
            filtered = filtered.filter(agendamento => {
                const userName = agendamento.user?.name || '';
                const userEmail = agendamento.user?.email || '';
                return userName.toLowerCase().includes(solicitanteFilter.toLowerCase()) ||
                       userEmail.toLowerCase().includes(solicitanteFilter.toLowerCase());
            });
            
            // Ordenar para mostrar os que têm correspondência mais relevante primeiro
            filtered = filtered.sort((a, b) => {
                const userNameA = a.user?.name || '';
                const userNameB = b.user?.name || '';
                
                const nameMatchA = userNameA.toLowerCase().includes(solicitanteFilter.toLowerCase());
                const nameMatchB = userNameB.toLowerCase().includes(solicitanteFilter.toLowerCase());
                
                // Priorizar correspondências no nome sobre email
                if (nameMatchA && !nameMatchB) return -1;
                if (!nameMatchA && nameMatchB) return 1;
                return 0;
            });
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(agendamento => 
                agendamento.status === statusFilter
            );
        }

        if (espacoFilter !== 'all') {
            filtered = filtered.filter(agendamento => 
                agendamento.espaco_id.toString() === espacoFilter
            );
        }

        if (dataInicioFilter) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDataInicio = agendamento.data_inicio.split('T')[0];
                return agendamentoDataInicio >= dataInicioFilter;
            });
        }

        if (dataFimFilter) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDataFim = agendamento.data_fim.split('T')[0];
                return agendamentoDataFim <= dataFimFilter;
            });
        }

        // Aplicar ordenação
        if (nomeSortOrder !== 'none') {
            filtered.sort((a, b) => {
                const comparison = a.titulo.localeCompare(b.titulo);
                return nomeSortOrder === 'asc' ? comparison : -comparison;
            });
        } else if (solicitanteSortOrder !== 'none') {
            filtered.sort((a, b) => {
                const nameA = a.user?.name || '';
                const nameB = b.user?.name || '';
                const comparison = nameA.localeCompare(nameB);
                return solicitanteSortOrder === 'asc' ? comparison : -comparison;
            });
        } else if (dataInicioSortOrder !== 'none') {
            filtered.sort((a, b) => {
                const comparison = a.data_inicio.localeCompare(b.data_inicio);
                return dataInicioSortOrder === 'asc' ? comparison : -comparison;
            });
        } else if (dataFimSortOrder !== 'none') {
            filtered.sort((a, b) => {
                const comparison = a.data_fim.localeCompare(b.data_fim);
                return dataFimSortOrder === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    })();

    // Calcular paginação para agendamentos sem conflito
    const totalItemsSemConflito = filteredAgendamentosSemConflito.length;
    const totalPagesSemConflito = Math.ceil(totalItemsSemConflito / itemsPerPageSemConflito);
    const startIndexSemConflito = (currentPageSemConflito - 1) * itemsPerPageSemConflito;
    const endIndexSemConflito = startIndexSemConflito + itemsPerPageSemConflito;
    const currentItemsSemConflito = filteredAgendamentosSemConflito.slice(startIndexSemConflito, endIndexSemConflito);

    // Gerar links de paginação para agendamentos sem conflito
    const generatePaginationLinksSemConflito = () => {
        const links = [];
        
        // Botão "Anterior"
        links.push({
            label: '« Anterior',
            active: false,
            disabled: currentPageSemConflito === 1,
            page: currentPageSemConflito - 1
        });

        // Páginas numeradas
        for (let i = 1; i <= totalPagesSemConflito; i++) {
            links.push({
                label: i.toString(),
                active: i === currentPageSemConflito,
                disabled: false,
                page: i
            });
        }

        // Botão "Próximo"
        links.push({
            label: 'Próximo »',
            active: false,
            disabled: currentPageSemConflito === totalPagesSemConflito,
            page: currentPageSemConflito + 1
        });

        return links;
    };

    const paginationLinksSemConflito = generatePaginationLinksSemConflito();

    // Função para gerar URL com filtros atuais para voltar
    const generateReturnUrl = () => {
        const params = new URLSearchParams();
        
        if (tipoConflitoFilter !== 'com_conflito') {
            params.set('tipo_conflito', tipoConflitoFilter);
        }
        if (statusFilter !== 'all') {
            params.set('status', statusFilter);
        }
        if (espacoFilter !== 'all') {
            params.set('espaco_id', espacoFilter);
        }
        if (dataInicioFilter) {
            params.set('data_inicio', dataInicioFilter);
        }
        if (dataFimFilter) {
            params.set('data_fim', dataFimFilter);
        }
        if (solicitanteFilter.trim()) {
            params.set('solicitante', solicitanteFilter);
        }
        if (nomeAgendamentoFilter.trim()) {
            params.set('nome_agendamento', nomeAgendamentoFilter);
        }
        
        const queryString = params.toString();
        return `/gerenciar-agendamentos${queryString ? `?${queryString}` : ''}`;
    };

    const formatDate = (dateString: string) => {
        try {
            // Se a data está no formato ISO (com T), extrair apenas a parte da data
            const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
            const [year, month, day] = dateOnly.split('-');
            return `${day}/${month}/${year}`;
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        try {
            // Se o tempo tem segundos ou milissegundos, extrair apenas HH:mm
            const timeParts = timeString.split(':');
            return `${timeParts[0]}:${timeParts[1]}`;
        } catch {
            return timeString;
        }
    };

    const formatPeriod = (agendamento: Agendamento) => {
        const dataInicioFormatada = formatDate(agendamento.data_inicio);
        const dataFimFormatada = formatDate(agendamento.data_fim);
        const horaInicioFormatada = formatTime(agendamento.hora_inicio);
        const horaFimFormatada = formatTime(agendamento.hora_fim);
        
        // Se é o mesmo dia
        if (agendamento.data_inicio === agendamento.data_fim || 
            (agendamento.data_inicio.includes('T') && agendamento.data_fim.includes('T') && 
             agendamento.data_inicio.split('T')[0] === agendamento.data_fim.split('T')[0])) {
            return `${dataInicioFormatada} das ${horaInicioFormatada} às ${horaFimFormatada}`;
        }
        
        // Se são dias diferentes
        return `${dataInicioFormatada} às ${horaInicioFormatada} até ${dataFimFormatada} às ${horaFimFormatada}`;
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gerenciar Agendamentos" />

            <div className="space-y-6">
                <div className="flex items-center justify-between mt-6 mx-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gerenciar Agendamentos</h1>
                    </div>

                    <Button
                        asChild
                        variant="outline"
                        className="bg-sidebar 
                                    hover:bg-gray-100 
                                    hover:border-gray-300 
                                    hover:text-gray-800 
                                    dark:hover:bg-gray-800/40 
                                    dark:hover:border-gray-600 
                                    dark:hover:text-gray-100"
                    >
                        <Link href="/avaliar-agendamentos">
                            <Eye className="h-4 w-4 mr-2" />
                            Avaliar Agendamentos
                        </Link>
                    </Button>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-orange-100/60 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800 group"
                        onClick={() => {
                            // Apenas alterar o filtro local sem recarregar a página
                            setTipoConflitoFilter('com_conflito');
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conflitos Pendentes</CardTitle>
                            <AlertTriangle 
                                className={`h-4 w-4 text-orange-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-orange-500 ${
                                    estatisticas.conflitos_pendentes > 0 
                                        ? 'animate-pulse duration-[1s] scale-110 drop-shadow-lg' 
                                        : ''
                                }`} 
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{totalConflitosFixo}</div>
                            <p className="text-xs text-muted-foreground">
                                Grupos de conflito para resolver
                            </p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-orange-100/60 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800 group"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Agendamentos em Conflito</CardTitle>
                            <Zap className="h-4 w-4 text-orange-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{totalAgendamentosConflitantesFixo}</div>
                            <p className="text-xs text-muted-foreground">
                                Total de agendamentos conflitantes
                            </p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-green-100/60 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 group"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{totalConflitosResolvidosFixo}</div>
                            <p className="text-xs text-muted-foreground">
                                Conflitos resolvidos hoje
                            </p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 group"
                        onClick={() => {
                            // Apenas alterar o filtro local sem recarregar a página
                            setTipoConflitoFilter('sem_conflito');
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sem Conflito</CardTitle>
                            <CheckCircle className="h-4 w-4 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{totalSemConflitoFixo}</div>
                            <p className="text-xs text-muted-foreground">
                                Agendamentos sem conflito
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
                                        value={nomeAgendamentoFilter}
                                        onChange={(e) => setNomeAgendamentoFilter(e.target.value)}
                                        className="pl-8 pr-10"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={toggleNomeSort}
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                                            >
                                                {getNomeSortIcon()}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ordenar por nome {nomeSortOrder === 'none' ? 'crescente' : nomeSortOrder === 'asc' ? 'decrescente' : 'padrão'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="min-w-[120px]">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => setStatusFilter(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="tipo_conflito">Tipo</Label>
                                <Select
                                    value={tipoConflitoFilter}
                                    onValueChange={(value) => setTipoConflitoFilter(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="com_conflito">Com Conflito</SelectItem>
                                        <SelectItem value="sem_conflito">Sem Conflito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="espaco">Espaço</Label>
                                <Select
                                    value={espacoFilter}
                                    onValueChange={(value) => setEspacoFilter(value)}
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
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por solicitante..."
                                        value={solicitanteFilter}
                                        onChange={(e) => setSolicitanteFilter(e.target.value)}
                                        className="pl-8 pr-10"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={toggleSolicitanteSort}
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                                            >
                                                {getSolicitanteSortIcon()}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ordenar por solicitante {solicitanteSortOrder === 'none' ? 'crescente' : solicitanteSortOrder === 'asc' ? 'decrescente' : 'padrão'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_inicio">Data Início</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={dataInicioFilter}
                                        onChange={(e) => setDataInicioFilter(e.target.value)}
                                        className="pr-10"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={toggleDataInicioSort}
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted pointer-events-auto z-10"
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                {getDataInicioSortIcon()}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ordenar por data início {dataInicioSortOrder === 'none' ? 'crescente' : dataInicioSortOrder === 'asc' ? 'decrescente' : 'padrão'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_fim">Data Fim</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={dataFimFilter}
                                        onChange={(e) => setDataFimFilter(e.target.value)}
                                        className="pr-10"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={toggleDataFimSort}
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted pointer-events-auto z-10"
                                                onMouseDown={(e) => e.preventDefault()}
                                            >
                                                {getDataFimSortIcon()}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ordenar por data fim {dataFimSortOrder === 'none' ? 'crescente' : dataFimSortOrder === 'asc' ? 'decrescente' : 'padrão'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Botão Limpar Filtros - só aparece quando há filtros ativos */}
                            {(nomeAgendamentoFilter || solicitanteFilter || espacoFilter !== 'all' || 
                              statusFilter !== 'all' || tipoConflitoFilter !== 'com_conflito' || dataInicioFilter || dataFimFilter || 
                              nomeSortOrder !== 'none' || solicitanteSortOrder !== 'none' || 
                              dataInicioSortOrder !== 'none' || dataFimSortOrder !== 'none') && (
                                <div className="flex flex-col">
                                    <Label className="mb-2 opacity-0">Ações</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    // Limpar todos os filtros locais
                                                    setNomeAgendamentoFilter('');
                                                    setSolicitanteFilter('');
                                                    setStatusFilter('all');
                                                    setTipoConflitoFilter('com_conflito');
                                                    setEspacoFilter('all');
                                                    setDataInicioFilter('');
                                                    setDataFimFilter('');
                                                    setNomeSortOrder('none');
                                                    setSolicitanteSortOrder('none');
                                                    setDataInicioSortOrder('none');
                                                    setDataFimSortOrder('none');
                                                }}
                                                className="h-10 w-10 p-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Limpar filtros</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Grupos de Conflito */}
                {filteredGruposConflito.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-orange-600 animate-pulse" />
                                <h2 className="text-2xl font-bold text-orange-600">Conflitos Pendentes</h2>
                            </div>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                                {filteredGruposConflito.reduce((total, grupo) => total + grupo.agendamentos.length, 0)} agendamentos
                            </Badge>
                        </div>

                        <div className="grid gap-6">
                            {filteredGruposConflito.map((grupo) => {
                                // Gerar cores únicas para cada agendamento no grupo - com suporte ao tema escuro
                                const eventColors = [
                                    'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/10 dark:border-l-orange-400',
                                    'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10 dark:border-l-blue-400', 
                                    'border-l-green-500 bg-green-50/50 dark:bg-green-950/10 dark:border-l-green-400',
                                    'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10 dark:border-l-yellow-400',
                                    'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/10 dark:border-l-purple-400',
                                    'border-l-pink-500 bg-pink-50/50 dark:bg-pink-950/10 dark:border-l-pink-400',
                                    'border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10 dark:border-l-indigo-400',
                                    'border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/10 dark:border-l-teal-400'
                                ];

                                return (
                                    <Card key={grupo.grupo_conflito} className="shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-700">
                                        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                                                            <Building className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl flex items-center gap-2">
                                                            <span className="text-orange-700 dark:text-orange-400">Conflito:</span>
                                                            <span className="text-gray-900 dark:text-gray-100">{grupo.espaco.nome}</span>
                                                        </CardTitle>
                                                        <CardDescription className="text-base mt-1 flex items-center gap-4">
                                                            <span className="flex items-center gap-1">
                                                                <Zap className="h-4 w-4 text-orange-500" />
                                                                {grupo.agendamentos.length} eventos conflitantes
                                                            </span>
                                                            {grupo.espaco.localizacao && (
                                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {grupo.espaco.localizacao.nome}
                                                                </span>
                                                            )}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setResolverDialog({
                                                                    open: true,
                                                                    grupoConflito: grupo,
                                                                    agendamentoSelecionado: null
                                                                })}
                                                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Resolver
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Resolver conflito selecionando um agendamento para aprovar</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => setRejeitarTodosDialog({
                                                                    open: true,
                                                                    grupoConflito: grupo
                                                                })}
                                                                className="bg-orange-600 hover:bg-orange-700 border-orange-600 hover:border-orange-700"
                                                            >
                                                                <X className="h-4 w-4 mr-2" />
                                                                Rejeitar Todos
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Rejeitar todos os agendamentos deste conflito</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="relative">
                                                <div className="space-y-3 p-4">
                                                    {grupo.agendamentos.map((agendamento, index) => (
                                                        <div 
                                                            key={agendamento.id} 
                                                            className={`
                                                                relative border-l-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-md
                                                                ${getEventBorderColor(agendamento)} bg-white dark:bg-gray-900/50
                                                                border border-gray-200 dark:border-gray-700 shadow-sm
                                                            `}
                                                        >
                                                            <div className="p-6">
                                                                {/* Cabeçalho do agendamento */}
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                                                {agendamento.titulo}
                                                                            </h4>
                                                                            
                                                                            <StatusBadge status={agendamento.status} />
                                                                            
                                                                            {index === 0 && (
                                                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
                                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                                    Primeiro solicitado
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {/* Grid de informações */}
                                                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
                                                                            {/* Coluna 1: Solicitante */}
                                                                            <div className="space-y-3">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                                                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                                            Solicitante
                                                                                        </p>
                                                                                        <div className="flex items-center gap-2">
                                                                                            {agendamento.user && <UserAvatar user={agendamento.user} size="sm" />}
                                                                                            <div>
                                                                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                                                                    {agendamento.user?.name || 'Usuário não encontrado'}
                                                                                                </p>
                                                                                                {agendamento.user?.email && (
                                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                        {agendamento.user.email}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        {agendamento.user?.perfil_acesso && (
                                                                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mt-2 ${getPerfilColor(agendamento.user.perfil_acesso)}`}>
                                                                                                {formatPerfil(agendamento.user.perfil_acesso)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Coluna 2: Data e Horário */}
                                                                            <div className="space-y-3">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                                                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                                            Período Conflitante
                                                                                        </p>
                                                                                        <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
                                                                                            {formatPeriod(agendamento)}
                                                                                        </p>
                                                                                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-600 dark:text-orange-400">
                                                                                            <AlertCircle className="h-3 w-3" />
                                                                                            <span>Horário em conflito</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            {/* Coluna 3: Justificativa */}
                                                                            <div className="space-y-3">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                                                        <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                                            Justificativa
                                                                                        </p>
                                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                                                                                            {agendamento.justificativa}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Botão de ação */}
                                                                    <div className="flex-shrink-0 ml-4">
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button 
                                                                                    variant="outline" 
                                                                                    size="sm" 
                                                                                    asChild 
                                                                                    className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-200"
                                                                                >
                                                                                    <Link href={`/agendamentos/${agendamento.id}?return_url=${encodeURIComponent(generateReturnUrl())}`}>
                                                                                        <Eye className="h-4 w-4" />
                                                                                    </Link>
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Visualizar detalhes completos do agendamento</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Linha temporal do conflito */}
                                                                {grupo.agendamentos.length > 1 && (
                                                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                                                                            <span>
                                                                                Este evento conflita com {grupo.agendamentos.length - 1} outro{grupo.agendamentos.length - 1 !== 1 ? 's' : ''} agendamento{grupo.agendamentos.length - 1 !== 1 ? 's' : ''} no mesmo período
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Agendamentos sem conflito - só mostra quando filtro for especificamente 'sem_conflito' */}
                {tipoConflitoFilter === 'sem_conflito' && currentItemsSemConflito.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h2 className="text-xl font-semibold">Agendamentos sem Conflito</h2>
                            <Badge variant="secondary" className="ml-2">
                                {totalItemsSemConflito} agendamento{totalItemsSemConflito !== 1 ? 's' : ''} 
                                {totalPagesSemConflito > 1 && (
                                    <span className="text-muted-foreground"> (Página {currentPageSemConflito} de {totalPagesSemConflito})</span>
                                )}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {currentItemsSemConflito.map((agendamento) => (
                                <Card key={agendamento.id} className={`border-l-4 ${getEventBorderColor(agendamento)} cursor-pointer shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-200 group mx-4`}>
                                    <CardContent className="py-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-semibold text-lg">{agendamento.titulo}</h3>
                                                    <StatusBadge status={agendamento.status} />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{agendamento.espaco?.nome || 'Espaço não encontrado'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        <div className="flex items-center gap-2">
                                                            {agendamento.user && <UserAvatar user={agendamento.user} size="sm" />}
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
                                                        <span>{formatPeriod(agendamento)}</span>
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
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-200">
                                                            <Link href={`/agendamentos/${agendamento.id}?return_url=${encodeURIComponent(generateReturnUrl())}`}>
                                                                <Eye className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Visualizar</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Paginação para agendamentos sem conflito */}
                        {totalPagesSemConflito > 1 && (
                            <div className="flex justify-center">
                                <div className="flex gap-2">
                                    {paginationLinksSemConflito.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={link.disabled}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!link.disabled) {
                                                    setCurrentPageSemConflito(link.page);
                                                }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contador de registros */}
                        <div className="flex justify-between items-center -mt-4">
                            <p className="text-sm text-muted-foreground ml-2">
                                &nbsp;Mostrando {currentItemsSemConflito.length} de {totalItemsSemConflito} agendamentos
                            </p>
                        </div>
                    </div>
                )}

                {/* Mensagem quando não há dados para mostrar */}
                {filteredGruposConflito.length === 0 && 
                 (tipoConflitoFilter === 'sem_conflito' ? totalItemsSemConflito === 0 : true) && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="rounded-full bg-muted p-3">
                                    <Search className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Nenhum agendamento encontrado</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        {(nomeAgendamentoFilter || solicitanteFilter || espacoFilter !== 'all' || 
                                          statusFilter !== 'all' || tipoConflitoFilter !== 'com_conflito' || dataInicioFilter || dataFimFilter)
                                            ? 'Tente ajustar os filtros para encontrar os agendamentos que você está procurando.'
                                            : 'Não há agendamentos disponíveis no momento.'
                                        }
                                    </p>
                                </div>
                                {(nomeAgendamentoFilter || solicitanteFilter || espacoFilter !== 'all' || 
                                  statusFilter !== 'all' || tipoConflitoFilter !== 'com_conflito' || dataInicioFilter || dataFimFilter) && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            // Limpar todos os filtros locais
                                            setNomeAgendamentoFilter('');
                                            setSolicitanteFilter('');
                                            setStatusFilter('all');
                                            setTipoConflitoFilter('com_conflito');
                                            setEspacoFilter('all');
                                            setDataInicioFilter('');
                                            setDataFimFilter('');
                                            setNomeSortOrder('none');
                                            setSolicitanteSortOrder('none');
                                            setDataInicioSortOrder('none');
                                            setDataFimSortOrder('none');
                                        }}
                                        className="mt-4"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Limpar Filtros
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Dialog para resolver conflito */}
            <Dialog open={resolverDialog.open} onOpenChange={(open) => {
                if (!open) {
                    setResolverDialog({ open: false, grupoConflito: null, agendamentoSelecionado: null });
                    setMotivoRejeicao('');
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Resolver Conflito de Horário</DialogTitle>
                        <DialogDescription>
                            Selecione qual agendamento deve ser aprovado. Os demais serão rejeitados automaticamente.
                        </DialogDescription>
                    </DialogHeader>

                    {resolverDialog.grupoConflito && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {resolverDialog.grupoConflito.agendamentos.map((agendamento) => (
                                    <div 
                                        key={agendamento.id}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                            resolverDialog.agendamentoSelecionado === agendamento.id
                                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                                : 'border-border hover:bg-muted/50'
                                        }`}
                                        onClick={() => setResolverDialog(prev => ({
                                            ...prev,
                                            agendamentoSelecionado: agendamento.id
                                        }))}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                                                resolverDialog.agendamentoSelecionado === agendamento.id
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-300'
                                            }`} />
                                            <div className="flex-1">
                                                <h4 className="font-medium mb-2">{agendamento.titulo}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            <div className="flex items-center gap-2">
                                                                {agendamento.user && <UserAvatar user={agendamento.user} size="sm" />}
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
                                                            <span>{formatPeriod(agendamento)}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground mb-1">Justificativa:</p>
                                                        <p className="text-sm">{agendamento.justificativa}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="motivo_rejeicao">
                                    Motivo da rejeição dos demais agendamentos *
                                </Label>
                                <Textarea
                                    id="motivo_rejeicao"
                                    placeholder="Informe o motivo da rejeição dos agendamentos não selecionados..."
                                    value={motivoRejeicao}
                                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setResolverDialog({ open: false, grupoConflito: null, agendamentoSelecionado: null });
                                setMotivoRejeicao('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleResolverConflito}
                            disabled={!resolverDialog.agendamentoSelecionado || !motivoRejeicao.trim()}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Resolver Conflito
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para rejeitar todos */}
            <Dialog open={rejeitarTodosDialog.open} onOpenChange={(open) => {
                if (!open) {
                    setRejeitarTodosDialog({ open: false, grupoConflito: null });
                    setMotivoRejeicao('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Todos os Agendamentos</DialogTitle>
                        <DialogDescription>
                            Todos os agendamentos conflitantes serão rejeitados. Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {rejeitarTodosDialog.grupoConflito && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    {rejeitarTodosDialog.grupoConflito.agendamentos.length} agendamentos serão rejeitados no espaço "{rejeitarTodosDialog.grupoConflito.espaco.nome}".
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="motivo_rejeicao_todos">
                                Motivo da rejeição *
                            </Label>
                            <Textarea
                                id="motivo_rejeicao_todos"
                                placeholder="Informe o motivo da rejeição de todos os agendamentos..."
                                value={motivoRejeicao}
                                onChange={(e) => setMotivoRejeicao(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejeitarTodosDialog({ open: false, grupoConflito: null });
                                setMotivoRejeicao('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejeitarTodos}
                            disabled={!motivoRejeicao.trim()}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Rejeitar Todos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}