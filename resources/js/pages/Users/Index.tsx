import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { type User, type BreadcrumbItem } from '@/types';
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
        router.delete(route('users.destroy', id));
    };

    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return '';
        return perfil.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getPerfilVariant = (perfil: string | undefined) => {
        if (!perfil) return 'secondary';
        
        switch (perfil.toLowerCase()) {
            case 'administrador':
                return 'destructive'; // Vermelho para admin
            case 'diretor_geral':
                return 'default'; // Azul escuro para diretor geral
            case 'coordenador':
                return 'outline'; // Borda para coordenador
            case 'servidores':
                return 'secondary'; // Cinza para servidores
            default:
                return 'secondary';
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Usuários', href: route('users.index') }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuários" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Usuários</h1>
                    <Button asChild>
                        <Link href={route('users.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Usuário
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Perfil</TableHead>
                                <TableHead>Data de Criação</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={getPerfilVariant(user.perfil_acesso)}>
                                                {formatPerfil(user.perfil_acesso)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={route('users.edit', user.id)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
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
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell 
                                        colSpan={5} 
                                        className="h-24 text-center text-gray-500"
                                    >
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Mostrando {users.data.length} de {users.total} usuários
                        </p>
                        <div className="flex gap-2">
                            {users.current_page > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(route('users.index', { page: users.current_page - 1 }))}
                                >
                                    Anterior
                                </Button>
                            )}
                            {users.current_page < users.last_page && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(route('users.index', { page: users.current_page + 1 }))}
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
