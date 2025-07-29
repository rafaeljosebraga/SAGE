import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, User as UserIcon } from 'lucide-react';
import { type User, type BreadcrumbItem } from '@/types';
import { FilterableTable, type ColumnConfig } from '@/components/ui/filterable-table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect } from 'react';

interface UsersIndexProps {
    auth: {
        user: User;
    };
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        total: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}
export default function UsersIndex({ auth, users, flash }: UsersIndexProps) {
    const { toast } = useToast();

    // Mostrar toasts baseados nas flash messages
    useEffect(() => {
        if (flash?.success) {
            toast({
                title: "Sucesso!",
                description: flash.success,
                variant: "success",
                duration: 5000, // 5 segundos
            });
        }
        if (flash?.error) {
            toast({
                title: "Erro!",
                description: flash.error,
                variant: "destructive",
            });
        }
    }, [flash, toast]);

    const handleDelete = (id: number) => {
         router.delete(`/usuarios/${id}`, {
            onSuccess: () => {
                toast({
                    title: "Usuário excluído",
                    description: "O usuário foi excluído com sucesso.",
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] as string || "Erro ao excluir usuário";
                toast({
                    title: "Erro ao excluir",
                    description: errorMessage,
                    variant: "destructive",
                });
            },
        });
    };

    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return '';
        return perfil.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getPerfilVariant = (perfil: string | undefined) => {
        if (!perfil) return 'secondary';

        switch (perfil.toLowerCase()) {
            case 'administrador':
                return 'destructive';
            case 'diretor_geral':
                return 'default';
            case 'coordenador':
                return 'outline';
            case 'servidores':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const getPerfilColor = (perfil: string | undefined) => {
        if (!perfil) return '';

        switch (perfil.toLowerCase()) {
            case 'administrador':
                return 'bg-[#EF7D4C] hover:bg-[#f0875d] text-white border-transparent';
            case 'coordenador':
                return 'bg-[#957157] hover:bg-[#856147] text-white border-transparent';
            case 'diretor_geral':
                return 'bg-[#F1DEC5] hover:bg-[#e5d2b9] text-gray-600 border-transparent';
            case 'servidores':
                return 'bg-[#285355] hover:bg-[#1d4446] text-white border-transparent';
            default:
                return '';
        }
    };

    const columns: ColumnConfig[] = [
        {
            key: 'name',
            label: 'Nome',
            render: (value, user) => (
                <div className="flex items-center gap-2 font-medium">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    {value}
                </div>
            )
        },
        {
            key: 'email',
            label: 'Email',
            type: 'text'
        },
        {
            key: 'perfil_acesso',
            label: 'Perfil',
            type: 'select',
            options: [
                { value: 'administrador', label: 'Administrador' },
                { value: 'diretor_geral', label: 'Diretor Geral' },
                { value: 'coordenador', label: 'Coordenador' },
                { value: 'servidores', label: 'Servidores' }
            ],
            getValue: (user) => user.perfil_acesso || '',
            render: (value, user) => (
                <Badge 
                    variant={getPerfilVariant(user.perfil_acesso)}
                    className={getPerfilColor(user.perfil_acesso)}
                >
                    {formatPerfil(user.perfil_acesso)}
                </Badge>
            )
        },
        {
            key: 'created_at',
            label: 'Data de Criação',
            type: 'date',
            getValue: (user) => new Date(user.created_at).toLocaleDateString('pt-BR')
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
                                asChild
                                className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black"
                            >
                                <Link href={`/usuarios/${user.id}/editar`}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Editar</p>
                        </TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                       className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-[#F26326] hover:text-black dark:text-[#F26326] dark:hover:text-black"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Excluir</p>
                            </TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Confirmar exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja excluir o usuário {user.name}? 
                                    Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )
        }
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Usuários', href: '/usuarios' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuários" />

            <div className="space-y-6">
                   <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-3xl font-bold text-black dark:text-white">Usuários</h1>
    <Button asChild className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black">
            <Link href={route('users.create')}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
            </Link>
        </Button>
    </div>

                <FilterableTable 
                    data={users.data}
                    columns={columns}
                    emptyMessage="Nenhum usuário encontrado."
                />




                {users.last_page > 1 && (
                    <div className="flex items-center justify-between ">
                        <p className="text-sm text-gray-700 px-6">
                            Mostrando {users.data.length} de {users.total} usuários
                        </p>
                        <div className="flex gap-2">
                            {users.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(`/usuarios?page=${users.current_page - 1}`)}
                                >
                                    Anterior
                                </Button>
                            )}
                            {users.current_page < users.last_page && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(`/usuarios?page=${users.current_page + 1}`)}
                                >
                                    Próximo
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
