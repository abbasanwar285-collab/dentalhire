import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env', 'utf8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('VITE_SUPABASE_URL')).split('=')[1].trim();
const supabaseKey = env.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1].trim();

const options = {
  hostname: new URL(supabaseUrl).hostname,
  path: '/rest/v1/appointments?select=id,date,time,status&order=date.desc&limit=10',
  method: 'GET',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});

req.end();
