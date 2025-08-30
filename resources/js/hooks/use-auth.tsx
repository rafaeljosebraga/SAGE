import { type SharedData, type User } from '@/types';
import { usePage } from '@inertiajs/react';

export function useAuth() {
    const { props } = usePage<SharedData>();
    return props.auth;
}

export function useCanManageUsers() {
    const auth = useAuth();
    const user = auth?.user as User;

    if (!user || !user.perfil_acesso) {
        return false;
    }

    return user.perfil_acesso === 'administrador';
}

export function useHasEspacoAtribuido() {
    const auth = useAuth();
    const user = auth?.user as User;

    if (!user || !user.perfil_acesso) {
        return false;
    }
    const qtd = user.espacos?.length || 0;
    if (qtd > 0 || user.perfil_acesso === 'diretor_geral') {
        return true;
    }
    return false;
}

export function useIsDiretorGeral() {
    const auth = useAuth();
    const user = auth?.user as User;

    if (!user || !user.perfil_acesso) {
        return false;
    }

    return user.perfil_acesso === 'diretor_geral';
}
