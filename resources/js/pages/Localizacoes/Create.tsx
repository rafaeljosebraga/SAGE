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
import { useToastDismissOnClick } from '@/hooks/use-toast-dismiss-on-click';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type User, type BreadcrumbItem } from '@/types';
import { FormEventHandler, ChangeEvent, useState, useEffect, useRef } from 'react';

interface LocalizacoesCreateProps {
    auth: {
        user: User;
    };
}

export default function LocalizacoesCreate({ auth }: LocalizacoesCreateProps) {
    
    const { toast } = useToast();
    useToastDismissOnClick(); // Hook para dismissar toast ao clicar em botões
    const { setHasUnsavedChanges } = useUnsavedChanges();
    const [arquivosOriginais, setArquivosOriginais] = useState<File[]>([]);
    const [formAlterado, setFormAlterado] = useState(false);
    const [deveScrollParaErro, setDeveScrollParaErro] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const { data, setData, reset, post, processing, errors } = useForm({
        nome: '',
        descricao: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isSubmitting || processing) {
            return;
        }

        setIsSubmitting(true);
        setDeveScrollParaErro(true);

        post(route('localizacoes.store'), {

            onSuccess: () => {
                reset();
                setDeveScrollParaErro(false);
                setIsSubmitting(false);

                toast({
                    title: "Localização criada com sucesso!",
                    description: `A localização ${data.nome} foi adicionada ao sistema.`,
                    variant: "success",
                    duration: 5000,
                });
            },

            onError: (errors) => {
                setIsSubmitting(false);

                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    toast({
                        title: "Erro ao criar localização",
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

    useEffect(() => {
        const inicial = {
            nome: '',
            descricao: '',
        };

        const alterado =
            data.nome.trim() !== inicial.nome ||
            data.descricao.trim() !== inicial.descricao;

        setFormAlterado(alterado);
        setHasUnsavedChanges(alterado);
        }, [data, setHasUnsavedChanges]);

        useEffect(() => {
            return () => {
                setHasUnsavedChanges(false);
            };
        }, [setHasUnsavedChanges]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Localizações', href: route('localizacoes.index') },
        { title: 'Nova Localização', href: route('localizacoes.create') }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nova Localização" />

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
                                transition-colors"                            >
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
                                    window.location.href = '/localizacoes';
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
                                window.location.href = '/localizacoes';
                            }}
                            >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                            </Button>
                        )}
                      <h1 className="text-3xl font-bold text-black dark:text-white">Nova Localização</h1>
                </div>

                <form onSubmit={submit} className="space-y-6 px-4 pb-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Localização</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome *</Label>
                                <Input
                                    id="nome"
                                    type="text"
                                    value={data.nome}
                                    onChange={(e) => setData('nome', e.target.value)}
                                    placeholder="Nome da localização (ex: Prédio A, Bloco Central)"
                                    className={errors.nome ? 'h-10 border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'h-10 bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                />
                                {errors.nome && (
                                    <p className="text-sm text-red-500">{errors.nome}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição</Label>
                                <Textarea
                                    id="descricao"
                                    value={data.descricao}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setData('descricao', e.target.value)}
                                    placeholder="Descrição da localização"
                                    rows={4}
                                    className={errors.descricao ? 'border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}
                                />
                                {errors.descricao && (
                                    <p className="text-sm text-red-500">{errors.descricao}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4 pr-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="
                                ml-1
                                bg-green-700 dark:bg-green-800
                                text-white dark:text-white
                                hover:bg-green-600 dark:hover:bg-green-700
                                cursor-pointer 
                                transition-colors
                                border-none
                                gap-2
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                            "
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Salvando...' : 'Salvar Localização'}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    className="
                                        bg-gray-100 dark:bg-gray-800
                                        text-gray-800 dark:text-gray-100
                                        hover:bg-orange-100 dark:hover:bg-orange-900
                                        hover:text-orange-700 dark:hover:text-orange-100
                                        cursor-pointer
                                        transition-colors
                                        border border-gray-300 dark:border-gray-700
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