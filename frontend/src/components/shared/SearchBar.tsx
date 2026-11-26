/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — SearchBar
   Central search input with agent mode selector and autocomplete.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../../store/sessionStore';
import { SUGGESTIONS, AGENT_MODES } from '../../data/constants';
import type { AgentMode } from '../../types';

interface SearchBarProps {
    onSubmit: (query: string) => void;
    placeholder?: string;
    large?: boolean;
}

export default function SearchBar({
    onSubmit,
    placeholder = 'Search across your documents...',
    large = false,
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showAgentDrop, setShowAgentDrop] = useState(false);
    const { agentMode, setAgentMode } = useSessionStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredSuggestions =
        query.length > 2
            ? SUGGESTIONS.filter((s) =>
                s.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 4)
            : [];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
                setShowAgentDrop(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSubmit = (text?: string) => {
        const q = (text || query).trim();
        if (!q) return;
        onSubmit(q);
        setQuery('');
        setShowSuggestions(false);
    };

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', maxWidth: large ? 560 : 520, position: 'relative' }}
        >
            <div
                style={{
                    display: 'flex',
                    border: '1px solid var(--qs-gray-200)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'visible',
                    background: '#fff',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'box-shadow var(--transition-normal), border-color var(--transition-normal)',
                }}
                onFocus={() => setShowSuggestions(true)}
            >
                {/* Agent Mode Selector */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowAgentDrop(!showAgentDrop)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0 12px',
                            height: large ? 52 : 44,
                            background: 'transparent',
                            border: 'none',
                            borderRight: '1px solid var(--qs-gray-200)',
                            cursor: 'pointer',
                            color: 'var(--qs-blue)',
                            fontSize: 13,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            fontFamily: 'var(--font-primary)',
                        }}
                    >
                        <Users size={16} />
                        <ChevronDown size={14} />
                    </button>
                    <AnimatePresence>
                        {showAgentDrop && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="dropdown"
                                style={{ left: 0, top: 'calc(100% + 4px)', minWidth: 220 }}
                            >
                                {AGENT_MODES.map((a) => (
                                    <button
                                        key={a}
                                        onClick={() => {
                                            setAgentMode(a as AgentMode);
                                            setShowAgentDrop(false);
                                        }}
                                        className={`dropdown-item${agentMode === a ? ' active' : ''}`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Search Input */}
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder={placeholder}
                    style={{
                        flex: 1,
                        border: 'none',
                        padding: '0 14px',
                        fontSize: large ? 15 : 14,
                        color: 'var(--qs-gray-900)',
                        background: 'transparent',
                        height: large ? 52 : 44,
                        fontFamily: 'var(--font-primary)',
                    }}
                />

                {/* Search Button */}
                <button
                    onClick={() => handleSubmit()}
                    style={{
                        padding: '0 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--qs-gray-500)',
                        borderLeft: '1px solid var(--qs-gray-200)',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Search size={18} strokeWidth={2} />
                </button>
            </div>

            {/* Autocomplete Suggestions */}
            <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="dropdown"
                        style={{ left: 0, right: 0, top: 'calc(100% + 4px)' }}
                    >
                        {filteredSuggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSubmit(s)}
                                className="dropdown-item"
                                style={{
                                    fontWeight: 500,
                                    borderBottom:
                                        i < filteredSuggestions.length - 1
                                            ? '1px solid var(--qs-gray-50)'
                                            : 'none',
                                }}
                            >
                                <Search
                                    size={12}
                                    style={{ marginRight: 8, color: 'var(--qs-gray-400)', flexShrink: 0 }}
                                />
                                {s}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
