import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance, withTransition = true) => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    if (withTransition) {
        // Adicionar classe de transição antes de mudar o tema
        document.documentElement.classList.add('theme-transitioning');
        
        // Pequeno delay para garantir que a classe de transição seja aplicada
        requestAnimationFrame(() => {
            // Aplicar o tema
            document.documentElement.classList.toggle('dark', isDark);
            
            // Remover a classe de transição após a transição completa
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transitioning');
            }, 300);
        });
    } else {
        // Aplicar tema imediatamente sem transição
        document.documentElement.classList.toggle('dark', isDark);
    }
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    if (currentAppearance === 'system' || !currentAppearance) {
        applyTheme('system', true);
    }
};

export function initializeTheme() {
    if (typeof window === 'undefined') {
        return;
    }

    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';

    // Aplicar tema imediatamente sem transição na inicialização
    applyTheme(savedAppearance, false);

    // Add the event listener for system theme changes...
    const mq = mediaQuery();
    if (mq) {
        // Remove listener existente para evitar duplicatas
        mq.removeEventListener('change', handleSystemThemeChange);
        mq.addEventListener('change', handleSystemThemeChange);
    }
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => {
        if (typeof window === 'undefined') {
            return 'system';
        }
        return (localStorage.getItem('appearance') as Appearance) || 'system';
    });

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);

        if (typeof window !== 'undefined') {
            // Store in localStorage for client-side persistence...
            localStorage.setItem('appearance', mode);

            // Store in cookie for SSR...
            setCookie('appearance', mode);

            applyTheme(mode, true);
        }
    }, []);

    useEffect(() => {
        // Não precisamos chamar updateAppearance aqui pois o estado já é inicializado corretamente
        // Apenas configuramos o listener para mudanças do sistema
        const mq = mediaQuery();
        if (mq) {
            mq.removeEventListener('change', handleSystemThemeChange);
            mq.addEventListener('change', handleSystemThemeChange);
            
            return () => {
                mq.removeEventListener('change', handleSystemThemeChange);
            };
        }
    }, []);

    return { appearance, updateAppearance } as const;
}
