import { useState } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Head, Link } from '@inertiajs/react';
import { UserIcon, Plus, Eye } from 'lucide-react';
import { type User, type Espaco, type BreadcrumbItem } from '@/types';
import { FilterableTable, type ColumnConfig } from '@/components/ui/filterable-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ModalDetalhesUsuario } from '@/components/ui/espacosByUserModal';

interface AtribuirPermissoesIndexProps {
    users: User[];
    espacos: Espaco[];
}


export default function AtribuirPermissoesIndex({ users, espacos }: AtribuirPermissoesIndexProps) {
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<User | null>(null);
    const [espacosDoUsuario, setSalasDoUsuario] = useState<Espaco[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    async function handleViewDetails(id: number) {
        try {


            const response = await axios.get(`/usuarios/${id}/espacos`);
            setUsuarioSelecionado(users.find(user => user.id === id) || null);
            setSalasDoUsuario(response.data); // é a lista de espacos
            setIsModalOpen(true);
        } catch (error) {
            console.error('Erro ao buscar espaços do usuário:', error);
        }
    }

    const closeModal = () => {
        setIsModalOpen(false);
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


    const columns: ColumnConfig[] = [
        {
            key: 'name',
            label: 'Nome',
            render: (value) => (
                <div className="flex items-center gap-2 font-medium">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    {value}
                </div>
            )
        },
        {
            key: 'email',
            label: 'Email',
            render: (value) => <span>{value}</span>
        },
        {
            key: 'perfil_acesso',
            label: 'Perfil de Acesso',
            type: 'select',
            options: [
                { value: 'administrador', label: 'Administrador' },
                { value: 'diretor_geral', label: 'Diretor Geral' },
                { value: 'coordenador', label: 'Coordenador' },
                { value: 'servidores', label: 'Servidores' }
            ],
            getValue: (user) => user.perfil_acesso || '',
            render: (value, user) => (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(user.perfil_acesso)}`}>
                    {formatPerfil(user.perfil_acesso)}
                </span>
            )
        },
        {
            key: 'acoes',
            label: 'Ações',
            searchable: false,
            sortable: false,
            render: (value, user) => (
                <div className="flex items-center justify-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(user.id)}
                                className="cursor-pointer bg-sidebar border border-transparent text-blue-700
                                hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
                                dark:bg-gray-800 dark:border-transparent dark:text-blue-300
                                dark:hover:bg-blue-900/30 dark:hover:border-blue-700 dark:hover:text-blue-300"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Visualizar espacos atribuidos, associados a {user.name}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="cursor-pointer bg-sidebar border border-transparent text-[#EF7D4C]
                                hover:bg-[#EF7D4C]/10 hover:border-[#EF7D4C]/60 hover:text-[#EF7D4C]
                                dark:bg-gray-800 dark:border-transparent dark:text-[#EF7D4C]
                                dark:hover:bg-[#EF7D4C]/30 dark:hover:border-[#EF7D4C]/70 dark:hover:text-[#EF7D4C]"
                                >
                                <Link href={`atribuir-permissoes/${user.id}/criar`}>
                                    <Plus className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Atribuir</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )
        }
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Atribuir Permissões', href: '/atribuir-permissoes' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Atribuir Permissões" />
            <div className="space-y-6 mt-6 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-6">&nbsp;&nbsp;Atribuir Permissões</h1>
                    <FilterableTable
                        data={users}
                        columns={columns}
                        emptyMessage="Nenhum usuário encontrado."
                    />
                </div>
            </div>

        <ModalDetalhesUsuario
            isOpen={isModalOpen}
            onClose={closeModal}
            usuario={usuarioSelecionado}
            espacos={espacosDoUsuario}
        />
        </AppLayout>
    );
}
