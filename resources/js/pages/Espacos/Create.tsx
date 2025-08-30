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
import { useToast } from '@/hooks/use-toast';
import { useToastDismissOnClick } from '@/hooks/use-toast-dismiss-on-click';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
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
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';

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
    const { setHasUnsavedChanges } = useUnsavedChanges();
    const { toast } = useToast();
    useToastDismissOnClick(); // Hook para dismissar toast ao clicar em botões
    const [fotos, setFotos] = useState<FotoLocal[]>([]);
    const [arquivosOriginais, setArquivosOriginais] = useState<File[]>([]);
    const [deveScrollParaErro, setDeveScrollParaErro] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formAlterado, setFormAlterado] = useState(false);
    const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<Required<EspacoFormData>>({
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

    useEffect(() => {
        const inicial = {
            nome: '',
            descricao: '',
            capacidade: '',
            localizacao_id: '',
            status: 'ativo',
            disponivel_reserva: true,
            recursos: [],
            fotos: [],
            descricoes: [],
        };

        const preenchido =
            data.nome.trim() !== inicial.nome ||
            data.descricao.trim() !== inicial.descricao ||
            data.capacidade.trim() !== inicial.capacidade ||
            data.localizacao_id !== inicial.localizacao_id ||
            data.status !== inicial.status ||
            data.disponivel_reserva !== inicial.disponivel_reserva ||
            data.recursos.length !== 0 ||
            arquivosOriginais.length !== 0 ||
            fotos.some(foto => (foto.descricao?.trim() || '') !== '');

        setFormAlterado(preenchido);
        setHasUnsavedChanges(preenchido);
        }, [data, arquivosOriginais, fotos]
    );
    // Sincronizar fotos com o formulário sempre que mudarem
    useEffect(() => {
        setData('fotos', arquivosOriginais);
        setData('descricoes', fotos.map(foto => foto.descricao || ''));
    }, [arquivosOriginais, fotos]);

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

    // Limpar timeout ao desmontar componente
    useEffect(() => {
        return () => {
            if (submitTimeoutRef.current) {
                clearTimeout(submitTimeoutRef.current);
            }
        };
    }, []);

    // useEffect(() => {
    // return () => {
    //     setHasUnsavedChanges(false);
    // };
    // }, [setHasUnsavedChanges]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Prevenir duplo clique
        if (isSubmitting || processing) {
            return;
        }

        setIsSubmitting(true);

        // Ativar o flag para fazer scroll em caso de erro
        setDeveScrollParaErro(true);

        post('/espacos', {
            forceFormData: true,

            onSuccess: () => {
                reset();
                setFotos([]);
                setArquivosOriginais([]);
                setDeveScrollParaErro(false);
                setIsSubmitting(false);
                 setHasUnsavedChanges(false);

                toast({
                    title: "Espaço criado com sucesso!",
                    description: `O espaço ${data.nome} foi criado e adicionado ao sistema.`,
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
            },

            onError: (errors) => {
                setIsSubmitting(false);

                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    toast({
                        title: "Erro ao criar espaço",
                        description: errorMessages[0] as string,
                        variant: "destructive",
                    });
                }
            },

            onFinish: () => {
                submitTimeoutRef.current = setTimeout(() => {
                    setIsSubmitting(false);
                }, 1000);
            }
        });

    };

    const handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // Prevenir duplo clique
        if (isSubmitting || processing) {
            return;
        }

        // Simular submit do formulário
        const form = e.currentTarget.closest('form');
        if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
        }
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

    const handleFotosChange = (novasFotos: FotoLocal[]) => {
        setFotos(novasFotos);
        // Limpar erro de fotos se houver pelo menos 1 foto
        if (novasFotos.length > 0 && errors.fotos) {
            clearErrors('fotos');
        }
    };

    const handleArquivosChange = (novosArquivos: File[]) => {
        setArquivosOriginais(novosArquivos);
        // Limpar erro de fotos se houver pelo menos 1 arquivo
        if (novosArquivos.length > 0 && errors.fotos) {
            clearErrors('fotos');
        }
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
                    {formAlterado ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                type="button"
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
                                As informações preenchidas serão perdidas.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Não</AlertDialogCancel>
                                <AlertDialogAction
                                onClick={() => {
                                    window.location.href = '/espacos';
                                }}
                                className="bg-red-600 hover:bg-red-700"
                                >
                                Sim, voltar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        ) : (
                        <Button
                            variant="outline"
                            type="button"
                            className="
                                ml-1
                                bg-white dark:bg-white 
                                text-black dark:text-black 
                                hover:bg-gray-100 dark:hover:bg-gray-200 
                                cursor-pointer 
                                transition-colors" 
                            onClick={() => {
                                window.location.href = '/espacos';
                            }}
                            >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                            </Button>
                        )}
                    <h1 className="text-3xl font-bold text-black dark:text-white">Criar espaço</h1>
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
                                        name="nome"
                                        type="text"
                                        value={data.nome}
                                        onChange={(e) => handleNomeChange(e.target.value)}
                                        placeholder="Nome do espaço"
                                        className={errors.nome ? 'border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                    />
                                    {errors.nome && (
                                        <p className="text-sm text-red-500">{errors.nome}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="capacidade">Capacidade *</Label>
                                    <Input
                                        id="capacidade"
                                        name="capacidade"
                                        type="number"
                                        value={data.capacidade}
                                        onChange={(e) => handleCapacidadeChange(e.target.value)}
                                        placeholder="Ex: 50"
                                        min="1"
                                        className={errors.capacidade ? 'border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
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
                                    name="descricao"
                                    value={data.descricao}
                                    onChange={(e) => handleDescricaoChange(e.target.value)}
                                    placeholder="Descreva o espaço..."
                                    rows={3}
                                    className={errors.descricao ? 'border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
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
                                    <Combobox
                                        id="localizacao_id"
                                        name="localizacao_id"
                                        value={data.localizacao_id}
                                        onValueChange={handleLocalizacaoChange}
                                        options={localizacoes.map(l => ({ value: l.id.toString(), label: l.nome }))}
                                        placeholder="Selecione uma localização"
                                        searchPlaceholder="Buscar localização..."
                                        className=""
                                        triggerClassName={(errors.localizacao_id ? 'border-red-500 ' : '') + 'bg-sidebar border-sidebar-border text-sidebar-foreground'}
                                    />
                                    {errors.localizacao_id && (
                                        <p className="text-sm text-red-500">{errors.localizacao_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        name="status"
                                        value={data.status}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className={errors.status ? 'border-red-500 bg-sidebar text-sidebar-foreground' : 'bg-sidebar border-sidebar-border text-sidebar-foreground'}
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

                    {/* Seção de Fotos - é OBRIGATÓRIA!!! */}
                    <Card
                        id="painel-fotos"
                        className={errors.fotos ? 'border-red-500' : ''}
                        data-testid="fotos-card"
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Fotos do Espaço *
                                <span className="text-sm font-normal text-red-500">
                                    (Obrigatório - mínimo 1 foto)
                                </span>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                É obrigatório adicionar pelo menos 1 foto do espaço. Máximo 10 fotos, 5MB cada.
                            </p>
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
                            type="button"
                            disabled={isSubmitting || processing}
                            onClick={handleSubmitClick}
                            className="
                                ml-1
                                bg-white dark:bg-white
                                text-black dark:text-black
                                hover:bg-gray-100 dark:hover:bg-gray-300
                                cursor-pointer 
                                transition-colors" 
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {(isSubmitting || processing) ? 'Salvando...' : 'Salvar Espaço'}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmitting || processing}
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
                                        Todas as informações preenchidas serão limpas.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Não</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            reset();
                                            setFotos([]);
                                            setArquivosOriginais([]);
                                        }}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Sim, cancelar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
