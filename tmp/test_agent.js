async function testAgent() {
    const email = 'admin@qsimutron.ai';
    const token = btoa(email);
    const baseUrl = 'http://localhost:3001/api';

    try {
        console.log('--- Creating Session ---');
        const res = await fetch(`${baseUrl}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: 'Analyze revenue trends for 2024' })
        });

        if (!res.ok) {
            console.error('Session creation failed:', res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log('Session Response:', JSON.stringify(data, null, 2));

        if (data.sessionId) {
            console.log('\n--- Waiting for plan (poll) ---');
            let planReady = false;
            for (let i = 0; i < 15; i++) {
                const sres = await fetch(`${baseUrl}/sessions/${data.sessionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const sdata = await sres.json();
                console.log(`Status [${i}]: ${sdata.status}`);
                if (sdata.status === 'ready' || sdata.status === 'done') {
                    planReady = true;
                    break;
                }
                if (sdata.status === 'error') {
                    console.error('Session entered error state.');
                    break;
                }
                await new Promise(r => setTimeout(r, 1000));
            }

            if (planReady) {
                console.log('\n--- Executing Plan ---');
                const eres = await fetch(`${baseUrl}/sessions/${data.sessionId}/execute`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('Execute Response:', await eres.text());
            } else {
                console.log('Planning timed out or failed.');
            }
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testAgent();
