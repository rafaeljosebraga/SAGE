import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

import type { PageProps, Agendamento, Espaco, Recurso } from '@/types';

interface Props extends PageProps {
    agendamento: Agendamento;
    espacos: Espaco[];
    recursos: Recurso[];
}

export default function AgendamentosEdit({ agendamento, espacos, recursos }: Props) {
    const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(
        espacos.find(e => e.id === agendamento.espaco_id) || null
    );

    const { data, setData, put, processing, errors } = useForm({
        espaco_id: agendamento.espaco_id.toString(),
        titulo: agendamento.titulo,
        justificativa: agendamento.justificativa,
        data_inicio: agendamento.data_inicio,
        hora_inicio: agendamento.hora_inicio,
        data_fim: agendamento.data_fim,
        hora_fim: agendamento.hora_fim,
        observacoes: agendamento.observacoes || '',
        recursos_solicitados: agendamento.recursos_solicitados || [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/agendamentos/${agendamento.id}`);
    };

    const handleEspacoChange = (value: string) => {
        setData('espaco_id', value);
        const espaco = espacos.find(e => e.id.toString() === value);
        setSelectedEspaco(espaco || null);
    };

    return (
        <AppLayout>
            <Head title={`Editar Agendamento - ${agendamento.titulo}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/agendamentos">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Editar Agendamento</h1>
                        <p className="text-muted-foreground">
                            Modifique os dados do seu agendamento
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Formulário Principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Informações Básicas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações do Agendamento</CardTitle>
                                    <CardDescription>
                                        Modifique os dados básicos do seu agendamento
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="espaco_id">Espaço *</Label>
                                        <Select
                                            value={data.espaco_id}
                                            onValueChange={handleEspacoChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um espaço" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {espacos.map((espaco) => (
                                                    <SelectItem key={espaco.id} value={espaco.id.toString()}>
                                                        {espaco.nome} ({espaco.capacidade} pessoas)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.espaco_id && (
                                            <p className="text-sm text-red-600 mt-1">{errors.espaco_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="titulo">Título do Evento *</Label>
                                        <Input
                                            id="titulo"
                                            value={data.titulo}
                                            onChange={(e) => setData('titulo', e.target.value)}
                                            placeholder="Ex: Reunião de equipe, Treinamento..."
                                        />
                                        {errors.titulo && (
                                            <p className="text-sm text-red-600 mt-1">{errors.titulo}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="justificativa">Justificativa *</Label>
                                        <Textarea
                                            id="justificativa"
                                            value={data.justificativa}
                                            onChange={(e) => setData('justificativa', e.target.value)}
                                            placeholder="Descreva o motivo e objetivo do agendamento..."
                                            rows={4}
                                        />
                                        {errors.justificativa && (
                                            <p className="text-sm text-red-600 mt-1">{errors.justificativa}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="observacoes">Observações</Label>
                                        <Textarea
                                            id="observacoes"
                                            value={data.observacoes}
                                            onChange={(e) => setData('observacoes', e.target.value)}
                                            placeholder="Informações adicionais..."
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Data e Horário */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Data e Horário
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="data_inicio">Data de Início *</Label>
                                            <Input
                                                id="data_inicio"
                                                type="date"
                                                value={data.data_inicio}
                                                onChange={(e) => setData('data_inicio', e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.data_inicio && (
                                                <p className="text-sm text-red-600 mt-1">{errors.data_inicio}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="hora_inicio">Hora de Início *</Label>
                                            <Input
                                                id="hora_inicio"
                                                type="time"
                                                value={data.hora_inicio}
                                                onChange={(e) => setData('hora_inicio', e.target.value)}
                                            />
                                            {errors.hora_inicio && (
                                                <p className="text-sm text-red-600 mt-1">{errors.hora_inicio}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="data_fim">Data de Fim *</Label>
                                            <Input
                                                id="data_fim"
                                                type="date"
                                                value={data.data_fim}
                                                onChange={(e) => setData('data_fim', e.target.value)}
                                                min={data.data_inicio || new Date().toISOString().split('T')[0]}
                                            />
                                            {errors.data_fim && (
                                                <p className="text-sm text-red-600 mt-1">{errors.data_fim}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="hora_fim">Hora de Fim *</Label>
                                            <Input
                                                id="hora_fim"
                                                type="time"
                                                value={data.hora_fim}
                                                onChange={(e) => setData('hora_fim', e.target.value)}
                                            />
                                            {errors.hora_fim && (
                                                <p className="text-sm text-red-600 mt-1">{errors.hora_fim}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recursos Adicionais */}
                            {recursos && recursos.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recursos Adicionais</CardTitle>
                                        <CardDescription>
                                            Selecione recursos extras que você precisa para o evento
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {recursos.map((recurso) => (
                                                <div key={recurso.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`recurso-${recurso.id}`}
                                                        checked={data.recursos_solicitados.includes(recurso.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setData('recursos_solicitados', [
                                                                    ...data.recursos_solicitados,
                                                                    recurso.id
                                                                ]);
                                                            } else {
                                                                setData('recursos_solicitados',
                                                                    data.recursos_solicitados.filter((id: number) => id !== recurso.id)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Label
                                                        htmlFor={`recurso-${recurso.id}`}
                                                        className="cursor-pointer"
                                                    >
                                                        {recurso.nome}
                                                        {recurso.descricao && (
                                                            <span className="text-muted-foreground text-sm ml-2">
                                                                - {recurso.descricao}
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar - Informações do Espaço */}
                        <div className="space-y-6">
                            {selectedEspaco && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            {selectedEspaco.nome}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Capacidade: {selectedEspaco.capacidade} pessoas
                                            </span>
                                        </div>

                                        {selectedEspaco.localizacao && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {selectedEspaco.localizacao.nome}
                                                </span>
                                            </div>
                                        )}

                                        {selectedEspaco.descricao && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedEspaco.descricao}
                                                </p>
                                            </div>
                                        )}

                                        {selectedEspaco.observacoes && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-1">Observações:</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedEspaco.observacoes}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Ações */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing ? 'Salvando...' : 'Salvar Alterações'}
                                        </Button>

                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href={`/agendamentos/${agendamento.id}`}>
                                                Cancelar
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">
                                            <strong>Nota:</strong> Apenas agendamentos com status "Pendente" podem ser editados.
                                            Após a aprovação, entre em contato com o responsável para alterações.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}