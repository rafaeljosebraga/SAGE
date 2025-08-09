import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, MapPin, User, Filter, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, List, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, addMonths, subMonths, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle, Ban } from "lucide-react";
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgendamentoColors, StatusBadge, isEventPast } from '@/components/ui/agend-colors';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useViewMode } from "@/contexts/ViewModeContext";
import AgendamentosCalendar from './AgendamentosCalendar';
import AgendamentosModals from './AgendamentosModals';
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
    // Hooks básicos
    const { getStatusColor, getEventBackgroundColor, getEventBorderColor, getStatusText, getStatusIcon } = useAgendamentoColors();
    const { toast } = useToast();

    // Função para obter estado inicial
    const getInitialState = () => {
        // Verificar se é um refresh de página
        const isPageRefresh = (() => {
            // Método 1: Verificar se o performance navigation type é reload
            if (typeof window !== 'undefined' && window.performance && window.performance.navigation) {
                return window.performance.navigation.type === 1;
            }
            
            // Método 2: Verificar entries do performance
            if (typeof window !== 'undefined' && window.performance && window.performance.getEntriesByType) {
                const navEntries = window.performance.getEntriesByType('navigation') as any[];
                if (navEntries.length > 0) {
                    return navEntries[0].type === 'reload';
                }
            }
            
            // Método 3: Verificar se há um timestamp muito recente no sessionStorage
            const pageLoadTime = sessionStorage.getItem('page-load-time');
            const currentTime = Date.now();
            const { viewMode, setViewMode } = useViewMode();
            
            // Definir um novo timestamp
            sessionStorage.setItem('page-load-time', currentTime.toString());
            
            if (pageLoadTime) {
                const timeDiff = currentTime - parseInt(pageLoadTime);
                // Se menos de 100ms, é provavelmente um refresh
                if (timeDiff < 100) {
                    return true;
                }
            }
            
            sessionStorage.setItem('page-load-time', currentTime.toString());
            
            return false;
        })();
        
        // Se for refresh, limpar localStorage e usar valores padrão
        if (isPageRefresh) {
            localStorage.removeItem('agendamentos-view-state');
        }
        
        // Tentar recuperar o estado anterior do localStorage
        const savedState = localStorage.getItem('agendamentos-view-state');
        
        if (savedState && !isPageRefresh) {
            try {
                const savedViewState = JSON.parse(savedState);
                
                // Verificar se o viewMode salvo é válido
                const validViewModes = ['month', 'week', 'day', 'timeline', 'list'];
                if (savedViewState.viewMode && validViewModes.includes(savedViewState.viewMode)) {
                    // Definir o viewMode se ainda não foi definido
                    if (savedViewState.viewMode === 'list') {
                        setViewMode('list');
                    } else {
                        setViewMode(savedViewState.viewMode);
                    }
                }
                
                // Recuperar data específica do modo salvo
                let dateToUse = new Date();
                if (savedViewState.dates && savedViewState.dates[savedViewState.viewMode]) {
                    const savedModeDate = savedViewState.dates[savedViewState.viewMode];
                    try {
                        const savedDate = new Date(savedModeDate);
                        if (!isNaN(savedDate.getTime())) {
                            dateToUse = savedDate;
                        }
                    } catch (error) {
                        console.warn('Data salva inválida, usando data atual:', error);
                    }
                }
                
                // Verificar se os espaços salvos ainda existem
                let espacosToUse = espacos.map(e => e.id);
                if (savedViewState.selectedEspacos && Array.isArray(savedViewState.selectedEspacos)) {
                    const validEspacos = savedViewState.selectedEspacos.filter((id: number) =>
                        espacos.some(espaco => espaco.id === id)
                    );
                    if (validEspacos.length > 0) {
                        espacosToUse = validEspacos;
                    }
                }
                
                return {
                    date: dateToUse,
                    espacos: espacosToUse
                };
            } catch (error) {
                console.warn('Erro ao recuperar estado salvo, usando valores padrão:', error);
            }
        }
        
        return {
            date: new Date(),
            espacos: espacos.map(e => e.id)
        };
    };

    const initialState = getInitialState();
    const { viewMode, setViewMode } = useViewMode();

    // Estados principais
    const [currentDate, setCurrentDate] = useState(initialState.date);
    const [selectedEspacos, setSelectedEspacos] = useState<number[]>(initialState.espacos);
    const [searchEspacos, setSearchEspacos] = useState("");
    const [searchAgendamentos, setSearchAgendamentos] = useState("");
    const [nomeFilter, setNomeFilter] = useState(filters.nome || '');
    const [dataInicioFilter, setDataInicioFilter] = useState('');
    const [dataFimFilter, setDataFimFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [espacoFilter, setEspacoFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Estados para ordenação
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [dateSortOrder, setDateSortOrder] = useState<{
        inicio: 'asc' | 'desc' | 'none';
        fim: 'asc' | 'desc' | 'none';
    }>({ inicio: 'none', fim: 'none' });
    const [nomeSortOrder, setNomeSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

    // Estados para modais
    const [createModal, setCreateModal] = useState<{ open: boolean; selectedDate?: string; selectedTime?: string; selectedEspaco?: number; }>({ open: false });
    const [showCancelCreateConfirm, setShowCancelCreateConfirm] = useState(false);
    const [conflictModal, setConflictModal] = useState<{ open: boolean; conflitos: Agendamento[]; formData: any; }>({ open: false, conflitos: [], formData: null });
    const [dayViewModal, setDayViewModal] = useState<{ open: boolean; selectedDate: Date | null; events: Agendamento[]; }>({ open: false, selectedDate: null, events: [] });
    const [pastTimeModal, setPastTimeModal] = useState<{ open: boolean; formData?: any; }>({ open: false });
    const [conflictTimeModal, setConflictTimeModal] = useState<{ open: boolean; message: string; }>({ open: false, message: "" });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; agendamento: Agendamento | null; }>({ open: false, agendamento: null });
    const [forceDeleteModal, setForceDeleteModal] = useState<{ open: boolean; agendamento: Agendamento | null; }>({ open: false, agendamento: null });
    
    // Estado para controlar se estamos no processo de confirmação de agendamento no passado
    const [isConfirmingPastTime, setIsConfirmingPastTime] = useState(false);

    // Estado do formulário
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Agendamentos', href: '/agendamentos' }
    ];

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

    // Extrair dados dos agendamentos
    const agendamentosData = Array.isArray(agendamentos) ? agendamentos : agendamentos.data;

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

    // Função para alternar ordenação de espaços
    const toggleSort = () => {
        if (sortOrder === 'none') {
            setSortOrder('asc');
        } else if (sortOrder === 'asc') {
            setSortOrder('desc');
        } else {
            setSortOrder('none');
        }
    };

    // Função para obter ícone de ordenação de espaços
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

    // Filtrar e ordenar agendamentos (para o modo List View)
    const filteredAndSortedAgendamentos = (() => {
        let filtered = agendamentosData;
        
        // Aplicar filtros baseados no estado atual
        if (nomeFilter) {
            filtered = filtered.filter(agendamento =>
                agendamento.titulo.toLowerCase().includes(nomeFilter.toLowerCase())
            );
        }
        
        if (dataInicioFilter) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDate = new Date(agendamento.data_inicio.split('T')[0]);
                const filterDate = new Date(dataInicioFilter);
                return agendamentoDate >= filterDate;
            });
        }
        
        if (dataFimFilter) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDate = new Date(agendamento.data_fim.split('T')[0]);
                const filterDate = new Date(dataFimFilter);
                return agendamentoDate <= filterDate;
            });
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(agendamento => agendamento.status === statusFilter);
        }
        
        if (espacoFilter !== 'all') {
            filtered = filtered.filter(agendamento => agendamento.espaco_id.toString() === espacoFilter);
        }

        // Aplicar filtros de espaços selecionados
        filtered = filtered.filter(agendamento =>
            selectedEspacos.includes(agendamento.espaco_id)
        );

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

    // Função para verificar se pode descancelar
    const canUncancel = (agendamento: Agendamento) => {
        // Verificar se pode descancelar (apenas diretor geral pode descancelar agendamentos cancelados)
        return auth.user.perfil_acesso === 'diretor_geral' &&
               agendamento.status === 'cancelado';
    };

    // Função para verificar se o formulário foi alterado
    const isFormDirty = () => {
        // Se estamos confirmando agendamento no passado, não considerar como "sujo"
        if (isConfirmingPastTime) {
            return false;
        }
        
        // Verificar apenas os campos que realmente indicam que o usuário começou a preencher
        const hasTitle = formData.titulo && formData.titulo.trim() !== '';
        const hasEspaco = formData.espaco_id && formData.espaco_id !== '';
        const hasJustificativa = formData.justificativa && formData.justificativa.trim() !== '';
        const hasObservacoes = formData.observacoes && formData.observacoes.trim() !== '';
        const hasRecorrencia = formData.recorrente === true;
        const hasRecursossolicitados = formData.recursos_solicitados && formData.recursos_solicitados.length > 0;
        
        // Considerar "sujo" apenas se pelo menos um dos campos principais foi preenchido
        return hasTitle || hasEspaco || hasJustificativa || hasObservacoes || hasRecorrencia || hasRecursossolicitados;
    };

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
            if (nomeFilter.trim()) {
                events = events.filter(event =>
                    event.titulo.toLowerCase().includes(nomeFilter.toLowerCase()) ||
                    event.justificativa?.toLowerCase().includes(nomeFilter.toLowerCase()) ||
                    event.user?.name.toLowerCase().includes(nomeFilter.toLowerCase())
                );
            }

            if (espacoFilter !== 'all') {
                events = events.filter(event =>
                    event.espaco_id.toString() === espacoFilter
                );
            }

            if (statusFilter !== 'all') {
                events = events.filter(event =>
                    event.status === statusFilter
                );
            }

            if (dataInicioFilter) {
                events = events.filter(event => {
                    const eventDataInicio = event.data_inicio.split('T')[0];
                    return eventDataInicio >= dataInicioFilter;
                });
            }

            if (dataFimFilter) {
                events = events.filter(event => {
                    const eventDataFim = event.data_fim.split('T')[0];
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
            const slotHour = parseInt(timeSlot.split(":")[0]);
            const nextSlotTime = `${(slotHour + 1).toString().padStart(2, "0")}:00`;

            const startsInSlot = eventStart >= timeSlot && eventStart < nextSlotTime;
            const isActiveInSlot = eventStart <= timeSlot && eventEnd > timeSlot;

            return startsInSlot || isActiveInSlot;
        });
    };

    // Função para gerar tooltip
    const getEventTooltip = (event: Agendamento, includeTime: boolean = true) => {
        const baseTooltip = includeTime
            ? `${event.titulo} - ${event.espaco?.nome || 'Espaço'} - ${event.hora_inicio.substring(0, 5)} às ${event.hora_fim.substring(0, 5)} - ${getStatusText(event.status)}`
            : `${event.titulo} - ${event.espaco?.nome || 'Espaço'} - ${getStatusText(event.status)}`;

        const eventPast = isEventPast(event);
        return eventPast ? `${baseTooltip} - JÁ PASSOU` : baseTooltip;
    };

    // Função para verificar se o horário está no passado
    const isTimeInPast = (date: Date, timeSlot?: string) => {
        const now = new Date();
        const selectedDateTime = new Date(date);

        if (timeSlot) {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            selectedDateTime.setHours(hours, minutes, 0, 0);
        } else {
            selectedDateTime.setHours(8, 0, 0, 0);
        }

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

        if (selectedDate === todayStr) {
            const nextMinute = new Date(today.getTime() + 60000);
            return format(nextMinute, 'HH:mm');
        }

        return '00:00';
    };

    // Função para validar se data e hora estão no passado
    const isDateTimeInPast = (date: string, time: string) => {
        if (!date || !time) return false;

        const now = new Date();
        const selectedDateTime = new Date(`${date}T${time}:00`);

        return selectedDateTime <= now;
    };

    const handleDateSelect = (date: Date, timeSlot?: string, preserveEspaco?: boolean) => {
        const selectedDate = format(date, 'yyyy-MM-dd');
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');

        let selectedTime = timeSlot || '08:00';
        let isPastTime = false;

        if (selectedDate === todayStr) {
            if (timeSlot) {
                const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                if (slotHour === currentHour) {
                    const nextMinute = new Date(now.getTime() + 60000);
                    selectedTime = format(nextMinute, 'HH:mm');
                }
                else if (slotHour < currentHour || (slotHour === currentHour && slotMinute < currentMinute)) {
                    isPastTime = true;
                }
            } else {
                const nextMinute = new Date(now.getTime() + 60000);
                selectedTime = format(nextMinute, 'HH:mm');
            }
        }
        else if (isTimeInPast(date, timeSlot)) {
            isPastTime = true;
        }

        const endTime = selectedTime ?
            `${(parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0')}:00` :
            '09:00';

        const newFormData = {
            titulo: '',
            espaco_id: preserveEspaco ? formData.espaco_id : '',
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
        };

        if (isPastTime) {
            setPastTimeModal({ 
                open: true, 
                formData: {
                    ...newFormData,
                    selectedDate,
                    selectedTime,
                    selectedEspaco: selectedEspacos[0]
                }
            });
            return;
        }

        setFormData(newFormData);

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

    const handleDayClick = (date: Date, events: Agendamento[], espacoId?: number) => {
        if (events.length > 0) {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const { titulo, espaco_id, justificativa, data_inicio, hora_inicio, data_fim, hora_fim } = formData;

        if (!titulo || !espaco_id || !justificativa || !data_inicio || !data_fim || !hora_inicio || !hora_fim) {
            toast({
                variant: 'destructive',
                title: 'Campos obrigatórios não preenchidos',
                description: 'Por favor, preencha todos os campos obrigatórios.',
            });
            return;
        }

        // Verificar se é agendamento no passado apenas se não foi confirmado anteriormente
        if (isDateTimeInPast(data_inicio, hora_inicio) || isDateTimeInPast(data_fim, hora_fim)) {
            setIsConfirmingPastTime(true);
            setPastTimeModal({ 
                open: true, 
                formData: formData 
            });
            return;
        }

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
                toast({
                    title: "Agendamento criado com sucesso!",
                    description: "Seu agendamento foi enviado para análise.",
                });
            },
            onError: (errors: any) => {
                console.error('Erro completo ao criar agendamento:', errors);
                
                if (errors.conflitos) {
                    if (typeof errors.conflitos === 'string') {
                        setConflictTimeModal({ open: true, message: errors.conflitos });
                    } else if (Array.isArray(errors.conflitos)) {
                        setConflictModal({
                            open: true,
                            conflitos: errors.conflitos,
                            formData: formData
                        });
                    }
                } else {
                    // Mostrar erros de validação específicos se existirem
                    let errorMessage = 'Erro ao criar agendamento. Verifique os dados informados.';
                    
                    if (typeof errors === 'object' && errors !== null) {
                        const errorMessages = [];
                        
                        // Verificar erros de validação comuns
                        if (errors.titulo) errorMessages.push(`Título: ${Array.isArray(errors.titulo) ? errors.titulo[0] : errors.titulo}`);
                        if (errors.espaco_id) errorMessages.push(`Espaço: ${Array.isArray(errors.espaco_id) ? errors.espaco_id[0] : errors.espaco_id}`);
                        if (errors.data_inicio) errorMessages.push(`Data início: ${Array.isArray(errors.data_inicio) ? errors.data_inicio[0] : errors.data_inicio}`);
                        if (errors.hora_inicio) errorMessages.push(`Hora início: ${Array.isArray(errors.hora_inicio) ? errors.hora_inicio[0] : errors.hora_inicio}`);
                        if (errors.data_fim) errorMessages.push(`Data fim: ${Array.isArray(errors.data_fim) ? errors.data_fim[0] : errors.data_fim}`);
                        if (errors.hora_fim) errorMessages.push(`Hora fim: ${Array.isArray(errors.hora_fim) ? errors.hora_fim[0] : errors.hora_fim}`);
                        if (errors.justificativa) errorMessages.push(`Justificativa: ${Array.isArray(errors.justificativa) ? errors.justificativa[0] : errors.justificativa}`);
                        
                        if (errorMessages.length > 0) {
                            errorMessage = errorMessages.join('\n');
                        } else if (errors.message) {
                            errorMessage = errors.message;
                        }
                    }
                    
                    toast({
                        variant: 'destructive',
                        title: 'Erro ao criar agendamento',
                        description: errorMessage,
                        duration: 10000,
                    });
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

    const handlePastTimeConfirm = () => {
        if (pastTimeModal.formData) {
            const { selectedDate, selectedTime, selectedEspaco, ...formDataToSubmit } = pastTimeModal.formData;
            
            // Se veio do handleDateSelect, abrir o modal de criação
            if (selectedDate && selectedTime && selectedEspaco) {
                setFormData(formDataToSubmit);
                setCreateModal({
                    open: true,
                    selectedDate,
                    selectedTime,
                    selectedEspaco
                });
                setPastTimeModal({ open: false });
                setIsConfirmingPastTime(false);
            } else {
                // Se veio do handleSubmit, submeter diretamente
                router.post('/agendamentos', formDataToSubmit, {
                    onSuccess: () => {
                        setCreateModal({ open: false });
                        setPastTimeModal({ open: false });
                        setIsConfirmingPastTime(false);
                        resetForm();
                        toast({
                            title: "Agendamento criado com sucesso!",
                            description: "Seu agendamento foi criado mesmo sendo no passado.",
                        });
                    },
                    onError: (errors: any) => {
                        if (errors.conflitos) {
                            if (typeof errors.conflitos === 'string') {
                                setConflictTimeModal({ open: true, message: errors.conflitos });
                            } else if (Array.isArray(errors.conflitos)) {
                                setConflictModal({
                                    open: true,
                                    conflitos: errors.conflitos,
                                    formData: formDataToSubmit
                                });
                            }
                        } else {
                            console.error('Erro ao criar agendamento:', errors);
                            alert('Erro ao criar agendamento. Verifique os dados informados.');
                        }
                        setPastTimeModal({ open: false });
                        setIsConfirmingPastTime(false);
                    }
                });
            }
        }
    };

    const handlePastTimeCancel = () => {
        setPastTimeModal({ open: false });
        setIsConfirmingPastTime(false);
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
                    });
                    router.reload();
                },
                onError: () => {
                    setDeleteModal({ open: false, agendamento: null });
                    toast({
                        title: "Erro ao cancelar agendamento",
                        description: "Ocorreu um erro ao tentar cancelar o agendamento. Tente novamente.",
                        variant: "destructive",
                        duration: 5000,
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
        return auth.user.perfil_acesso === 'diretor_geral' || (agendamento.user_id === auth.user.id && agendamento.status === 'pendente');
    };

    const canDelete = (agendamento: Agendamento) => {
        return auth.user.perfil_acesso === 'diretor_geral' &&
               (agendamento.status === 'pendente' || agendamento.status === 'aprovado');
    };

    const canForceDelete = (agendamento: Agendamento) => {
        return auth.user.perfil_acesso === 'diretor_geral';
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

    // Função para formatar o perfil do usuário
    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return "Não definido";
        return perfil.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    // Função para obter as cores do perfil
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

    // Renderizar visualização de lista
    const renderListView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 dark:bg-muted dark:text-white dark:hover:bg-muted/70 cursor-pointer border border-border"
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
                <div className="text-sm text-muted-foreground">
                    {totalItems} agendamento(s) encontrado(s)
                </div>
            </div>

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

                            {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all' || dataInicioFilter || dataFimFilter ||
                              nomeSortOrder !== 'none' || dateSortOrder.inicio !== 'none' || dateSortOrder.fim !== 'none') && (
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
                                                    setNomeSortOrder('none');
                                                    setDateSortOrder({ inicio: 'none', fim: 'none' });
                                                }}
                                                className="h-10 w-10 p-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Limpar filtros e ordenações</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

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
                            &nbsp;&nbsp;&nbsp;Agendamentos
                        </h1>
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

                {viewMode !== 'list' ? (
                    <div className="w-full">
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
                                <AgendamentosCalendar
                                    viewMode={viewMode}
                                    currentDate={currentDate}
                                    days={days}
                                    timeSlots={timeSlots}
                                    filteredAgendamentos={filteredAgendamentos}
                                    espacos={espacos}
                                    selectedEspacos={selectedEspacos}
                                    showFilters={showFilters}
                                    setShowFilters={setShowFilters}
                                    nomeFilter={nomeFilter}
                                    setNomeFilter={setNomeFilter}
                                    espacoFilter={espacoFilter}
                                    setEspacoFilter={setEspacoFilter}
                                    statusFilter={statusFilter}
                                    setStatusFilter={setStatusFilter}
                                    dataInicioFilter={dataInicioFilter}
                                    setDataInicioFilter={setDataInicioFilter}
                                    dataFimFilter={dataFimFilter}
                                    setDataFimFilter={setDataFimFilter}
                                    searchAgendamentos={searchAgendamentos}
                                    setSearchAgendamentos={setSearchAgendamentos}
                                    getEventsForDay={getEventsForDay}
                                    getEventsForTimeSlot={getEventsForTimeSlot}
                                    getEventTooltip={getEventTooltip}
                                    handleDateSelect={handleDateSelect}
                                    handleDayClick={handleDayClick}
                                    handleEventClick={handleEventClick}
                                    setDayViewModal={setDayViewModal}
                                    setFormData={setFormData}
                                />
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    renderListView()
                )}

                <AgendamentosModals
                    createModal={createModal}
                    setCreateModal={setCreateModal}
                    formData={formData}
                    setFormData={setFormData}
                    isFormDirty={isFormDirty}
                    handleSubmit={handleSubmit}
                    resetForm={resetForm}
                    getMinDate={getMinDate}
                    getMinTime={getMinTime}
                    showCancelCreateConfirm={showCancelCreateConfirm}
                    setShowCancelCreateConfirm={setShowCancelCreateConfirm}
                    conflictModal={conflictModal}
                    setConflictModal={setConflictModal}
                    handleConflictSubmit={handleConflictSubmit}
                    dayViewModal={dayViewModal}
                    setDayViewModal={setDayViewModal}
                    handleEventClick={handleEventClick}
                    handleDateSelect={handleDateSelect}
                    pastTimeModal={pastTimeModal}
                    setPastTimeModal={setPastTimeModal}
                    handlePastTimeConfirm={handlePastTimeConfirm}
                    conflictTimeModal={conflictTimeModal}
                    setConflictTimeModal={setConflictTimeModal}
                    deleteModal={deleteModal}
                    setDeleteModal={setDeleteModal}
                    confirmDelete={confirmDelete}
                    forceDeleteModal={forceDeleteModal}
                    setForceDeleteModal={setForceDeleteModal}
                    confirmForceDelete={confirmForceDelete}
                    espacos={espacos}
                />

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
            </div>
        </AppLayout>
    );
}
