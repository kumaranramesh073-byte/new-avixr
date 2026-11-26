/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Admin Route Guard
   Redirects non-admin users to Home with a toast notification.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useEffect } from 'react';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const user = useAuthStore(s => s.user);
    const addToast = useToastStore(s => s.addToast);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            addToast('Access restricted to administrators', 'warning');
        }
    }, [user, addToast]);

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
