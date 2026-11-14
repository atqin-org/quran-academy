import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

type UmamiSessionData = Record<string, string | number | boolean>;
type UmamiAPI = {
    identify: {
        (data: UmamiSessionData): void;
        (id: string, data?: UmamiSessionData): void;
    };
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
    if (!umami) {
        if (attempt < 30) {
            window.setTimeout(() => identifyUmami(props, attempt + 1), 100);
        }
        return;
    }

    const id = String(user.id);
    const fullName = [user.name, user.last_name].filter(Boolean).join(" ").trim();
    const sessionData: UmamiSessionData = { id };
    if (user.name) sessionData.first_name = user.name;
    if (user.last_name) sessionData.last_name = user.last_name;
    if (fullName) sessionData.full_name = fullName;
    if (user.email) sessionData.email = user.email;
    if (user.role) sessionData.role = user.role;

    // Newer Umami API: identify({ id, ...props }). Fall back to legacy
    // identify(id, props) form so older self-hosted instances still work.
    try {
        umami.identify(sessionData);
    } catch {
        umami.identify(id, sessionData);
    }
    lastIdentifiedFingerprint = fingerprint;
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
