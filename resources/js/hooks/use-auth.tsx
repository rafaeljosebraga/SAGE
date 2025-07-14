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

export function useIsDiretorGeral() {
    const auth = useAuth();
    const user = auth?.user as User;

    if (!user || !user.perfil_acesso) {
        return false;
    }

    return user.perfil_acesso === 'diretor_geral';
}
