const https = require('https');
const token = 'sbp_485ebe3a5aadc22282e71207a5c561d54eb374bf';

console.log('Testing Supabase Management API...');

const options = {
    hostname: 'api.supabase.com',
    path: '/v1/projects', // List projects
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const projects = JSON.parse(data);
            if (Array.isArray(projects)) {
                console.log('Projects found:', projects.map(p => ({ id: p.id, name: p.name })));
            } else {
                console.log('Response:', data);
            }
        } catch (e) {
            console.log('Raw Data:', data);
        }
    });
});

req.on('error', e => console.error('Error:', e));
req.end();
