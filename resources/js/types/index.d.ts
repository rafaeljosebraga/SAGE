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

export interface User {
    id: number;
    name: string;
    email: string;
    perfil_acesso?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
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

export interface Espaco {
    id: number;
    nome: string;
    capacidade: number;
    descricao?: string;
    localizacao_id?: number;
    recursos_fixos?: any[];
    fotos?: string[];
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
    createdBy?: User;
    updatedBy?: User;
}
