import { useCallback, useMemo } from 'react';

// Cache para armazenar iniciais já calculadas
const initialsCache = new Map<string, string>();

function calculateInitials(fullName: string): string {
    // Verificar se já está no cache
    if (initialsCache.has(fullName)) {
        return initialsCache.get(fullName)!;
    }

    const names = fullName.trim().split(' ').filter(name => name.length > 0);

    let result = '';
    if (names.length === 0) {
        result = '';
    } else if (names.length === 1) {
        result = names[0].charAt(0).toUpperCase();
    } else {
        const firstInitial = names[0].charAt(0);
        const lastInitial = names[names.length - 1].charAt(0);
        result = `${firstInitial}${lastInitial}`.toUpperCase();
    }

    // Armazenar no cache
    initialsCache.set(fullName, result);
    
    // Limitar o tamanho do cache para evitar vazamentos de memória
    if (initialsCache.size > 100) {
        const firstKey = initialsCache.keys().next().value;
        if (firstKey !== undefined) {
            initialsCache.delete(firstKey);
        }
    }

    return result;
}

export function useInitials() {
    return useCallback((fullName: string): string => {
        return calculateInitials(fullName);
    }, []);
}
