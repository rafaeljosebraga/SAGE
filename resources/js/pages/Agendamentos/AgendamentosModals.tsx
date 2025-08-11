import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, User, Plus, Eye, AlertTriangle, Trash2, X, CheckCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, useAgendamentoColors } from '@/components/ui/agend-colors';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/user-avatar';
import type { Agendamento, Espaco } from '@/types';

interface ModalsProps {
    // Modal de criação
    createModal: {
        open: boolean;
        selectedDate?: string;
        selectedTime?: string;
        selectedEspaco?: number;
    };
    setCreateModal: (modal: any) => void;
    
    // Formulário
    formData: any;
    setFormData: (data: any) => void;
    isFormDirty: () => boolean;
    handleSubmit: (e: React.FormEvent) => void;
    resetForm: () => void;
    getMinDate: () => string;
    getMinTime: (selectedDate: string) => string;
    
    // Modais de confirmação
    showCancelCreateConfirm: boolean;
    setShowCancelCreateConfirm: (show: boolean) => void;
    
    // Modal de conflito
    conflictModal: {
        open: boolean;
        conflitos: Agendamento[];
        formData: any;
    };
    setConflictModal: (modal: any) => void;
    handleConflictSubmit: () => void;
    
    // Modal de visualização do dia
    dayViewModal: {
        open: boolean;
        selectedDate: Date | null;
        events: Agendamento[];
    };
    setDayViewModal: (modal: any) => void;
    handleEventClick: (agendamento: Agendamento) => void;
    handleDateSelect: (date: Date, timeSlot?: string) => void;
    
    // Modais de aviso
    pastTimeModal: {
        open: boolean;
        formData?: any;
    };
    setPastTimeModal: (modal: any) => void;
    handlePastTimeConfirm: () => void;
    
    conflictTimeModal: {
        open: boolean;
        message: string;
    };
    setConflictTimeModal: (modal: any) => void;
    
    // Modais de exclusão
    deleteModal: {
        open: boolean;
        agendamento: Agendamento | null;
    };
    setDeleteModal: (modal: any) => void;
    confirmDelete: () => void;
    
    forceDeleteModal: {
        open: boolean;
        agendamento: Agendamento | null;
    };
    setForceDeleteModal: (modal: any) => void;
    confirmForceDelete: () => void;
    
    // Props
    espacos: Espaco[];
}

export default function AgendamentosModals({
    createModal,
    setCreateModal,
    formData,
    setFormData,
    isFormDirty,
    handleSubmit,
    resetForm,
    getMinDate,
    getMinTime,
    showCancelCreateConfirm,
    setShowCancelCreateConfirm,
    conflictModal,
    setConflictModal,
    handleConflictSubmit,
    dayViewModal,
    setDayViewModal,
    handleEventClick,
    handleDateSelect,
    pastTimeModal,
    setPastTimeModal,
    handlePastTimeConfirm,
    conflictTimeModal,
    setConflictTimeModal,
    deleteModal,
    setDeleteModal,
    confirmDelete,
    forceDeleteModal,
    setForceDeleteModal,
    confirmForceDelete,
    espacos
}: ModalsProps) {
    const { getEventBackgroundColor } = useAgendamentoColors();
    const { toast } = useToast();
    
    // useEffect para gerenciar foco quando modais fecham - solução mais agressiva
    useEffect(() => {
        // Função para remover foco de elementos ativos de forma mais robusta
        const removeFocusFromActiveElement = () => {
            const activeElement = document.activeElement;
            if (activeElement && activeElement instanceof HTMLElement) {
                // Verificar se é um elemento de formulário dentro de um modal
                const isFormElement = activeElement.matches('input, textarea, select, button');
                const isInModal = activeElement.closest('[role="dialog"], [data-slot="dialog-content"]');
                
                if (isFormElement && isInModal) {
                    activeElement.blur();
                    // Remover tabindex temporariamente para evitar re-foco
                    const originalTabIndex = activeElement.tabIndex;
                    activeElement.tabIndex = -1;
                    
                    // Restaurar tabindex após um delay
                    setTimeout(() => {
                        activeElement.tabIndex = originalTabIndex;
                    }, 300);
                    
                    // Focar no body
                    document.body.focus();
                }
            }
        };

        // Executar imediatamente quando qualquer modal muda de estado
        removeFocusFromActiveElement();
        
        // Também executar com delay para pegar casos edge
        const timeoutId = setTimeout(removeFocusFromActiveElement, 10);
        return () => clearTimeout(timeoutId);
    }, [createModal.open, conflictModal.open, dayViewModal.open, pastTimeModal.open, 
        conflictTimeModal.open, deleteModal.open, forceDeleteModal.open, showCancelCreateConfirm]);

    // useEffect adicional para interceptar mudanças no DOM
    useEffect(() => {
        const handleMutations = (mutations: MutationRecord[]) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
                    const target = mutation.target as HTMLElement;
                    if (target.getAttribute('aria-hidden') === 'true') {
                        // Modal está sendo marcado como hidden, remover foco de todos os elementos dentro
                        const focusableElements = target.querySelectorAll('input, textarea, select, button, [tabindex]:not([tabindex="-1"])');
                        focusableElements.forEach((element) => {
                            if (element === document.activeElement) {
                                (element as HTMLElement).blur();
                            }
                        });
                    }
                }
            });
        };

        const observer = new MutationObserver(handleMutations);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['aria-hidden'],
            subtree: true
        });

        return () => observer.disconnect();
    }, []);
    
    // Funções auxiliares para formatação
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
        <>
            {/* Modal de Criação */}
            <Dialog open={createModal.open} onOpenChange={(open) => {
                if (!open) {
                    // Remover foco de qualquer elemento ativo para evitar problemas de acessibilidade
                    if (document.activeElement && document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                    
                    // Não mostrar confirmação se outros modais estão abertos (como modal de conflito)
                    const hasOtherModalsOpen = conflictModal.open || pastTimeModal.open || conflictTimeModal.open;
                    
                    if (isFormDirty() && !hasOtherModalsOpen) {
                        setShowCancelCreateConfirm(true);
                    } else {
                        setCreateModal({ open: false });
                        resetForm();
                    }
                }
            }}>
                <DialogContent 
                    className="max-w-2xl max-h-[90vh] rounded-2xl flex flex-col" 
                    onInteractOutside={(e) => {
                        // Não mostrar confirmação se outros modais estão abertos
                        const hasOtherModalsOpen = conflictModal.open || pastTimeModal.open || conflictTimeModal.open;
                        
                        // Se o formulário foi alterado e não há outros modais, mostrar confirmação
                        if (isFormDirty() && !hasOtherModalsOpen) {
                            e.preventDefault();
                            setShowCancelCreateConfirm(true);
                        }
                        // Se não foi alterado ou há outros modais, permite fechar normalmente
                    }}
                    onEscapeKeyDown={(e) => {
                        // Mesmo comportamento para ESC
                        const hasOtherModalsOpen = conflictModal.open || pastTimeModal.open || conflictTimeModal.open;
                        
                        if (isFormDirty() && !hasOtherModalsOpen) {
                            e.preventDefault();
                            setShowCancelCreateConfirm(true);
                        }
                    }}
                >
                    <DialogHeader className="flex-shrink-0 pb-4">
                        <DialogTitle>Novo Agendamento</DialogTitle>
                        <DialogDescription>
                            Preencha os dados para solicitar um novo agendamento de espaço.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-1 min-h-0">
                        <form id="agendamento-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="titulo">Título *</Label>
                                    <Input
                                        id="titulo"
                                        name="titulo"
                                        value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        placeholder="Ex: Reunião de Planejamento"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="espaco_id">Espaço *</Label>
                                    <Select
                                        name="espaco_id"
                                        value={formData.espaco_id}
                                        onValueChange={(value) => setFormData({ ...formData, espaco_id: value })}
                                    >
                                        <SelectTrigger id="espaco_id">
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
                                        name="data_inicio"
                                        type="date"
                                        value={formData.data_inicio}
                                        onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="hora_inicio">Hora de Início *</Label>
                                    <Input
                                        id="hora_inicio"
                                        name="hora_inicio"
                                        type="time"
                                        value={formData.hora_inicio}
                                        onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="data_fim">Data de Fim *</Label>
                                    <Input
                                        id="data_fim"
                                        name="data_fim"
                                        type="date"
                                        value={formData.data_fim}
                                        onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                                        min={formData.data_inicio}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="hora_fim">Hora de Fim *</Label>
                                    <Input
                                        id="hora_fim"
                                        name="hora_fim"
                                        type="time"
                                        value={formData.hora_fim}
                                        onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                                        min={
                                            formData.data_fim === formData.data_inicio && formData.hora_inicio
                                                ? formData.hora_inicio
                                                : undefined
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="justificativa">Justificativa *</Label>
                                <Textarea
                                    id="justificativa"
                                    name="justificativa"
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
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    placeholder="Informações adicionais..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="recorrente"
                                    name="recorrente"
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
                                            name="tipo_recorrencia"
                                            value={formData.tipo_recorrencia}
                                            onValueChange={(value) => setFormData({ ...formData, tipo_recorrencia: value })}
                                        >
                                            <SelectTrigger id="tipo_recorrencia">
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
                                            name="data_fim_recorrencia"
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
                        <Button type="button" variant="outline" onClick={() => {
                            // Não mostrar confirmação se outros modais estão abertos
                            const hasOtherModalsOpen = conflictModal.open || pastTimeModal.open || conflictTimeModal.open;
                            
                            if (isFormDirty() && !hasOtherModalsOpen) {
                                setShowCancelCreateConfirm(true);
                            } else {
                                setCreateModal({ open: false });
                                resetForm();
                            }
                        }}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="agendamento-form">
                            Solicitar Agendamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Modal de confirmação de cancelamento do formulário de criação */}
            <Dialog open={showCancelCreateConfirm} onOpenChange={setShowCancelCreateConfirm}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            Cancelar criação de agendamento
                        </DialogTitle>
                        <DialogDescription>
                            Confirme se deseja cancelar a criação do agendamento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-center text-muted-foreground">
                            Deseja realmente cancelar e voltar? O progresso feito será perdido!
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelCreateConfirm(false)}
                        >
                            Não
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowCancelCreateConfirm(false);
                                setCreateModal({ open: false });
                                resetForm();
                            }}
                        >
                            Sim, cancelar e voltar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Conflito */}
            <Dialog open={conflictModal.open} onOpenChange={(open) => {
                if (!open) {
                    // Remover foco de qualquer elemento ativo para evitar problemas de acessibilidade
                    if (document.activeElement && document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                }
                setConflictModal({ ...conflictModal, open });
            }}>
                <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[95vh] overflow-hidden rounded-lg flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            Conflito de Horário Detectado
                        </DialogTitle>
                        <DialogDescription>
                            Existem agendamentos que conflitam com o horário solicitado. Você pode cancelar ou pedir prioridade.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col gap-2 flex-1 min-h-0">
                        {/* Área de visualização de agendamentos com scroll personalizado */}
                        <div className="flex flex-col gap-0 flex-1 min-h-0">
                            <div className="flex items-center justify-between flex-shrink-0">
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    Agendamentos em conflito ({conflictModal.conflitos.length}):
                                </h4>
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[70vh] pr-2 rounded-md flex-1 min-h-0 mb-1 last:-mb-2">
                                {conflictModal.conflitos.map((conflito) => {
                                    // Usar as cores reais do agendamento
                                    const { getEventColors } = useAgendamentoColors();
                                    const colors = getEventColors(conflito as any);
                                    
                                    // Função para formatar data para exibição
                                    const formatDateForDisplay = (dateString: string) => {
                                        try {
                                            const dateOnly = dateString.split("T")[0];
                                            const [year, month, day] = dateOnly.split("-");
                                            return `${day}/${month}/${year}`;
                                        } catch {
                                            return dateString;
                                        }
                                    };

                                    // Função para formatar hora para exibição
                                    const formatTimeForDisplay = (timeString: string) => {
                                        return timeString.substring(0, 5);
                                    };

                                    // Função para formatar período - ajustada para dados limitados
                                    const formatPeriod = (agendamento: any) => {
                                        const dataInicioFormatada = formatDateForDisplay(agendamento.data_inicio);
                                        const horaInicioFormatada = formatTimeForDisplay(agendamento.hora_inicio);
                                        const horaFimFormatada = formatTimeForDisplay(agendamento.hora_fim);
                                        
                                        // Se não tem data_fim ou é igual à data_inicio, assumir mesmo dia
                                        if (!agendamento.data_fim || agendamento.data_inicio === agendamento.data_fim || 
                                            (agendamento.data_inicio.includes('T') && agendamento.data_fim?.includes('T') && 
                                             agendamento.data_inicio.split('T')[0] === agendamento.data_fim.split('T')[0])) {
                                            return `${dataInicioFormatada} das ${horaInicioFormatada} às ${horaFimFormatada}`;
                                        }
                                        
                                        // Se são dias diferentes
                                        const dataFimFormatada = formatDateForDisplay(agendamento.data_fim);
                                        return `${dataInicioFormatada} às ${horaInicioFormatada} até ${dataFimFormatada} às ${horaFimFormatada}`;
                                    };
                                    
                                    return (
                                        <Card
                                            key={conflito.id}
                                            className={`transition-all duration-200 hover:shadow-md hover:bg-muted/30 ${colors.border} border-l-4 rounded-lg overflow-hidden`}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <h5 className="font-medium">{conflito.titulo}</h5>
                                                            <StatusBadge status={conflito.status} />
                                                        </div>

                                                        <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                        {(() => {
                                                            // Debug: verificar dados do usuário
                                                            console.log('USER COMPLETO:', conflito.user);
                                                            console.log('User properties:', conflito.user ? Object.keys(conflito.user) : 'user is null/undefined');
                                                            console.log('User name:', conflito.user?.name);
                                                            console.log('User email:', conflito.user?.email);
                                                            console.log('User perfil_acesso:', conflito.user?.perfil_acesso);
                                                            return null;
                                                        })()}
                                                        {conflito.user && <UserAvatar user={conflito.user} size="sm" />}
                                                        <div className="flex flex-col">
                                                        <span className="font-medium">{conflito.user?.name || 'Usuário não encontrado'}</span>
                                                        {conflito.user?.email && (
                                                        <span className="text-xs text-muted-foreground">{conflito.user.email}</span>
                                                        )}
                                                        </div>
                                                        {conflito.user?.perfil_acesso && (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(conflito.user.perfil_acesso)}`}>
                                                        {formatPerfil(conflito.user.perfil_acesso)}
                                                        </span>
                                                        )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm opacity-80">
                                                        <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {formatPeriod(conflito)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {(() => {
                                                            // Como solução temporária, usar o espaço do formData (todos os conflitos são para o mesmo espaço)
                                                            if (conflictModal.formData?.espaco_id) {
                                                                const espacoSolicitado = espacos.find(e => e.id == conflictModal.formData.espaco_id);
                                                                if (espacoSolicitado) {
                                                                    return espacoSolicitado.nome;
                                                                }
                                                            }
                                                            
                                                            // Fallback: tentar encontrar pelo objeto espaco se existir
                                                            return conflito.espaco?.nome || 'Mesmo espaço solicitado';
                                                        })()}
                                                        </div>
                                                        </div>
                                                        
                                                        {conflito.justificativa && (
                                                            <div className="mt-1 text-sm">
                                                                <span className="font-medium">Justificativa:</span>
                                                                <p className="text-muted-foreground">{conflito.justificativa}</p>
                                                            </div>
                                                        )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Botões de ação - fixos na parte inferior */}
                        <div className="flex-shrink-0 border-t border-border pt-4">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setConflictModal({ open: false, conflitos: [], formData: null })}
                                    className="cursor-pointer flex-1 rounded-lg"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => {
                                        handleConflictSubmit();
                                        toast({
                                            variant: "success",
                                            title: "Solicitação enviada!",
                                            description: (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Prioridade solicitada com sucesso
                                                </div>
                                            ),
                                            duration: 5000,
                                        });
                                    }}
                                    className="cursor-pointer flex-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                                >
                                    Pedir Prioridade
                                </Button>
                            </div>
                        </div>
                    </div>
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

            {/* Modal de Confirmação de Agendamento no Passado */}
            <Dialog open={pastTimeModal.open} onOpenChange={(open) => {
                if (!open) {
                    setPastTimeModal({ open: false });
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            Agendamento no Passado
                        </DialogTitle>
                        <DialogDescription>
                            Confirme se deseja criar um agendamento para um horário que já passou.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-center text-muted-foreground mb-4">
                            Você está tentando agendar para um horário que já passou. 
                        </p>
                        <p className="text-center text-muted-foreground">
                            Deseja realmente continuar com este agendamento?
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPastTimeModal({ open: false })}
                            className="cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="default"
                            onClick={handlePastTimeConfirm}
                            className="cursor-pointer"
                        >
                            Sim, Agendar Mesmo Assim
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Conflito de Horário */}
            <Dialog open={conflictTimeModal.open} onOpenChange={(open) => setConflictTimeModal({ open, message: "" })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            Conflito de Horário
                        </DialogTitle>
                        <DialogDescription>
                            Foi detectado um conflito de horário com agendamentos existentes.
                        </DialogDescription>
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
                                    {deleteModal.agendamento.espaco?.nome} • {(() => { 
                                        try { 
                                            const dateOnly = deleteModal.agendamento.data_inicio.split("T")[0]; 
                                            const [year, month, day] = dateOnly.split("-"); 
                                            return `${day}/${month}/${year}`; 
                                        } catch { 
                                            return deleteModal.agendamento.data_inicio; 
                                        } 
                                    })()}
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

            {/* Modal de Confirmação de Exclusão Permanente */}
            <Dialog open={forceDeleteModal.open} onOpenChange={(open) => setForceDeleteModal({ open, agendamento: null })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Excluir Agendamento Permanentemente
                        </DialogTitle>
                        <DialogDescription>
                            Esta ação é irreversível e removerá o agendamento permanentemente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-muted-foreground mb-3">
                            <strong>ATENÇÃO:</strong> Esta ação é irreversível! Tem certeza que deseja excluir permanentemente este agendamento?
                        </p>
                        {forceDeleteModal.agendamento && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="font-medium text-sm text-red-800 dark:text-red-200">{forceDeleteModal.agendamento.titulo}</p>
                                <p className="text-xs text-red-600 dark:text-red-300">
                                    {forceDeleteModal.agendamento.espaco?.nome} • {(() => { 
                                        try { 
                                            const dateOnly = forceDeleteModal.agendamento.data_inicio.split("T")[0]; 
                                            const [year, month, day] = dateOnly.split("-"); 
                                            return `${day}/${month}/${year}`; 
                                        } catch { 
                                            return forceDeleteModal.agendamento.data_inicio; 
                                        } 
                                    })()}
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
        </>
    );
}
