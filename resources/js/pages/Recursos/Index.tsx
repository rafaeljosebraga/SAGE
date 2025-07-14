import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { type User, type Recurso, type BreadcrumbItem } from '@/types';
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

interface RecursosIndexProps {
    auth: {
        user: User;
    };
    recursos: Recurso[];
}

export default function RecursosIndex({ auth, recursos }: RecursosIndexProps) {
    const handleDelete = (id: number) => {
        router.delete(`/recursos/${id}`);
    };

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

    const columns: ColumnConfig[] = [
        {
            key: 'nome',
            label: 'Nome',
            render: (value, recurso) => (
                <div className="flex items-center gap-2 font-medium">
                    <Package className="h-4 w-4 text-gray-500" />
                    {value}
                </div>
            )
        },
        {
            key: 'marca_modelo',
            label: 'Marca/Modelo',
            getValue: (recurso) => {
                return recurso.marca && recurso.modelo 
                    ? `${recurso.marca} - ${recurso.modelo}`
                    : recurso.marca || recurso.modelo || 'Não informado';
            }
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'disponivel', label: 'Disponível' },
                { value: 'manutencao', label: 'Manutenção' },
                { value: 'indisponivel', label: 'Indisponível' }
            ],
            render: (value, recurso) => (
                <Badge 
                    variant={getStatusVariant(recurso.status)}
                    className={`${getStatusColor(recurso.status)} flex items-center gap-1 w-fit`}
                >
                    {getStatusIcon(recurso.status)}
                    {formatStatus(recurso.status)}
                </Badge>
            )
        },
        {
            key: 'tipo',
            label: 'Tipo',
            type: 'select',
            options: [
                { value: 'true', label: 'Fixo' },
                { value: 'false', label: 'Móvel' }
            ],
            getValue: (recurso) => recurso.fixo ? 'true' : 'false',
            render: (value, recurso) => (
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
            )
        },
        {
            key: 'createdBy.name',
            label: 'Criado por',
            getValue: (recurso) => recurso.createdBy?.name || 'Sistema'
        },
        {
            key: 'created_at',
            label: 'Criado em',
            type: 'date',
            getValue: (recurso) => new Date(recurso.created_at).toLocaleDateString('pt-BR')
        },
        {
            key: 'acoes',
            label: 'Ações',
            searchable: false,
            sortable: false,
            render: (value, recurso) => (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                    >
                        <Link href={`/recursos/${recurso.id}/edit`}>
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
            )
        }
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Recursos', href: '/recursos' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recursos" />

            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-500">Recursos</h1>
                    </div>
                    <div className="flex-shrink-0">
                        <Button asChild className="bg-[#D2CBB9] hover:bg-[#EF7D4C] text-black">
                            <Link href="/recursos/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Recurso
                            </Link>
                        </Button>
                    </div>
                </div>

                <FilterableTable 
                    data={recursos}
                    columns={columns}
                    emptyMessage="Nenhum recurso encontrado."
                />
            </div>
        </AppLayout>
    );
}