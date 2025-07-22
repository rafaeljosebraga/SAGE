import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Users, MapPin, Eye, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterableTable, type ColumnConfig } from '@/components/ui/filterable-table';
import { type User, type Espaco } from '@/types';

interface AtribuirPermissoesCreateProps {
    Users: User[];
    espacos: Espaco[];
    usID: User['id'];
    espacosAtribuidos: number[];
}

export default function Create({espacos,usID }: AtribuirPermissoesCreateProps) {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(usID);
    const [selectedEspacos, setSelectedEspacos] = useState<number[]>(espacosAtribuidos);
    const [searchTerm, setSearchTerm] = useState('');

    const {setData, processing, errors } = useForm({
        user_id: usID,
        espaco_ids: espacosAtribuidos,
    });

    // Atualiza automaticamente quando os IDs mudam
    useEffect(() => {
        setSelectedEspacos(espacosAtribuidos);
        setData('espaco_ids', espacosAtribuidos);
    }, [espacosAtribuidos]);

    // Filtrar espaços baseado no termo de busca
    const filteredEspacos = espacos.filter(espaco =>
        espaco.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
    const columns: ColumnConfig[] = [
        {
            key: 'acoes',
            label: 'Atribuir',
            searchable: false,
            sortable: false,
            render: (value, espaco) => (
                <Checkbox
                    id={`espaco-${espaco.id}`}
                    checked={selectedEspacos.includes(espaco.id)}
                    onCheckedChange={() => toggleEspaco(espaco.id)}
                    className={jaAtribuido ? 'border-2 border-primary' : ''}
                    className="mr-3"
                />
            ),
        },
        {
            key: 'nome',
            label: 'Nome',
            render: (value) => (
                <span className="font-medium">{value}</span>
            )
        },
        {
            key: 'capacidade',
            label: 'Capacidade',
            type: 'number',
            render: (value) => (
                <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    {value}
                </div>
            )
        },
        {
            key: 'localizacao.nome',
            label: 'Localização',
            getValue: (espaco) => espaco.localizacao?.nome || 'Não definida',
            render: (value) => (
                <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {value}
                </div>
            )
        },
        {
            key: 'responsaveis',
            label: 'Responsáveis',
            searchable: true,
            sortable: true,
            getValue: (espaco) => {
                const responsaveis: string[] = [];

                // Adicionar o criador do espaço
                if (espaco.createdBy) {
                    responsaveis.push(espaco.createdBy.name);
                }

                // Adicionar usuários com permissão (excluindo o criador se já estiver na lista)
                if (espaco.users && espaco.users.length > 0) {
                    espaco.users.forEach((user: User) => {
                        if (!responsaveis.includes(user.name)) {
                            responsaveis.push(user.name);
                        }
                    });
                }

                // Para ordenação, retornar o primeiro responsável (principal)
                return responsaveis.length > 0 ? responsaveis[0] : 'Não definido';
            },
            getSearchValue: (espaco) => {
                const responsaveis: string[] = [];

                // Adicionar o criador do espaço
                if (espaco.createdBy) {
                    responsaveis.push(espaco.createdBy.name);
                }

                // Adicionar usuários com permissão (excluindo o criador se já estiver na lista)
                if (espaco.users && espaco.users.length > 0) {
                    espaco.users.forEach((user: User) => {
                        if (!responsaveis.includes(user.name)) {
                            responsaveis.push(user.name);
                        }
                    });
                }

                // Para busca, retornar todos os nomes concatenados
                return responsaveis.join(' ');
            },
            render: (value, espaco) => {
                const responsaveis: string[] = [];

                // Adicionar o criador do espaço
                if (espaco.createdBy) {
                    responsaveis.push(espaco.createdBy.name);
                }

                // Adicionar usuários com permissão (excluindo o criador se já estiver na lista)
                if (espaco.users && espaco.users.length > 0) {
                    espaco.users.forEach((user: User) => {
                        if (!responsaveis.includes(user.name)) {
                            responsaveis.push(user.name);
                        }
                    });
                }

                if (responsaveis.length === 0) {
                    return <span className="text-muted-foreground px-3 py-1.5 font-medium">Não definido</span>;
                }

                if (responsaveis.length === 1) {
                    return (
                        <button
                            onClick={() => handleViewDetailsFromResponsavel(espaco)}
                            className="text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] font-medium"
                        >
                            {responsaveis[0]}
                        </button>
                    );
                }

                return (
                    <button
                        onClick={() => handleViewDetailsFromResponsavel(espaco)}
                        className="text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] font-medium"
                    >
                        {responsaveis[0]}, ...
                    </button>
                );
            }
        },
        // {
        //     key: 'status',
        //     label: 'Status',
        //     type: 'select',
        //     options: [
        //         { value: 'ativo', label: 'Ativo' },
        //         { value: 'inativo', label: 'Inativo' },
        //         { value: 'manutencao', label: 'Manutenção' }
        //     ],
        //     render: (value, espaco) => (
        //         <Badge
        //             variant={getStatusVariant(espaco.status)}
        //             className={getStatusColor(espaco.status)}
        //         >
        //             {formatStatus(espaco.status)}
        //         </Badge>
        //     )
        // },
        {
            key: 'disponivel_reserva',
            label: 'Disponível para Reserva',
            type: 'select',
            options: [
                { value: 'true', label: 'Sim' },
                { value: 'false', label: 'Não' }
            ],
            getValue: (espaco) => espaco.disponivel_reserva ? 'true' : 'false',
            render: (value, espaco) => (
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
            )
        },
    ];



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
                    <div>

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


                                    {/* Lista de espaços */}
                                    <div className="border rounded-lg divide-y bg-background flex-grow overflow-auto max-h-[300px]">
                                        <FilterableTable
                                            data={espacos}
                                            columns={columns}
                                            emptyMessage="Nenhum espaço encontrado."
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
