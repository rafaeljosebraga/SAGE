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
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { type User, type Localizacao, type Recurso, type Espaco, type Foto, type BreadcrumbItem } from '@/types';
import { FormEventHandler, ChangeEvent, useState, useEffect, useRef } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import { useToast } from '@/hooks/use-toast';

// Tipo para o formulário de edição
type EspacoEditFormData = {
    nome: string;
    descricao: string;
    capacidade: string;
    localizacao_id: string;
    status: 'ativo' | 'inativo' | 'manutencao';
    disponivel_reserva: boolean;
    recursos: number[];
    fotos?: string; // Campo opcional para capturar erros de validação de fotos
};

interface EspacosEditProps {
    auth: {
        user: User;
    };
    espaco: Espaco;
    localizacoes: Localizacao[];
    recursos: Recurso[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function EspacosEdit({ auth, espaco, localizacoes, recursos, flash }: EspacosEditProps) {
    const { toast } = useToast();
    const [fotosAtuais, setFotosAtuais] = useState<Foto[]>(espaco.fotos || []);
    const [deveScrollParaErro, setDeveScrollParaErro] = useState(false);
    const [formAlterado, setFormAlterado] = useState(false);

    // Mostrar toasts baseados nas flash messages
    useEffect(() => {
        if (flash?.success) {
            toast({
                title: "Sucesso!",
                description: flash.success,
                variant: "success",
                duration: 5000, // 5 segundos
            });
        }
        if (flash?.error) {
            toast({
                title: "Erro!",
                description: flash.error,
                variant: "destructive",
                duration: 5000, // 5 segundos
            });
        }
    }, [flash, toast]);

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

    const { data, setData, put, processing, errors, clearErrors } = useForm<Required<EspacoEditFormData>>({
        nome: espaco.nome || '',
        descricao: espaco.descricao || '',
        capacidade: espaco.capacidade?.toString() || '',
        localizacao_id: espaco.localizacao_id?.toString() || '',
        status: espaco.status || 'ativo',
        disponivel_reserva: espaco.disponivel_reserva || false,
        recursos: espaco.recursos?.map(r => r.id) || [],
        fotos: '', // Campo vazio para capturar erros
    });

    // Scroll automático para o painel com erro APENAS quando deve fazer scroll
    useEffect(() => {
        if (deveScrollParaErro && Object.keys(errors).length > 0) {
            // Mapeamento de campos para painéis
            const mapeamentoCampoParaPainel = {
                'nome': 'painel-informacoes-basicas',
                'capacidade': 'painel-informacoes-basicas', 
                'descricao': 'painel-informacoes-basicas',
                'localizacao_id': 'painel-configuracoes',
                'status': 'painel-configuracoes',
                'recursos': 'painel-recursos',
                'fotos': 'painel-fotos'
            };

            // Ordem de prioridade dos campos para scroll
            const camposOrdem = ['nome', 'capacidade', 'descricao', 'localizacao_id', 'status', 'recursos', 'fotos'];
            
            // Encontrar o primeiro campo com erro
            const primeiroErro = camposOrdem.find(campo => errors[campo as keyof typeof errors]);
            
            if (primeiroErro) {
                const painelId = mapeamentoCampoParaPainel[primeiroErro as keyof typeof mapeamentoCampoParaPainel];
                const painel = document.getElementById(painelId);
                
                if (painel) {
                    // Verificar se o painel cabe inteiro na tela
                    const painelRect = painel.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    const painelHeight = painelRect.height;
                    
                    // Se o painel cabe na tela, centralizar; senão, mostrar o topo
                    const scrollBehavior = painelHeight <= viewportHeight * 0.8 ? 'center' : 'start';
                    
                    painel.scrollIntoView({
                        behavior: 'smooth',
                        block: scrollBehavior as ScrollLogicalPosition,
                        inline: 'nearest'
                    });
                    
                    console.log(`Scroll para painel: ${painelId} (campo: ${primeiroErro})`);
                } else {
                    console.log(`Painel não encontrado: ${painelId}`);
                }
            }
            
            // Resetar o flag após fazer o scroll
            setDeveScrollParaErro(false);
        }
    }, [errors, deveScrollParaErro]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Ativar o flag para fazer scroll em caso de erro
        setDeveScrollParaErro(true);
        
        put(`/espacos/${espaco.id}`, {
            onSuccess: () => {
                toast({
                    title: "Espaço atualizado com sucesso!",
                    description: `O espaço ${data.nome} foi atualizado no sistema.`,
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
            },
            onError: () => {
                toast({
                    title: "Erro ao atualizar espaço",
                    description: "Ocorreu um erro ao executar a ação, verifique os campos",
                    variant: "destructive",
                    duration: 5000, // 5 segundos
                });
            }
        });
    };

    // Handlers que limpam erros automaticamente
    const handleNomeChange = (value: string) => {
        setData('nome', value);
        if (errors.nome && value.trim()) {
            clearErrors('nome');
        }
    };

    const handleCapacidadeChange = (value: string) => {
        setData('capacidade', value);
        if (errors.capacidade && value.trim() && parseInt(value) > 0) {
            clearErrors('capacidade');
        }
    };

    const handleDescricaoChange = (value: string) => {
        setData('descricao', value);
        if (errors.descricao) {
            clearErrors('descricao');
        }
    };

    const handleLocalizacaoChange = (value: string) => {
        setData('localizacao_id', value);
        if (errors.localizacao_id && value) {
            clearErrors('localizacao_id');
        }
    };

    const handleStatusChange = (value: 'ativo' | 'inativo' | 'manutencao') => {
        setData('status', value);
        if (errors.status && value) {
            clearErrors('status');
        }
    };

    const handleRecursoChange = (recursoId: number, checked: boolean) => {
        let novosRecursos: number[];
        if (checked) {
            novosRecursos = [...data.recursos, recursoId];
        } else {
            novosRecursos = data.recursos.filter(id => id !== recursoId);
        }
        
        setData('recursos', novosRecursos);
        if (errors.recursos) {
            clearErrors('recursos');
        }
    };

    // Função para converter fotos do PhotoUpload para o tipo global
    const handleFotosChange = (fotosPhotoUpload: any[]) => {
        // Converter para o tipo Foto global, mantendo apenas as propriedades necessárias
        const fotosConvertidas: Foto[] = fotosPhotoUpload.map(foto => ({
            id: foto.id || 0,
            espaco_id: espaco.id,
            url: foto.url,
            nome_original: foto.nome_original,
            tamanho: foto.tamanho || 0,
            tipo_mime: foto.tipo_mime || '',
            ordem: foto.ordem,
            descricao: foto.descricao,
            created_at: foto.created_at || '',
            updated_at: foto.updated_at || '',
        }));
        
        setFotosAtuais(fotosConvertidas);
        
        // Limpar erro de fotos se houver pelo menos 1 foto
        if (fotosConvertidas.length > 0 && errors.fotos) {
            clearErrors('fotos');
        }
        
        // Limpar a classe vermelha do painel de fotos quando uma foto for adicionada
        if (fotosConvertidas.length > 0) {
            const painelFotos = document.getElementById('painel-fotos');
            if (painelFotos) {
                painelFotos.classList.remove('border-red-500');
            }
        }
    };

    useEffect(() => {
        const houveAlteracao =
            data.nome.trim() !== (espaco.nome || '').trim() ||
            data.descricao.trim() !== (espaco.descricao || '').trim() ||
            data.capacidade.trim() !== (espaco.capacidade?.toString() || '').trim() ||
            data.localizacao_id.trim() !== (espaco.localizacao_id?.toString() || '').trim() ||
            data.status !== (espaco.status || 'ativo') ||
            data.disponivel_reserva !== (espaco.disponivel_reserva || false) ||
            JSON.stringify(data.recursos.sort()) !== JSON.stringify((espaco.recursos?.map(r => r.id).sort()) || []);

        setFormAlterado(houveAlteracao);
    }, [data, espaco]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Espaços', href: '/espacos' },
        { title: 'Editar Espaço', href: `/espacos/${espaco.id}/editar` }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Espaço - ${espaco.nome}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    {formAlterado ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="
                                ml-1
                                bg-white dark:bg-white 
                                text-black dark:text-black 
                                hover:bg-gray-100 dark:hover:bg-gray-200 
                                cursor-pointer 
                                transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza que deseja voltar?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    As alterações feitas não foram salvas. Você perderá todas as modificações.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Não</AlertDialogCancel>
                                <AlertDialogAction
                                    className="cursor-pointer bg-red-600 hover:bg-red-700"
                                    onClick={() => (window.location.href = '/espacos')}
                                >
                                    Sim, voltar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        className="
                                ml-1
                                bg-white dark:bg-white 
                                text-black dark:text-black 
                                hover:bg-gray-100 dark:hover:bg-gray-200 
                                cursor-pointer 
                                transition-colors" 
                        onClick={() => (window.location.href = '/espacos')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                )}
                    <h1 className="text-3xl font-bold text-black dark:text-white">Editar espaço</h1>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card id="painel-informacoes-basicas">
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
                                        onChange={(e) => handleNomeChange(e.target.value)}
                                        placeholder="Nome do espaço"
                                        className={errors.nome ? 'border-red-500 bg-white border-black dark:bg-black' : 'bg-white border-black dark:bg-black'}
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
                                        onChange={(e) => handleCapacidadeChange(e.target.value)}
                                        placeholder="Número de pessoas"
                                        className={errors.nome ? 'border-red-500 bg-white border-black dark:bg-black' : 'bg-white border-black dark:bg-black'}
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
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleDescricaoChange(e.target.value)}
                                    placeholder="Descrição do espaço"
                                    rows={3}
                                    className={errors.nome ? 'border-red-500 bg-white border-black dark:bg-black' : 'bg-white border-black dark:bg-black'}
                                />
                                {errors.descricao && (
                                    <p className="text-sm text-red-500">{errors.descricao}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card id="painel-configuracoes">
                        <CardHeader>
                            <CardTitle>Configurações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="localizacao_id">Localização *</Label>
                                    <Select
                                        value={data.localizacao_id}
                                        onValueChange={handleLocalizacaoChange}
                                    >
                                        <SelectTrigger 
                                            id="localizacao_id"
                                            className={errors.localizacao_id ? 'border-red-500' : ''}
                                        >
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
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger 
                                            id="status"
                                            className={errors.nome ? 'border-red-500 bg-white border-black dark:bg-black' : 'bg-white border-black dark:bg-black'}
                                        >
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
                        <Card id="painel-recursos">
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

                    {/* Responsáveis pelo Espaço - SEGUNDO */}
                    <Card id="painel-responsavel">
                        <CardHeader>
                            <CardTitle>Responsáveis pelo Espaço</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(() => {
                                const responsaveis: Array<User & { tipo: string }> = [];
                                
                                // Adicionar o criador do espaço
                                if (espaco.createdBy) {
                                    responsaveis.push({
                                        ...espaco.createdBy,
                                        tipo: 'Criador'
                                    });
                                }
                                
                                // Adicionar usuários com permissão (excluindo o criador se já estiver na lista)
                                if (espaco.users && espaco.users.length > 0) {
                                    espaco.users.forEach((user: User) => {
                                        if (!responsaveis.find(r => r.id === user.id)) {
                                            responsaveis.push({
                                                ...user,
                                                tipo: 'Com Permissão'
                                            });
                                        }
                                    });
                                }
                                
                                return responsaveis.length > 0 ? (
                                    <div className="space-y-4">
                                        {responsaveis.map((responsavel, index) => (
                                            <div key={responsavel.id} className="bg-muted/30 p-4 rounded-lg border border-border">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar user={responsavel} size="lg" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-semibold text-card-foreground">
                                                                {responsavel.name}
                                                            </h3>
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                                {responsavel.tipo}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {responsavel.email}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerfilColor(responsavel.perfil_acesso)}`}>
                                                            {formatPerfil(responsavel.perfil_acesso)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-muted/30 p-4 rounded-lg border border-border text-center">
                                        <p className="text-muted-foreground">Nenhum responsável definido</p>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </form>

                {/* Seção de Fotos - Separada do formulário - OBRIGATÓRIA */}
                <Card 
                    id="painel-fotos"
                    className={errors.fotos ? 'border-red-500' : ''}
                    data-testid="fotos-card"
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Fotos do Espaço *
                            {(!fotosAtuais || fotosAtuais.length === 0) && (
                                <span className="text-sm font-normal text-red-500">
                                    (Obrigatório - mínimo 1 foto)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PhotoUpload
                            espacoId={espaco.id}
                            fotos={espaco.fotos || []}
                            maxFiles={10}
                            maxFileSize={5}
                            onFotosChange={handleFotosChange}
                        />
                        {errors.fotos && (
                            <p className="text-sm text-red-500 mt-2">{errors.fotos}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Botões de Ação - No final, igual ao Create */}
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={submit}
                        className="
                                ml-1
                                bg-white dark:bg-white
                                text-black dark:text-black
                                hover:bg-gray-100 dark:hover:bg-gray-300
                                cursor-pointer 
                                transition-colors" 
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            className="
                                        bg-black dark:bg-black
                                        text-white dark:text-white
                                        hover:bg-gray-800 dark:hover:bg-gray-900
                                        hover:text-white
                                        cursor-pointer
                                        trasition-colors
                                    "
                            >
                            Cancelar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza que deseja cancelar?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Todas as alterações feitas serão descartadas. O formulário voltará ao estado original.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Não</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                setData({
                                    nome: espaco.nome || '',
                                    descricao: espaco.descricao || '',
                                    capacidade: espaco.capacidade?.toString() || '',
                                    localizacao_id: espaco.localizacao_id?.toString() || '',
                                    status: espaco.status || 'ativo',
                                    disponivel_reserva: espaco.disponivel_reserva || false,
                                    recursos: espaco.recursos?.map(r => r.id) || [],
                                    fotos: ''
                                });
                                setFotosAtuais(espaco.fotos || []);
                                clearErrors();
                                }}
                                className="cursor-pointer bg-red-600 hover:bg-red-700"
                            >
                                Sim, cancelar
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                </div>
            </div>
        </AppLayout>
    );
}