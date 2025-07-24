import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) => {
    // Verificação de segurança para garantir que page não seja null
    if (!page) {
        console.error('SSR: Page object is null');
        return Promise.reject(new Error('Page object is null'));
    }

    return createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
        setup: ({ App, props }) => {
            // Configuração mínima para evitar problemas com Ziggy no SSR
            try {
                /* eslint-disable */
                // @ts-expect-error
                global.route = (name, params, absolute) => {
                    // Retorna uma string vazia para evitar erros no SSR
                    // O Ziggy será configurado corretamente no lado cliente
                    return '';
                };
                /* eslint-enable */
            } catch (error) {
                console.error('Error setting up global route:', error);
            }

            return <App {...props} />;
        },
    });
});
