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
    useToastDismissOnClick(); // Hook para dismissar toast ao clicar em botões
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        perfil_acesso: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/usuarios', { onSuccess: () => {
                reset();
                toast({
                    title: "Usuário criado com sucesso!",
                    description: `O usuário ${data.name} foi criado e adicionado ao sistema.`,
                    variant: "success",
                    duration: 5000, // 5 segundos
                });
            },
            
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adicionar Novo Usuário" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href="/usuarios">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    </Link>
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
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        if (errors.name) clearErrors('name');
                                    }}
                                    placeholder="Digite o nome completo"
                                    className={errors.name ? 'border-red-500' : ''}
                                     />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => {
                                        setData('email', e.target.value);
                                        if (errors.email) clearErrors('email');
                                    }}
                                    placeholder="Digite o e-mail"
                                    className={errors.email ? 'border-red-500' : ''}
                                      />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="perfil_acesso">Perfil de Acesso *</Label>
                                <Select value={data.perfil_acesso} onValueChange={(value) => {
                                    setData('perfil_acesso', value);
                                    if (errors.perfil_acesso) clearErrors('perfil_acesso');
                                }}>
                                    <SelectTrigger className={errors.perfil_acesso ? 'border-red-500' : ''}>
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
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => {
                                        setData('password', e.target.value);
                                        // Limpa erros de ambos os campos de senha
                                        if (errors.password) clearErrors('password');
                                        if (errors.password_confirmation) clearErrors('password_confirmation');
                                    }}
                                    placeholder="Digite a senha (mínimo 8 caracteres)"
                                    className={errors.password ? 'border-red-500' : ''}
                                     />
                                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar Senha *</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => {
                                        setData('password_confirmation', e.target.value);
                                        // Limpa erros de ambos os campos de senha
                                        if (errors.password) clearErrors('password');
                                        if (errors.password_confirmation) clearErrors('password_confirmation');
                                    }}
                                    placeholder="Confirme a senha"
                                    className={errors.password_confirmation ? 'border-red-500' : ''}
                                       />
                                {errors.password_confirmation && <p className="text-sm text-red-500">{errors.password_confirmation}</p>}
                            </div>
                             {(errors as any).error && <p className="text-sm text-red-500">{(errors as any).error}</p>}

                            <div className="flex gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Criando...' : 'Criar Usuário'}
                                </Button>
                                <Link href="/usuarios">
                                    <Button type="button" variant="outline">
                                        Cancelar
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
