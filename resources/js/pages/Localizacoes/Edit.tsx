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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type User, type Localizacao, type BreadcrumbItem } from '@/types';
import { FormEventHandler, ChangeEvent, useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';

interface LocalizacoesEditProps {
    auth: {
        user: User;
    };
    localizacao: Localizacao;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function LocalizacoesEdit({ auth, localizacao, flash }: LocalizacoesEditProps) {
    const { toast } = useToast();
    const { setHasUnsavedChanges } = useUnsavedChanges();
    const { data, setData, reset, put, processing, errors } = useForm({
        nome: localizacao.nome || '',
        descricao: localizacao.descricao || '',
    });

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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('localizacoes.update', localizacao.id), {
            onSuccess: () => {
                toast({
                    title: "Localização atualizada com sucesso!",
                    description: `A localização ${data.nome} foi atualizada no sistema.`,
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
            },
            onError: () => {
                toast({
                    title: "Erro ao atualizar localização",
                    description: "Ocorreu um erro ao executar a ação, verifique os campos",
                    variant: "destructive",
                    duration: 5000, // 5 segundos
                });
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Localizações', href: route('localizacoes.index') },
        { title: 'Editar Localização', href: route('localizacoes.edit', localizacao.id) }
    ];

    useEffect(() => {
        const houveAlteracao =
            data.nome !== localizacao.nome ||
            data.descricao !== localizacao.descricao;

        setFormAlterado(houveAlteracao);
        setHasUnsavedChanges(houveAlteracao);
    }, [data, localizacao, setHasUnsavedChanges]);

    useEffect(() => {
        return () => {
            setHasUnsavedChanges(false);
        };
    }, [setHasUnsavedChanges]);


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Localização - ${localizacao.nome}`} />

            <div className="flex items-center gap-4 mb-5">
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
                        <AlertDialogContent className="dark:text-white">
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
                                    onClick={() => (window.location.href = '/localizacoes')}
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
                        onClick={() => (window.location.href = '/localizacoes')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                )}

                <h1 className="text-3xl font-bold text-black dark:text-white">Editar Localização</h1>
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
                                className={errors.descricao ? 'border-red-500 bg-sidebar dark:bg-sidebar text-sidebar-foreground dark:text-sidebar-foreground' : 'bg-sidebar dark:bg-sidebar border-sidebar-border dark:border-sidebar-border text-sidebar-foreground dark:text-sidebar-foreground'}                                />
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
                        {processing ? 'Salvando...' : 'Salvar Alterações'}
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
                                    Todas as alterações feitas serão descartadas. O formulário voltará ao estado original.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Não</AlertDialogCancel>
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
        </AppLayout>
    );
}