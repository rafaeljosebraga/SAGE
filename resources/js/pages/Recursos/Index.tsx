import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Pencil, Trash2, Package, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { type User, type Recurso, type BreadcrumbItem } from '@/types';
import { useState, useMemo } from 'react';
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

interface RecursosIndexProps {
    auth: {
        user: User;
    };
    recursos: Recurso[];
}

export default function RecursosIndex({ auth, recursos }: RecursosIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id: number) => {
        router.delete(route('recursos.destroy', id));
    };

    // Filtrar recursos baseado no termo de busca
    const filteredRecursos = useMemo(() => {
        if (!searchTerm.trim()) {
            return recursos;
        }

        const term = searchTerm.toLowerCase();
        return recursos.filter((recurso) => {
            const marcaModelo = recurso.marca && recurso.modelo
                ? `${recurso.marca} - ${recurso.modelo}`
                : recurso.marca || recurso.modelo || '';
            
            return (
                recurso.nome.toLowerCase().includes(term) ||
                marcaModelo.toLowerCase().includes(term) ||
                recurso.status.toLowerCase().includes(term) ||
                (recurso.fixo ? 'fixo' : 'móvel').includes(term) ||
                (recurso.createdBy?.name || '').toLowerCase().includes(term) ||
                (recurso.descricao || '').toLowerCase().includes(term) ||
                (recurso.observacoes || '').toLowerCase().includes(term) ||
                new Date(recurso.created_at).toLocaleDateString('pt-BR').includes(term)
            );
        });
    }, [recursos, searchTerm]);

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'disponivel':
                return 'default';
            case 'manutencao':
                return 'destructive';
            case 'indisponivel':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'disponivel':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'manutencao':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'indisponivel':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'disponivel':
                return <CheckCircle className="h-4 w-4" />;
            case 'manutencao':
                return <AlertTriangle className="h-4 w-4" />;
            case 'indisponivel':
                return <XCircle className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const formatStatus = (status: string) => {
        switch (status.toLowerCase()) {
            case 'disponivel':
                return 'Disponível';
            case 'manutencao':
                return 'Manutenção';
            case 'indisponivel':
                return 'Indisponível';
            default:
                return status;
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Recursos', href: route('recursos.index') }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recursos" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-500">Recursos</h1>
                    <Button asChild className="bg-[#D2CBB9] hover:bg-[#EF7D4C] text-black">
                        <Link href={route('recursos.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Recurso
                        </Link>
                    </Button>
                </div>

                {/* Barra de Busca */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Buscar recursos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {searchTerm && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchTerm('')}
                        >
                            Limpar
                        </Button>
                    )}
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Marca/Modelo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Criado por</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecursos.length > 0 ? (
                                filteredRecursos.map((recurso) => (
                                    <TableRow key={recurso.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-gray-500" />
                                                {recurso.nome}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {recurso.marca && recurso.modelo 
                                                ? `${recurso.marca} - ${recurso.modelo}`
                                                : recurso.marca || recurso.modelo || 'Não informado'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={getStatusVariant(recurso.status)}
                                                className={`${getStatusColor(recurso.status)} flex items-center gap-1 w-fit`}
                                            >
                                                {getStatusIcon(recurso.status)}
                                                {formatStatus(recurso.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={recurso.fixo ? 'default' : 'outline'}
                                                className={
                                                    recurso.fixo 
                                                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                                        : 'bg-gray-100 text-gray-800 border-gray-200'
                                                }
                                            >
                                                {recurso.fixo ? 'Fixo' : 'Móvel'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {recurso.createdBy?.name || 'Sistema'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(recurso.created_at).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={route('recursos.edit', recurso.id)}>
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
                                                                Tem certeza que deseja excluir o recurso {recurso.nome}? 
                                                                Esta ação não pode ser desfeita e pode afetar espaços vinculados.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancelar
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(recurso.id)}
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
                                        {searchTerm
                                            ? `Nenhum recurso encontrado para "${searchTerm}".`
                                            : 'Nenhum recurso encontrado.'
                                        }
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