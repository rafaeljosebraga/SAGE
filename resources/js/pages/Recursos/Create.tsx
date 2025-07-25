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
import { useToastDismissOnClick } from '@/hooks/use-toast-dismiss-on-click';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type User, type BreadcrumbItem } from '@/types';
import { FormEventHandler, ChangeEvent } from 'react';

interface RecursosCreateProps {
    auth: {
        user: User;
    };
}

export default function RecursosCreate({ auth }: RecursosCreateProps) {
    const { toast } = useToast();
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('recursos.store'), {
            onSuccess: () => {
                reset();
                toast({
                    title: "Recurso criado com sucesso!",
                    description: `O recurso ${data.nome} foi criado e adicionado ao sistema.`,
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
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
                                        window.location.href = '/recursos';
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Sim, voltar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
                                        type="text"
                                        value={data.nome}
                                        onChange={(e) => {
                                            setData('nome', e.target.value);
                                            if (errors.nome) clearErrors('nome');
                                        }}
                                        placeholder="Nome do recurso"
                                        className={errors.nome ? 'border-red-500' : ''}
                                    />
                                    {errors.nome && (
                                        <p className="text-sm text-red-500">{errors.nome}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => {
                                            setData('status', value as 'disponivel' | 'manutencao' | 'indisponivel');
                                            if (errors.status) clearErrors('status');
                                        }}
                                    >
                                        <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
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
                                    value={data.descricao}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                                        setData('descricao', e.target.value);
                                        if (errors.descricao) clearErrors('descricao');
                                    }}
                                    placeholder="Descrição do recurso"
                                    rows={3}
                                    className={errors.descricao ? 'border-red-500' : ''}
                                />
                                {errors.descricao && (
                                    <p className="text-sm text-red-500">{errors.descricao}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="fixo"
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
                                        type="text"
                                        value={data.marca}
                                        onChange={(e) => {
                                            setData('marca', e.target.value);
                                            if (errors.marca) clearErrors('marca');
                                        }}
                                        placeholder="Marca do equipamento"
                                        className={errors.marca ? 'border-red-500' : ''}
                                    />
                                    {errors.marca && (
                                        <p className="text-sm text-red-500">{errors.marca}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="modelo">Modelo</Label>
                                    <Input
                                        id="modelo"
                                        type="text"
                                        value={data.modelo}
                                        onChange={(e) => {
                                            setData('modelo', e.target.value);
                                            if (errors.modelo) clearErrors('modelo');
                                        }}
                                        placeholder="Modelo do equipamento"
                                        className={errors.modelo ? 'border-red-500' : ''}
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
                                    value={data.observacoes}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                                        setData('observacoes', e.target.value);
                                        if (errors.observacoes) clearErrors('observacoes');
                                    }}
                                    placeholder="Observações gerais sobre o recurso"
                                    rows={3}
                                    className={errors.observacoes ? 'border-red-500' : ''}
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
                            className="bg-sidebar dark:bg-white hover:bg-[#EF7D4C] dark:hover:bg-[#EF7D4C] text-black dark:text-black"
                     
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Salvando...' : 'Salvar Recurso'}
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