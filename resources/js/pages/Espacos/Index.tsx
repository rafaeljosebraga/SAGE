import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, MapPin, Users, Eye, X } from 'lucide-react';
import { type User, type Espaco, type BreadcrumbItem } from '@/types';
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
import { useState } from 'react';

interface EspacosIndexProps {
    auth: {
        user: User;
    };
    espacos: Espaco[];
}

export default function EspacosIndex({ auth, espacos }: EspacosIndexProps) {
    const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = (id: number) => {
        router.delete(`/espacos/${id}`);
    };

    const handleViewDetails = (espaco: Espaco) => {
        setSelectedEspaco(espaco);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEspaco(null);
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
            key: 'responsavel.name',
            label: 'Responsável',
            getValue: (espaco) => espaco.responsavel?.name || 'Não definido'
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(espaco)}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                    >
                        <Link href={`/espacos/${espaco.id}/edit`}>
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
                <div className="flex items-center justify-between px-1">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-500">Espaços</h1>
                    </div>
                    <div className="flex-shrink-0">
                        <Button asChild className="bg-[#D2CBB9] hover:bg-[#EF7D4C] text-black">
                            <Link href="/espacos/create">
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
                        className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                                    <p className="text-lg font-semibold text-card-foreground mt-1">{selectedEspaco.nome}</p>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                                    <p className="text-lg text-card-foreground mt-1">#{selectedEspaco.id}</p>
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

                            {/* Localização e Responsável */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Localização</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                        <p className="text-lg text-card-foreground">
                                            {selectedEspaco.localizacao?.nome || 'Não definida'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                                    <p className="text-lg text-card-foreground mt-1">
                                        {selectedEspaco.responsavel?.name || 'Não definido'}
                                    </p>
                                </div>
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

                            {/* Fotos */}
                            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                <label className="text-sm font-medium text-muted-foreground">Fotos do Espaço</label>
                                {selectedEspaco.fotos && Array.isArray(selectedEspaco.fotos) && selectedEspaco.fotos.length > 0 ? (
                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedEspaco.fotos.map((foto, index) => {
                                            // Garante que a URL seja absoluta
                                            const fotoUrl = foto.startsWith('http') ? foto : `${window.location.origin}${foto}`;
                                            
                                            return (
                                                <div key={index} className="relative group">
                                                    <img 
                                                        src={fotoUrl} 
                                                        alt={`Foto ${index + 1} do espaço ${selectedEspaco.nome}`}
                                                        className="w-full h-32 object-cover rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                parent.innerHTML = `
                                                                    <div class="w-full h-32 bg-muted rounded-lg border border-border flex items-center justify-center">
                                                                        <div class="text-center text-muted-foreground">
                                                                            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                                            </svg>
                                                                            <p class="text-xs">Imagem não encontrada</p>
                                                                        </div>
                                                                    </div>
                                                                `;
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            // Abre a imagem em uma nova aba para visualização completa
                                                            window.open(fotoUrl, '_blank');
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <div className="bg-white/90 dark:bg-black/90 rounded-full p-2">
                                                            <Eye className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="mt-3 flex items-center justify-center py-8 text-muted-foreground">
                                        <div className="text-center">
                                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <p className="text-sm">Nenhuma foto disponível</p>
                                        </div>
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
                                    router.visit(`/espacos/${selectedEspaco.id}/edit`);
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
        </AppLayout>
    );
}
