/**
 * AmbientBackground — fixed, full-viewport SOFT BLUE ambient lighting on a
 * near-white canvas (Apple Vision Pro / Linear feel). Very low-opacity blue
 * glows drift slowly behind the floating glass UI; no dark vignette.
 * Sits at z-index -10. Respects prefers-reduced-motion (global rule).
 */
export default function AmbientBackground() {
    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
            {/* soft blue — top left */}
            <div
                className="absolute rounded-full"
                style={{
                    width: 680,
                    height: 680,
                    top: '-16%',
                    left: '-10%',
                    background: 'radial-gradient(circle, rgba(96,165,250,0.18), transparent 70%)',
                    filter: 'blur(100px)',
                    animation: 'floatOrb 20s ease-in-out infinite',
                }}
            />
            {/* sky — top right */}
            <div
                className="absolute rounded-full"
                style={{
                    width: 560,
                    height: 560,
                    top: '-10%',
                    right: '-12%',
                    background: 'radial-gradient(circle, rgba(56,189,248,0.14), transparent 70%)',
                    filter: 'blur(110px)',
                    animation: 'floatOrb 24s ease-in-out infinite reverse',
                }}
            />
            {/* faint indigo — bottom center */}
            <div
                className="absolute rounded-full"
                style={{
                    width: 760,
                    height: 760,
                    bottom: '-30%',
                    left: '36%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)',
                    filter: 'blur(120px)',
                    animation: 'floatOrb 28s ease-in-out infinite',
                }}
            />
            {/* whisper of cyan — mid left */}
            <div
                className="absolute rounded-full"
                style={{
                    width: 420,
                    height: 420,
                    top: '48%',
                    left: '-8%',
                    background: 'radial-gradient(circle, rgba(14,165,233,0.08), transparent 70%)',
                    filter: 'blur(120px)',
                    animation: 'floatOrb 32s ease-in-out infinite reverse',
                }}
            />
        </div>
    );
}
