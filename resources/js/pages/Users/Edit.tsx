import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit as EditIcon } from 'lucide-react';
import { FormEvent } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    perfil_acesso: string;
}

interface Props {
    user: User;
    perfilAcesso: Record<string, string>;
}

export default function Edit({ user, perfilAcesso }: Props) {
    const { toast } = useToast();
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
            title: `Editar ${user.name}`,
            href: `/usuarios/${user.id}/editar`,
        },
    ];
const { data, setData, put, processing, errors, clearErrors } = useForm({
        name: user.name,
        email: user.email,
        perfil_acesso: user.perfil_acesso,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/usuarios/${user.id}`, {
            onSuccess: () => {
                toast({
                    title: "Usuário atualizado com sucesso!",
                    description: `Os dados do usuário ${data.name} foram atualizados.`,
                    variant: "success",
                    duration: 800, // 0.8 segundos
                });
            },
            onError: (errors) => {
                // Mostrar toast de erro se houver erros de validação
                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    toast({
                        title: "Erro ao atualizar usuário",
                        description: errorMessages[0] as string,
                        variant: "destructive",
                    });
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar ${user.name}`} />

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
                            <EditIcon className="h-5 w-5" />
                            Editar Usuário
                        </CardTitle>
                        <CardDescription>Altere os dados do usuário {user.name}</CardDescription>
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
                            
                            {(errors as any).error && <p className="text-sm text-red-500">{(errors as any).error}</p>}

                            <div className="flex gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Salvando...' : 'Salvar Alterações'}
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
