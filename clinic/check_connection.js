
const https = require('https');

const url = 'https://rwbovdtcnrkslrgdjzth.supabase.co';

console.log(`Checking connection to ${url}...`);

https.get(url, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    console.log('Connection Successful!');
}).on('error', (e) => {
    console.error('Connection Failed:', e);
});
