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
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';
import { useToastDismissOnClick } from '@/hooks/use-toast-dismiss-on-click';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type User, type BreadcrumbItem } from '@/types';
import { FormEventHandler, useState, useEffect, useRef, ChangeEvent } from 'react';

interface RecursosCreateProps {
    auth: {
        user: User;
    };
}

export default function RecursosCreate({ auth }: RecursosCreateProps) {
    const { toast } = useToast();
    const { setHasUnsavedChanges } = useUnsavedChanges();
    const [formAlterado, setFormAlterado] = useState(false);
    useToastDismissOnClick(); // Hook para dismissar toast ao clicar em botões
    const { data, setData, reset, post, processing, errors, clearErrors } = useForm({
        nome: '',
        descricao: '',
        status: 'disponivel' as 'disponivel' | 'manutencao' | 'indisponivel',
        fixo: true as boolean,
        marca: '',
        modelo: '',
        observacoes: '',
    });

    useEffect(() => {
        const inicial = {
            nome: '',
            descricao: '',
            status: 'disponivel' as 'disponivel' | 'manutencao' | 'indisponivel',
            fixo: true,
            marca: '',
            modelo: '',
            observacoes: '',
        };

        const preenchido =
            data.nome.trim() !== inicial.nome ||
            data.descricao.trim() !== inicial.descricao ||
            data.status !== inicial.status ||
            data.fixo !== inicial.fixo ||
            data.marca.trim() !== inicial.marca ||
            data.modelo.trim() !== inicial.modelo ||
            data.observacoes.trim() !== inicial.observacoes;

        setFormAlterado(preenchido);
        setHasUnsavedChanges(preenchido);
        }, [data, setHasUnsavedChanges]);

        useEffect(() => {
            return () => {
                setHasUnsavedChanges(false);
            };
        }, [setHasUnsavedChanges]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('recursos.store'), {
            onSuccess: () => {
                reset();
                setFormAlterado(false);
                toast({
                    title: "Recurso criado com sucesso!",
                    description: `O recurso ${data.nome} foi criado e adicionado ao sistema.`,
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
                setHasUnsavedChanges(false);
            },
            onError: () => {
                toast({
                    title: "Erro ao criar recurso",
                    description: "Ocorreu um erro ao executar a ação, verifique os campos",
                    variant: "destructive",
                    duration: 5000, // 5 segundos
                });
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Recursos', href: route('recursos.index') },
        { title: 'Novo Recurso', href: route('recursos.create') }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Novo Recurso" />

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
                            <AlertDialogContent className="dark:text-white">
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
                                    window.location.href = '/recursos';
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
                                window.location.href = '/recursos';
                            }}
                            >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                            </Button>
                        )}
                     <h1 className="text-3xl font-bold text-black dark:text-white">Novo Recurso</h1>
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
                                        name="nome"
                                        type="text"
                                        value={data.nome}
                                        onChange={(e) => {
                                            setData('nome', e.target.value);
                                            if (errors.nome) clearErrors('nome');
                                        }}
                                        placeholder="Nome do recurso"
                                        className={errors.nome ? 'h-10 border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'h-10 bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                    />
                                    {errors.nome && (
                                        <p className="text-sm text-red-500">{errors.nome}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        name="status"
                                        value={data.status}
                                        onValueChange={(value) => {
                                            setData('status', value as 'disponivel' | 'manutencao' | 'indisponivel');
                                            if (errors.status) clearErrors('status');
                                        }}
                                    >
                                        <SelectTrigger 
                                            id="status"
                                            className={errors.status ? 'h-10 border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'h-10 bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="disponivel">Disponível</SelectItem>
                                            <SelectItem value="manutencao">Manutenção</SelectItem>
                                            <SelectItem value="indisponivel">Indisponível</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-500">{errors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição</Label>
                                <Textarea
                                    id="descricao"
                                    name="descricao"
                                    value={data.descricao}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                                        setData('descricao', e.target.value);
                                        if (errors.descricao) clearErrors('descricao');
                                    }}
                                    placeholder="Descrição do recurso"
                                    rows={3}
                                    className={errors.descricao ? 'border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                />
                                {errors.descricao && (
                                    <p className="text-sm text-red-500">{errors.descricao}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="fixo"
                                    name="fixo"
                                    checked={data.fixo}
                                    onCheckedChange={(checked) => setData('fixo', !!checked)}
                                />
                                <Label htmlFor="fixo">
                                    Recurso fixo (não pode ser movido entre espaços)
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Técnicas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="marca">Marca</Label>
                                    <Input
                                        id="marca"
                                        name="marca"
                                        type="text"
                                        value={data.marca}
                                        onChange={(e) => {
                                            setData('marca', e.target.value);
                                            if (errors.marca) clearErrors('marca');
                                        }}
                                        placeholder="Marca do equipamento"
                                        className={errors.marca ? 'h-10 border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'h-10 bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                    />
                                    {errors.marca && (
                                        <p className="text-sm text-red-500">{errors.marca}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="modelo">Modelo</Label>
                                    <Input
                                        id="modelo"
                                        name="modelo"
                                        type="text"
                                        value={data.modelo}
                                        onChange={(e) => {
                                            setData('modelo', e.target.value);
                                            if (errors.modelo) clearErrors('modelo');
                                        }}
                                        placeholder="Modelo do equipamento"
                                        className={errors.modelo ? 'h-10 border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'h-10 bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                    />
                                    {errors.modelo && (
                                        <p className="text-sm text-red-500">{errors.modelo}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="observacoes">Observações</Label>
                                <Textarea
                                    id="observacoes"
                                    name="observacoes"
                                    value={data.observacoes}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                                        setData('observacoes', e.target.value);
                                        if (errors.observacoes) clearErrors('observacoes');
                                    }}
                                    placeholder="Observações gerais sobre o recurso"
                                    rows={3}
                                    className={errors.observacoes ? 'border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                />
                                {errors.observacoes && (
                                    <p className="text-sm text-red-500">{errors.observacoes}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="
                                ml-1
                                bg-white dark:bg-white 
                                text-black dark:text-black 
                                hover:bg-gray-100 dark:hover:bg-gray-200 
                                cursor-pointer 
                                transition-colors" 
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Salvando...' : 'Salvar Recurso'}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="cursor-pointer">
                                    Cancelar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="dark:text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza que deseja cancelar?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Todas as informações preenchidas serão limpas.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className='cursor-pointer'>Não</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            reset();
                                        }}
                                        className="cursor-pointer bg-red-600 hover:bg-red-700"
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