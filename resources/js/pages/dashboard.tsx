import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type PageProps, type BreadcrumbItem } from '@/types';
import { CalendarDays } from 'lucide-react';

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const currentDate = new Date().toLocaleDateString('pt-BR');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">
                        Bem-vindo ao <span className="text-primary">SAGE</span>, {auth.user.name}!
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Sistema de Agendamento e Gerenciamento de Espaços
                    </p>
                </div>

                <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3 shadow-sm max-w-sm">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Hoje</span>
                        <span className="font-medium text-lg">{currentDate}</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
