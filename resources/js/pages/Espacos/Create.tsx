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
import { type User, type Localizacao, type Recurso, type BreadcrumbItem } from '@/types';
import { FormEventHandler, useState, useEffect } from 'react';

// Interface local para fotos (compatível com PhotoUpload)
interface FotoLocal {
    id?: number;
    url: string;
    nome_original: string;
    descricao?: string;
    ordem: number;
}

// Tipo para o formulário
type EspacoFormData = {
    nome: string;
    descricao: string;
    capacidade: string;
    localizacao_id: string;
    status: 'ativo' | 'inativo' | 'manutencao';
    disponivel_reserva: boolean;
    recursos: number[];
    fotos: File[];
    descricoes: string[];
};

interface EspacosCreateProps {
    auth: {
        user: User;
    };
    localizacoes: Localizacao[];
    recursos: Recurso[];
}

export default function EspacosCreate({ auth, localizacoes, recursos }: EspacosCreateProps) {
    const [fotos, setFotos] = useState<FotoLocal[]>([]);
    const [arquivosOriginais, setArquivosOriginais] = useState<File[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm<Required<EspacoFormData>>({
        nome: '',
        descricao: '',
        capacidade: '',
        localizacao_id: '',
        status: 'ativo',
        disponivel_reserva: true,
        recursos: [],
        fotos: [],
        descricoes: [],
    });

    // Sincronizar fotos com o formulário sempre que mudarem
    useEffect(() => {
        setData('fotos', arquivosOriginais);
        setData('descricoes', fotos.map(foto => foto.descricao || ''));
    }, [arquivosOriginais, fotos]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        post('/espacos', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setFotos([]);
                setArquivosOriginais([]);
            },
        });
    };

    const handleRecursoChange = (recursoId: number, checked: boolean) => {
        if (checked) {
            setData('recursos', [...data.recursos, recursoId]);
        } else {
            setData('recursos', data.recursos.filter(id => id !== recursoId));
        }
    };
    
    const handleFotosChange = (novasFotos: FotoLocal[]) => {
        setFotos(novasFotos);
    };
    
    const handleArquivosChange = (novosArquivos: File[]) => {
        setArquivosOriginais(novosArquivos);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaços', href: '/espacos' },
        { title: 'Criar Espaço', href: '/espacos/criar' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Criar Espaço" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/espacos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-black dark:text-white">Criar espaço</h1>
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
                                        value={data.capacidade}
                                        onChange={(e) => setData('capacidade', e.target.value)}
                                        placeholder="Ex: 50"
                                        min="1"
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
                                    onChange={(e) => setData('descricao', e.target.value)}
                                    placeholder="Descreva o espaço..."
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
                                    onCheckedChange={(checked) => {
                                        setData('disponivel_reserva', Boolean(checked));
                                    }}
                                />
                                <Label htmlFor="disponivel_reserva">
                                    Disponível para reserva
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

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
                                                onCheckedChange={(checked) => {
                                                    handleRecursoChange(recurso.id, Boolean(checked));
                                                }}
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

                    {/* Seção de Fotos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fotos do Espaço</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PhotoUpload
                                fotos={fotos}
                                onFotosChange={handleFotosChange}
                                onArquivosChange={handleArquivosChange}
                                maxFiles={10}
                                maxFileSize={5}
                            />
                            {errors.fotos && (
                                <p className="text-sm text-red-500 mt-2">{errors.fotos}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Salvando...' : 'Salvar Espaço'}
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
                </form>
            </div>
        </AppLayout>
    );
}