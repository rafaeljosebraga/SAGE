import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface PageProps extends SharedData {
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    perfil_acesso?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    espacos?: EspacoWithPivot[];
    [key: string]: unknown; // This allows for additional properties...
}

export interface Localizacao {
    id: number;
    nome: string;
    descricao?: string;
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
    espacos?: Espaco[];
    createdBy?: User;
    updatedBy?: User;
}

export interface Recurso {
    id: number;
    nome: string;
    descricao?: string;
    status: 'disponivel' | 'manutencao' | 'indisponivel';
    fixo: boolean;
    marca?: string;
    modelo?: string;
    observacoes?: string;
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
    espacos?: Espaco[];
    createdBy?: User;
    updatedBy?: User;
}

export interface Foto {
    id: number;
    espaco_id: number;
    url: string;
    nome_original: string;
    tamanho: number;
    tipo_mime: string;
    ordem: number;
    descricao?: string;
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
    espaco?: Espaco;
    createdBy?: User;
    updatedBy?: User;
}

export interface Espaco {
    id: number;
    nome: string;
    capacidade: number;
    descricao?: string;
    localizacao_id?: number;
    recursos_fixos?: any[];
    status: 'ativo' | 'inativo' | 'manutencao';
    responsavel_id?: number;
    disponivel_reserva: boolean;
    observacoes?: string;
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
    localizacao?: Localizacao;
    responsavel?: User;
    recursos?: Recurso[];
    fotos?: Foto[];
    users?: UserWithPivot[];
    createdBy?: User;
    updatedBy?: User;
}

// Interface para dados da tabela pivot espaco_user
export interface EspacoUserPivot {
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
    createdBy?: User;
    updatedBy?: User;
}

// Interface para Espaco com dados do pivot
export interface EspacoWithPivot extends Espaco {
    pivot: EspacoUserPivot;
}

// Interface para User com dados do pivot
export interface UserWithPivot extends User {
    pivot: EspacoUserPivot;
}

export interface Agendamento {
    id: number;
    espaco_id: number;
    user_id: number;
    titulo: string;
    justificativa: string;
    data_inicio: string;
    hora_inicio: string;
    data_fim: string;
    hora_fim: string;
    status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
    observacoes?: string;
    aprovado_por?: number;
    aprovado_em?: string;
    motivo_rejeicao?: string;
    recorrente: boolean;
    tipo_recorrencia?: 'diaria' | 'semanal' | 'mensal';
    data_fim_recorrencia?: string;
    recursos_solicitados?: number[];
    grupo_recorrencia?: string;
    is_representante_grupo?: boolean;
    total_grupo?: number;
    info_grupo?: {
        total: number;
        data_inicio: string;
        data_fim: string;
        tipo_recorrencia: string;
        pendentes: number;
        aprovados: number;
        rejeitados: number;
    };
    created_at: string;
    updated_at: string;
    espaco?: Espaco;
    user?: User;
    aprovadoPor?: User;
    periodo_formatado?: string;
    ativo?: boolean;
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
    user: string;
    espaco: string;
    justificativa?: string;
    observacoes?: string;
}
