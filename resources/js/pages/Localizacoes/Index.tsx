import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Building } from 'lucide-react';
import { type User, type Localizacao, type BreadcrumbItem } from '@/types';
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

interface LocalizacoesIndexProps {
    auth: {
        user: User;
    };
    localizacoes: Localizacao[];
}

export default function LocalizacoesIndex({ auth, localizacoes }: LocalizacoesIndexProps) {
    const handleDelete = (id: number) => {
        router.delete(`/localizacoes/${id}`);
    };

    const columns: ColumnConfig[] = [
        {
            key: 'nome',
            label: 'Nome',
            render: (value, localizacao) => (
                <div className="flex items-center gap-2 font-medium">
                    <Building className="h-4 w-4 text-gray-500" />
                    {value}
                </div>
            )
        },
        {
            key: 'descricao',
            label: 'Descrição',
            getValue: (localizacao) => localizacao.descricao || 'Sem descrição'
        },
        {
            key: 'acoes',
            label: 'Ações',
            searchable: false,
            sortable: false,
            render: (value, localizacao) => (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black"

                    >
                        <Link href={`/localizacoes/${localizacao.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-[#F26326] hover:text-black dark:text-[#F26326] dark:hover:text-black"

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
                                    Tem certeza que deseja excluir a localização {localizacao.nome}?
                                    Esta ação não pode ser desfeita e pode afetar espaços vinculados.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(localizacao.id)}
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
        { title: 'Localizações', href: '/localizacoes' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Localizações" />

            <div className="space-y-6">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-black dark:text-white">Localizações</h1>
                    </div>
                    <div className="flex-shrink-0 mr-6">
                        <Button asChild className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black ">
                            <Link href="/localizacoes/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Localização
                            </Link>
                        </Button>
                    </div>
                </div>

                <FilterableTable
                    data={localizacoes}
                    columns={columns}
                    emptyMessage="Nenhuma localização encontrada."
                />
            </div>
        </AppLayout>
    );
}
