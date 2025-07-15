import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AtribuirPermissoesCreateProps {
    users: {
        id: number;
        name: string;
        espacos?: Array<{ id: number; nome: string }>;
    }[];
    espacos: {
        id: number;
        nome: string;
    }[];
}

export default function Create({ users, espacos }: AtribuirPermissoesCreateProps) {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedEspacos, setSelectedEspacos] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        user_id: null as number | null,
        espaco_ids: [] as number[],
    });

    // Filtrar espaços baseado no termo de busca
    const filteredEspacos = espacos.filter(espaco =>
        espaco.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Quando seleciona um usuário
    const handleUserSelect = (userId: number) => {
        setSelectedUserId(userId);
        setData('user_id', userId);

        // Preencher com espaços já associados ao usuário
        const user = users.find(u => u.id === userId);
        const espacoIds = user?.espacos?.map(e => e.id) || [];
        setSelectedEspacos(espacoIds);
        setData('espaco_ids', espacoIds);
    };

    // Alternar seleção de espaço
    const toggleEspaco = (espacoId: number) => {
        const newSelected = selectedEspacos.includes(espacoId)
            ? selectedEspacos.filter(id => id !== espacoId)
            : [...selectedEspacos, espacoId];

        setSelectedEspacos(newSelected);
        setData('espaco_ids', newSelected);
    };

    // Enviar os dados para o controller
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId || selectedEspacos.length === 0) {
            return;
        }

        router.post(route('espaco-users.store'), {
            user_id: selectedUserId,
            espaco_ids: selectedEspacos,
        }, {
            onSuccess: () => {
                // Limpar seleção após sucesso
                setSelectedUserId(null);
                setSelectedEspacos([]);
                setData({
                    user_id: null,
                    espaco_ids: [],
                });
                setSearchTerm('');
            },
        });
    };

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <AppLayout>
            <Head title="Atribuir Permissões" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Button asChild variant="ghost" className="pl-0">
                            <Link href={route('espaco-users.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground mt-2">Atribuir Permissões</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Painel de seleção de usuário */}
                        <div className="lg:col-span-1">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="text-lg">Selecionar Usuário</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user" className="text-muted-foreground">
                                            Usuário
                                        </Label>
                                        <Select
                                            onValueChange={(value) => handleUserSelect(Number(value))}
                                            value={selectedUserId?.toString() || ''}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione um usuário" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map(user => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={user.id.toString()}
                                                    >
                                                        {user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.user_id && (
                                            <p className="text-destructive text-sm mt-1">{errors.user_id}</p>
                                        )}
                                    </div>

                                    {selectedUser && (
                                        <div className="border rounded-lg p-4 bg-muted">
                                            <h3 className="font-semibold text-foreground">{selectedUser.name}</h3>
                                            <div className="mt-2 flex items-center">
                                                <span className="text-sm text-muted-foreground">
                                                    Espaços atribuídos:
                                                </span>
                                                <Badge variant="secondary" className="ml-2">
                                                    {selectedUser.espacos?.length || 0}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Painel de seleção de espaços */}
                        <div className="lg:col-span-2">
                            <Card className="h-full">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">Selecionar Espaços</CardTitle>
                                        <div className="text-sm text-muted-foreground">
                                            {selectedEspacos.length} selecionados
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 flex flex-col h-[calc(100%-65px)]">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Pesquisar Espaços</Label>
                                        <Input
                                            placeholder="Digite para filtrar espaços..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Espaços selecionados */}
                                    <div className="mt-2">
                                        <Label className="text-muted-foreground">Espaços Selecionados</Label>
                                        <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
                                            {selectedEspacos.length > 0 ? (
                                                espacos
                                                    .filter(e => selectedEspacos.includes(e.id))
                                                    .map(espaco => (
                                                        <Badge
                                                            key={espaco.id}
                                                            variant="secondary"
                                                            className="px-3 py-1"
                                                        >
                                                            {espaco.nome}
                                                        </Badge>
                                                    ))
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    Nenhum espaço selecionado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {errors.espaco_ids && (
                                        <p className="text-destructive text-sm">{errors.espaco_ids}</p>
                                    )}

                                    {/* Lista de espaços */}
                                    <div className="border rounded-lg divide-y bg-background flex-grow overflow-auto max-h-[300px]">
                                        {filteredEspacos.length > 0 ? (
                                            filteredEspacos.map(espaco => (
                                                <div
                                                    key={espaco.id}
                                                    className="p-4 hover:bg-accent transition-colors flex items-center"
                                                >
                                                    <Checkbox
                                                        id={`espaco-${espaco.id}`}
                                                        checked={selectedEspacos.includes(espaco.id)}
                                                        onCheckedChange={() => toggleEspaco(espaco.id)}
                                                        className="mr-3"
                                                    />
                                                    <Label
                                                        htmlFor={`espaco-${espaco.id}`}
                                                        className="flex-grow cursor-pointer"
                                                    >
                                                        <p className="font-medium text-foreground">{espaco.nome}</p>
                                                    </Label>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <p className="text-muted-foreground">Nenhum espaço encontrado</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botão de salvar */}
                                    <div className="flex justify-end pt-4 border-t mt-auto">
                                        <Button
                                            type="submit"
                                            disabled={processing || selectedEspacos.length === 0 || !selectedUserId}
                                            className="gap-2"
                                        >
                                            <Save className="h-4 w-4" />
                                            {processing ? 'Salvando...' : 'Salvar Permissões'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
