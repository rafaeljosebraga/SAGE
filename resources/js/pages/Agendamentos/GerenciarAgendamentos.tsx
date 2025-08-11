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
    Building,
    CircleCheckBig
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

    // Estados para conflitos resolvidos hoje
    const [mostrarResolvidosHoje, setMostrarResolvidosHoje] = useState(false);
    const [conflitosResolvidosHoje, setConflitosResolvidosHoje] = useState<GrupoConflito[]>([]);
    const [carregandoResolvidos, setCarregandoResolvidos] = useState(false);

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

    // Limpar estado de resolvidos hoje quando o filtro mudar
    useEffect(() => {
        if (tipoConflitoFilter !== 'resolvidos_hoje') {
            setMostrarResolvidosHoje(false);
            setConflitosResolvidosHoje([]);
        }
    }, [tipoConflitoFilter]);

    // Função para buscar conflitos resolvidos hoje
    const buscarConflitosResolvidosHoje = async () => {
        setCarregandoResolvidos(true);
        try {
            const response = await fetch('/conflitos/resolvidos-hoje');
            if (response.ok) {
                const data = await response.json();
                setConflitosResolvidosHoje(data.grupos_resolvidos);
                setMostrarResolvidosHoje(true);
                // Resetar outros filtros para mostrar apenas os resolvidos hoje
                setTipoConflitoFilter('resolvidos_hoje');
            } else {
                toast({
                    title: 'Erro ao carregar dados',
                    description: 'Não foi possível carregar os conflitos resolvidos hoje.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Erro ao carregar dados',
                description: 'Erro de conexão ao carregar os conflitos resolvidos hoje.',
                variant: 'destructive',
            });
        } finally {
            setCarregandoResolvidos(false);
        }
    };

    // Função para voltar à visualização normal
    const voltarVisualizacaoNormal = () => {
        setMostrarResolvidosHoje(false);
        setConflitosResolvidosHoje([]);
        setTipoConflitoFilter('com_conflito');
    };





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
        if (!resolverDialog.grupoConflito || !resolverDialog.agendamentoSelecionado || !motivoRejeicao.trim() || motivoRejeicao.trim().length < 5) {
            toast({
                title: 'Dados incompletos',
                // description: 'Selecione um agendamento para aprovar e informe o motivo da rejeição dos demais (mínimo 5 caracteres).',
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

        // Se o filtro é "resolvidos_hoje", mostrar apenas os conflitos resolvidos hoje
        if (tipoConflitoFilter === 'resolvidos_hoje') {
            return conflitosResolvidosHoje;
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
        // Se o filtro de tipo é especificamente "com_conflito" ou "resolvidos_hoje", não mostrar agendamentos sem conflito
        if (tipoConflitoFilter === 'com_conflito' || tipoConflitoFilter === 'resolvidos_hoje') {
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-orange-100/60 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800 group relative overflow-hidden"
                        onClick={() => {
                            // Apenas alterar o filtro local sem recarregar a página
                            setTipoConflitoFilter('com_conflito');
                        }}
                    >
                        {/* Background decorativo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 dark:bg-orange-800/10 rounded-full -translate-y-16 translate-x-16" />
                        
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                Conflitos Pendentes
                            </CardTitle>
                            <div className="relative">
                                <AlertTriangle 
                                    className={`h-5 w-5 text-orange-600 dark:text-orange-400 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-orange-500 ${
                                        estatisticas.conflitos_pendentes > 0 
                                            ? 'animate-pulse duration-[1s] scale-110 drop-shadow-lg' 
                                            : ''
                                    }`} 
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="space-y-3">
                                {/* Número principal */}
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                        {totalConflitosFixo}
                                    </div>
                                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                        grupos
                                    </div>
                                </div>
                                
                                {/* Detalhamento */}
                                <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-orange-200/50 dark:border-orange-800/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                            <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
                                                Total de agendamentos
                                            </span>
                                        </div>
                                        <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                            {totalAgendamentosConflitantesFixo}
                                        </div>
                                    </div>
                                    <div className="mt-1 text-xs text-orange-600/80 dark:text-orange-400/80">
                                        {totalAgendamentosConflitantesFixo > 0 && (
                                            <>Média de {Math.round(totalAgendamentosConflitantesFixo / Math.max(totalConflitosFixo, 1))} agendamentos por conflito</>
                                        )}
                                    </div>
                                </div>
                                
                                                            </div>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-green-100/60 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 group relative overflow-hidden"
                        onClick={buscarConflitosResolvidosHoje}
                    >
                        {/* Background decorativo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 dark:bg-green-800/10 rounded-full -translate-y-16 translate-x-16" />
                        
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                                Resolvidos Hoje
                            </CardTitle>
                            <div className="relative">
                                <CircleCheckBig 
                                    className="h-5 w-5 text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-green-500"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="space-y-3">
                                {/* Número principal */}
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {totalConflitosResolvidosFixo}
                                    </div>
                                    <div className="text-sm font-medium text-green-700 dark:text-green-300">
                                        conflitos
                                    </div>
                                </div>
                                
                                {/* Detalhamento */}
                                <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-green-200/50 dark:border-green-800/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                            <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                                Resolvidos hoje
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-1 text-xs text-green-600/80 dark:text-green-400/80">
                                        {totalConflitosResolvidosFixo > 0 
                                            ? `Excelente trabalho! ${totalConflitosResolvidosFixo} conflito${totalConflitosResolvidosFixo !== 1 ? 's' : ''} resolvido${totalConflitosResolvidosFixo !== 1 ? 's' : ''}`
                                            : 'Nenhum conflito resolvido hoje'
                                        }
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 group relative overflow-hidden"
                        onClick={() => {
                            // Apenas alterar o filtro local sem recarregar a página
                            setTipoConflitoFilter('sem_conflito');
                        }}
                    >
                        {/* Background decorativo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-sky-50/30 dark:from-blue-950/20 dark:to-sky-950/10" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/10 rounded-full -translate-y-16 translate-x-16" />
                        
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Sem Conflito
                            </CardTitle>
                            <div className="relative">
                                <CheckCircle 
                                    className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:text-blue-500"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="space-y-3">
                                {/* Número principal */}
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {totalSemConflitoFixo}
                                    </div>
                                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        agendamentos
                                    </div>
                                </div>
                                
                                {/* Detalhamento */}
                                <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                                Status limpo
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
                                        {totalSemConflitoFixo > 0 
                                            ? `${totalSemConflitoFixo} agendamento${totalSemConflitoFixo !== 1 ? 's' : ''} sem problemas de conflito`
                                            : 'Nenhum agendamento sem conflito'
                                        }
                                    </div>
                                </div>
                            </div>
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
                                        <SelectItem value="resolvidos_hoje">Resolvidos Hoje</SelectItem>
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
                                    <Card key={grupo.grupo_conflito} className={`shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                                        tipoConflitoFilter === 'resolvidos_hoje' 
                                            ? 'bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                            : 'bg-white dark:bg-gray-900/80 dark:border-gray-700'
                                    }`}>
                                        <CardHeader className={`flex flex-col gap-1.5 px-6 ${
                                            tipoConflitoFilter === 'resolvidos_hoje'
                                                ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/50'
                                                : 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/50 min-h-[75px]'
                                        }`}>
                                            <div className={`flex items-center justify-between ${
                                                tipoConflitoFilter !== 'resolvidos_hoje' ? 'h-full' : ''
                                            }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className={`p-3 rounded-full ${
                                                            tipoConflitoFilter === 'resolvidos_hoje'
                                                                ? 'bg-green-100 dark:bg-green-900/50'
                                                                : 'bg-orange-100 dark:bg-orange-900/50'
                                                        }`}>
                                                            {tipoConflitoFilter === 'resolvidos_hoje' ? (
                                                                <CircleCheckBig className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <Building className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl flex items-center gap-2">
                                                            <span className={tipoConflitoFilter === 'resolvidos_hoje' 
                                                                ? 'text-green-700 dark:text-green-400' 
                                                                : 'text-orange-700 dark:text-orange-400'
                                                            }>
                                                                {tipoConflitoFilter === 'resolvidos_hoje' ? 'Resolvido:' : 'Conflito:'}
                                                            </span>
                                                            <span className="text-gray-900 dark:text-gray-100">{grupo.espaco.nome}</span>
                                                        </CardTitle>
                                                        <CardDescription className="text-base mt-1 flex items-center gap-4">
                                                            <span className="flex items-center gap-1">
                                                                {tipoConflitoFilter === 'resolvidos_hoje' ? (
                                                                    <CircleCheckBig className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <Zap className="h-4 w-4 text-orange-500" />
                                                                )}
                                                                {grupo.agendamentos.length} eventos {tipoConflitoFilter === 'resolvidos_hoje' ? 'resolvidos' : 'conflitantes'}
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
                                                {tipoConflitoFilter !== 'resolvidos_hoje' && (
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
                                                                    className="bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 dark:bg-green-600 dark:border-green-600 dark:text-white"
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
                                                )}
                                                {tipoConflitoFilter === 'resolvidos_hoje' && (grupo as any).resolvido_por && (
                                                    <div className="flex flex-col gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/30">
                                                        <div className="flex items-center gap-2">
                                                            <UserAvatar user={(grupo as any).resolvido_por} size="sm" />
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                                        {(grupo as any).resolvido_por.name}
                                                                    </span>
                                                                    {(grupo as any).resolvido_por.perfil_acesso && (
                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPerfilColor((grupo as any).resolvido_por.perfil_acesso)}`}>
                                                                            {formatPerfil((grupo as any).resolvido_por.perfil_acesso)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {(grupo as any).resolvido_por.email && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {(grupo as any).resolvido_por.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {(grupo as any).resolvido_em && (
                                                            <div className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                                                                Aprovado {format(new Date((grupo as any).resolvido_em), 'dd/MM/yyyy', { locale: ptBR })} às {format(new Date((grupo as any).resolvido_em), 'HH:mm', { locale: ptBR })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="relative">
                                                <div className="space-y-3 p-4">
                                                    {grupo.agendamentos.map((agendamento, index) => (
                                                        <div 
                                                            key={agendamento.id} 
                                                            className={`
                                                                relative border-l-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-md dark:hover:shadow-white/5
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
                                                                        <div className="space-y-4 text-sm">
                                                                            {/* Primeira linha: Solicitante e Data/Horário */}
                                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                                {/* Coluna 1: Solicitante */}
                                                                                <div className="space-y-3">
                                                                                    <div className="flex items-start gap-3">
                                                                                        <User className="h-4 w-4 flex-shrink-0 mt-1 text-gray-600 dark:text-gray-400" />
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                                                Solicitante
                                                                                            </p>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {agendamento.user && <UserAvatar user={agendamento.user} size="sm" />}
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                                                        {agendamento.user?.name || 'Usuário não encontrado'}
                                                                                                    </span>
                                                                                                    {agendamento.user?.email && (
                                                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                            {agendamento.user.email}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                {agendamento.user?.perfil_acesso && (
                                                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(agendamento.user.perfil_acesso)}`}>
                                                                                                        {formatPerfil(agendamento.user.perfil_acesso)}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                {/* Coluna 2: Data e Horário */}
                                                                                <div className="space-y-3">
                                                                                    <div className="flex items-start gap-3">
                                                                                        <Clock className="h-4 w-4 flex-shrink-0 mt-1 text-gray-600 dark:text-gray-400" />
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
                                                                            </div>
                                                                            
                                                                            {/* Segunda linha: Justificativa (largura completa) */}
                                                                            <div>
                                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                                                                    Justificativa:
                                                                                </p>
                                                                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                                                                                    {agendamento.justificativa}
                                                                                </p>
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


                        <div className="space-y-3">
                            {currentItemsSemConflito.map((agendamento) => (
                                <Card key={agendamento.id} className={`border-l-4 ${getEventBorderColor(agendamento)} cursor-pointer shadow-sm hover:scale-[1.01] hover:shadow-md dark:hover:shadow-white/5 transition-all duration-200 group mx-4`}>
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
                                    <h3 className="font-semibold text-lg">
                                        {tipoConflitoFilter === 'resolvidos_hoje' 
                                            ? 'Nenhum conflito resolvido hoje' 
                                            : 'Nenhum agendamento encontrado'
                                        }
                                    </h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        {tipoConflitoFilter === 'resolvidos_hoje' 
                                            ? 'Não há conflitos que foram resolvidos hoje. Quando conflitos forem resolvidos, eles aparecerão aqui.'
                                            : (nomeAgendamentoFilter || solicitanteFilter || espacoFilter !== 'all' || 
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
                <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[95vh] overflow-hidden rounded-lg flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <CircleCheckBig className="h-5 w-5 text-green-600" />
                            Resolver Conflito de Horário
                        </DialogTitle>
                    </DialogHeader>

                    {resolverDialog.grupoConflito && (
                        <div className="flex flex-col gap-2 flex-1 min-h-0">
                            {/* Área de seleção de agendamentos com scroll personalizado */}
                            <div className="flex flex-col gap-0 flex-1 min-h-0">
                                <div className="flex items-center justify-between flex-shrink-0">
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        Agendamentos em conflito ({resolverDialog.grupoConflito.agendamentos.length}):
                                    </h4>
                                    {resolverDialog.agendamentoSelecionado && (
                                        <Badge variant="outline" className="text-green-600 border-green-200">
                                            1 selecionado
                                        </Badge>
                                    )}
                                </div>
                                
                                <div className="space-y-1 overflow-y-auto max-h-[70vh] pr-2 rounded-md flex-1 min-h-0 mb-1 last:-mb-2">
                                    {resolverDialog.grupoConflito.agendamentos.map((agendamento) => {
                                        const isSelected = resolverDialog.agendamentoSelecionado === agendamento.id;
                                        const { getEventColors } = useAgendamentoColors();
                                        const colors = getEventColors(agendamento as any);
                                        
                                        return (
                                            <Card 
                                                key={agendamento.id}
                                                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                                    isSelected 
                                                        ? 'ring-2 ring-green-500 border-green-200 bg-green-50 dark:bg-green-950/20 shadow-md' 
                                                        : 'hover:bg-muted/30'
                                                } ${colors.border} border-l-4 rounded-lg overflow-hidden`}
                                                onClick={() => setResolverDialog(prev => ({
                                                    ...prev,
                                                    agendamentoSelecionado: agendamento.id
                                                }))}
                                            >
                                                <CardContent className="p-3">
                                                    <div className="flex items-start gap-3">
                                                        {/* Radio Button Personalizado */}
                                                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${
                                                            isSelected
                                                                ? 'bg-green-500 border-green-500 dark:bg-green-400 dark:border-green-400'
                                                                : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                                                        }`}>
                                                            {isSelected && (
                                                                <div className="w-2 h-2 rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-start justify-between">
                                                                <h5 className="font-medium">{agendamento.titulo}</h5>
                                                                <StatusBadge status={agendamento.status} />
                                                            </div>
                                                            
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-4 text-sm opacity-80">
                                                                    <div className="flex items-center gap-1">
                                                                        <User className="h-4 w-4" />
                                                                        <div className="flex items-center gap-2">
                                                                            {agendamento.user && <UserAvatar user={agendamento.user} size="sm" />}
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{agendamento.user?.name || 'Usuário não encontrado'}</span>
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
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm opacity-80">
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="h-4 w-4" />
                                                                        {formatPeriod(agendamento)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin className="h-4 w-4" />
                                                                        {agendamento.espaco?.nome || 'Espaço não encontrado'}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-1 text-sm">
                                                                    <span className="font-medium">Justificativa:</span>
                                                                    <p className="text-muted-foreground">{agendamento.justificativa}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Campo de motivo de rejeição - fixo na parte inferior */}
                            <div className="flex-shrink-0 space-y-4 border-t border-border pt-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <Label htmlFor="motivo_rejeicao" className="font-semibold text-foreground">
                                            Motivo da rejeição dos demais agendamentos *
                                        </Label>
                                    </div>
                                    <Textarea
                                        id="motivo_rejeicao"
                                        // placeholder="Informe detalhadamente o motivo da rejeição dos agendamentos não selecionados..."
                                        value={motivoRejeicao}
                                        onChange={(e) => setMotivoRejeicao(e.target.value)}
                                        rows={3}
                                        className="resize-none rounded-lg border-2 border-input bg-background focus:border-border focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
                                    />
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setResolverDialog({ open: false, grupoConflito: null, agendamentoSelecionado: null });
                                            setMotivoRejeicao('');
                                        }}
                                        className="flex-1 rounded-lg"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleResolverConflito}
                                        disabled={!resolverDialog.agendamentoSelecionado || !motivoRejeicao.trim() || motivoRejeicao.trim().length < 5}
                                        className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Resolver Conflito
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
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
                            <Label htmlFor="motivo_rejeicao_todos" className="font-semibold text-foreground">
                                Motivo da rejeição *
                            </Label>
                            <Textarea
                                id="motivo_rejeicao_todos"
                                placeholder="Informe o motivo da rejeição de todos os agendamentos..."
                                value={motivoRejeicao}
                                onChange={(e) => setMotivoRejeicao(e.target.value)}
                                rows={3}
                                className="resize-none rounded-lg border-2 border-input bg-background focus:border-border focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
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