import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

declare global {
    interface Window {
        __QS_AUTH?: { signedIn: boolean; logout: () => Promise<void> };
    }
}

/**
 * Index page ("/"): the Q-Simutron marketing site.
 *
 * The site is a standalone page (public/landing/index.html) shown full-screen in
 * a same-origin iframe, so its styles and scripts stay separate from the app's
 * global CSS (which locks html/body scrolling). Its links to app pages
 * (/auth, /morning) navigate this window.
 *
 * window.__QS_AUTH tells the site whether someone is signed in, so its header
 * shows "Log out" and "Open Dashboard" instead of "Login" and "Start Simulating".
 * The "qs-auth" event asks it to re-render when that changes.
 */
export default function Landing() {
    const user = useAuthStore((s) => s.user);
    const isLoading = useAuthStore((s) => s.isLoading);
    const logout = useAuthStore((s) => s.logout);
    const frame = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        window.__QS_AUTH = { signedIn: !isLoading && !!user, logout };
        frame.current?.contentWindow?.dispatchEvent(new Event('qs-auth'));
    }, [user, isLoading, logout]);

    useEffect(() => () => {
        delete window.__QS_AUTH;
    }, []);

    return (
        <iframe
            ref={frame}
            src="/landing/index.html"
            title="Q-Simutron"
            onLoad={() => frame.current?.contentWindow?.focus()}
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, display: 'block' }}
        />
    );
}
