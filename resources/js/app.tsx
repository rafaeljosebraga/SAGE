import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { UnsavedChangesProvider } from '@/contexts/unsaved-changes-context'; //Condicionador global
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from 'sonner';
import { ViewModeProvider } from '@/contexts/ViewModeContext'; //Condicionador global

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <UnsavedChangesProvider>
                    <ViewModeProvider>
                        <App {...props} />
                        <Toaster />
                    </ViewModeProvider>
                </UnsavedChangesProvider>
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
