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
import { Plus, Pencil, Trash2, MapPin, Users } from 'lucide-react';
import { type User, type Espaco, type BreadcrumbItem } from '@/types';
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

interface EspacosIndexProps {
    auth: {
        user: User;
    };
    espacos: Espaco[];
}

export default function EspacosIndex({ auth, espacos }: EspacosIndexProps) {
    const handleDelete = (id: number) => {
        router.delete(route('espacos.destroy', id));
    };

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ativo':
                return 'default';
            case 'inativo':
                return 'secondary';
            case 'manutencao':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ativo':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'inativo':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'manutencao':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatus = (status: string) => {
        switch (status.toLowerCase()) {
            case 'ativo':
                return 'Ativo';
            case 'inativo':
                return 'Inativo';
            case 'manutencao':
                return 'Manutenção';
            default:
                return status;
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaços', href: route('espacos.index') }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Espaços" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-500">Espaços</h1>
                    <Button asChild className="bg-[#D2CBB9] hover:bg-[#EF7D4C] text-black">
                        <Link href={route('espacos.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Espaço
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Capacidade</TableHead>
                                <TableHead>Localização</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Disponível para Reserva</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {espacos.length > 0 ? (
                                espacos.map((espaco) => (
                                    <TableRow key={espaco.id}>
                                        <TableCell className="font-medium">
                                            {espaco.nome}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-gray-500" />
                                                {espaco.capacidade}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                                {espaco.localizacao?.nome || 'Não definida'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {espaco.responsavel?.name || 'Não definido'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={getStatusVariant(espaco.status)}
                                                className={getStatusColor(espaco.status)}
                                            >
                                                {formatStatus(espaco.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={espaco.disponivel_reserva ? 'default' : 'secondary'}
                                                className={
                                                    espaco.disponivel_reserva 
                                                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                                        : 'bg-gray-100 text-gray-800 border-gray-200'
                                                }
                                            >
                                                {espaco.disponivel_reserva ? 'Sim' : 'Não'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={route('espacos.edit', espaco.id)}>
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
                                                                Tem certeza que deseja excluir o espaço {espaco.nome}? 
                                                                Esta ação não pode ser desfeita.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancelar
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(espaco.id)}
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
                                        colSpan={7} 
                                        className="h-24 text-center text-gray-500"
                                    >
                                        Nenhum espaço encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
