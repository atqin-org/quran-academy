import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

type UmamiAPI = {
    identify: (id: string | number, data?: Record<string, unknown>) => void;
};

type IdentifyProps = {
    auth?: {
        user?: {
            id: number | string;
            name?: string;
            last_name?: string;
            email?: string;
            role?: string;
        } | null;
    };
};

let lastIdentifiedFingerprint: string | null = null;

function identifyUmami(props: IdentifyProps, attempt = 0): void {
    const user = props.auth?.user;
    if (!user?.id) {
        return;
    }
    const fingerprint = JSON.stringify([
        user.id,
        user.name,
        user.last_name,
        user.email,
        user.role,
    ]);
    if (fingerprint === lastIdentifiedFingerprint) {
        return;
    }
    const umami = (window as unknown as { umami?: UmamiAPI }).umami;
    if (umami) {
        umami.identify(String(user.id), {
            name: user.name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
        });
        lastIdentifiedFingerprint = fingerprint;
    } else if (attempt < 30) {
        window.setTimeout(() => identifyUmami(props, attempt + 1), 100);
    }
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);

        identifyUmami(props.initialPage.props as IdentifyProps);
    },
    progress: {
        color: '#4B5563',
    },
});

router.on('navigate', (event) => {
    identifyUmami(event.detail.page.props as IdentifyProps);
});
