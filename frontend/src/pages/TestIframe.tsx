export default function TestIframe() {
    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
            <iframe
                src="https://q-simutron-landing-page.vercel.app/"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Q-Simutron Landing Page"
            />
        </div>
    );
}
