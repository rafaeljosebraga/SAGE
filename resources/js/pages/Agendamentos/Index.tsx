import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, MapPin, User, Filter, Plus, Eye, Edit, Trash2, Settings, AlertTriangle, ChevronLeft, ChevronRight, List, Search, ArrowUpDown, ArrowUp, ArrowDown, Clock3, CheckCircle, XCircle, Ban } from 'lucide-react';
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

import type { PageProps, Agendamento, Espaco } from '@/types';

interface Props extends PageProps {
    agendamentos: Agendamento[];
    espacos: Espaco[];
    filters: {
        espaco_id?: string;
        status?: string;
        data_inicio?: string;
        data_fim?: string;
        view?: string;
    };
}

type ViewMode = 'month' | 'week' | 'day' | 'timeline' | 'list';

export default function AgendamentosIndex({ agendamentos, espacos, filters, auth }: Props) {
    // Detectar se deve iniciar no modo calendário baseado na URL
    const initialView = filters.view === 'list' ? 'list' : 'week';
    const [viewMode, setViewMode] = useState<ViewMode>(initialView);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEspacos, setSelectedEspacos] = useState<number[]>(
        filters.espaco_id ? [parseInt(filters.espaco_id)] : espacos.map(e => e.id)
    );
    const [searchEspacos, setSearchEspacos] = useState("");
    const [searchAgendamentos, setSearchAgendamentos] = useState("");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    
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

    // Atualizar viewMode quando filters.view mudar
    useEffect(() => {
        if (filters.view === 'list') {
            setViewMode('list');
        }
    }, [filters.view]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
            case 'aprovado':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
            case 'rejeitado':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
            case 'cancelado':
                return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case 'pendente':
                return 'bg-yellow-300 dark:bg-yellow-600/80 text-yellow-900 dark:text-yellow-100';
            case 'aprovado':
                return 'bg-green-300 dark:bg-green-600/80 text-green-900 dark:text-green-100';
            case 'rejeitado':
                return 'bg-red-300 dark:bg-red-600/80 text-red-900 dark:text-red-100';
            case 'cancelado':
                return 'bg-gray-300 dark:bg-gray-600/80 text-gray-900 dark:text-gray-100';
            default:
                return 'bg-gray-300 dark:bg-gray-600/80 text-gray-900 dark:text-gray-100';
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pendente':
                return <Clock3 className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />;
            case 'aprovado':
                return <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />;
            case 'rejeitado':
                return <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
            case 'cancelado':
                return <Ban className="h-3 w-3 text-gray-600 dark:text-gray-400" />;
            default:
                return <Clock3 className="h-3 w-3 text-gray-600 dark:text-gray-400" />;
        }
    };

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

    // Filtrar agendamentos pelos espaços selecionados
    const filteredAgendamentos = agendamentos.filter(agendamento => 
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

    const handleDateSelect = (date: Date, timeSlot?: string) => {
        const selectedDate = format(date, 'yyyy-MM-dd');
        const selectedTime = timeSlot || '08:00';
        const endTime = timeSlot ? 
            `${(parseInt(timeSlot.split(':')[0]) + 1).toString().padStart(2, '0')}:00` : 
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
        router.get(`/agendamentos/${agendamento.id}`);
    };

    const handleDelete = (agendamento: Agendamento) => {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            router.delete(`/agendamentos/${agendamento.id}`, {
                onSuccess: () => {
                    alert('Agendamento cancelado com sucesso!');
                    router.reload();
                },
                onError: () => {
                    alert('Erro ao cancelar agendamento');
                }
            });
        }
    };

    const canEdit = (agendamento: Agendamento) => {
        return agendamento.user_id === auth.user.id && agendamento.status === 'pendente';
    };

    const canDelete = (agendamento: Agendamento) => {
        return auth.user.perfil_acesso === 'diretor_geral' || agendamento.user_id === auth.user.id;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.titulo || !formData.espaco_id || !formData.justificativa) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        router.post('/agendamentos', formData, {
            onSuccess: () => {
                setCreateModal({ open: false });
                resetForm();
            },
            onError: (errors: any) => {
                if (errors.conflitos) {
                    setConflictModal({
                        open: true,
                        conflitos: Array.isArray(errors.conflitos) ? errors.conflitos : [],
                        formData: formData
                    });
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
                            onClick={() => handleDateSelect(day)}
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
                                        className={`text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 ${getStatusBgColor(event.status)}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEventClick(event);
                                        }}
                                        title={`${event.titulo} - ${event.espaco?.nome || 'Espaço'} - ${event.hora_inicio.substring(0, 5)} às ${event.hora_fim.substring(0, 5)} - ${getStatusText(event.status)}`}
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
                                            className={`text-xs p-1 rounded mb-1 cursor-pointer transition-opacity hover:opacity-80 relative ${getStatusBgColor(event.status)}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }}
                                            title={`${event.titulo} - ${event.espaco?.nome || 'Espaço'} - ${getStatusText(event.status)}`}
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
                                                className={`p-3 rounded-lg cursor-pointer transition-opacity hover:opacity-80 ${getStatusBgColor(event.status)}`}
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
                                                        className={`text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 relative ${getStatusBgColor(event.status)}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEventClick(event);
                                                        }}
                                                        title={`${event.titulo} - ${event.hora_inicio.substring(0, 5)} às ${event.hora_fim.substring(0, 5)} - ${getStatusText(event.status)}`}
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="espaco">Espaço</Label>
                            <Select
                                value={filters.espaco_id || 'all'}
                                onValueChange={(value) => {
                                    const espacoId = value === 'all' ? undefined : value;
                                    router.get('/agendamentos', { ...filters, espaco_id: espacoId });
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
                                    router.get('/agendamentos', { ...filters, status });
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

                        <div>
                            <Label htmlFor="data_inicio">Data Início</Label>
                            <Input
                                type="date"
                                value={filters.data_inicio || ''}
                                onChange={(e) => {
                                    router.get('/agendamentos', { ...filters, data_inicio: e.target.value || undefined });
                                }}
                            />
                        </div>

                        <div>
                            <Label htmlFor="data_fim">Data Fim</Label>
                            <Input
                                type="date"
                                value={filters.data_fim || ''}
                                onChange={(e) => {
                                    router.get('/agendamentos', { ...filters, data_fim: e.target.value || undefined });
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Agendamentos */}
            <div className="space-y-4">
                {agendamentos.length === 0 ? (
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
                    agendamentos.map((agendamento) => (
                        <Card key={agendamento.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{agendamento.titulo}</h3>
                                            <Badge className={getStatusColor(agendamento.status)}>
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(agendamento.status)}
                                                    {getStatusText(agendamento.status)}
                                                </span>
                                            </Badge>
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
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/agendamentos/${agendamento.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>

                                        {canEdit(agendamento) && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/agendamentos/${agendamento.id}/editar`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}

                                        {canDelete(agendamento) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(agendamento)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
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
        <AppLayout>
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
                                    <div className="space-y-2 mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-yellow-300 dark:bg-yellow-600/80 border border-yellow-400 dark:border-yellow-500 flex items-center justify-center">
                                                <Clock3 className="h-2.5 w-2.5 text-yellow-700 dark:text-yellow-300" />
                                            </div>
                                            <span className="text-sm">Pendente</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-600/80 border border-green-400 dark:border-green-500 flex items-center justify-center">
                                                <CheckCircle className="h-2.5 w-2.5 text-green-700 dark:text-green-300" />
                                            </div>
                                            <span className="text-sm">Aprovado</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-red-300 dark:bg-red-600/80 border border-red-400 dark:border-red-500 flex items-center justify-center">
                                                <XCircle className="h-2.5 w-2.5 text-red-700 dark:text-red-300" />
                                            </div>
                                            <span className="text-sm">Rejeitado</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600/80 border border-gray-400 dark:border-gray-500 flex items-center justify-center">
                                                <Ban className="h-2.5 w-2.5 text-gray-700 dark:text-gray-300" />
                                            </div>
                                            <span className="text-sm">Cancelado</span>
                                        </div>
                                    </div>
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
                            {/* <DialogDescription>
                                Preencha os dados para solicitar um novo agendamento de espaço.
                            </DialogDescription> */}
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
                                                {conflito.user?.name} - {conflito.data_inicio} {conflito.hora_inicio} às {conflito.hora_fim}
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
            </div>
        </AppLayout>
    );
}