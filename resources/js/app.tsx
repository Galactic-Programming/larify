import '../css/app.css';

import { Toaster } from '@/components/ui/sonner';
import { getXsrfToken } from '@/utils/csrf';
import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Helper to perform broadcasting auth with retry on 403/419
// XSRF token is already set by Laravel on every response via cookie
const authorizeBroadcasting = async (
    socketId: string,
    channelName: string,
    retries = 1,
): Promise<{ auth: string; channel_data?: string }> => {
    const token = getXsrfToken();

    const response = await fetch('/broadcasting/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'X-XSRF-TOKEN': token,
        },
        body: new URLSearchParams({
            socket_id: socketId,
            channel_name: channelName,
        }).toString(),
    });

    if (!response.ok) {
        // On 403/419, retry once after a short delay
        // This handles race conditions where token may not be fully synced
        if ((response.status === 403 || response.status === 419) && retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return authorizeBroadcasting(socketId, channelName, retries - 1);
        }
        // Log for debugging but don't throw - channel subscription will fail gracefully
        console.warn(`Broadcasting auth failed for ${channelName}: ${response.status}`);
        throw new Error(`Auth failed: ${response.status}`);
    }

    return response.json();
};

// Configure Echo for Laravel Reverb broadcasting
configureEcho({
    broadcaster: 'reverb',
    authorizer: (channel) => ({
        authorize: (
            socketId: string,
            callback: (error: Error | null, authData: { auth: string; channel_data?: string } | null) => void,
        ) => {
            authorizeBroadcasting(socketId, channel.name)
                .then((data) => callback(null, data))
                .catch((error) => callback(error, null));
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
