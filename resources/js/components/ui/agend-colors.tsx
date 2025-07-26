import React from 'react';
import { Clock3, CheckCircle, XCircle, Ban, Clock } from 'lucide-react';
import type { Agendamento } from '@/types';

// Paleta de cores para agendamentos
const colorPalette = [
    // Blues 
    { bg: 'bg-blue-100 dark:bg-blue-600', text: 'text-blue-900 dark:text-blue-50', border: 'border-l-blue-400' },
    { bg: 'bg-blue-200 dark:bg-blue-700', text: 'text-blue-900 dark:text-blue-50', border: 'border-l-blue-500' },
    { bg: 'bg-blue-300 dark:bg-blue-800', text: 'text-blue-900 dark:text-blue-100', border: 'border-l-blue-600' },
    { bg: 'bg-sky-100 dark:bg-sky-600', text: 'text-sky-900 dark:text-sky-50', border: 'border-l-sky-400' },
    { bg: 'bg-sky-200 dark:bg-sky-700', text: 'text-sky-900 dark:text-sky-50', border: 'border-l-sky-500' },
    { bg: 'bg-sky-300 dark:bg-sky-800', text: 'text-sky-900 dark:text-sky-100', border: 'border-l-sky-600' },
    { bg: 'bg-cyan-100 dark:bg-cyan-600', text: 'text-cyan-900 dark:text-cyan-50', border: 'border-l-cyan-400' },
    { bg: 'bg-cyan-200 dark:bg-cyan-700', text: 'text-cyan-900 dark:text-cyan-50', border: 'border-l-cyan-500' },
    { bg: 'bg-cyan-300 dark:bg-cyan-800', text: 'text-cyan-900 dark:text-cyan-100', border: 'border-l-cyan-600' },
    
    // Purples 
    { bg: 'bg-purple-100 dark:bg-purple-600', text: 'text-purple-900 dark:text-purple-50', border: 'border-l-purple-400' },
    { bg: 'bg-purple-200 dark:bg-purple-700', text: 'text-purple-900 dark:text-purple-50', border: 'border-l-purple-500' },
    { bg: 'bg-purple-300 dark:bg-purple-800', text: 'text-purple-900 dark:text-purple-100', border: 'border-l-purple-600' },
    { bg: 'bg-violet-100 dark:bg-violet-600', text: 'text-violet-900 dark:text-violet-50', border: 'border-l-violet-400' },
    { bg: 'bg-violet-200 dark:bg-violet-700', text: 'text-violet-900 dark:text-violet-50', border: 'border-l-violet-500' },
    { bg: 'bg-violet-300 dark:bg-violet-800', text: 'text-violet-900 dark:text-violet-100', border: 'border-l-violet-600' },
    { bg: 'bg-indigo-100 dark:bg-indigo-600', text: 'text-indigo-900 dark:text-indigo-50', border: 'border-l-indigo-400' },
    { bg: 'bg-indigo-200 dark:bg-indigo-700', text: 'text-indigo-900 dark:text-indigo-50', border: 'border-l-indigo-500' },
    { bg: 'bg-indigo-300 dark:bg-indigo-800', text: 'text-indigo-900 dark:text-indigo-100', border: 'border-l-indigo-600' },
    
    // Pinks
    { bg: 'bg-pink-100 dark:bg-pink-600', text: 'text-pink-900 dark:text-pink-50', border: 'border-l-pink-400' },
    { bg: 'bg-pink-200 dark:bg-pink-700', text: 'text-pink-900 dark:text-pink-50', border: 'border-l-pink-500' },
    { bg: 'bg-pink-300 dark:bg-pink-800', text: 'text-pink-900 dark:text-pink-100', border: 'border-l-pink-600' },
    { bg: 'bg-rose-100 dark:bg-rose-600', text: 'text-rose-900 dark:text-rose-50', border: 'border-l-rose-400' },
    { bg: 'bg-rose-200 dark:bg-rose-700', text: 'text-rose-900 dark:text-rose-50', border: 'border-l-rose-500' },
    { bg: 'bg-rose-300 dark:bg-rose-800', text: 'text-rose-900 dark:text-rose-100', border: 'border-l-rose-600' },
    { bg: 'bg-fuchsia-100 dark:bg-fuchsia-600', text: 'text-fuchsia-900 dark:text-fuchsia-50', border: 'border-l-fuchsia-400' },
    { bg: 'bg-fuchsia-200 dark:bg-fuchsia-700', text: 'text-fuchsia-900 dark:text-fuchsia-50', border: 'border-l-fuchsia-500' },
    { bg: 'bg-fuchsia-300 dark:bg-fuchsia-800', text: 'text-fuchsia-900 dark:text-fuchsia-100', border: 'border-l-fuchsia-600' },
    
    // Greens
    { bg: 'bg-green-100 dark:bg-green-600', text: 'text-green-900 dark:text-green-50', border: 'border-l-green-400' },
    { bg: 'bg-green-200 dark:bg-green-700', text: 'text-green-900 dark:text-green-50', border: 'border-l-green-500' },
    { bg: 'bg-green-300 dark:bg-green-800', text: 'text-green-900 dark:text-green-100', border: 'border-l-green-600' },
    { bg: 'bg-emerald-100 dark:bg-emerald-600', text: 'text-emerald-900 dark:text-emerald-50', border: 'border-l-emerald-400' },
    { bg: 'bg-emerald-200 dark:bg-emerald-700', text: 'text-emerald-900 dark:text-emerald-50', border: 'border-l-emerald-500' },
    { bg: 'bg-emerald-300 dark:bg-emerald-800', text: 'text-emerald-900 dark:text-emerald-100', border: 'border-l-emerald-600' },
    { bg: 'bg-teal-100 dark:bg-teal-600', text: 'text-teal-900 dark:text-teal-50', border: 'border-l-teal-400' },
    { bg: 'bg-teal-200 dark:bg-teal-700', text: 'text-teal-900 dark:text-teal-50', border: 'border-l-teal-500' },
    { bg: 'bg-teal-300 dark:bg-teal-800', text: 'text-teal-900 dark:text-teal-100', border: 'border-l-teal-600' },
    
    // Yellows
    { bg: 'bg-yellow-100 dark:bg-yellow-600', text: 'text-yellow-900 dark:text-yellow-50', border: 'border-l-yellow-400' },
    { bg: 'bg-yellow-200 dark:bg-yellow-700', text: 'text-yellow-900 dark:text-yellow-50', border: 'border-l-yellow-500' },
    { bg: 'bg-yellow-300 dark:bg-yellow-800', text: 'text-yellow-900 dark:text-yellow-100', border: 'border-l-yellow-600' },
    { bg: 'bg-amber-100 dark:bg-amber-600', text: 'text-amber-900 dark:text-amber-50', border: 'border-l-amber-400' },
    { bg: 'bg-amber-200 dark:bg-amber-700', text: 'text-amber-900 dark:text-amber-50', border: 'border-l-amber-500' },
    { bg: 'bg-amber-300 dark:bg-amber-800', text: 'text-amber-900 dark:text-amber-100', border: 'border-l-amber-600' },
    { bg: 'bg-orange-100 dark:bg-orange-600', text: 'text-orange-900 dark:text-orange-50', border: 'border-l-orange-400' },
    { bg: 'bg-orange-200 dark:bg-orange-700', text: 'text-orange-900 dark:text-orange-50', border: 'border-l-orange-500' },
    { bg: 'bg-orange-300 dark:bg-orange-800', text: 'text-orange-900 dark:text-orange-100', border: 'border-l-orange-600' },
    
    // Reds 
    { bg: 'bg-red-100 dark:bg-red-600', text: 'text-red-900 dark:text-red-50', border: 'border-l-red-400' },
    { bg: 'bg-red-200 dark:bg-red-700', text: 'text-red-900 dark:text-red-50', border: 'border-l-red-500' },
    { bg: 'bg-red-300 dark:bg-red-800', text: 'text-red-900 dark:text-red-100', border: 'border-l-red-600' },
    
    // Limes 
    { bg: 'bg-lime-100 dark:bg-lime-600', text: 'text-lime-900 dark:text-lime-50', border: 'border-l-lime-400' },
    { bg: 'bg-lime-200 dark:bg-lime-700', text: 'text-lime-900 dark:text-lime-50', border: 'border-l-lime-500' },
    { bg: 'bg-lime-300 dark:bg-lime-800', text: 'text-lime-900 dark:text-lime-100', border: 'border-l-lime-600' },
    
    // Tons neutros 
    { bg: 'bg-slate-100 dark:bg-slate-600', text: 'text-slate-900 dark:text-slate-50', border: 'border-l-slate-400' },
    { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-900 dark:text-slate-50', border: 'border-l-slate-500' },
    { bg: 'bg-stone-100 dark:bg-stone-600', text: 'text-stone-900 dark:text-stone-50', border: 'border-l-stone-400' },
    { bg: 'bg-stone-200 dark:bg-stone-700', text: 'text-stone-900 dark:text-stone-50', border: 'border-l-stone-500' },
    { bg: 'bg-zinc-100 dark:bg-zinc-600', text: 'text-zinc-900 dark:text-zinc-50', border: 'border-l-zinc-400' },
    { bg: 'bg-zinc-200 dark:bg-zinc-700', text: 'text-zinc-900 dark:text-zinc-50', border: 'border-l-zinc-500' },
    
    // Tons vibrantes 
    { bg: 'bg-blue-400 dark:bg-blue-500', text: 'text-blue-900 dark:text-blue-50', border: 'border-l-blue-600' },
    { bg: 'bg-purple-400 dark:bg-purple-500', text: 'text-purple-900 dark:text-purple-50', border: 'border-l-purple-600' },
    { bg: 'bg-pink-400 dark:bg-pink-500', text: 'text-pink-900 dark:text-pink-50', border: 'border-l-pink-600' },
    { bg: 'bg-green-400 dark:bg-green-500', text: 'text-green-900 dark:text-green-50', border: 'border-l-green-600' },
    { bg: 'bg-yellow-400 dark:bg-yellow-500', text: 'text-yellow-900 dark:text-yellow-50', border: 'border-l-yellow-600' },
    { bg: 'bg-red-400 dark:bg-red-500', text: 'text-red-900 dark:text-red-50', border: 'border-l-red-600' },
    { bg: 'bg-indigo-400 dark:bg-indigo-500', text: 'text-indigo-900 dark:text-indigo-50', border: 'border-l-indigo-600' },
    { bg: 'bg-teal-400 dark:bg-teal-500', text: 'text-teal-900 dark:text-teal-50', border: 'border-l-teal-600' },
    { bg: 'bg-cyan-400 dark:bg-cyan-500', text: 'text-cyan-900 dark:text-cyan-50', border: 'border-l-cyan-600' },
    { bg: 'bg-emerald-400 dark:bg-emerald-500', text: 'text-emerald-900 dark:text-emerald-50', border: 'border-l-emerald-600' },
];

// Função para gerar hash com máxima distribuição usando múltiplos algoritmos
const generateHash = (str: string): number => {
    // Algoritmo FNV-1a para melhor distribuição
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash *= 16777619;
    }
    
    // Segundo hash usando DJB2
    let hash2 = 5381;
    for (let i = 0; i < str.length; i++) {
        hash2 = ((hash2 << 5) + hash2) + str.charCodeAt(i);
    }
    
    // Terceiro hash usando SDBM
    let hash3 = 0;
    for (let i = 0; i < str.length; i++) {
        hash3 = str.charCodeAt(i) + (hash3 << 6) + (hash3 << 16) - hash3;
    }
    
    // Combinar os três hashes com números primos para máxima distribuição
    const combined = Math.abs((hash >>> 0) + (hash2 * 37) + (hash3 * 97));
    return combined;
};

// Função para distribuir cores de forma mais uniforme
const getDistributedColorIndex = (hash: number, paletteSize: number): number => {
    // Usar sequência de Fibonacci para distribuição mais uniforme
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const fibonacciHash = (hash * phi) % 1;
    return Math.floor(fibonacciHash * paletteSize);
};

// Função para verificar se um agendamento já passou
const isEventPast = (agendamento: Agendamento): boolean => {
    try {
        // Extrair apenas a parte da data (YYYY-MM-DD) independentemente do formato
        const dateOnly = agendamento.data_fim.split('T')[0];
        const eventDateTime = new Date(`${dateOnly}T${agendamento.hora_fim}`);
        const now = new Date();
        const isPast = eventDateTime < now;
        
        return isPast;
    } catch (error) {
        return false;
    }
};

// Hook personalizado para cores de agendamentos
export const useAgendamentoColors = () => {
    // Função para obter cor de status
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'pendente':
                return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
            case 'aprovado':
                return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
            case 'rejeitado':
                return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700';
            case 'cancelado':
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600';
        }
    };

    // Função para obter cor de fundo do evento (para calendário)
    // Função para gerar identificador único para série de agendamentos
    const getEventSeriesId = (agendamento: Agendamento): string => {
        // Para agendamentos recorrentes, usar uma combinação que seja igual para toda a série
        const baseId = [
            agendamento.titulo,
            agendamento.espaco_id,
            agendamento.user_id,
            agendamento.hora_inicio,
            agendamento.hora_fim,
            agendamento.justificativa
        ].join('|');
        
        return baseId;
    };

    const getEventBackgroundColor = (agendamento: Agendamento): string => {
        // Se o evento já passou, usar cinza
        if (isEventPast(agendamento)) {
            return 'bg-gray-300 dark:bg-gray-600/80 text-gray-900 dark:text-gray-100';
        }

        // Usar identificador da série para que agendamentos recorrentes tenham a mesma cor
        const seriesId = getEventSeriesId(agendamento);
        const hash1 = generateHash(`primary_${seriesId}`);
        const hash2 = generateHash(`secondary_${seriesId}`);
        const hash3 = generateHash(`tertiary_${seriesId}`);
        
        // Combinar os hashes de forma única
        const combinedHash = Math.abs(hash1 + (hash2 * 17) + (hash3 * 23));
        const colorIndex = getDistributedColorIndex(combinedHash, colorPalette.length);
        const color = colorPalette[colorIndex];
        
        return `${color.bg} ${color.text}`;
    };

    // Função para obter cor da borda do agendamento (para cards)
    const getEventBorderColor = (agendamento: Agendamento): string => {
        // Se o evento já passou, usar cinza
        if (isEventPast(agendamento)) {
            return 'border-l-gray-500';
        }

        // Usar identificador da série para que agendamentos recorrentes tenham a mesma cor
        const seriesId = getEventSeriesId(agendamento);
        const hash1 = generateHash(`primary_${seriesId}`);
        const hash2 = generateHash(`secondary_${seriesId}`);
        const hash3 = generateHash(`tertiary_${seriesId}`);
        
        // Combinar os hashes de forma única
        const combinedHash = Math.abs(hash1 + (hash2 * 17) + (hash3 * 23));
        const colorIndex = getDistributedColorIndex(combinedHash, colorPalette.length);
        const color = colorPalette[colorIndex];
        
        return color.border;
    };

    // Função para obter cor de fundo do status (para calendário)
    const getStatusBgColor = (status: string): string => {
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

    // Função para obter texto do status
    const getStatusText = (status: string): string => {
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

    // Função para obter ícone do status
    const getStatusIcon = (status: string): React.ReactNode => {
        switch (status) {
            case 'pendente':
                return (
                    <div className="w-4 h-4 rounded-full bg-orange-500 dark:bg-orange-400 flex items-center justify-center shadow-sm shrink-0">
                        <Clock3 className="h-2.5 w-2.5 text-white dark:text-orange-900" />
                    </div>
                );
            case 'aprovado':
                return (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 dark:bg-emerald-400 flex items-center justify-center shadow-sm shrink-0">
                        <CheckCircle className="h-2.5 w-2.5 text-white dark:text-emerald-900" />
                    </div>
                );
            case 'rejeitado':
                return (
                    <div className="w-4 h-4 rounded-full bg-red-500 dark:bg-red-400 flex items-center justify-center shadow-sm shrink-0">
                        <XCircle className="h-2.5 w-2.5 text-white dark:text-red-900" />
                    </div>
                );
            case 'cancelado':
                return (
                    <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center shadow-sm shrink-0">
                        <Ban className="h-2.5 w-2.5 text-white dark:text-gray-900" />
                    </div>
                );
            default:
                return (
                    <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center shadow-sm shrink-0">
                        <Clock3 className="h-2.5 w-2.5 text-white dark:text-gray-900" />
                    </div>
                );
        }
    };

    return {
        getStatusColor,
        getEventBackgroundColor,
        getEventBorderColor,
        getStatusBgColor,
        getStatusText,
        getStatusIcon,
        isEventPast,
        colorPalette
    };
};

// Componente de legenda de status
interface StatusLegendProps {
    className?: string;
}

export const StatusLegend: React.FC<StatusLegendProps> = ({ className = "" }) => {
    const { getStatusIcon } = useAgendamentoColors();

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2">
                {getStatusIcon('pendente')}
                <span className="text-sm">Pendente</span>
            </div>
            <div className="flex items-center gap-2">
                {getStatusIcon('aprovado')}
                <span className="text-sm">Aprovado</span>
            </div>
            <div className="flex items-center gap-2">
                {getStatusIcon('rejeitado')}
                <span className="text-sm">Rejeitado</span>
            </div>
            <div className="flex items-center gap-2">
                {getStatusIcon('cancelado')}
                <span className="text-sm">Cancelado</span>
            </div>
        </div>
    );
};

// Componente para exibir status com ícone
interface StatusBadgeProps {
    status: string;
    showText?: boolean;
    className?: string;
    agendamento?: Agendamento;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
    status, 
    showText = true, 
    className = "",
    agendamento
}) => {
    const { getStatusIcon, getStatusText, getStatusColor, isEventPast } = useAgendamentoColors();

    // Verificar se o evento já passou
    const eventPast = agendamento ? isEventPast(agendamento) : false;

    if (showText) {
        return (
            <div className={`inline-flex items-center gap-2 ${className}`}>
                {eventPast && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">
                        <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center shadow-sm shrink-0">
                            <Clock className="h-2.5 w-2.5 text-white dark:text-gray-900" />
                        </div>
                        Já Passou
                    </div>
                )}
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm font-medium ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    {getStatusText(status)}
                </div>
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {eventPast && (
                <div className="w-4 h-4 rounded-full bg-gray-500 dark:bg-gray-400 flex items-center justify-center shadow-sm shrink-0" title="Evento já passou">
                    <Clock className="h-2.5 w-2.5 text-white dark:text-gray-900" />
                </div>
            )}
            {getStatusIcon(status)}
i        </div>
    );
};

// Exportar as funções utilitárias também
export { generateHash, isEventPast, colorPalette };