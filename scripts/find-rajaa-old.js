import fs from 'fs';
const data = JSON.parse(fs.readFileSync('clinic/clinic_all_database_data.json', 'utf8'));
const raj = data.patients.find(p => p.name && p.name.includes('رجاء'));
console.log(JSON.stringify(raj, null, 2));
