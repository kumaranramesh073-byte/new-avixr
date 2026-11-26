import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../store/toastStore';
import type { ToastType } from '../../store/toastStore';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} color="var(--qs-green)" />;
            case 'error': return <XCircle size={18} color="var(--qs-red)" />;
            case 'warning': return <AlertCircle size={18} color="var(--qs-yellow)" />;
            default: return <Info size={18} color="var(--qs-blue)" />;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            pointerEvents: 'none'
        }}>
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            background: '#fff',
                            border: '1px solid var(--qs-gray-100)',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '12px 16px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            minWidth: 300,
                            pointerEvents: 'auto'
                        }}
                    >
                        {getIcon(toast.type)}
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--qs-gray-800)', flex: 1 }}>
                            {toast.message}
                        </span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--qs-gray-300)', padding: 4 }}
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
