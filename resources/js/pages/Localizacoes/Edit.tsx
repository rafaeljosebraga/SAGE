import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type User, type Localizacao, type BreadcrumbItem } from '@/types';
import { FormEventHandler, ChangeEvent } from 'react';

interface LocalizacoesEditProps {
    auth: {
        user: User;
    };
    localizacao: Localizacao;
}

export default function LocalizacoesEdit({ auth, localizacao }: LocalizacoesEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nome: localizacao.nome || '',
        descricao: localizacao.descricao || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('localizacoes.update', localizacao.id));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Localizações', href: route('localizacoes.index') },
        { title: 'Editar Localização', href: route('localizacoes.edit', localizacao.id) }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Localização - ${localizacao.nome}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href={route('localizacoes.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
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
                        <Button variant="outline" asChild>
                            <Link href={route('localizacoes.index')}>
                                Cancelar
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}