import { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Users, MapPin, Eye, Pencil, X, ImageIcon, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterableTable, type ColumnConfig } from '@/components/ui/filterable-table';
import { type User, type Espaco, type BreadcrumbItem } from '@/types';
import { UserAvatar } from '@/components/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AtribuirPermissoesCreateProps {
    Users: User[];
    espacos: Espaco[];
    usID: User['id'];
    espacosAtribuidos: number[];
}

export default function Create({espacos,usID, espacosAtribuidos}: AtribuirPermissoesCreateProps) {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(usID);
    const [selectedEspacos, setSelectedEspacos] = useState<number[]>(espacosAtribuidos);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFoto, setSelectedFoto] = useState<any | null>(null);
    const [isFotoModalOpen, setIsFotoModalOpen] = useState(false);
    const [scrollToResponsaveis, setScrollToResponsaveis] = useState(false);
    const [removedEspacos, setRemovedEspacos] = useState<number[]>([]);

    const {setData, processing, errors } = useForm<{
        user_id: number;
        espaco_ids: number[];
    }>({
        user_id: usID,
        espaco_ids: espacosAtribuidos,
    });


    // Função para atualizar espaços selecionados
    const atualizarEspacosSelecionados = (espacos: number[]) => {
        setSelectedEspacos(espacos);
        setData('espaco_ids', espacos);
        setRemovedEspacos([]); // Limpa removidos ao atualizar atribuídos
    };

    useEffect(() => {
        if (isModalOpen && scrollToResponsaveis) {
            // Aguardar um pouco para o modal renderizar completamente
            setTimeout(() => {
                const responsaveisElement = document.getElementById('responsaveis-section');
                if (responsaveisElement) {
                    responsaveisElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                setScrollToResponsaveis(false);
            }, 300);
        }
    }, [isModalOpen, scrollToResponsaveis]);

    const handleViewDetails = (espaco: Espaco) => {
        console.log("ABRINDO MODAL DE DETALHES");
        setSelectedEspaco(espaco);
        setIsModalOpen(true);
        setScrollToResponsaveis(false);
    };

    const handleViewDetailsFromResponsavel = (espaco: Espaco) => {
        setSelectedEspaco(espaco);
        setIsModalOpen(true);
        setScrollToResponsaveis(true);
    };

    const closeModal = () => {

        console.log("Matando o modal");
        setIsModalOpen(false);
        setSelectedEspaco(null);
        setScrollToResponsaveis(false);
    };

    const handleViewFoto = (foto: any) => {
        setSelectedFoto(foto);
        setIsFotoModalOpen(true);
    };

    const closeFotoModal = () => {
        setIsFotoModalOpen(false);
        setSelectedFoto(null);
    };

    const disposedEspacos = espacosAtribuidos.filter(id => !selectedEspacos.includes(id));
    // Alternar seleção de espaço
    const toggleEspaco = (espacoId: number) => {
        let newSelected: number[];
        if (selectedEspacos.includes(espacoId)) {
            newSelected = selectedEspacos.filter(id => id !== espacoId);
            // Se estava originalmente atribuído, registra como removido
            if (espacosAtribuidos.includes(espacoId)) {
                setRemovedEspacos(prev => [...prev, espacoId]);
            }
        } else {
            newSelected = [...selectedEspacos, espacoId];
            // Se estava removido e foi marcado de novo, remove dos removidos
            setRemovedEspacos(prev => prev.filter(id => id !== espacoId));
        }
        atualizarEspacosSelecionados(newSelected);
    };

// Enviar os dados para o controller
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando dados para o controller",disposedEspacos);

    if (!selectedUserId || (selectedEspacos.length === 0 && disposedEspacos.length === 0)) {
        return;
    }

    console.log(selectedUserId, selectedEspacos, disposedEspacos);
    router.post(route('espaco-users.store'), {
        user_id: selectedUserId,
        espaco_ids: selectedEspacos,
        espaco_ids_removidos: disposedEspacos,
    }, {
        onSuccess: () => {
            console.log("Dados enviados deu merda");
            // Limpar seleção após sucesso
            setSelectedUserId(null);
            setSelectedEspacos([]);
            setData('espaco_ids', []);
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
    const getPerfilColor = (perfil: string | undefined) => {
        if (!perfil) return "bg-gray-100 text-gray-800 border-gray-200";

        switch (perfil.toLowerCase()) {
            case "administrador":
                return "bg-[#EF7D4C] text-white border-transparent";
            case "coordenador":
                return "bg-[#957157] text-white border-transparent";
            case "diretor_geral":
                return "bg-[#F1DEC5] text-gray-600 border-transparent";
            case "servidores":
                return "bg-[#285355] text-white border-transparent";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };
    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return "Não definido";
        return perfil.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const columns: ColumnConfig[] = [
        {
            key: 'atribuir',
            label: 'Atribuir',
            searchable: false,
            sortable: false,
            render: (value, espaco) => {
                const isDisposed = disposedEspacos.includes(espaco.id);
                return (
                    <Checkbox
                        id={`espaco-${espaco.id}`}
                        checked={selectedEspacos.includes(espaco.id)}
                        onCheckedChange={() => toggleEspaco(espaco.id)}
                        className={`mr-3 ${isDisposed ? 'border-2 border-red-500' : ''}`}
                    />
                );
            }
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
                            type="button"
                            onClick={() => handleViewDetailsFromResponsavel(espaco)}
                            className="text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] font-medium"
                        >
                            {responsaveis[0]}
                        </button>
                    );
                }

                return (
                    <button
                        type="button"
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
        {
            key: 'Visualizar',
            label: 'Ação',
            searchable: false,
            sortable: false,
            render: (value, espaco) => (
                <div className="flex items-center justify-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => handleViewDetails(espaco)}
                                className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-blue-700 dark:text-blue-700"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Visualizar</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )
        }
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Atribuir Permissões', href: '/atribuir-permissoes' },
        { title: 'Atribuir Permissões ao Usuário', href: `/atribuir-permissoes/${usID}/criar` }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Atribuir Permissões" />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" type="button">
                    <Link
                        href={route('espaco-users.index')}
                        className="
                        ml-4
                        bg-white dark:bg-black
                        text-[#EF7D4C] dark:text-[#EF7D4C]
                        border border-[#EF7D4C]
                        hover:!bg-[#EF7D4C] hover:!text-white
                        dark:hover:!bg-[#EF7D4C] dark:hover:!text-white
                        transition-colors
                        pl-0
                        inline-flex items-center
                        "
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Link>
                    </Button>

                    <h1 className="text-3xl font-bold text-foreground">Atribuir Permissões</h1>
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


                                    {/* Lista de espaços */}
                                        <FilterableTable
                                            data={espacos}
                                            columns={columns}
                                            emptyMessage="Nenhum espaço encontrado."
                                        />
                                    {/* Espaços selecionados */}
                                    { selectedEspacos.length > 0 && (
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
                                    )}
                                    {/* Espaços desmarcados (deselecionados) que estavam atribuídos */}
                                    { disposedEspacos.length > 0 && (
                                    <div className="mt-2">
                                        <Label className="text-muted-foreground">Espaços Removidos</Label>
                                        <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
                                            {espacosAtribuidos.filter(id => !selectedEspacos.includes(id)).length > 0 ? (
                                                espacos
                                                .filter(e => espacosAtribuidos.includes(e.id) && !selectedEspacos.includes(e.id))
                                                .map(espaco => (
                                                    <Badge
                                                        key={espaco.id}
                                                        variant="destructive"
                                                        className="px-3 py-1"
                                                    >
                                                        {espaco.nome}
                                                    </Badge>
                                                ))
                                            ) : (
                                                    <span className="text-muted-foreground text-sm">
                                                        Nenhum espaço removido
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                    )}

                                    {errors.espaco_ids && (
                                        <p className="text-destructive text-sm">{errors.espaco_ids}</p>
                                    )}


                                    {/* Botão de salvar */}
                                    <div className="flex justify-end pt-4 border-t mt-auto">
                                        <Button
                                            type="submit"
                                            disabled={processing || (selectedEspacos.length === 0 && disposedEspacos.length === 0) || !selectedUserId}
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

            {/* Modal de Detalhes do Espaço */}
            {isModalOpen && selectedEspaco && (
                <div
                    className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50"
                    onClick={closeModal}
                >
                    <div
                        className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
                            <h2 className="text-2xl font-bold text-card-foreground">
                                Detalhes do Espaço
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeModal}
                                className="text-muted-foreground hover:text-card-foreground rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-card">
                            {/* Informações Básicas */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                                    <p className="text-lg font-semibold text-card-foreground mt-1">{selectedEspaco.nome}</p>
                                </div>
                            </div>

                            {/* Capacidade e Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Capacidade</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-lg text-card-foreground">{selectedEspaco.capacidade} pessoas</p>
                                    </div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        <Badge
                                            variant={getStatusVariant(selectedEspaco.status)}
                                            className={`${getStatusColor(selectedEspaco.status)} text-sm rounded-full`}
                                        >
                                            {formatStatus(selectedEspaco.status)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Localização */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="text-sm font-medium text-muted-foreground">Localização</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                    <p className="text-lg text-card-foreground">
                                        {selectedEspaco.localizacao?.nome || 'Não definida'}
                                    </p>
                                </div>
                            </div>

                            {/* Responsáveis */}
                            <div id="responsaveis-section" className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="text-sm font-medium text-muted-foreground">Responsáveis</label>
                                {(() => {
                                    const responsaveis: Array<User & { tipo: string }> = [];

                                    // Adicionar o criador do espaço
                                    if (selectedEspaco.createdBy) {
                                        responsaveis.push({
                                            ...selectedEspaco.createdBy,
                                            tipo: 'Criador'
                                        });
                                    }

                                    // Adicionar usuários com permissão (excluindo o criador se já estiver na lista)
                                    if (selectedEspaco.users && selectedEspaco.users.length > 0) {
                                        selectedEspaco.users.forEach((user: User) => {
                                            if (!responsaveis.find(r => r.id === user.id)) {
                                                responsaveis.push({
                                                    ...user,
                                                    tipo: 'Com Permissão'
                                                });
                                            }
                                        });
                                    }

                                    return responsaveis.length > 0 ? (
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {responsaveis.map((responsavel, index) => (
                                                <div key={responsavel.id} className="bg-background/50 p-3 rounded-md border border-border">
                                                    <div className="flex items-start gap-2">
                                                        <UserAvatar user={responsavel} size="md" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-sm font-medium text-card-foreground break-words">
                                                                    {responsavel.name}
                                                                </p>
                                                                <Badge variant="outline" className="text-xs self-start">
                                                                    {responsavel.tipo}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground break-words mt-1">
                                                                {responsavel.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerfilColor(responsavel.perfil_acesso)}`}>
                                                            {formatPerfil(responsavel.perfil_acesso)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-lg text-card-foreground mt-1">Não definido</p>
                                    );
                                })()}
                            </div>

                            {/* Disponibilidade para Reserva */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="text-sm font-medium text-muted-foreground">Disponível para Reserva</label>
                                <div className="mt-1">
                                    <Badge
                                        variant={selectedEspaco.disponivel_reserva ? 'default' : 'secondary'}
                                        className={`text-sm rounded-full ${
                                            selectedEspaco.disponivel_reserva
                                                ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                                : 'bg-muted text-muted-foreground border-border'
                                        }`}
                                    >
                                        {selectedEspaco.disponivel_reserva ? 'Sim' : 'Não'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Descrição */}
                            {selectedEspaco.descricao && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                                    <p className="text-card-foreground mt-1 leading-relaxed">{selectedEspaco.descricao}</p>
                                </div>
                            )}

                            {/* Observações */}
                            {selectedEspaco.observacoes && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                                    <p className="text-card-foreground mt-1 leading-relaxed">{selectedEspaco.observacoes}</p>
                                </div>
                            )}

                            {/* Recursos */}
                            {selectedEspaco.recursos && selectedEspaco.recursos.length > 0 && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Recursos Disponíveis</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedEspaco.recursos.map((recurso) => (
                                            <Badge
                                                key={recurso.id}
                                                variant="outline"
                                                className="text-sm rounded-full border-border text-card-foreground"
                                            >
                                                {recurso.nome}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fotos do Espaço */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Fotos do Espaço
                                        {selectedEspaco.fotos && selectedEspaco.fotos.length > 0 && (
                                            <span className="ml-1">({selectedEspaco.fotos.length})</span>
                                        )}
                                    </label>
                                </div>

                                {selectedEspaco.fotos && selectedEspaco.fotos.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {selectedEspaco.fotos.filter(foto => foto.url && foto.url !== '/storage/' && foto.url.length > 10).map((foto) => (
                                            <div
                                                key={foto.id}
                                                className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                                                onClick={() => handleViewFoto(foto)}
                                            >
                                                <img
                                                    src={foto.url}
                                                    alt={foto.nome_original}
                                                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ZoomIn className="h-6 w-6 text-white" />
                                                </div>
                                                {/* Descrição sempre visível na parte inferior */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                                                    {foto.descricao ? foto.descricao : 'Sem descrição'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhuma foto cadastrada para este espaço</p>
                                    </div>
                                )}
                            </div>

                            {/* Informações de Auditoria */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border border-t">
                                <h3 className="text-lg font-medium text-card-foreground mb-3">Informações de Auditoria</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-background/50 p-3 rounded-md border border-border">
                                        <label className="text-muted-foreground font-medium">Criado em</label>
                                        <p className="text-card-foreground mt-1">{formatDate(selectedEspaco.created_at)}</p>
                                    </div>
                                    <div className="bg-background/50 p-3 rounded-md border border-border">
                                        <label className="text-muted-foreground font-medium">Atualizado em</label>
                                        <p className="text-card-foreground mt-1">{formatDate(selectedEspaco.updated_at)}</p>
                                    </div>
                                    {selectedEspaco.createdBy && (
                                        <div className="bg-background/50 p-3 rounded-md border border-border">
                                            <label className="text-muted-foreground font-medium">Criado por</label>
                                            <p className="text-card-foreground mt-1">{selectedEspaco.createdBy.name}</p>
                                        </div>
                                    )}
                                    {selectedEspaco.updatedBy && (
                                        <div className="bg-background/50 p-3 rounded-md border border-border">
                                            <label className="text-muted-foreground font-medium">Atualizado por</label>
                                            <p className="text-card-foreground mt-1">{selectedEspaco.updatedBy.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer do Modal */}
                        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/20 flex-shrink-0">
                            <Button
                                onClick={() => {
                                    closeModal();
                                    router.visit(`/espacos/${selectedEspaco.id}/editar`);
                                }}
                                className="bg-[#D2CBB9] hover:bg-[#EF7D4C] text-black rounded-lg"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Visualização de Foto - APENAS IMAGEM */}
            {isFotoModalOpen && selectedFoto && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-60"
                    onClick={closeFotoModal}
                >
                    <div
                        className="bg-card border border-border rounded-xl shadow-2xl max-w-5xl max-h-[95vh] w-full mx-4 overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header do Modal de Foto */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
                            <h3 className="text-lg font-semibold text-card-foreground">
                                {selectedFoto.nome_original}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeFotoModal}
                                className="text-muted-foreground hover:text-card-foreground rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Imagem - Ocupa todo o espaço disponível */}
                        <div className="flex-1 flex items-center justify-center p-6 bg-muted/10">
                            <img
                                src={selectedFoto.url}
                                alt={selectedFoto.nome_original}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
