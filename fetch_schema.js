import fs from 'fs';

async function fetchSchema() {
  const url = 'https://kmjqdtupptbakhpihqfc.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA4NzUsImV4cCI6MjA4NjE5Njg3NX0.DUTKuOtQ4tf3IyyVv6sWlOc56jOaLXeHT-_XMmiqI4g';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    fs.writeFileSync('C:\\Users\\abbas\\Desktop\\iris new manager app\\supabase_schema.json', JSON.stringify(data, null, 2));
    console.log('Schema fetched and saved.');
  } catch (err) {
    console.error('Error fetching schema:', err);
  }
}

fetchSchema();
