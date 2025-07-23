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
    const [arquivosOriginais, setArquivosOriginais] = useState<File[]>([]);
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



    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Localizações', href: route('localizacoes.index') },
        { title: 'Nova Localização', href: route('localizacoes.create') }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nova Localização" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                type="button"
                                className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-[#F26326] hover:text-black dark:text-[#F26326] dark:hover:text-black"
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
                                        window.location.href = '/localizacoes';
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Sim, voltar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                      <h1 className="text-3xl font-bold text-black dark:text-white">Nova Localização</h1>
                </div>

                <form onSubmit={submit} className="space-y-6">
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
                                    className={errors.nome ? 'border-red-500' : ''}
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
                                    className={errors.descricao ? 'border-red-500' : ''}
                                />
                                {errors.descricao && (
                                    <p className="text-sm text-red-500">{errors.descricao}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={processing}
                             className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Salvando...' : 'Salvar Localização'}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>
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