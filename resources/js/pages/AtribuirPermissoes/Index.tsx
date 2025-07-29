import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { UserIcon, Plus } from 'lucide-react';
import { type User, type Espaco, type BreadcrumbItem } from '@/types';
import { FilterableTable, type ColumnConfig } from '@/components/ui/filterable-table';

interface AtribuirPermissoesIndexProps {
    users: User[];
    espacos: Espaco[];
}


export default function AtribuirPermissoesIndex({ users, espacos }: AtribuirPermissoesIndexProps) {

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
            render: (value) => <span>{value || 'N/A'}</span>
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
                        className="
                            bg-white dark:bg-black
                            text-[#EF7D4C] dark:text-[#EF7D4C]
                            border border-[#EF7D4C]
                            hover:bg-[#EF7D4C] hover:text-white
                            dark:hover:bg-[#EF7D4C] dark:hover:text-white
                            transition-colors
                        "
                        >
                        <Link href={`atribuir-permissoes/${user.id}/criar`}>
                            <Plus className="h-4 w-4" />
                        </Link>
                        </Button>
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">&nbsp;&nbsp;&nbsp;Atribuir Permissões</h1>
                    <FilterableTable
                        data={users}
                        columns={columns}
                        emptyMessage="Nenhum usuário encontrado."
                    />
                </div>
            </div>
        </AppLayout>
    );
}