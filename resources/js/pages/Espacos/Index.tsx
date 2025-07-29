import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, MapPin, Users, Eye, X, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { type User, type Espaco, type BreadcrumbItem } from '@/types';
import { FilterableTable, type ColumnConfig } from '@/components/ui/filterable-table';
import { UserAvatar } from '@/components/user-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useState, useEffect } from 'react';

interface EspacosIndexProps {
    auth: {
        user: User;
    };
    espacos: Espaco[];
}

interface Foto {
    id: number;
    url: string;
    nome_original: string;
    descricao?: string;
    ordem: number;
}

export default function EspacosIndex({ auth, espacos }: EspacosIndexProps) {
    const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);
    const [isFotoModalOpen, setIsFotoModalOpen] = useState(false);
    const [scrollToResponsaveis, setScrollToResponsaveis] = useState(false);

    const handleDelete = (id: number) => {
        router.delete(`/espacos/${id}`);
    };

    const handleViewDetails = (espaco: Espaco) => {
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
        setIsModalOpen(false);
        setSelectedEspaco(null);
        setScrollToResponsaveis(false);
    };

    // useEffect para fazer scroll para responsáveis quando necessário
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

    const handleViewFoto = (foto: Foto) => {
        setSelectedFoto(foto);
        setIsFotoModalOpen(true);
    };

    const closeFotoModal = () => {
        setIsFotoModalOpen(false);
        setSelectedFoto(null);
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

    const formatPerfil = (perfil: string | undefined) => {
        if (!perfil) return "Não definido";
        return perfil.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
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

    const columns: ColumnConfig[] = [
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
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'manutencao', label: 'Manutenção' }
            ],
            render: (value, espaco) => (
                <Badge
                    variant={getStatusVariant(espaco.status)}
                    className={getStatusColor(espaco.status)}
                >
                    {formatStatus(espaco.status)}
                </Badge>
            )
        },
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
            key: 'acoes',
            label: 'Ações',
            searchable: false,
            sortable: false,
            render: (value, espaco) => (
                <div className="flex items-center justify-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
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
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black"
                            >
                                <Link href={`/espacos/${espaco.id}/editar`}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Editar</p>
                        </TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-[#F26326] hover:text-black dark:text-[#F26326] dark:hover:text-black"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Excluir</p>
                            </TooltipContent>
                        </Tooltip>
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
            )
        }
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaços', href: '/espacos' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Espaços" />

            <div className="space-y-6">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-black dark:text-white">Espaços</h1>
                    </div>
                    <div className="flex-shrink-0">
                        <Button asChild className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black ">
                            <Link href="/espacos/criar">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Espaço
                            </Link>
                        </Button>
                    </div>
                </div>

                <FilterableTable
                    data={espacos}
                    columns={columns}
                    emptyMessage="Nenhum espaço encontrado."
                />
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
