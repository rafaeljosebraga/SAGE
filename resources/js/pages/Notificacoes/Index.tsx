
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type User, type Localizacao } from '@/types';
import ComponenteNotificacao, { ComponenteAcaoExemplo } from '@/components/ComponenteNotificacao';

interface LocalizacoesIndexProps {
    auth: {
        user: User;
    };
    localizacoes: Localizacao[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function LocalizacoesIndex({ auth }: LocalizacoesIndexProps) {

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Localizações" />

            <div className="space-y-6">
                <ComponenteNotificacao ComponenteAcao={ComponenteAcaoExemplo} />
            </div>
        </AppLayout>
    );
}
