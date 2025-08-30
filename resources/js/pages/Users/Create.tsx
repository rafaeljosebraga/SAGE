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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useToastDismissOnClick } from '@/hooks/use-toast-dismiss-on-click';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { FormEvent } from 'react';
import { FormEventHandler, useState, useEffect, useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Gerenciar Usuários',
        href: '/usuarios',
    },
    {
        title: 'Adicionar Novo',
        href: '/usuarios/criar',
    },
];

interface Props {
    perfilAcesso: Record<string, string>;
}

export default function Create({ perfilAcesso }: Props) {
    const { toast } = useToast();
    const [formAlterado, setFormAlterado] = useState(false);
    useToastDismissOnClick(); // Hook para dismissar toast ao clicar em botões
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        perfil_acesso: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        const inicial = {
            name: '',
            email: '',
            perfil_acesso: '',
            password: '',
            password_confirmation: '',
        };

        const preenchido =
            data.name.trim() !== inicial.name ||
            data.email.trim() !== inicial.email ||
            data.perfil_acesso !== inicial.perfil_acesso ||
            data.password !== inicial.password ||
            data.password_confirmation !== inicial.password_confirmation;

        setFormAlterado(preenchido);
        }, [data]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/usuarios', { 
            onSuccess: () => {
                reset();
                toast({
                    title: "Usuário criado com sucesso!",
                    description: `O usuário ${data.name} foi criado e adicionado ao sistema.`,
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
            },
            onError: () => {
                toast({
                    title: "Erro ao criar usuário",
                    description: "Ocorreu um erro ao executar a ação, verifique os campos",
                    variant: "destructive",
                    duration: 5000, // 5 segundos
                });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adicionar Novo Usuário" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    {formAlterado ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                type="button"
                        className="
                                ml-0
                                bg-white dark:bg-white
                                text-black dark:text-black
                                hover:bg-gray-100 dark:hover:bg-gray-200
                                cursor-pointer
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
                                As informações preenchidas serão perdidas.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Não</AlertDialogCancel>
                                <AlertDialogAction
                                onClick={() => {
                                    window.location.href = '/usuarios';
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
                                ml-0
                                bg-white dark:bg-white
                                text-black dark:text-black
                                hover:bg-gray-100 dark:hover:bg-gray-200
                                cursor-pointer
                                transition-colors
                                "
                            onClick={() => {
                                window.location.href = '/usuarios';
                            }}
                            >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                            </Button>
                        )}
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Adicionar Novo Usuário
                        </CardTitle>
                        <CardDescription>Preencha os dados para criar um novo usuário no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>  
                        <form onSubmit={submit} className="space-y-6" noValidate>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        if (errors.name) clearErrors('name');
                                    }}
                                    placeholder="Digite o nome completo"
                                    className={errors.name ? 'border-red-500 bg-white  dark:bg-black' : 'bg-white border-black dark:bg-black'}
                                     />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => {
                                        setData('email', e.target.value);
                                        if (errors.email) clearErrors('email');
                                    }}
                                    placeholder="Digite o e-mail"
                                    className={errors.email ? 'border-red-500 bg-white dark:bg-black' : 'bg-white border-black dark:bg-black'}
                                      />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="perfil_acesso">Perfil de Acesso *</Label>
                                <Select 
                                    name="perfil_acesso"
                                    value={data.perfil_acesso} 
                                    onValueChange={(value) => {
                                        setData('perfil_acesso', value);
                                        if (errors.perfil_acesso) clearErrors('perfil_acesso');
                                    }}
                                >
                                    <SelectTrigger id="perfil_acesso" className={errors.perfil_acesso ? 'cursor-pointer border-red-500 bg-white dark:bg-black' : 'cursor-pointer bg-white border-black dark:bg-black'}>
                                        <SelectValue placeholder="Selecione o perfil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(perfilAcesso).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.perfil_acesso && <p className="text-sm text-red-500">{errors.perfil_acesso}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha *</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => {
                                        setData('password', e.target.value);
                                        // Limpa erros de ambos os campos de senha
                                        if (errors.password) clearErrors('password');
                                        if (errors.password_confirmation) clearErrors('password_confirmation');
                                    }}
                                    onCopy={(e) => e.preventDefault()}
                                    onPaste={(e) => e.preventDefault()}
                                    onCut={(e) => e.preventDefault()}
                                    onDrag={(e) => e.preventDefault()}
                                    onDrop={(e) => e.preventDefault()}
                                    onContextMenu={(e) => e.preventDefault()}
                                    placeholder="Digite a senha (mínimo 8 caracteres)"
                                    className={errors.password ? 'border-red-500 bg-white dark:bg-black' : 'bg-white border-black dark:bg-black'}
                                     />
                                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar Senha *</Label>
                                <Input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) => {
                                        setData('password_confirmation', e.target.value);
                                        // Limpa erros de ambos os campos de senha
                                        if (errors.password) clearErrors('password');
                                        if (errors.password_confirmation) clearErrors('password_confirmation');
                                    }}
                                    onCopy={(e) => e.preventDefault()}
                                    onPaste={(e) => e.preventDefault()}
                                    onCut={(e) => e.preventDefault()}
                                    onDrag={(e) => e.preventDefault()}
                                    onDrop={(e) => e.preventDefault()}
                                    onContextMenu={(e) => e.preventDefault()}
                                    placeholder="Confirme a senha"
                                    className={errors.password_confirmation ? 'border-red-500 bg-white dark:bg-black' : 'bg-white border-black dark:bg-black'}
                                       />
                                {errors.password_confirmation && <p className="text-sm text-red-500">{errors.password_confirmation}</p>}
                            </div>
                             {(errors as any).error && <p className="text-sm text-red-500">{(errors as any).error}</p>}

                            <div className="flex gap-4 pt-4">
                                <Button type="submit" disabled={processing}
                                className="
                                        ml-1
                                        bg-white dark:bg-white
                                        text-black dark:text-black
                                        hover:bg-gray-100 dark:hover:bg-gray-300
                                        cursor-pointer 
                                        transition-colors
                                        border border-black" 
                                >
                                    {processing ? 'Criando...' : 'Criar Usuário'}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
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
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}