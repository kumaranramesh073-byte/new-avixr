import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/toastStore';

export const useKeyboardShortcuts = () => {
    const navigate = useNavigate();
    const addToast = useToastStore((state) => state.addToast);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if not typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // G then D -> Data
            if (e.key === 'd') {
                navigate('/data');
                addToast('Navigated to Data Integrations', 'info');
            }
            // G then M -> Models
            if (e.key === 'm') {
                navigate('/models');
                addToast('Navigated to ML Models', 'info');
            }
            // G then S -> Session (Home)
            if (e.key === 'h') {
                navigate('/');
                addToast('Navigated to Home', 'info');
            }
            // G then P -> Platform (Manage)
            if (e.key === 'p') {
                navigate('/manage');
                addToast('Navigated to Platform Management', 'info');
            }
            // Help
            if (e.key === '?') {
                navigate('/help');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, addToast]);
};
