import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

export default function UsersIndex({ auth, users }: UsersIndexProps) {
    const handleDelete = (id: number) => {
        router.delete(`/users/${id}`);
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
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                    >
                        <Link href={`/users/${user.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[#F26326] hover:text-[#e5724a]" 
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
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
        { title: 'Usuários', href: '/users' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuários" />

            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-500">Usuários</h1>
                    </div>
                    <div className="flex-shrink-0">
                        <Button asChild className="bg-[#D2CBB9] hover:bg-[#EF7D4C] text-black">
                            <Link href="/users/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Usuário
                            </Link>
                        </Button>
                    </div>
                </div>

                <FilterableTable 
                    data={users.data}
                    columns={columns}
                    emptyMessage="Nenhum usuário encontrado."
                />

                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Mostrando {users.data.length} de {users.total} usuários
                        </p>
                        <div className="flex gap-2">
                            {users.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(`/users?page=${users.current_page - 1}`)}
                                >
                                    Anterior
                                </Button>
                            )}
                            {users.current_page < users.last_page && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(`/users?page=${users.current_page + 1}`)}
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
