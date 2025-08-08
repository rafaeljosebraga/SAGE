import React from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAgendamentoColors } from '@/components/ui/agend-colors';
import type { Agendamento, Espaco } from '@/types';

interface CalendarProps {
    viewMode: 'month' | 'week' | 'day' | 'timeline';
    currentDate: Date;
    days: Date[];
    timeSlots: string[];
    filteredAgendamentos: Agendamento[];
    espacos: Espaco[];
    selectedEspacos: number[];
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    nomeFilter: string;
    setNomeFilter: (filter: string) => void;
    espacoFilter: string;
    setEspacoFilter: (filter: string) => void;
    statusFilter: string;
    setStatusFilter: (filter: string) => void;
    dataInicioFilter: string;
    setDataInicioFilter: (filter: string) => void;
    dataFimFilter: string;
    setDataFimFilter: (filter: string) => void;
    searchAgendamentos: string;
    setSearchAgendamentos: (search: string) => void;
    getEventsForDay: (date: Date) => Agendamento[];
    getEventsForTimeSlot: (date: Date, timeSlot: string) => Agendamento[];
    getEventTooltip: (event: Agendamento, includeTime?: boolean) => string;
    handleDateSelect: (date: Date, timeSlot?: string, preserveEspaco?: boolean) => void;
    handleDayClick: (date: Date, events: Agendamento[], espacoId?: number) => void;
    handleEventClick: (agendamento: Agendamento) => void;
    setDayViewModal: (modal: { open: boolean; selectedDate: Date | null; events: Agendamento[] }) => void;
    setFormData: React.Dispatch<React.SetStateAction<{
        titulo: string;
        espaco_id: string;
        data_inicio: string;
        hora_inicio: string;
        data_fim: string;
        hora_fim: string;
        justificativa: string;
        observacoes: string;
        recorrente: boolean;
        tipo_recorrencia: string;
        data_fim_recorrencia: string;
        recursos_solicitados: string[];
    }>>;
}

export default function AgendamentosCalendar({
    viewMode,
    currentDate,
    days,
    timeSlots,
    filteredAgendamentos,
    espacos,
    selectedEspacos,
    showFilters,
    setShowFilters,
    nomeFilter,
    setNomeFilter,
    espacoFilter,
    setEspacoFilter,
    statusFilter,
    setStatusFilter,
    dataInicioFilter,
    setDataInicioFilter,
    dataFimFilter,
    setDataFimFilter,
    searchAgendamentos,
    setSearchAgendamentos,
    getEventsForDay,
    getEventsForTimeSlot,
    getEventTooltip,
    handleDateSelect,
    handleDayClick,
    handleEventClick,
    setDayViewModal,
    setFormData
}: CalendarProps) {
    const { getEventBackgroundColor, getStatusIcon } = useAgendamentoColors();

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

            <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="p-3 text-center font-medium text-muted-foreground bg-muted rounded-lg">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);
                    return (
                        <div
                            key={day.toISOString()}
                            className={`min-h-[120px] p-2 border-2 border-border/100 hover:border-border/60 rounded-lg cursor-pointer transition-all duration-200 ${
                                isCurrentMonth ? 'bg-background hover:bg-muted/50' : 'bg-muted/30 hover:bg-muted/40'
                            } ${isCurrentDay ? 'ring-2 ring-primary shadow-md border-primary/50' : 'hover:shadow-sm'}`}
                            onClick={() => handleDayClick(day, dayEvents)}
                        >
                            <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'} ${isCurrentDay ? 'text-primary font-bold' : ''}`}>
                                {format(day, 'd')}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <Tooltip key={event.id}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`text-xs p-1 rounded cursor-pointer transition-opacity hover:opacity-80 ${getEventBackgroundColor(event)}`}
                                                onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">
                                                            <span className="text-xs font-normal opacity-75">{event.hora_inicio.substring(0, 5)}</span>
                                                            <span className="ml-1">{event.titulo}</span>
                                                        </div>
                                                        <div className="text-xs opacity-75 truncate">{event.espaco?.nome}</div>
                                                    </div>
                                                    <div className="flex-shrink-0">{getStatusIcon(event.status)}</div>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{getEventTooltip(event)}</p></TooltipContent>
                                    </Tooltip>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div 
                                        className="text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDayClick(day, dayEvents);
                                        }}
                                    >
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
                                                handleDayClick(day, events);
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
                        {(nomeFilter || espacoFilter !== 'all' || statusFilter !== 'all') && (
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

                {/* Painel de Filtros Expandido para Timeline */}
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
                                    const dayEventsForSpace = getEventsForDay(day).filter((event) => event.espaco_id === espaco.id);
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

    switch (viewMode) {
        case 'month': return renderMonthView();
        case 'week': return renderWeekView();
        case 'day': return renderDayView();
        case 'timeline': return renderTimelineView();
        default: return renderMonthView();
    }
}
