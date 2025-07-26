import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, MapPin, User, Filter, Plus, Eye, Edit, Trash2, Settings, AlertTriangle, ChevronLeft, ChevronRight, List, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addHours, startOfDay, endOfDay } from 'date-fns';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useAgendamentoColors, StatusLegend, StatusBadge, isEventPast } from '@/components/ui/agend-colors';
import { useToast } from '@/hooks/use-toast';

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

    // Detectar se deve iniciar no modo calendário baseado na URL
    const getInitialState = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view') || filters.view;
        const dateParam = urlParams.get('date');
        const espacosParam = urlParams.get('espacos');
        
        // Determinar visualização inicial
        const initialView: ViewMode = viewParam === 'list' ? 'list' : 
                                     viewParam === 'month' ? 'month' :
                                     viewParam === 'day' ? 'day' :
                                     viewParam === 'timeline' ? 'timeline' : 'week';
        
        // Determinar data inicial
        let initialDate = new Date();
        if (dateParam) {
            try {
                const parsedDate = new Date(dateParam);
                if (!isNaN(parsedDate.getTime())) {
                    initialDate = parsedDate;
                }
            } catch (error) {
                console.warn('Data inválida na URL:', dateParam);
            }
        }
        
        // Determinar espaços selecionados
        let initialEspacos = espacos.map(e => e.id);
        if (espacosParam) {
            try {
                const espacosIds = espacosParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
                if (espacosIds.length > 0) {
                    initialEspacos = espacosIds.filter(id => espacos.some(e => e.id === id));
                }
            } catch (error) {
                console.warn('Espaços inválidos na URL:', espacosParam);
            }
        } else if (filters.espaco_id) {
            initialEspacos = [parseInt(filters.espaco_id)];
        }
        
        return {
            view: initialView,
            date: initialDate,
            espacos: initialEspacos
        };
    };
    
    const initialState = getInitialState();
    const [viewMode, setViewMode] = useState<ViewMode>(initialState.view);
    const [currentDate, setCurrentDate] = useState(initialState.date);
    const [selectedEspacos, setSelectedEspacos] = useState<number[]>(initialState.espacos);
    const [searchEspacos, setSearchEspacos] = useState("");
    const [searchAgendamentos, setSearchAgendamentos] = useState("");
    const [nomeFilter, setNomeFilter] = useState(filters.nome || '');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    const [dateSortOrder, setDateSortOrder] = useState<{
        inicio: 'asc' | 'desc' | 'none';
        fim: 'asc' | 'desc' | 'none';
    }>({ inicio: 'none', fim: 'none' });
    const [nomeSortOrder, setNomeSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

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
        tipo_recorrencia: 'semanal',
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

    // Debounce para o filtro de nome
    useEffect(() => {
        const timer = setTimeout(() => {
            if (nomeFilter !== (filters.nome || '')) {
                router.get('/agendamentos', { 
                    ...filters, 
                    nome: nomeFilter || undefined, 
                    view: 'list' 
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true
                });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nomeFilter]);

    // Atualizar estado local quando filters.nome mudar
    useEffect(() => {
        setNomeFilter(filters.nome || '');
    }, [filters.nome]);

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
                return <ArrowUp className="h-3 w-3" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3" />;
            default:
                return <ArrowUpDown className="h-3 w-3" />;
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
                return <ArrowUp className="h-3 w-3" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3" />;
            default:
                return <ArrowUpDown className="h-3 w-3" />;
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
                return <ArrowUp className="h-3 w-3" />;
            case 'desc':
                return <ArrowDown className="h-3 w-3" />;
            default:
                return <ArrowUpDown className="h-3 w-3" />;
        }
    };

    // Extrair dados dos agendamentos (pode ser array ou objeto paginado)
    const agendamentosData = Array.isArray(agendamentos) ? agendamentos : agendamentos.data;

    // Filtrar e ordenar agendamentos para a lista
    const filteredAndSortedAgendamentos = (() => {
        let filtered = [...agendamentosData];

        // Aplicar filtros de data se especificados
        if (filters.data_inicio) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDataInicio = agendamento.data_inicio.split('T')[0]; // YYYY-MM-DD
                return agendamentoDataInicio >= filters.data_inicio!;
            });
        }

        if (filters.data_fim) {
            filtered = filtered.filter(agendamento => {
                const agendamentoDataFim = agendamento.data_fim.split('T')[0]; // YYYY-MM-DD
                return agendamentoDataFim <= filters.data_fim!;
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
        return filteredAgendamentos.filter(event => {
            try {
                const eventDate = parseISO(event.data_inicio);
                return isSameDay(eventDate, date);
            } catch (error) {
                return false;
            }
        });
    };

    // Obter agendamentos para um horário específico
    const getEventsForTimeSlot = (date: Date, timeSlot: string) => {
        const dayEvents = getEventsForDay(date);
        return dayEvents.filter(event => {
            const eventStart = event.hora_inicio.substring(0, 5);
            const eventEnd = event.hora_fim.substring(0, 5);
            return eventStart <= timeSlot && eventEnd > timeSlot;
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

    const handleDateSelect = (date: Date, timeSlot?: string) => {
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
        
        setFormData({
            titulo: '',
            espaco_id: selectedEspacos[0]?.toString() || '',
            data_inicio: selectedDate,
            hora_inicio: selectedTime,
            data_fim: selectedDate,
            hora_fim: endTime,
            justificativa: '',
            observacoes: '',
            recorrente: false,
            tipo_recorrencia: 'semanal',
            data_fim_recorrencia: '',
            recursos_solicitados: []
        });
        
        setCreateModal({ 
            open: true, 
            selectedDate, 
            selectedTime, 
            selectedEspaco: selectedEspacos[0] 
        });
    };

    const handleEventClick = (agendamento: Agendamento) => {
        // Preservar o estado atual da visualização na URL
        const currentParams = new URLSearchParams();
        currentParams.set('view', viewMode);
        currentParams.set('date', format(currentDate, 'yyyy-MM-dd'));
        
        // Adicionar filtros de espaços selecionados se não for todos
        if (selectedEspacos.length !== espacos.length) {
            currentParams.set('espacos', selectedEspacos.join(','));
        }
        
        // Preservar filtros da lista se estiver na visualização de lista
        if (viewMode === 'list') {
            if (filters.espaco_id) {
                currentParams.set('espaco_id', filters.espaco_id);
            }
            if (filters.status) {
                currentParams.set('status', filters.status);
            }
            if (filters.data_inicio) {
                currentParams.set('data_inicio', filters.data_inicio);
            }
            if (filters.data_fim) {
                currentParams.set('data_fim', filters.data_fim);
            }
            if (filters.nome) {
                currentParams.set('nome', filters.nome);
            }
        }
        
        router.get(`/agendamentos/${agendamento.id}?${currentParams.toString()}`);
    };

    // Função para abrir modal de visualização do dia
    const handleDayClick = (date: Date, events: Agendamento[]) => {
        if (events.length > 0) {
            setDayViewModal({
                open: true,
                selectedDate: date,
                events: events.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
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
        
        if (!formData.titulo || !formData.espaco_id || !formData.justificativa) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Validar se data/hora de início está no passado
        if (isDateTimeInPast(formData.data_inicio, formData.hora_inicio)) {
            setPastTimeModal({ open: true });
            return;
        }

        // Validar se data/hora de fim está no passado
        if (isDateTimeInPast(formData.data_fim, formData.hora_fim)) {
            setPastTimeModal({ open: true });
            return;
        }

        // Validar se data/hora de fim é anterior à de início
        const dataInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}:00`);
        const dataFim = new Date(`${formData.data_fim}T${formData.hora_fim}:00`);
        
        if (dataFim <= dataInicio) {
            alert('A data e hora de fim deve ser posterior à data e hora de início.');
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
            tipo_recorrencia: 'semanal',
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
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="p-3 text-center font-medium text-muted-foreground bg-muted/50 rounded-lg">
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
                                    <div
                                        key={event.id}
                                        className={`text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 ${getEventBackgroundColor(event)}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                        }}
                                        title={getEventTooltip(event)}
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
                                    : 'bg-muted/50 text-muted-foreground'
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
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className={`text-xs p-1 rounded mb-1 cursor-pointer transition-opacity hover:opacity-80 relative ${getEventBackgroundColor(event)}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }}
                                            title={getEventTooltip(event, false)}
                                        >
                                            <div className="absolute top-0.5 right-0.5">
                                                {getStatusIcon(event.status)}
                                            </div>
                                            <div className="font-medium truncate pr-4">{event.titulo}</div>
                                            <div className="text-xs opacity-75 truncate">{event.espaco?.nome}</div>
                                        </div>
                                    ))}
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
                {/* Cabeçalho do dia */}
                <div className="text-center p-4 bg-muted/50 rounded-lg">
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
                                            <div
                                                key={event.id}
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
                {/* Controles de busca e ordenação para timeline */}
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar agendamentos..."
                            value={searchAgendamentos}
                            onChange={(e) => setSearchAgendamentos(e.target.value)}
                            className="h-8 text-sm w-64"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {timelineEspacos.length} de {espacos.filter(e => selectedEspacos.includes(e.id)).length} espaços
                    </div>
                </div>

                {/* Cabeçalho com dias */}
                <div className="grid gap-1" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
                    <div className="p-3 text-center font-medium text-muted-foreground bg-muted/50 rounded-lg">
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
                                        : "bg-muted/50 text-muted-foreground"
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
                            <div key={espaco.id} className="grid gap-1" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
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
                                            className="min-h-[80px] p-2 border-2 border-border/100 hover:border-border/60 rounded cursor-pointer hover:bg-muted/30 transition-all duration-200"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, espaco_id: espaco.id.toString() }));
                                                handleDateSelect(day);
                                            }}
                                        >
                                            <div className="space-y-1">
                                                {dayEvents.map((event) => (
                                                    <div
                                                        key={event.id}
                                                        className={`text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 relative ${getEventBackgroundColor(event)}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEventClick(event);
                                                        }}
                                                        title={getEventTooltip(event)}
                                                    >
                                                        <div className="absolute top-0.5 right-0.5">
                                                            {getStatusIcon(event.status)}
                                                        </div>
                                                        <div className="font-medium truncate pr-4">{event.titulo}</div>
                                                        <div className="text-xs opacity-75">
                                                            {event.hora_inicio.substring(0, 5)} - {event.hora_fim.substring(0, 5)}
                                                        </div>
                                                    </div>
                                                ))}
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
            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="nome_agendamento">Nome do Agendamento</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <div className="relative">
                                    <Input
                                        id="nome_agendamento"
                                        placeholder="Buscar por nome..."
                                        value={nomeFilter}
                                        onChange={(e) => setNomeFilter(e.target.value)}
                                        className="pl-10 pr-10"
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
                        </div>

                        <div>
                            <Label htmlFor="espaco">Espaço</Label>
                            <Select
                                value={filters.espaco_id || 'all'}
                                onValueChange={(value) => {
                                    const espacoId = value === 'all' ? undefined : value;
                                    router.get('/agendamentos', { ...filters, espaco_id: espacoId, view: 'list' });
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
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => {
                                    const status = value === 'all' ? undefined : value;
                                    router.get('/agendamentos', { ...filters, status, view: 'list' });
                                }}
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

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="data_inicio">Início</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={filters.data_inicio || ''}
                                        onChange={(e) => {
                                            router.get('/agendamentos', { ...filters, data_inicio: e.target.value || undefined, view: 'list' });
                                        }}
                                        className="pr-8 text-sm"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => toggleDateSort('inicio')}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"
                                        title={`Ordenar por data de início ${dateSortOrder.inicio === 'none' ? 'crescente' : dateSortOrder.inicio === 'asc' ? 'decrescente' : 'padrão'}`}
                                    >
                                        {getDateSortIcon('inicio')}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <Label htmlFor="data_fim">Fim</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={filters.data_fim || ''}
                                        onChange={(e) => {
                                            router.get('/agendamentos', { ...filters, data_fim: e.target.value || undefined, view: 'list' });
                                        }}
                                        className="pr-8 text-sm"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => toggleDateSort('fim')}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"
                                        title={`Ordenar por data de fim ${dateSortOrder.fim === 'none' ? 'crescente' : dateSortOrder.fim === 'asc' ? 'decrescente' : 'padrão'}`}
                                    >
                                        {getDateSortIcon('fim')}
                                    </Button>
                                </div>
                            </div>

                            {/* Botão Limpar Filtros - só aparece quando há filtros ativos */}
                            {(filters.nome || filters.espaco_id || filters.status || filters.data_inicio || filters.data_fim || 
                              nomeSortOrder !== 'none' || dateSortOrder.inicio !== 'none' || dateSortOrder.fim !== 'none') && (
                                <div className="flex flex-col">
                                    <Label className="mb-2 opacity-0">Ações</Label>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            // Limpar todos os filtros e ordenações
                                            setNomeFilter('');
                                            setNomeSortOrder('none');
                                            setDateSortOrder({ inicio: 'none', fim: 'none' });
                                            
                                            // Redirecionar para a página sem filtros
                                            router.get('/agendamentos', { view: 'list' });
                                        }}
                                        className="flex items-center gap-2 whitespace-nowrap h-10"
                                    >
                                        <X className="h-4 w-4" />
                                        Limpar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{agendamento.titulo}</h3>
                                            <StatusBadge status={agendamento.status} agendamento={agendamento} />
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {agendamento.espaco?.nome || 'Espaço não encontrado'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                {agendamento.user?.name || 'Usuário não encontrado'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {(() => {
                                                    // Formatar período de forma mais legível
                                                    const formatDate = (dateStr: string) => {
                                                        try {
                                                            // Extrair apenas a parte da data (YYYY-MM-DD) se vier com timezone
                                                            const dateOnly = dateStr.split('T')[0];
                                                            const [year, month, day] = dateOnly.split('-');
                                                            return `${day}/${month}/${year}`;
                                                        } catch {
                                                            return dateStr;
                                                        }
                                                    };
                                                    
                                                    const formatTime = (timeStr: string) => {
                                                        try {
                                                            // Extrair apenas HH:MM se vier com segundos
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
                                            </div>
                                        </div>

                                        <p className="text-sm">{agendamento.justificativa}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEventClick(agendamento)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                        {canEdit(agendamento) && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => {
                                                    // Preservar o estado atual da visualização na URL
                                                    const currentParams = new URLSearchParams();
                                                    currentParams.set('view', viewMode);
                                                    currentParams.set('date', format(currentDate, 'yyyy-MM-dd'));
                                                    
                                                    // Adicionar filtros de espaços selecionados se não for todos
                                                    if (selectedEspacos.length !== espacos.length) {
                                                        currentParams.set('espacos', selectedEspacos.join(','));
                                                    }
                                                    
                                                    // Preservar filtros da lista se estiver na visualização de lista
                                                    if (viewMode === 'list') {
                                                        if (filters.espaco_id) {
                                                            currentParams.set('espaco_id', filters.espaco_id);
                                                        }
                                                        if (filters.status) {
                                                            currentParams.set('status', filters.status);
                                                        }
                                                        if (filters.data_inicio) {
                                                            currentParams.set('data_inicio', filters.data_inicio);
                                                        }
                                                        if (filters.data_fim) {
                                                            currentParams.set('data_fim', filters.data_fim);
                                                        }
                                                        if (filters.nome) {
                                                            currentParams.set('nome', filters.nome);
                                                        }
                                                    }
                                                    
                                                    router.get(`/agendamentos/${agendamento.id}/editar?${currentParams.toString()}`);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {canForceDelete(agendamento) ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleForceDelete(agendamento)}
                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                title="Excluir agendamento permanentemente"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : canDelete(agendamento) ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(agendamento)}
                                                className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                                                title="Cancelar agendamento"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agendamentos" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-lg">
                            <Button
                                variant={viewMode === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('month')}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Mês
                            </Button>
                            <Button
                                variant={viewMode === 'week' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('week')}
                            >
                                Semana
                            </Button>
                            <Button
                                variant={viewMode === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('day')}
                            >
                                Dia
                            </Button>
                            <Button
                                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('timeline')}
                            >
                                Timeline
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4 mr-2" />
                                Lista
                            </Button>
                        </div>

                        <Button onClick={() => setCreateModal({ open: true })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Agendamento
                        </Button>
                    </div>
                </div>

                {/* Controles e Filtros */}
                {viewMode !== 'list' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Painel de Controle */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Controles
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Filtro de Espaços */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Espaços</Label>
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={toggleSort}
                                                className="text-xs h-6 px-1 bg-muted/50 hover:bg-muted border-border/50"
                                                title={`Ordenar ${sortOrder === 'none' ? 'A-Z' : sortOrder === 'asc' ? 'Z-A' : 'padrão'}`}
                                            >
                                                {getSortIcon()}
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={selectAllEspacos}
                                                className="text-xs h-6 px-2 bg-muted/50 hover:bg-muted border-border/50"
                                            >
                                                Todos
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={deselectAllEspacos}
                                                className="text-xs h-6 px-2 bg-muted/50 hover:bg-muted border-border/50"
                                            >
                                                Nenhum
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Campo de busca */}
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar espaços..."
                                            value={searchEspacos}
                                            onChange={(e) => setSearchEspacos(e.target.value)}
                                            className="pl-10 h-8 text-sm"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-muted/30 scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                                        {filteredAndSortedEspacos.map((espaco) => (
                                            <div key={espaco.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`espaco-${espaco.id}`}
                                                    checked={selectedEspacos.includes(espaco.id)}
                                                    onCheckedChange={() => toggleEspaco(espaco.id)}
                                                />
                                                <Label 
                                                    htmlFor={`espaco-${espaco.id}`}
                                                    className="text-sm cursor-pointer flex-1"
                                                >
                                                    {espaco.nome}
                                                    <span className="text-xs text-muted-foreground block">
                                                        Cap: {espaco.capacidade} | {espaco.localizacao?.nome}
                                                    </span>
                                                </Label>
                                            </div>
                                        ))}
                                        {filteredAndSortedEspacos.length === 0 && searchEspacos && (
                                            <div className="text-sm text-muted-foreground italic text-center py-2">
                                                Nenhum espaço encontrado
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Legenda */}
                                <div>
                                    <Label>Legenda</Label>
                                    <StatusLegend className="mt-2" />
                                </div>

                            </CardContent>
                        </Card>

                        {/* Calendário */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {getViewTitle()}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                                            Hoje
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
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
                                        required
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
                                        required
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
                                        required
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
                                        required
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
                                        required
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
                                    required
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="tipo_recorrencia">Tipo de Recorrência</Label>
                                        <Select
                                            value={formData.tipo_recorrencia}
                                            onValueChange={(value) => setFormData({ ...formData, tipo_recorrencia: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="diaria">Diária</SelectItem>
                                                <SelectItem value="semanal">Semanal</SelectItem>
                                                <SelectItem value="mensal">Mensal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="data_fim_recorrencia">Fim da Recorrência</Label>
                                        <Input
                                            id="data_fim_recorrencia"
                                            type="date"
                                            value={formData.data_fim_recorrencia}
                                            onChange={(e) => setFormData({ ...formData, data_fim_recorrencia: e.target.value })}
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
                                Você pode solicitar prioridade para sobrepor os agendamentos existentes.
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
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/agendamentos/${event.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    {canEdit(event) && (
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/agendamentos/${event.id}/editar`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    {canDelete(event) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(event);
                                                            }}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
        </AppLayout>
    );
}
