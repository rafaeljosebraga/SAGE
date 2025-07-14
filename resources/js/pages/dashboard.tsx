import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type PageProps } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const currentDate = new Date().toLocaleDateString('pt-BR');

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="p-6">
                <h1 className="text-3xl font-bold">Bem-vindo ao SAGE, {auth.user.name}!</h1>
                <p className="mt-2 text-muted-foreground">Sistema de Agendamento e Gerenciamento de Espaços</p>
                <p className="mt-2 text-muted-foreground">Hoje é {currentDate}</p>
            </div>
        </AppLayout>
    );
}
