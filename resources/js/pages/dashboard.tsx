import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="p-6">
                <h1 className="text-3xl font-bold">Bem-vindo ao SAGE!</h1>
                <p className="mt-2 text-muted-foreground">Sistema de Agendamento e Gerenciamento de Espaços</p>
            </div>
        </AppLayout>
    );
}
