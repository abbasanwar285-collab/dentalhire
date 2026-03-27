const fs = require('fs');
const patients = JSON.parse(fs.readFileSync('src/data/patients.json', 'utf8'));
console.log('Total patients in JSON:', patients.length);
