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

interface LocalizacoesEditProps {
    auth: {
        user: User;
    };
    localizacao: Localizacao;
}

export default function LocalizacoesEdit({ auth, localizacao }: LocalizacoesEditProps) {
    const { data, setData, reset, put, processing, errors } = useForm({
        nome: localizacao.nome || '',
        descricao: localizacao.descricao || '',
    });

    const [formAlterado, setFormAlterado] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('localizacoes.update', localizacao.id));
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
    }, [data, localizacao]);


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
                                    ml-4
                                    bg-white dark:bg-white
                                    text-black dark:text-black
                                    hover:!bg-[#EF7D4C] hover:!text-white
                                    dark:hover:!bg-[#EF7D4C] dark:hover:!text-white
                                    transition-colors
                        "
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
                                <AlertDialogCancel>Não</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
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
                                    ml-4
                                    bg-white dark:bg-white
                                    text-black dark:text-black
                                    hover:!bg-[#EF7D4C] hover:!text-white
                                    dark:hover:!bg-[#EF7D4C] dark:hover:!text-white
                                    transition-colors
                        "
                        onClick={() => (window.location.href = '/localizacoes')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                )}

                <h1 className="text-3xl font-bold text-black dark:text-white">Editar Localização</h1>
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
                            {processing ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
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
        </AppLayout>
    );
}