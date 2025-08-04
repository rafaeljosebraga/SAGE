import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, MapPin, User, Users, Filter, Plus, Eye, Pencil, Trash2, Settings, AlertTriangle, ChevronLeft, ChevronRight, List, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, X, Building, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addHours, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
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
import { Checkbox } from '@/components/ui/checkbox';
import { useAgendamentoColors, StatusLegend, StatusBadge, isEventPast } from '@/components/ui/agend-colors';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useViewMode } from "@/contexts/ViewModeContext";
import type { PageProps, Agendamento, Espaco, BreadcrumbItem } from '@/types';

interface Props extends PageProps {
    agendamentos: Agendamento[] | {
        data: Agendamento[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
    };
    espacos: Espaco[];
    filters: {
        espaco_id?: string;
        status?: string;
        data_inicio?: string;
        data_fim?: string;
        nome?: string;
        view?: string;
    };
}

type ViewMode = 'month' | 'week' | 'day' | 'timeline' | 'list';

export default function AgendamentosIndex({ agendamentos, espacos, filters, auth }: Props) {
    // Usar o hook de cores
    const {
        getStatusColor,
        getEventBackgroundColor,
        getEventBorderColor,
        getStatusText,
        getStatusIcon
    } = useAgendamentoColors();

    // Usar o hook de toast
    const { toast } = useToast();

    // Estado inicial simples sem dependência da URL
    const getInitialState = () => {
    // Detectar se é um refresh da página (F5) - usando múltiplas abordagens para compatibilidade
    const isPageRefresh = (() => {
    // Método 1: Performance Navigation API (mais moderno)
    if (performance.navigation && performance.navigation.type === 1) {
    return true;
    }

    // Método 2: Performance Navigation (legado)
    if (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
    return true;
    }

    // Método 3: Verificar se há um timestamp muito recente no sessionStorage
    const pageLoadTime = sessionStorage.getItem('page-load-time');
    const currentTime = Date.now();
    const { viewMode, setViewMode } = useViewMode();

    if (!pageLoadTime) {
    sessionStorage.setItem('page-load-time', currentTime.toString());
    return false;
    }

    const timeDiff = currentTime - parseInt(pageLoadTime);

    // Se a diferença for muito pequena (menos de 100ms), provavelmente é um refresh
    if (timeDiff < 100) {
    return true;
    }

    // Atualizar o timestamp
    sessionStorage.setItem('page-load-time', currentTime.toString());
    return false;
    })();

    // Se for refresh, limpar localStorage e usar valores padrão
    if (isPageRefresh) {
    localStorage.removeItem('agendamentos-view-state');
    // console.log('Refresh detectado - localStorage limpo');
    }

    // Tentar recuperar o estado anterior do localStorage
    const savedState = localStorage.getItem('agendamentos-view-state');
    let savedViewState = null;

    if (savedState) {
    try {
    savedViewState = JSON.parse(savedState);
    } catch (error) {
    console.warn('Erro ao recuperar estado salvo:', error);
    }
    }

    // Determinar visualização inicial
    let initialView: ViewMode = 'day'; // padr��o
    if (filters.view === 'list') {
    initialView = 'list';
    } else if (savedViewState?.viewMode) {
    initialView = savedViewState.viewMode;
    }

    // Determinar data inicial - cada modo preserva sua própria data
    let initialDate = new Date(); // Sempre hoje por padrão
    if (savedViewState?.viewMode && savedViewState?.dates) {
    const savedModeDate = savedViewState.dates[savedViewState.viewMode];
    if (savedModeDate) {
    try {
    const savedDate = new Date(savedModeDate);
    if (!isNaN(savedDate.getTime())) {
    initialDate = savedDate;
    }
    } catch (error) {
    console.warn(`Data salva inválida para ${savedViewState.viewMode}:`, error);
    }
    }
    }

    // Espaços iniciais - todos selecionados por padrão, ou filtro específico se houver
    let initialEspacos = espacos.map(e => e.id);
    if (filters.espaco_id) {
    initialEspacos = [parseInt(filters.espaco_id)];
    } else if (savedViewState?.selectedEspacos && Array.isArray(savedViewState.selectedEspacos)) {
    // Verificar se os espaços salvos ainda existem
    const validEspacos = savedViewState.selectedEspacos.filter((id: number) =>
    espacos.some(e => e.id === id)
    );
    if (validEspacos.length > 0) {
    initialEspacos = validEspacos;
    }
    }

    return {
    view: initialView,
    date: initialDate,
    espacos: initialEspacos
    };
    };

    const initialState = getInitialState();
    const { viewMode, setViewMode } = useViewMode();
    const [currentDate, setCurrentDate] = useState(initialState.date);
    const [selectedEspacos, setSelectedEspacos] = useState<number[]>(initialState.espacos);
    const [searchEspacos, setSearchEspacos] = useState("");
    const [searchAgendamentos, setSearchAgendamentos] = useState("");
    const [nomeFilter, setNomeFilter] = useState(filters.nome || '');
    const [dataInicioFilter, setDataInicioFilter] = useState('');
    const [dataFimFilter, setDataFimFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [espacoFilter, setEspacoFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [dateSortOrder, setDateSortOrder] = useState<{
        inicio: 'asc' | 'desc' | 'none';
        fim: 'asc' | 'desc' | 'none';
    }>({ inicio: 'none', fim: 'none' });
    const [nomeSortOrder, setNomeSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [showFilters, setShowFilters] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Agendamentos', href: '/agendamentos' }
    ];

    // Estados para o modal de criação
    const [createModal, setCreateModal] = useState<{
        open: boolean;
        selectedDate?: string;
        selectedTime?: string;
        selectedEspaco?: number;
    }>({ open: false });

    const [formData, setFormData] = useState({
        titulo: '',
        espaco_id: '',
        data_inicio: '',
        hora_inicio: '',
        data_fim: '',
        hora_fim: '',
        justificativa: '',
        observacoes: '',
        recorrente: false,
        tipo_recorrencia: '',
        data_fim_recorrencia: '',
        recursos_solicitados: [] as string[]
    });

    // Estados para conflitos
    const [conflictModal, setConflictModal] = useState<{
        open: boolean;
        conflitos: Agendamento[];
        formData: any;
    }>({ open: false, conflitos: [], formData: null });

    // Estado para modal de visualização do dia
    const [dayViewModal, setDayViewModal] = useState<{
    open: boolean;
    selectedDate: Date | null;
    events: Agendamento[];
    }>({ open: false, selectedDate: null, events: [] });

    // Estado para modal de aviso de horário passado
    const [pastTimeModal, setPastTimeModal] = useState<{
    open: boolean;
    }>({ open: false });
    // Estado para modal de conflito de horário
    const [conflictTimeModal, setConflictTimeModal] = useState<{
    open: boolean;
    message: string;
    }>({ open: false, message: "" });
    // Estado para modal de confirmação de cancelamento
    const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    agendamento: Agendamento | null;
    }>({ open: false, agendamento: null });

    // Estado para modal de confirmação de exclusão permanente
    const [forceDeleteModal, setForceDeleteModal] = useState<{
    open: boolean;
    agendamento: Agendamento | null;
    }>({ open: false, agendamento: null });

    // Atualizar viewMode quando filters.view mudar
    useEffect(() => {
        if (filters.view === 'list') {
            setViewMode('list');
        }
    }, [filters.view]);

    // Salvar estado no localStorage - cada modo preserva sua própria data
    useEffect(() => {
        // Recuperar estado atual para preservar datas de outros modos
        const currentState = localStorage.getItem('agendamentos-view-state');
        let existingDates = {};

        if (currentState) {
            try {
                const parsed = JSON.parse(currentState);
                existingDates = parsed.dates || {};
            } catch (error) {
                console.warn('Erro ao recuperar estado atual:', error);
            }
        }

        // Atualizar apenas a data do modo atual
        const updatedDates = {
            ...existingDates,
            [viewMode]: currentDate.toISOString()
        };

        const stateToSave = {
            viewMode,
            selectedEspacos,
            dates: updatedDates
        };

        try {
            localStorage.setItem('agendamentos-view-state', JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Erro ao salvar estado:', error);
        }
    }, [viewMode, currentDate, selectedEspacos]);

    // Filtrar e ordenar espaços
    const filteredAndSortedEspacos = (() => {
        // Primeiro filtrar pela busca
        let filtered = espacos.filter(espaco =>
            espaco.nome.toLowerCase().includes(searchEspacos.toLowerCase()) ||
            espaco.localizacao?.nome.toLowerCase().includes(searchEspacos.toLowerCase())
        );

        // Depois ordenar
        if (sortOrder === 'asc') {
            filtered = filtered.sort((a, b) => a.nome.localeCompare(b.nome));
        } else if (sortOrder === 'desc') {
            filtered = filtered.sort((a, b) => b.nome.localeCompare(a.nome));
        }

        return filtered;
    })();

    // Função para alternar ordenação
    const toggleSort = () => {
        if (sortOrder === 'none') {
            setSortOrder('asc');
        } else if (sortOrder === 'asc') {
            setSortOrder('desc');
        } else {
            setSortOrder('none');
        }
    };

    // Função para obter ícone de ordenação
    const getSortIcon = () => {
        switch (sortOrder) {
            case 'asc':
                return <ArrowUp className="h-3 w-3  text-blue-600" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3  text-blue-600" />;
            default:
                return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
        }
    };

    // Funções para alternar ordenação de datas
    // Função para alternar ordenação de nome
    const toggleNomeSort = () => {
        if (nomeSortOrder === 'none') {
            setNomeSortOrder('asc');
            setDateSortOrder({ inicio: 'none', fim: 'none' });
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
                return <ArrowUp className="h-3 w-3  text-blue-600" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3  text-blue-600" />;
            default:
                return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
        }
    };

    const toggleDateSort = (type: 'inicio' | 'fim') => {
        setDateSortOrder(prev => {
            const currentOrder = prev[type];
            let newOrder: 'asc' | 'desc' | 'none';

            if (currentOrder === 'none') {
                newOrder = 'asc';
            } else if (currentOrder === 'asc') {
                newOrder = 'desc';
            } else {
                newOrder = 'none';
            }


            // Reset nome sort when date sort is activated
            if (newOrder !== 'none') {
                setNomeSortOrder('none');
            }
            if (type === 'inicio') {
                return {
                    inicio: newOrder,
                    fim: 'none'
                };
            } else {
                return {
                    inicio: 'none',
                    fim: newOrder
                };
            }
        });
    };

    // Função para obter ícone de ordenação de data
    const getDateSortIcon = (type: 'inicio' | 'fim') => {
        const order = dateSortOrder[type];
        switch (order) {
            case 'asc':
                return <ArrowUp className="h-3 w-3  text-blue-600" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3  text-blue-600" />;
            default:
                return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
        }
    };

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

    // Extrair dados dos agendamentos (pode ser array ou objeto paginado)
    const agendamentosData = Array.isArray(agendamentos) ? agendamentos : agendamentos.data;

    // Filtrar e ordenar agendamentos para a lista
    const filteredAndSortedAgendamentos = (() => {
        let filtered = [...agendamentosData];

        // Aplicar filtro de nome se especificado
        if (nomeFilter.trim()) {
            filtered = filtered.filter(agendamento =>
                agendamento.titulo.toLowerCase().includes(nomeFilter.toLowerCase()) ||
                agendamento.justificativa?.toLowerCase().includes(nomeFilter.toLowerCase()) ||
                agendamento.user?.name.toLowerCase().includes(nomeFilter.toLowerCase())
            );
        }

        // Aplicar filtro de espaço se especificado
        if (espacoFilter !== 'all') {
            filtered = filtered.filter(agendamento =>
                agendamento.espaco_id.toString() === espacoFilter
            );
        }

        // Aplicar filtro de status se especificado
        if (statusFilter !== 'all') {
            filtered = filtered.filter(agendamento =>
                agendamento.status === statusFilter
            );
        }

        // Aplicar filtros de data se especificados
        if (dataInicioFilter) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDataInicio = agendamento.data_inicio.split('T')[0]; // YYYY-MM-DD
                return agendamentoDataInicio >= dataInicioFilter;
            });
        }

        if (dataFimFilter) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDataFim = agendamento.data_fim.split('T')[0]; // YYYY-MM-DD
                return agendamentoDataFim <= dataFimFilter;
            });
        }

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

        // Aplicar ordenação por data se ativa
        if (dateSortOrder.inicio !== 'none') {
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

                return dateSortOrder.inicio === 'asc'
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            });
        } else if (dateSortOrder.fim !== 'none') {
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

                return dateSortOrder.fim === 'asc'
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            });
        }

        return filtered;
    })();

    // Calcular total de itens para exibição
    const totalItems = filteredAndSortedAgendamentos.length;

    // Filtrar agendamentos pelos espaços selecionados
    const filteredAgendamentos = agendamentosData.filter(agendamento =>
        selectedEspacos.includes(agendamento.espaco_id)
    );

    // Gerar horários para visualização (6h às 22h)
    const timeSlots = Array.from({ length: 17 }, (_, i) => {
        const hour = i + 6;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    // Obter período baseado no modo de visualização
    const getViewPeriod = () => {
        switch (viewMode) {
            case 'month':
                const monthStart = startOfMonth(currentDate);
                const monthEnd = endOfMonth(currentDate);
                return {
                    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
                    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
                    days: eachDayOfInterval({
                        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
                        end: endOfWeek(monthEnd, { weekStartsOn: 0 })
                    })
                };
            case 'week':
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
                return {
                    start: weekStart,
                    end: weekEnd,
                    days: eachDayOfInterval({ start: weekStart, end: weekEnd })
                };
            case 'day':
                return {
                    start: startOfDay(currentDate),
                    end: endOfDay(currentDate),
                    days: [currentDate]
                };
            default:
                return {
                    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 0 }),
                    days: eachDayOfInterval({
                        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
                        end: endOfWeek(currentDate, { weekStartsOn: 0 })
                    })
                };
        }
    };

    const { days } = getViewPeriod();

    // Obter agendamentos de um dia específico
    const getEventsForDay = (date: Date) => {
        let events = filteredAgendamentos.filter(event => {
            try {
                const eventDate = parseISO(event.data_inicio);
                return isSameDay(eventDate, date);
            } catch (error) {
                return false;
            }
        });

        // Aplicar filtros adicionais se não estivermos na visualização de lista
        if (viewMode !== 'list') {
            // Aplicar filtro de nome se especificado
            if (nomeFilter.trim()) {
                events = events.filter(event =>
                    event.titulo.toLowerCase().includes(nomeFilter.toLowerCase()) ||
                    event.justificativa?.toLowerCase().includes(nomeFilter.toLowerCase()) ||
                    event.user?.name.toLowerCase().includes(nomeFilter.toLowerCase())
                );
            }

            // Aplicar filtro de espaço se especificado
            if (espacoFilter !== 'all') {
                events = events.filter(event =>
                    event.espaco_id.toString() === espacoFilter
                );
            }

            // Aplicar filtro de status se especificado
            if (statusFilter !== 'all') {
                events = events.filter(event =>
                    event.status === statusFilter
                );
            }

            // Aplicar filtros de data se especificados
            if (dataInicioFilter) {
                events = events.filter(event => {
                    const eventDataInicio = event.data_inicio.split('T')[0]; // YYYY-MM-DD
                    return eventDataInicio >= dataInicioFilter;
                });
            }

            if (dataFimFilter) {
                events = events.filter(event => {
                    const eventDataFim = event.data_fim.split('T')[0]; // YYYY-MM-DD
                    return eventDataFim <= dataFimFilter;
                });
            }
        }

        return events;
    };

    // Obter agendamentos para um horário específico
    const getEventsForTimeSlot = (date: Date, timeSlot: string) => {
        const dayEvents = getEventsForDay(date);
        return dayEvents.filter(event => {
            const eventStart = event.hora_inicio.substring(0, 5);
            const eventEnd = event.hora_fim.substring(0, 5);
            // Extrair a hora do slot (ex: "19:00" -> 19)
            const slotHour = parseInt(timeSlot.split(":")[0]);
            const nextSlotTime = `${(slotHour + 1).toString().padStart(2, "0")}:00`;

            // Verificar se o evento começa dentro deste slot de hora
            // ou se está ativo durante este slot
            const startsInSlot = eventStart >= timeSlot && eventStart < nextSlotTime;
            const isActiveInSlot = eventStart <= timeSlot && eventEnd > timeSlot;

            return startsInSlot || isActiveInSlot;
        });
    };

    // Função para verificar se o horário está no passado
    const isTimeInPast = (date: Date, timeSlot?: string) => {
        const now = new Date();
        const selectedDateTime = new Date(date);

        if (timeSlot) {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            selectedDateTime.setHours(hours, minutes, 0, 0);
        } else {
            selectedDateTime.setHours(8, 0, 0, 0); // Horário padrão 08:00
        }

        return selectedDateTime <= now;
    };

    const handleDateSelect = (date: Date, timeSlot?: string, preserveEspaco?: boolean) => {
        const selectedDate = format(date, 'yyyy-MM-dd');
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');

        let selectedTime = timeSlot || '08:00';

        // Se a data selecionada for hoje, verificar se precisa ajustar o horário
        if (selectedDate === todayStr) {
            if (timeSlot) {
                const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                // Se o slot clicado é a hora atual, ajustar para o minuto atual + 1
                if (slotHour === currentHour) {
                    const nextMinute = new Date(now.getTime() + 60000); // Adiciona 1 minuto
                    selectedTime = format(nextMinute, 'HH:mm');
                }
                // Se o slot clicado é anterior à hora atual, mostrar aviso
                else if (slotHour < currentHour || (slotHour === currentHour && slotMinute < currentMinute)) {
                    setPastTimeModal({ open: true });
                    return;
                }
            } else {
                // Quando não há timeSlot especificado (clique no dia no modo mês)
                // Definir horário como próximo minuto se for hoje
                const nextMinute = new Date(now.getTime() + 60000); // Adiciona 1 minuto
                selectedTime = format(nextMinute, 'HH:mm');
            }
        }
        // Para datas passadas, verificar se está no passado
        else if (isTimeInPast(date, timeSlot)) {
            setPastTimeModal({ open: true });
            return;
        }

        const endTime = selectedTime ?
            `${(parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0')}:00` :
            '09:00';

        setFormData(prev => ({
            titulo: '',
            espaco_id: preserveEspaco ? prev.espaco_id : '',
            data_inicio: selectedDate,
            hora_inicio: selectedTime,
            data_fim: selectedDate,
            hora_fim: endTime,
            justificativa: '',
            observacoes: '',
            recorrente: false,
            tipo_recorrencia: '',
            data_fim_recorrencia: '',
            recursos_solicitados: []
        }));

        setCreateModal({
            open: true,
            selectedDate,
            selectedTime,
            selectedEspaco: selectedEspacos[0]
        });
    };

    const handleEventClick = (agendamento: Agendamento) => {
        router.get(`/agendamentos/${agendamento.id}`);
    };

    // Função para abrir modal de visualização do dia
    const handleDayClick = (date: Date, events: Agendamento[], espacoId?: number) => {
        if (events.length > 0) {
            // Se espacoId for fornecido, filtrar apenas eventos desse espaço
            const filteredEvents = espacoId 
                ? events.filter(event => event.espaco_id === espacoId)
                : events;
                
            setDayViewModal({
                open: true,
                selectedDate: date,
                events: filteredEvents.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
            });
        } else {
            handleDateSelect(date);
        }
    };

    const handleDelete = (agendamento: Agendamento) => {
        setDeleteModal({ open: true, agendamento });
    };

    const confirmDelete = () => {
        if (deleteModal.agendamento) {
            router.delete(`/agendamentos/${deleteModal.agendamento.id}`, {
                onSuccess: () => {
                    setDeleteModal({ open: false, agendamento: null });
                    toast({
                        title: "Agendamento cancelado com sucesso!",
                        // description: "O agendamento foi cancelado.",
                    });
                    router.reload();
                },
                onError: () => {
                    setDeleteModal({ open: false, agendamento: null });
                    toast({
                        title: "Erro ao cancelar agendamento",
                        description: "Ocorreu um erro ao tentar cancelar o agendamento. Tente novamente.",
                        variant: "destructive",
                        duration: 5000, // 5 segundos
                    });
                }
            });
        }
    };

    const handleForceDelete = (agendamento: Agendamento) => {
        setForceDeleteModal({ open: true, agendamento });
    };

    const confirmForceDelete = () => {
        if (forceDeleteModal.agendamento) {
            router.delete(`/agendamentos/${forceDeleteModal.agendamento.id}/force-delete`, {
                onSuccess: () => {
                    setForceDeleteModal({ open: false, agendamento: null });
                    toast({
                        title: "Agendamento excluído com sucesso!",
                        // description: "O agendamento foi removido do sistema.",
                        duration: 5000,
                    });
                    router.reload();
                },
                onError: () => {
                    setForceDeleteModal({ open: false, agendamento: null });
                    toast({
                        title: "Erro ao excluir agendamento",
                        description: "Ocorreu um erro ao tentar excluir o agendamento. Tente novamente.",
                        variant: "destructive",
                        duration: 5000,
                    });
                }
            });
        }
    };

    const canEdit = (agendamento: Agendamento) => {
        // Diretor geral pode editar qualquer agendamento, usuários comuns só podem editar seus próprios agendamentos pendentes
        return auth.user.perfil_acesso === 'diretor_geral' || (agendamento.user_id === auth.user.id && agendamento.status === 'pendente');
    };

    const canDelete = (agendamento: Agendamento) => {
        // Verificar se pode cancelar (agendamentos pendentes ou aprovados, mas não cancelados)
        return auth.user.perfil_acesso === 'diretor_geral' &&
               (agendamento.status === 'pendente' || agendamento.status === 'aprovado');
    };

    const canUncancel = (agendamento: Agendamento) => {
        // Verificar se pode descancelar (apenas diretor geral pode descancelar agendamentos cancelados)
        return auth.user.perfil_acesso === 'diretor_geral' &&
               agendamento.status === 'cancelado';

    };

    const canForceDelete = (agendamento: Agendamento) => {
        // Verificar se pode excluir permanentemente (apenas diretor geral pode excluir a qualquer momento)
        return auth.user.perfil_acesso === 'diretor_geral';
    };

    // Função para validar se data e hora estão no passado
    const isDateTimeInPast = (date: string, time: string) => {
        if (!date || !time) return false;

        const now = new Date();
        const selectedDateTime = new Date(`${date}T${time}:00`);

        return selectedDateTime <= now;
    };

    // Função para obter data mínima (hoje)
    const getMinDate = () => {
        const today = new Date();
        return format(today, 'yyyy-MM-dd');
    };

    // Função para obter hora mínima baseada na data selecionada
    const getMinTime = (selectedDate: string) => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');

        // Se a data selecionada for hoje, a hora mínima é a hora atual + 1 minuto
        if (selectedDate === todayStr) {
            const nextMinute = new Date(today.getTime() + 60000); // Adiciona 1 minuto
            return format(nextMinute, 'HH:mm');
        }

        // Se for uma data futura, pode começar às 00:00
        return '00:00';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const { titulo, espaco_id, justificativa, data_inicio, hora_inicio, data_fim, hora_fim } = formData;

        // Validação de campos obrigatórios
        if (!titulo || !espaco_id || !justificativa || !data_inicio || !data_fim || !hora_inicio || !hora_fim) {
            toast({
                variant: 'destructive',
                title: 'Campos obrigatórios não preenchidos',
                description: 'Por favor, preencha todos os campos obrigatórios.',
            });
            return;
        }

        // Validar se data/hora de início está no passado
        if (isDateTimeInPast(data_inicio, hora_inicio)) {
            setPastTimeModal({ open: true });
            return;
        }

        // Validar se data/hora de fim está no passado
        if (isDateTimeInPast(data_fim, hora_fim)) {
            setPastTimeModal({ open: true });
            return;
        }

        // Validar se data/hora de fim é anterior ou igual à de início
        const dataInicio = new Date(`${data_inicio}T${hora_inicio}:00`);
        const dataFim = new Date(`${data_fim}T${hora_fim}:00`);

        if (dataFim <= dataInicio) {
            toast({
                variant: 'destructive',
                title: 'Data/hora inválida',
                description: 'A data e hora de fim devem ser posteriores à data e hora de início.',
            });
            return;
        }

        router.post('/agendamentos', formData, {
            onSuccess: () => {
                setCreateModal({ open: false });
                resetForm();
            },
            onError: (errors: any) => {
                console.log('Erro recebido:', errors);

                // Verificar se há conflitos (pode vir como string ou array)
                if (errors.conflitos) {
                    // Se for uma string simples, mostrar alerta
                    if (typeof errors.conflitos === 'string') {
                        setConflictTimeModal({ open: true, message: errors.conflitos });
                    } else if (Array.isArray(errors.conflitos)) {
                        // Se for array, mostrar modal de conflitos
                        setConflictModal({
                            open: true,
                            conflitos: errors.conflitos,
                            formData: formData
                        });
                    }
                } else {
                    console.error('Erro ao criar agendamento:', errors);
                    alert('Erro ao criar agendamento. Verifique os dados informados.');
                }
            }
        });
    };

    const handleConflictSubmit = () => {
        router.post('/agendamentos', { ...conflictModal.formData, force_create: true }, {
            onSuccess: () => {
                setConflictModal({ open: false, conflitos: [], formData: null });
                setCreateModal({ open: false });
                resetForm();
            },
            onError: (errors) => {
                console.error('Erro ao criar agendamento com conflito:', errors);
                alert('Erro ao criar agendamento.');
            }
        });
    };

    const resetForm = () => {
        setFormData({
            titulo: '',
            espaco_id: '',
            data_inicio: '',
            hora_inicio: '',
            data_fim: '',
            hora_fim: '',
            justificativa: '',
            observacoes: '',
            recorrente: false,
            tipo_recorrencia: '',
            data_fim_recorrencia: '',
            recursos_solicitados: []
        });
    };

    const toggleEspaco = (espacoId: number) => {
        setSelectedEspacos(prev => {
            if (prev.includes(espacoId)) {
                return prev.filter(id => id !== espacoId);
            } else {
                return [...prev, espacoId];
            }
        });
    };

    const selectAllEspacos = () => {
        setSelectedEspacos(espacos.map(e => e.id));
    };

    const deselectAllEspacos = () => {
        setSelectedEspacos([]);
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        switch (viewMode) {
            case 'month':
                setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
                break;
            case 'week':
            case 'timeline':
                setCurrentDate(direction === 'next' ? addDays(currentDate, 7) : addDays(currentDate, -7));
                break;
            case 'day':
                setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
                break;
        }
    };

    const getViewTitle = () => {
        switch (viewMode) {
            case 'month':
                return format(currentDate, 'MMMM yyyy', { locale: ptBR });
            case 'week':
            case 'timeline':
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
                return `${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}`;
            case 'day':
                return format(currentDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR });
            default:
                return format(currentDate, 'MMMM yyyy', { locale: ptBR });
        }
    };

    // Função para gerar tooltip com informação de "já passou"
    const getEventTooltip = (event: Agendamento, includeTime: boolean = true) => {
        const baseTooltip = includeTime
            ? `${event.titulo} - ${event.espaco?.nome || 'Espaço'} - ${event.hora_inicio.substring(0, 5)} às ${event.hora_fim.substring(0, 5)} - ${getStatusText(event.status)}`
            : `${event.titulo} - ${event.espaco?.nome || 'Espaço'} - ${getStatusText(event.status)}`;

        const eventPast = isEventPast(event);
        return eventPast ? `${baseTooltip} - JÁ PASSOU` : baseTooltip;
    };

    const renderMonthView = () => (
        <div className="space-y-4">
            {/* Botão de Filtros */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center cursor-pointer gap-2 bg-white dark:bg-muted border border-border hover:bg-muted/40 dark:hover:bg-muted/60"
                    >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter ||
                        nomeSortOrder !== 'none' || dateSortOrder.inicio !== 'none' || dateSortOrder.fim !== 'none') && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            !
                        </Badge>
                    )}
                    </Button>
            </div>

            {/* Painel de Filtros Colapsável */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Opções de Filtro
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilters(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="nome_agendamento">Nome do Agendamento</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="nome_agendamento"
                                        placeholder="Buscar por nome..."
                                        value={nomeFilter}
                                        onChange={(e) => setNomeFilter(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
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

                            <div className="min-w-[120px]">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => setStatusFilter(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos os status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os status</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_inicio">Data Início</Label>
                                <Input
                                    type="date"
                                    value={dataInicioFilter}
                                    onChange={(e) => setDataInicioFilter(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_fim">Data Fim</Label>
                                <Input
                                    type="date"
                                    value={dataFimFilter}
                                    onChange={(e) => setDataFimFilter(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            {/* Botão Limpar Filtros */}
                            {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter) && (
                                <div className="flex flex-col">
                                    <Label className="mb-2 opacity-0">Ações</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setNomeFilter('');
                                                    setEspacoFilter('all');
                                                    setStatusFilter('all');
                                                    setDataInicioFilter('');
                                                    setDataFimFilter('');
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
            )}

            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="p-3 text-center font-medium text-muted-foreground bg-muted rounded-lg">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`min-h-[120px] p-2 border-2 border-border/100 hover:border-border/60 rounded-lg cursor-pointer transition-all duration-200 ${
                                isCurrentMonth
                                    ? 'bg-background hover:bg-muted/50'
                                    : 'bg-muted/30 hover:bg-muted/40'
                            } ${
                                isCurrentDay
                                    ? 'ring-2 ring-primary shadow-md border-primary/50'
                                    : 'hover:shadow-sm'
                            }`}
                            onClick={() => handleDayClick(day, dayEvents)}
                        >
                            <div className={`text-sm font-medium mb-1 ${
                                isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                            } ${isCurrentDay ? 'text-primary font-bold' : ''}`}>
                                {format(day, 'd')}
                            </div>

                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <Tooltip key={event.id}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 ${getEventBackgroundColor(event)}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEventClick(event);
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">
                                                            <span className="text-xs font-normal opacity-75">
                                                                {event.hora_inicio.substring(0, 5)}
                                                            </span>
                                                            <span className="ml-1">{event.titulo}</span>
                                                        </div>
                                                        <div className="text-xs opacity-75 truncate">{event.espaco?.nome}</div>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {getStatusIcon(event.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{getEventTooltip(event)}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-muted-foreground font-medium">
                                        +{dayEvents.length - 3} mais
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderWeekView = () => (
        <div className="space-y-4">
            {/* Botão de Filtros */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 cursor-pointer bg-white dark:bg-muted border border-border hover:bg-muted/40 dark:hover:bg-muted/60"
                    >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter) && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        !
                        </Badge>
                    )}
                    </Button>
            </div>

            {/* Painel de Filtros Colapsável */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Opções de Filtro
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilters(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="nome_agendamento">Nome do Agendamento</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="nome_agendamento"
                                        placeholder="Buscar por nome..."
                                        value={nomeFilter}
                                        onChange={(e) => setNomeFilter(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
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

                            <div className="min-w-[120px]">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => setStatusFilter(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos os status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os status</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_inicio">Data Início</Label>
                                <Input
                                    type="date"
                                    value={dataInicioFilter}
                                    onChange={(e) => setDataInicioFilter(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_fim">Data Fim</Label>
                                <Input
                                    type="date"
                                    value={dataFimFilter}
                                    onChange={(e) => setDataFimFilter(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            {/* Botão Limpar Filtros */}
                            {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter) && (
                                <div className="flex flex-col">
                                    <Label className="mb-2 opacity-0">Ações</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setNomeFilter('');
                                                    setEspacoFilter('all');
                                                    setStatusFilter('all');
                                                    setDataInicioFilter('');
                                                    setDataFimFilter('');
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
            )}

            {/* Cabeçalho dos dias */}
            <div className="grid grid-cols-8 gap-1">
                <div className="p-3 text-center font-medium text-muted-foreground"></div>
                {days.map((day) => {
                    const isCurrentDay = isToday(day);
                    return (
                        <div
                            key={day.toISOString()}
                            className={`p-3 text-center font-medium rounded-lg ${
                                isCurrentDay
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            <div className="text-sm">{format(day, 'EEE', { locale: ptBR })}</div>
                            <div className={`text-lg ${isCurrentDay ? 'font-bold' : ''}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid de horários */}
            <div className="grid grid-cols-8 gap-1 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-muted/30 scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                {timeSlots.map((timeSlot) => (
                    <React.Fragment key={timeSlot}>
                        {/* Coluna de horários */}
                        <div className="p-2 text-sm text-muted-foreground font-medium bg-muted/30 rounded-lg flex items-center justify-center">
                            {timeSlot}
                        </div>

                        {/* Colunas dos dias */}
                        {days.map((day) => {
                            const events = getEventsForTimeSlot(day, timeSlot);
                            return (
                                <div
                                    key={`${day.toISOString()}-${timeSlot}`}
                                    className="min-h-[60px] p-1 border-2 border-border/100 hover:border-border/60 rounded cursor-pointer hover:bg-muted/30 transition-all duration-200"
                                    onClick={() => handleDateSelect(day, timeSlot)}
                                >
                                    {events.slice(0, 3).map((event) => (
                                        <Tooltip key={event.id}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`text-xs p-1 rounded mb-1 cursor-pointer transition-opacity hover:opacity-80 relative ${getEventBackgroundColor(event)}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEventClick(event);
                                                    }}
                                                >
                                                    <div className="absolute top-0.5 right-0.5">
                                                        {getStatusIcon(event.status)}
                                                    </div>
                                                    <div className="font-medium truncate pr-4">{event.titulo}</div>
                                                    <div className="text-xs opacity-75 truncate">{event.espaco?.nome}</div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{getEventTooltip(event, false)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                    {events.length > 3 && (
                                        <div 
                                            className="text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDayViewModal({
                                                    open: true,
                                                    selectedDate: day,
                                                    events: events.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                                                });
                                            }}
                                        >
                                            +{events.length - 3} mais
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    const renderDayView = () => {
        const dayEvents = getEventsForDay(currentDate);

        return (
            <div className="space-y-4">
                {/* Botão de Filtros */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center cursor-pointer gap-2 bg-white dark:bg-muted border border-border hover:bg-muted/40 dark:hover:bg-muted/60"
                        >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter) && (
                            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            !
                            </Badge>
                        )}
                        </Button>
                </div>

                {/* Painel de Filtros Colapsável */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Opções de Filtro
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFilters(false)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex-1 min-w-[200px]">
                                    <Label htmlFor="nome_agendamento">Nome do Agendamento</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="nome_agendamento"
                                            placeholder="Buscar por nome..."
                                            value={nomeFilter}
                                            onChange={(e) => setNomeFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
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

                                <div className="min-w-[120px]">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value) => setStatusFilter(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os status</SelectItem>
                                            <SelectItem value="pendente">Pendente</SelectItem>
                                            <SelectItem value="aprovado">Aprovado</SelectItem>
                                            <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                            <SelectItem value="cancelado">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Botão Limpar Filtros */}
                                {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all') && (
                                    <div className="flex flex-col">
                                        <Label className="mb-2 opacity-0">Ações</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setNomeFilter('');
                                                        setEspacoFilter('all');
                                                        setStatusFilter('all');
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
                )}

                {/* Cabeçalho do dia */}
                <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold">
                        {format(currentDate, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {dayEvents.length} agendamento(s) para este dia
                    </p>
                </div>

                {/* Lista de horários */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-muted/30 scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                    {timeSlots.map((timeSlot) => {
                        const events = getEventsForTimeSlot(currentDate, timeSlot);
                        return (
                            <div
                                key={timeSlot}
                                className="flex items-start gap-4 p-3 border-2 border-border/100 hover:border-border/60 rounded-lg hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                                onClick={() => handleDateSelect(currentDate, timeSlot)}
                            >
                                <div className="w-16 text-sm font-medium text-muted-foreground">
                                    {timeSlot}
                                </div>
                                <div className="flex-1 space-y-2">
                                    {events.length === 0 ? (
                                        <div className="text-sm text-muted-foreground italic">
                                            Horário disponível
                                        </div>
                                    ) : (
                                        events.map((event) => (
                                            <Tooltip key={event.id}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={`p-3 rounded-lg cursor-pointer transition-opacity hover:opacity-80 ${getEventBackgroundColor(event)}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEventClick(event);
                                                        }}
                                                    >
                                                        <div className="font-medium">{event.titulo}</div>
                                                        <div className="text-sm opacity-75">
                                                            {event.espaco?.nome} • {event.hora_inicio} - {event.hora_fim}
                                                        </div>
                                                        <div className="text-sm opacity-75">{event.user?.name}</div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{getEventTooltip(event)}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTimelineView = () => {
        // Filtrar e ordenar espaços para timeline
        const timelineEspacos = (() => {
            // Primeiro filtrar pelos espaços selecionados
            let filtered = espacos.filter(espaco => selectedEspacos.includes(espaco.id));

            // Depois filtrar pela busca de agendamentos
            if (searchAgendamentos) {
                const espacosComAgendamentos = new Set();
                filteredAgendamentos.forEach(agendamento => {
                    if (agendamento.titulo.toLowerCase().includes(searchAgendamentos.toLowerCase()) ||
                        agendamento.justificativa?.toLowerCase().includes(searchAgendamentos.toLowerCase()) ||
                        agendamento.user?.name.toLowerCase().includes(searchAgendamentos.toLowerCase())) {
                        espacosComAgendamentos.add(agendamento.espaco_id);
                    }
                });
                filtered = filtered.filter(espaco => espacosComAgendamentos.has(espaco.id));
            }

            return filtered;
        })();

        return (
            <div className="space-y-4">
                {/* Botão de Filtros */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center cursor-pointer gap-2 bg-white dark:bg-muted border border-border hover:bg-muted/40 dark:hover:bg-muted/60"
                        >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter) && (
                            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            !
                            </Badge>
                        )}
                        </Button>
                    <div className="text-sm text-muted-foreground">
                        {timelineEspacos.length} de {espacos.filter(e => selectedEspacos.includes(e.id)).length} espaços
                    </div>
                </div>

                {/* Painel de Filtros Colapsável */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Opções de Filtro
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFilters(false)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex-1 min-w-[200px]">
                                    <Label htmlFor="buscar_agendamentos">Buscar Agendamentos</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="buscar_agendamentos"
                                            placeholder="Buscar agendamentos..."
                                            value={searchAgendamentos}
                                            onChange={(e) => setSearchAgendamentos(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-[200px]">
                                    <Label htmlFor="nome_agendamento">Nome do Agendamento</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="nome_agendamento"
                                            placeholder="Buscar por nome..."
                                            value={nomeFilter}
                                            onChange={(e) => setNomeFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
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

                                <div className="min-w-[120px]">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(value) => setStatusFilter(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os status</SelectItem>
                                            <SelectItem value="pendente">Pendente</SelectItem>
                                            <SelectItem value="aprovado">Aprovado</SelectItem>
                                            <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                            <SelectItem value="cancelado">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="min-w-[140px]">
                                    <Label htmlFor="data_inicio">Data Início</Label>
                                    <Input
                                        type="date"
                                        value={dataInicioFilter}
                                        onChange={(e) => setDataInicioFilter(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>

                                <div className="min-w-[140px]">
                                    <Label htmlFor="data_fim">Data Fim</Label>
                                    <Input
                                        type="date"
                                        value={dataFimFilter}
                                        onChange={(e) => setDataFimFilter(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>

                                {/* Botão Limpar Filtros */}
                                {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter || searchAgendamentos) && (
                                    <div className="flex flex-col">
                                        <Label className="mb-2 opacity-0">Ações</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setNomeFilter('');
                                                        setEspacoFilter('all');
                                                        setStatusFilter('all');
                                                        setDataInicioFilter('');
                                                        setDataFimFilter('');
                                                        setSearchAgendamentos('');
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
                )}

                {/* Cabeçalho com dias */}
                <div className="grid gap-1" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
                    <div className="p-3 text-center font-medium text-muted-foreground bg-muted rounded-lg">
                        Espaços
                    </div>
                    {days.map((day) => {
                        const isCurrentDay = isToday(day);
                        return (
                            <div
                                key={day.toISOString()}
                                className={`p-3 text-center font-medium rounded-lg ${
                                    isCurrentDay
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                <div className="text-sm">{format(day, "EEE", { locale: ptBR })}</div>
                                <div className={`text-lg ${isCurrentDay ? "font-bold" : ""}`}>
                                    {format(day, "d")}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Timeline por sala */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-muted/30 scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                    {timelineEspacos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                                {searchAgendamentos ? "Nenhum agendamento encontrado com o termo pesquisado" : "Nenhum espaço selecionado"}
                            </p>
                        </div>
                    ) : (
                        timelineEspacos.map((espaco) => (
                            <div key={espaco.id} className="grid gap-1 w-full"
                            style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
                                {/* Informações da sala */}
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <div className="font-medium text-sm">{espaco.nome}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Cap: {espaco.capacidade}
                                    </div>
                                    {espaco.localizacao && (
                                        <div className="text-xs text-muted-foreground">
                                            {espaco.localizacao.nome}
                                        </div>
                                    )}
                                </div>

                                {/* Dias da semana para esta sala */}
                                {days.map((day) => {
                                    const dayEvents = getEventsForDay(day).filter(event => event.espaco_id === espaco.id);
                                    return (
                                        <div
                                            key={`${espaco.id}-${day.toISOString()}`}
                                            className="h-[160px] w-full p-2 border-2 border-border/100 hover:border-border/60 rounded cursor-pointer hover:bg-muted/30 transition-all duration-200 overflow-hidden"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, espaco_id: espaco.id.toString() }));
                                                handleDateSelect(day, undefined, true);
                                            }}
                                            >
                                            <div className="space-y-1 h-full pr-1">
                                                {(() => {
                                                    const dayEventsForSpace = getEventsForDay(day).filter((event) => event.espaco_id === espaco.id);
                                                    const maxEvents = 3;
                                                    const visibleEvents = dayEventsForSpace.slice(0, maxEvents);
                                                    
                                                    return (
                                                        <>
                                                            {visibleEvents.map((event) => (
                                                                <Tooltip key={event.id}>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                    className={`text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 relative ${getEventBackgroundColor(event)}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEventClick(event);
                                                                    }}
                                                                    style={{
                                                                        maxWidth: "100%",
                                                                        overflow: "hidden",
                                                                        whiteSpace: "nowrap",
                                                                        textOverflow: "ellipsis",
                                                                    }}
                                                                    >
                                                                    <div className="absolute top-0.5 right-0.5">
                                                                        {getStatusIcon(event.status)}
                                                                    </div>
                                                                    <div className="font-medium truncate pr-4">{event.titulo}</div>
                                                                    <div className="text-xs opacity-75 truncate">
                                                                        {event.hora_inicio.substring(0, 5)} - {event.hora_fim.substring(0, 5)}
                                                                    </div>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{getEventTooltip(event)}</p>
                                                                </TooltipContent>
                                                                </Tooltip>
                                                            ))}
                                                            {dayEventsForSpace.length > maxEvents && (
                                                                <div 
                                                                    className="text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDayClick(day, getEventsForDay(day), espaco.id);
                                                                    }}
                                                                >
                                                                    +{dayEventsForSpace.length - maxEvents} mais
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderListView = () => (
        <div className="space-y-6">
            {/* Botão de Filtros */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 
                                bg-white text-black hover:bg-gray-200 
                                dark:bg-muted dark:text-white dark:hover:bg-muted/70
                                cursor-pointer
                                border border-border"
                    >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter) && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        !
                        </Badge>
                    )}
                    </Button>
                <div className="text-sm text-muted-foreground">
                    {totalItems} agendamento(s) encontrado(s)
                </div>
            </div>

            {/* Painel de Filtros Colapsável */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Opções de Filtro
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilters(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="nome_agendamento">Nome do Agendamento</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="nome_agendamento"
                                        placeholder="Buscar por nome..."
                                        value={nomeFilter}
                                        onChange={(e) => setNomeFilter(e.target.value)}
                                        className="pl-10 pr-10"
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

                            <div className="min-w-[120px]">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => setStatusFilter(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos os status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os status</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="min-w-[140px]">
                                <Label htmlFor="data_inicio">Data Início</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={dataInicioFilter}
                                        onChange={(e) => setDataInicioFilter(e.target.value)}
                                        className="pr-8 text-sm"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleDateSort('inicio')}
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"
                                            >
                                                {getDateSortIcon('inicio')}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ordenar por data de início {dateSortOrder.inicio === 'none' ? 'crescente' : dateSortOrder.inicio === 'asc' ? 'decrescente' : 'padrão'}</p>
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
                                        className="pr-8 text-sm"
                                    />
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleDateSort('fim')}
                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"
                                            >
                                                {getDateSortIcon('fim')}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ordenar por data de fim {dateSortOrder.fim === 'none' ? 'crescente' : dateSortOrder.fim === 'asc' ? 'decrescente' : 'padrão'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Botão Limpar Filtros - só aparece quando há filtros ativos */}
                            {(nomeFilter || espacoFilter !== 'all' || (statusFilter !== 'all' && statusFilter !== 'all') || dataInicioFilter || dataFimFilter ||
                              nomeSortOrder !== 'none' || dateSortOrder.inicio !== 'none' || dateSortOrder.fim !== 'none') && (
                                <div className="flex flex-col">
                                    <Label className="mb-2 opacity-0">Ações</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // Limpar todos os filtros e ordenações
                                                    setNomeFilter('');
                                                    setEspacoFilter('all');
                                                    setStatusFilter('all');
                                                    setDataInicioFilter('');
                                                    setDataFimFilter('');
                                                    setNomeSortOrder('none');
                                                    setDateSortOrder({ inicio: 'none', fim: 'none' });
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
            )}

            {/* Lista de Agendamentos */}
            <div className="space-y-4">
                {filteredAndSortedAgendamentos.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
                            <Button asChild className="mt-4">
                                <Link href="/agendamentos/criar">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Primeiro Agendamento
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    filteredAndSortedAgendamentos.map((agendamento) => (
                        <Card key={agendamento.id} className={`border-l-4 ${getEventBorderColor(agendamento)}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{agendamento.titulo}</h3>
                                            <StatusBadge status={agendamento.status} agendamento={agendamento} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span>{agendamento.espaco?.nome || 'Espaço não encontrado'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <div className="flex items-center gap-2">
                                                    {agendamento.user ? (
                                                        <>
                                                            <UserAvatar user={agendamento.user} size="sm" />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{agendamento.user.name}</span>
                                                                {agendamento.user.email && (
                                                                    <span className="text-xs text-muted-foreground">{agendamento.user.email}</span>
                                                                )}
                                                            </div>
                                                            {agendamento.user.perfil_acesso && (
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(agendamento.user.perfil_acesso)}`}>
                                                                    {formatPerfil(agendamento.user.perfil_acesso)}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span>Usuário não encontrado</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-black dark:text-white" />
                                                <span>
                                                    {(() => {
                                                        const formatDate = (dateStr: string) => {
                                                            try {
                                                                const dateOnly = dateStr.split('T')[0];
                                                                const [year, month, day] = dateOnly.split('-');
                                                                return `${day}/${month}/${year}`;
                                                            } catch {
                                                                return dateStr;
                                                            }
                                                        };

                                                        const formatTime = (timeStr: string) => {
                                                            try {
                                                                return timeStr.split(':').slice(0, 2).join(':');
                                                            } catch {
                                                                return timeStr;
                                                            }
                                                        };

                                                        const dataInicioFormatted = formatDate(agendamento.data_inicio);
                                                        const dataFimFormatted = formatDate(agendamento.data_fim);
                                                        const horaInicioFormatted = formatTime(agendamento.hora_inicio);
                                                        const horaFimFormatted = formatTime(agendamento.hora_fim);

                                                        if (agendamento.data_inicio === agendamento.data_fim) {
                                                            return `${dataInicioFormatted} das ${horaInicioFormatted} às ${horaFimFormatted}`;
                                                        } else {
                                                            return `${dataInicioFormatted} ${horaInicioFormatted} até ${dataFimFormatted} ${horaFimFormatted}`;
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-sm">{agendamento.justificativa}</p>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEventClick(agendamento)}
                                                    className="hover:border-blue-500 group"
                                                    >
                                                    <Eye className="h-4 w-4 group-hover:text-blue-500" />
                                                </Button>
                                              
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Visualizar</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        {canEdit(agendamento) && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.get(`/agendamentos/${agendamento.id}/editar`)}
                                                >
                                                <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Editar</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        )}

                                        {canForceDelete(agendamento) ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleForceDelete(agendamento)}
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Excluir</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : canDelete(agendamento) ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(agendamento)}
                                                        className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Cancelar agendamento</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : null}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {/* Contador de registros */}
                <div className="flex justify-between items-center -mt-2">
                    <p className="text-sm text-muted-foreground ml-2">
                        &nbsp;Mostrando {totalItems} registros
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agendamentos" />

            <div className="space-y-6">






                <div className="flex items-center justify-between mt-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            &nbsp;&nbsp;&nbsp;Agendamentos</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-lg">
                            <Button
                                className="cursor-pointer"
                                variant={viewMode === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('month')}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Mês
                            </Button>
                            <Button
                                className="cursor-pointer"
                                variant={viewMode === 'week' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('week')}
                            >
                                Semana
                            </Button>
                            <Button
                                className="cursor-pointer"
                                variant={viewMode === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('day')}
                            >
                                Dia
                            </Button>
                            <Button
                                className="cursor-pointer"
                                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('timeline')}
                            >
                                Timeline
                            </Button>
                            <Button
                                className="cursor-pointer"
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4 mr-2" />
                                Lista
                            </Button>
                        </div>

                        <Button className="cursor-pointer" onClick={() => setCreateModal({ open: true })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Agendamento
                        </Button>
                    </div>
                </div>

                {/* Controles e Filtros */}
                {viewMode !== 'list' ? (
                    <div className="w-full">
                        {/* Calendário */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {getViewTitle()}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                                            Hoje
                                        </Button>
                                        <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => navigateDate('next')}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {viewMode === 'month' && renderMonthView()}
                                {viewMode === 'week' && renderWeekView()}
                                {viewMode === 'day' && renderDayView()}
                                {viewMode === 'timeline' && renderTimelineView()}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    renderListView()
                )}

                {/* Modal de Criação */}
                <Dialog open={createModal.open} onOpenChange={(open) => setCreateModal({ open })}>
                    <DialogContent className="max-w-2xl max-h-[90vh] rounded-2xl flex flex-col">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle>Novo Agendamento</DialogTitle>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-1 min-h-0">
                            <form id="agendamento-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="titulo">Título *</Label>
                                    <Input
                                        id="titulo"
                                        value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        placeholder="Ex: Reunião de Planejamento"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="espaco_id">Espaço *</Label>
                                    <Select
                                        value={formData.espaco_id}
                                        onValueChange={(value) => setFormData({ ...formData, espaco_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um espaço" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {espacos.map((espaco) => (
                                                <SelectItem key={espaco.id} value={espaco.id.toString()}>
                                                    {espaco.nome} (Cap: {espaco.capacidade})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="data_inicio">Data de Início *</Label>
                                    <Input
                                        id="data_inicio"
                                        type="date"
                                        value={formData.data_inicio}
                                        onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                        min={getMinDate()}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="hora_inicio">Hora de Início *</Label>
                                    <Input
                                        id="hora_inicio"
                                        type="time"
                                        value={formData.hora_inicio}
                                        onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                        min={formData.data_inicio ? getMinTime(formData.data_inicio) : undefined}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="data_fim">Data de Fim *</Label>
                                    <Input
                                        id="data_fim"
                                        type="date"
                                        value={formData.data_fim}
                                        onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                                        min={formData.data_inicio || getMinDate()}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="hora_fim">Hora de Fim *</Label>
                                    <Input
                                        id="hora_fim"
                                        type="time"
                                        value={formData.hora_fim}
                                        onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                                        min={
                                            formData.data_fim === formData.data_inicio && formData.hora_inicio
                                                ? formData.hora_inicio
                                                : formData.data_fim ? getMinTime(formData.data_fim) : undefined
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="justificativa">Justificativa *</Label>
                                <Textarea
                                    id="justificativa"
                                    value={formData.justificativa}
                                    onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                                    placeholder="Descreva o motivo do agendamento..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="observacoes">Observações</Label>
                                <Textarea
                                    id="observacoes"
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    placeholder="Informações adicionais..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="recorrente"
                                    checked={formData.recorrente}
                                    onCheckedChange={(checked) => setFormData({ ...formData, recorrente: !!checked })}
                                />
                                <Label htmlFor="recorrente">Agendamento recorrente</Label>
                            </div>

                            {formData.recorrente && (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="tipo_recorrencia">Tipo de Recorrência *</Label>
                                        <Select
                                            value={formData.tipo_recorrencia}
                                            onValueChange={(value) => setFormData({ ...formData, tipo_recorrencia: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma opção" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="diaria">Diária (a cada dia)</SelectItem>
                                                <SelectItem value="semanal">Semanal (a cada semana)</SelectItem>
                                                <SelectItem value="mensal">Mensal (a cada mês)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="data_fim_recorrencia">Data Fim da Recorrência *</Label>
                                        <Input
                                            id="data_fim_recorrencia"
                                            type="date"
                                            value={formData.data_fim_recorrencia}
                                            onChange={(e) => setFormData({ ...formData, data_fim_recorrencia: e.target.value })}
                                            min={formData.data_fim}
                                        />
                                    </div>
                                </div>
                            )}
                            </form>
                        </div>

                        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                            <Button type="button" variant="outline" onClick={() => setCreateModal({ open: false })}>
                                Cancelar
                            </Button>
                            <Button type="submit" form="agendamento-form">
                                Solicitar Agendamento
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Conflito */}
                <Dialog open={conflictModal.open} onOpenChange={(open) => setConflictModal({ ...conflictModal, open })}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                Conflito de Horário Detectado
                            </DialogTitle>
                            <DialogDescription>
                                Existe(m) agendamento(s) conflitante(s) no horário solicitado.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Ao solicitar prioridade, seu agendamento será enviado para aprovação do diretor,
                                    que decidirá se deve sobrepor os agendamentos existentes.
                                </AlertDescription>
                            </Alert>

                            <div>
                                <h4 className="font-medium mb-2">Agendamentos Conflitantes:</h4>
                                <div className="space-y-2">
                                    {conflictModal.conflitos.map((conflito) => (
                                        <div key={conflito.id} className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20">
                                            <div className="font-medium">{conflito.titulo}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {conflito.user?.name} - {(() => { try { const dateOnly = conflito.data_inicio.split("T")[0]; const [year, month, day] = dateOnly.split("-"); return `${day}/${month}/${year}`; } catch { return conflito.data_inicio; } })()} {conflito.hora_inicio} às {conflito.hora_fim}
                                            </div>
                                            <Badge className="mt-1" variant="outline">
                                                {conflito.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setConflictModal({ open: false, conflitos: [], formData: null })}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConflictSubmit}
                            >
                                Solicitar Prioridade
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Visualização do Dia */}
                <Dialog open={dayViewModal.open} onOpenChange={(open) => setDayViewModal({ ...dayViewModal, open })}>
                    <DialogContent className="max-w-4xl max-h-[90vh] rounded-2xl flex flex-col">
                        <DialogHeader className="flex-shrink-0 pb-4">
                            <DialogTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {dayViewModal.selectedDate && format(dayViewModal.selectedDate, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                            </DialogTitle>
                            <DialogDescription>
                                {dayViewModal.events.length} agendamento(s) para este dia
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-1 min-h-0">
                            {dayViewModal.events.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum agendamento para este dia</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {dayViewModal.events.map((event) => (
                                        <div
                                            key={event.id}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${getEventBackgroundColor(event)} border-border/20`}
                                            onClick={() => {
                                                setDayViewModal({ open: false, selectedDate: null, events: [] });
                                                handleEventClick(event);
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-lg">{event.titulo}</h3>
                                                        <StatusBadge status={event.status} />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span>{event.hora_inicio.substring(0, 5)} - {event.hora_fim.substring(0, 5)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <span>{event.espaco?.nome || 'Espaço não encontrado'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span>{event.user?.name || 'Usuário não encontrado'}</span>
                                                        </div>
                                                    </div>

                                                    {event.justificativa && (
                                                        <p className="text-sm text-foreground">
                                                            <strong className="text-foreground">Justificativa:</strong> {event.justificativa}
                                                        </p>
                                                    )}

                                                    {event.observacoes && (
                                                        <p className="text-sm text-foreground">
                                                            <strong className="text-foreground">Observações:</strong> {event.observacoes}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="outline" size="sm" asChild className="hover:border-blue-500 group">
                                                                <Link href={`/agendamentos/${event.id}`}>
                                                                    <Eye className="h-4 w-4 group-hover:text-blue-500" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Visualizar</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    {/* {canEdit(event) && (
                                                    <Tooltip>
                                                    <TooltipTrigger asChild>
                                                    <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.get(`/agendamentos/${event.id}/editar`)}
                                                    >
                                                    <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                    <p>Editar</p>
                                                    </TooltipContent>
                                                    </Tooltip>
                                                    )} */}

                                                    {/* {canDelete(event) && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(event);
                                                                    }}
                                                                    className="text-orange-600 hover:text-orange-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Excluir</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )} */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setDayViewModal({ open: false, selectedDate: null, events: [] })}
                            >
                                Fechar
                            </Button>
                            <Button
                                onClick={() => {
                                    setDayViewModal({ open: false, selectedDate: null, events: [] });
                                    if (dayViewModal.selectedDate) {
                                        handleDateSelect(dayViewModal.selectedDate);
                                    }
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Agendamento
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Aviso de Horário Passado */}
                <Dialog open={pastTimeModal.open} onOpenChange={(open) => setPastTimeModal({ open })}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Horário Inválido
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-4">
                            <p className="text-center text-muted-foreground">
                                Não é possível agendar no passado. Por favor, selecione um horário futuro.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={() => setPastTimeModal({ open: false })}
                                className="w-full"
                            >
                                OK
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                {/* Modal de Conflito de Horário */}
                <Dialog open={conflictTimeModal.open} onOpenChange={(open) => setConflictTimeModal({ open, message: "" })}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                Conflito de Horário
                            </DialogTitle>
                {/* Modal de Confirmação de Cancelamento */}
                <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, agendamento: null })}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Confirmar Cancelamento
                            </DialogTitle>
                            <DialogDescription>
                                Esta ação não pode ser desfeita.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <p className="text-center text-muted-foreground">
                                Tem certeza que deseja cancelar este agendamento?
                            </p>
                            {deleteModal.agendamento && (
                                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                                    <p className="font-medium text-sm">{deleteModal.agendamento.titulo}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {deleteModal.agendamento.espaco?.nome} • {(() => { try { const dateOnly = deleteModal.agendamento.data_inicio.split("T")[0]; const [year, month, day] = dateOnly.split("-"); return `${day}/${month}/${year}`; } catch { return deleteModal.agendamento.data_inicio; } })()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteModal({ open: false, agendamento: null })}
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
                        </DialogHeader>

                        <div className="py-4">
                            <p className="text-center text-muted-foreground">
                                {conflictTimeModal.message}
                            </p>
                        </div>

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
                </Dialog>

                {/* Modal de Confirmação de Exclusão Permanente */}
                <Dialog open={forceDeleteModal.open} onOpenChange={(open) => setForceDeleteModal({ open, agendamento: null })}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-red-600" />
                                Excluir Agendamento Permanentemente
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-4">
                            <p className="text-muted-foreground mb-3">
                                <strong>ATENÇÃO:</strong> Esta ação é irreversível! Tem certeza que deseja excluir permanentemente este agendamento?
                            </p>
                            {forceDeleteModal.agendamento && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <p className="font-medium text-sm text-red-800 dark:text-red-200">{forceDeleteModal.agendamento.titulo}</p>
                                    <p className="text-xs text-red-600 dark:text-red-300">
                                        {forceDeleteModal.agendamento.espaco?.nome} • {(() => { try { const dateOnly = forceDeleteModal.agendamento.data_inicio.split("T")[0]; const [year, month, day] = dateOnly.split("-"); return `${day}/${month}/${year}`; } catch { return forceDeleteModal.agendamento.data_inicio; } })()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setForceDeleteModal({ open: false, agendamento: null })}
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

            </div>

            {/* Bloco de legenda de status */}
            <div className="w-full px-6 mt-6">
            <div className="w-full bg-white dark:bg-background p-4 rounded-xl shadow-sm border border-border text-center">
                <div className="text-base font-semibold mb-3">Legenda de Status</div>

                <div className="flex flex-wrap justify-center gap-8 items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span>Pendente</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Aprovado</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Rejeitado</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ban className="w-4 h-4 text-gray-500" />
                    <span>Cancelado</span>
                </div>
                </div>
            </div>
            </div>
        </AppLayout>
    );
}
