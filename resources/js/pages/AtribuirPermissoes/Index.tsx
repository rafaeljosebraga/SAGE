import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type User, type Espaco } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AtribuirPermissoesIndexProps {
    users: User[];
    espacos: Espaco[];
}

export default function AtribuirPermissoesIndex({ users, espacos }: AtribuirPermissoesIndexProps) {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedEspacos, setSelectedEspacos] = useState<Espaco[]>([]);

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);

        if (userId) {
            const user = users.find(u => u.id.toString() === userId);
            setSelectedEspacos(user?.espacos || []);
        } else {
            setSelectedEspacos([]);
        }
    };

    return (
        <AppLayout>
            <Head title="Atribuir Permissões" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-foreground">Atribuir Permissões</h1>
                    <Button asChild>
                        <Link href={route('espaco-users.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Atribuição
                        </Link>
                    </Button>
                </div>

                <div className="bg-card rounded-lg shadow p-6 border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-foreground">Selecionar Usuário</h2>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-muted-foreground">
                                        Usuário
                                    </label>
                                    <Select onValueChange={handleUserSelect} value={selectedUserId}>
                                        <SelectTrigger className="w-full bg-background">
                                            <SelectValue placeholder="Selecione um usuário" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border">
                                            {users.map(user => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id.toString()}
                                                    className="hover:bg-accent focus:bg-accent"
                                                >
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="bg-muted rounded-lg p-4 border border-border">
                                    <h3 className="font-medium text-muted-foreground">Total de Usuários</h3>
                                    <p className="text-2xl font-bold text-primary">{users.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="space-y-4">
                                {selectedUserId ? (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-xl font-semibold text-foreground">
                                                Espaços do Usuário
                                            </h2>
                                            <span className="text-sm text-muted-foreground">
                                                {selectedEspacos.length} espaço(s) atribuído(s)
                                            </span>
                                        </div>

                                        {selectedEspacos.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {selectedEspacos.map(espaco => (
                                                    <div
                                                        key={espaco.id}
                                                        className="border border-border rounded-lg p-4 bg-background hover:bg-accent transition-colors"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-medium text-foreground">{espaco.nome}</h3>
                                                            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                                                                Ativo
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 flex items-center text-sm text-muted-foreground">
                                                            <span className="bg-primary/10 text-primary rounded px-2 py-1 mr-2">
                                                                ID: {espaco.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed rounded-lg p-8 text-center border-border">
                                                <div className="text-muted-foreground mb-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-medium text-foreground mb-1">Nenhum espaço atribuído</h3>
                                                <p className="text-muted-foreground">
                                                    Este usuário ainda não tem espaços associados.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center border-border">
                                        <div className="text-muted-foreground mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-foreground mb-1">Selecione um usuário</h3>
                                        <p className="text-muted-foreground">
                                            Escolha um usuário na lista à esquerda para ver seus espaços atribuídos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
