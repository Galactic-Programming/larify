import '../css/app.css';

import { Toaster } from '@/components/ui/sonner';
import { getXsrfToken } from '@/utils/csrf';
import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Configure Echo for Laravel Reverb broadcasting
// Using authorizer function to get fresh XSRF token on each auth request
configureEcho({
    broadcaster: 'reverb',
    authorizer: (channel) => ({
        authorize: (socketId: string, callback: (error: Error | null, authData: { auth: string; channel_data?: string } | null) => void) => {
            fetch('/broadcasting/auth', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: new URLSearchParams({
                    socket_id: socketId,
                    channel_name: channel.name,
                }).toString(),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Auth failed: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    callback(null, data);
                })
                .catch((error) => {
                    callback(error, null);
                });
        },
    }),
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
                <Toaster position="bottom-right" richColors />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
