import React, { useState, useEffect } from 'react';
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

import type { PageProps, Espaco, Recurso } from '@/types';

interface Props extends PageProps {
    espacos: Espaco[];
    recursos: Recurso[];
    espacoSelecionado?: Espaco;
    returnView?: string;
}

export default function AgendamentosCreate({ espacos, recursos, espacoSelecionado, returnView }: Props) {
    const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(espacoSelecionado || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const returnViewParam = urlParams.get('return_view') || returnView || '';
    const dataParam = urlParams.get('data') || '';

    const { data, setData, post, processing, errors, reset } = useForm({
        espaco_id: espacoSelecionado?.id.toString() || '',
        titulo: '',
        justificativa: '',
        data_inicio: dataParam,
        hora_inicio: '',
        data_fim: dataParam,
        hora_fim: '',
        observacoes: '',
        recursos_solicitados: [] as number[],
        recorrente: false as boolean,
        tipo_recorrencia: '',
        data_fim_recorrencia: '',
        return_view: returnViewParam,
    });

    // Cleanup para evitar memory leaks
    useEffect(() => {
        return () => {
            setIsSubmitting(false);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevenir múltiplos envios
        if (isSubmitting || processing) {
            return;
        }

        // Validação básica
        if (!data.espaco_id || !data.titulo || !data.justificativa || 
            !data.data_inicio || !data.hora_inicio || !data.data_fim || !data.hora_fim) {
            return;
        }

        setIsSubmitting(true);

        post('/agendamentos', {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Sucesso será tratado pelo redirect do backend
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Erro ao criar agendamento:', errors);
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleEspacoChange = (value: string) => {
        setData('espaco_id', value);
        const espaco = espacos.find(e => e.id.toString() === value);
        setSelectedEspaco(espaco || null);
    };

    const handleRecorrenteChange = (checked: boolean | "indeterminate") => {
        setData('recorrente', checked === true);
    };

    const isFormDisabled = processing || isSubmitting;

    return (
        <AppLayout>
            <Head title="Novo Agendamento" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/agendamentos${returnViewParam === 'calendar' ? '?view=calendar' : ''}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Novo Agendamento</h1>
                        <p className="text-muted-foreground">
                            Solicite o agendamento de um espaço
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
                                        Preencha os dados básicos do seu agendamento
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="espaco_id">Espaço *</Label>
                                        <Select
                                            value={data.espaco_id}
                                            onValueChange={handleEspacoChange}
                                            disabled={isFormDisabled}
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
                                            disabled={isFormDisabled}
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
                                            disabled={isFormDisabled}
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
                                            disabled={isFormDisabled}
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
                                                disabled={isFormDisabled}
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
                                                disabled={isFormDisabled}
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
                                                disabled={isFormDisabled}
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
                                                disabled={isFormDisabled}
                                            />
                                            {errors.hora_fim && (
                                                <p className="text-sm text-red-600 mt-1">{errors.hora_fim}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recorrência */}
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="recorrente"
                                                checked={data.recorrente}
                                                onCheckedChange={handleRecorrenteChange}
                                                disabled={isFormDisabled}
                                            />
                                            <Label htmlFor="recorrente">Agendamento recorrente</Label>
                                        </div>

                                        {data.recorrente && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                                                <div>
                                                    <Label htmlFor="tipo_recorrencia">Tipo de Recorrência</Label>
                                                    <Select
                                                        value={data.tipo_recorrencia}
                                                        onValueChange={(value) => setData('tipo_recorrencia', value)}
                                                        disabled={isFormDisabled}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="diaria">Diária</SelectItem>
                                                            <SelectItem value="semanal">Semanal</SelectItem>
                                                            <SelectItem value="mensal">Mensal</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="data_fim_recorrencia">Fim da Recorrência</Label>
                                                    <Input
                                                        id="data_fim_recorrencia"
                                                        type="date"
                                                        value={data.data_fim_recorrencia}
                                                        onChange={(e) => setData('data_fim_recorrencia', e.target.value)}
                                                        min={data.data_fim}
                                                        disabled={isFormDisabled}
                                                    />
                                                </div>
                                            </div>
                                        )}
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
                                                            if (checked === true) {
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
                                                        disabled={isFormDisabled}
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

                                        {selectedEspaco.recursos_fixos && selectedEspaco.recursos_fixos.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Recursos Fixos:</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedEspaco.recursos_fixos.map((recurso, index) => (
                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                            {recurso}
                                                        </Badge>
                                                    ))}
                                                </div>
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
                                            disabled={isFormDisabled}
                                        >
                                            {isFormDisabled ? 'Enviando...' : 'Solicitar Agendamento'}
                                        </Button>

                                        <Button 
                                            variant="outline" 
                                            className="w-full" 
                                            asChild
                                            disabled={isFormDisabled}
                                        >
                                            <Link href={`/agendamentos${returnViewParam === 'calendar' ? '?view=calendar' : ''}`}>
                                                Cancelar
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">
                                            <strong>Importante:</strong> Sua solicitação será enviada para aprovação. 
                                            Você receberá uma notificação quando for aprovada ou rejeitada.
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