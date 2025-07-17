import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type User, type Localizacao, type Recurso, type Espaco, type BreadcrumbItem } from '@/types';
import { FormEventHandler, ChangeEvent } from 'react';

// Tipo para o formulário de edição
type EspacoEditFormData = {
    nome: string;
    descricao: string;
    capacidade: string;
    localizacao_id: string;
    status: 'ativo' | 'inativo' | 'manutencao';
    disponivel_reserva: boolean;
    recursos: number[];
};

interface EspacosEditProps {
    auth: {
        user: User;
    };
    espaco: Espaco;
    localizacoes: Localizacao[];
    recursos: Recurso[];
}

export default function EspacosEdit({ auth, espaco, localizacoes, recursos }: EspacosEditProps) {
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

    const { data, setData, put, processing, errors } = useForm<Required<EspacoEditFormData>>({
        nome: espaco.nome || '',
        descricao: espaco.descricao || '',
        capacidade: espaco.capacidade?.toString() || '',
        localizacao_id: espaco.localizacao_id?.toString() || '',
        status: espaco.status || 'ativo',
        disponivel_reserva: espaco.disponivel_reserva || false,
        recursos: espaco.recursos?.map(r => r.id) || [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/espacos/${espaco.id}`);
    };

    const handleRecursoChange = (recursoId: number, checked: boolean) => {
        if (checked) {
            setData('recursos', [...data.recursos, recursoId]);
        } else {
            setData('recursos', data.recursos.filter(id => id !== recursoId));
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaços', href: '/espacos' },
        { title: 'Editar Espaço', href: `/espacos/${espaco.id}/editar` }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Espaço - ${espaco.nome}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/espacos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-black dark:text-white">Editar espaço</h1>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome *</Label>
                                    <Input
                                        id="nome"
                                        type="text"
                                        value={data.nome}
                                        onChange={(e) => setData('nome', e.target.value)}
                                        placeholder="Nome do espaço"
                                        className={errors.nome ? 'border-red-500' : ''}
                                    />
                                    {errors.nome && (
                                        <p className="text-sm text-red-500">{errors.nome}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="capacidade">Capacidade *</Label>
                                    <Input
                                        id="capacidade"
                                        type="number"
                                        min="1"
                                        value={data.capacidade}
                                        onChange={(e) => setData('capacidade', e.target.value)}
                                        placeholder="Número de pessoas"
                                        className={errors.capacidade ? 'border-red-500' : ''}
                                    />
                                    {errors.capacidade && (
                                        <p className="text-sm text-red-500">{errors.capacidade}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição</Label>
                                <Textarea
                                    id="descricao"
                                    value={data.descricao}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setData('descricao', e.target.value)}
                                    placeholder="Descrição do espaço"
                                    rows={3}
                                    className={errors.descricao ? 'border-red-500' : ''}
                                />
                                {errors.descricao && (
                                    <p className="text-sm text-red-500">{errors.descricao}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="localizacao_id">Localização *</Label>
                                    <Select
                                        value={data.localizacao_id}
                                        onValueChange={(value) => setData('localizacao_id', value)}
                                    >
                                        <SelectTrigger className={errors.localizacao_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Selecione uma localização" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {localizacoes.map((localizacao) => (
                                                <SelectItem key={localizacao.id} value={localizacao.id.toString()}>
                                                    {localizacao.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.localizacao_id && (
                                        <p className="text-sm text-red-500">{errors.localizacao_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => setData('status', value as 'ativo' | 'inativo' | 'manutencao')}
                                    >
                                        <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ativo">Ativo</SelectItem>
                                            <SelectItem value="inativo">Inativo</SelectItem>
                                            <SelectItem value="manutencao">Manutenção</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-500">{errors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="disponivel_reserva"
                                    checked={data.disponivel_reserva}
                                    onCheckedChange={(checked) => setData('disponivel_reserva', Boolean(checked))}
                                />
                                <Label htmlFor="disponivel_reserva">
                                    Disponível para reserva
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recursos Disponíveis - PRIMEIRO */}
                    {recursos.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recursos Disponíveis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recursos.map((recurso) => (
                                        <div key={recurso.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`recurso-${recurso.id}`}
                                                checked={data.recursos.includes(recurso.id)}
                                                onCheckedChange={(checked) => 
                                                    handleRecursoChange(recurso.id, Boolean(checked))
                                                }
                                            />
                                            <Label htmlFor={`recurso-${recurso.id}`}>
                                                {recurso.nome}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.recursos && (
                                    <p className="text-sm text-red-500 mt-2">{errors.recursos}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Responsável pelo Espaço - SEGUNDO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Responsável pelo Espaço</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(espaco.createdBy || espaco.responsavel) ? (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                            <span className="text-lg font-medium text-primary">
                                                {(espaco.createdBy?.name || espaco.responsavel?.name || "").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-card-foreground">
                                                {espaco.createdBy?.name || espaco.responsavel?.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {espaco.createdBy?.email || espaco.responsavel?.email}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerfilColor(espaco.createdBy?.perfil_acesso || espaco.responsavel?.perfil_acesso)}`}>
                                                {formatPerfil(espaco.createdBy?.perfil_acesso || espaco.responsavel?.perfil_acesso)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-muted/30 p-4 rounded-lg border border-border text-center">
                                    <p className="text-muted-foreground">Responsável não definido</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </form>

                {/* Seção de Fotos - Separada do formulário */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fotos do Espaço</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PhotoUpload
                            espacoId={espaco.id}
                            fotos={espaco.fotos || []}
                            maxFiles={10}
                            maxFileSize={5}
                        />
                    </CardContent>
                </Card>

                {/* Botões de Ação - No final, igual ao Create */}
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={submit}
                        className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button 
                        type="button" 
                        variant="outline"
                        asChild
                    >
                        <Link href="/espacos">
                            Cancelar
                        </Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}