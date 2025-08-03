import React from "react";
import useEffect from "react";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { X, Users, MapPin } from "lucide-react";
import { type User, type Espaco, type BreadcrumbItem } from '@/types';
import {FilterableTable, type ColumnConfig} from "@/components/ui/filterable-table";
import { ResponsaveisSection } from '@/components/ui/ResponsaveisSection';

interface Usuario {
    id: string;
    name: string;
    email: string;
    perfil_acesso: string;
}

interface ModalDetalhesUsuarioProps {
    isOpen: boolean;
    onClose: () => void;
    usuario: Usuario | null;
    espacos: Espaco[];
}

export function ModalDetalhesUsuario({ isOpen, onClose, usuario, espacos }: ModalDetalhesUsuarioProps) {
    const [selectedEspaco, setSelectedEspaco] = React.useState<Espaco | null>(null);

    React.useEffect(() => {
        if (!isOpen || !usuario) {
            setSelectedEspaco(null);
        }
    }, [isOpen, usuario]);

    if (!isOpen || !usuario) {
        return null;
    }


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

    const handleViewDetailsFromResponsavel = (espaco: Espaco) => {
        console.log('Visualizando detalhes do espaço:', espaco);
        setSelectedEspaco(espaco);
        setScrollToResponsaveis(true);
    };

       const columns : ColumnConfig[] = [
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
        }
    ];

    return (
        <div
            className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-card">
                    <h2 className="text-2xl font-bold text-card-foreground">Detalhes do Usuário</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>

                {/* Conteúdo */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Dados do Usuário */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <label className="text-sm font-medium text-muted-foreground">Nome</label>
                            <p className="text-lg font-semibold">{usuario.name}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                            <p className="text-lg font-semibold">{usuario.email}</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <label className="text-sm font-medium text-muted-foreground">Perfil</label>
                            <p className="text-lg">{usuario.perfil_acesso}</p>
                        </div>
                    </div>

                    <FilterableTable
                        data={espacos}
                        columns={columns}
                        emptyMessage="Nenhum usuário encontrado."
                    />

                    {selectedEspaco ? (
                        <ResponsaveisSection
                            createdBy={selectedEspaco.createdBy}
                            users={selectedEspaco.users}
                        />
                    ) : (
                            <p className="text-muted-foreground text-sm"></p>
                        )}
                </div>


                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/20 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                </div>
            </div>
        </div>
    );
}


