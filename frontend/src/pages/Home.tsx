import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/shared/SearchBar';
import { useSession } from '../hooks/useSession';
import { SUGGESTIONS } from '../data/constants';

export default function Home() {
    const navigate = useNavigate();
    const { submitQuery, setGlobalSearch } = useSession();

    const handleSearch = async (query: string) => {
        setGlobalSearch(query);
        const sid = await submitQuery(query);
        if (sid) {
            navigate(`/sessions/${sid}`);
        }
    };

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                background: 'linear-gradient(to bottom, #fff, var(--qs-gray-50))'
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center', marginBottom: 40 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
                    <img
                        src="/hero-logo-transparent.png"
                        alt="Qsimutron"
                        style={{
                            height: 160,
                            width: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 30px rgba(0,0,0,0.08))'
                        }}
                    />
                </div>
                <p style={{ fontSize: 16, color: 'var(--qs-gray-500)', maxWidth: 600, margin: '0 auto' }}>
                    Accelerate insights across your enterprise data with high-fidelity agent orchestration.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
                <SearchBar onSubmit={handleSearch} large />
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ marginTop: 40, width: '100%', maxWidth: 560 }}
            >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--qs-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                    Try Asking
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSearch(s)}
                            style={{
                                textAlign: 'left',
                                padding: '10px 16px',
                                background: '#fff',
                                border: '1px solid var(--qs-gray-100)',
                                borderRadius: 8,
                                fontSize: 13,
                                color: 'var(--qs-gray-700)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = 'var(--qs-blue)';
                                e.currentTarget.style.color = 'var(--qs-blue)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = 'var(--qs-gray-100)';
                                e.currentTarget.style.color = 'var(--qs-gray-700)';
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
