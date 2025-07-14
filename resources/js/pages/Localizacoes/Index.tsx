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
import { Plus, Pencil, Trash2, MapPin, Building, Search } from 'lucide-react';
import { type User, type Localizacao, type BreadcrumbItem } from '@/types';
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

interface LocalizacoesIndexProps {
    auth: {
        user: User;
    };
    localizacoes: Localizacao[];
}

export default function LocalizacoesIndex({ auth, localizacoes }: LocalizacoesIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id: number) => {
        router.delete(route('localizacoes.destroy', id));
    };

    // Filtrar localizações baseado no termo de busca
    const filteredLocalizacoes = useMemo(() => {
        if (!searchTerm.trim()) {
            return localizacoes;
        }

        const term = searchTerm.toLowerCase();
        return localizacoes.filter((localizacao) => {
            return (
                localizacao.nome.toLowerCase().includes(term) ||
                (localizacao.descricao || '').toLowerCase().includes(term) ||
                (localizacao.createdBy?.name || '').toLowerCase().includes(term) ||
                new Date(localizacao.created_at).toLocaleDateString('pt-BR').includes(term)
            );
        });
    }, [localizacoes, searchTerm]);


    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Localizações', href: route('localizacoes.index') }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Localizações" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-500">Localizações</h1>
                    <Button asChild className="bg-[#D2CBB9] hover:bg-[#EF7D4C] text-black">
                        <Link href={route('localizacoes.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Localização
                        </Link>
                    </Button>
                </div>

                {/* Barra de Busca */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Buscar localizações..."
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
                                <TableHead>Descrição</TableHead>
                                <TableHead>Criado por</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLocalizacoes.length > 0 ? (
                                filteredLocalizacoes.map((localizacao) => (
                                    <TableRow key={localizacao.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-gray-500" />
                                                {localizacao.nome}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {localizacao.descricao || 'Sem descrição'}
                                        </TableCell>
                                        <TableCell>
                                            {localizacao.createdBy?.name || 'Sistema'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(localizacao.created_at).toLocaleDateString('pt-BR')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={route('localizacoes.edit', localizacao.id)}>
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
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-gray-500"
                                    >
                                        {searchTerm
                                            ? `Nenhuma localização encontrada para "${searchTerm}".`
                                            : 'Nenhuma localização encontrada.'
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