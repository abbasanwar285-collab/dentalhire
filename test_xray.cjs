const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./clinic/clinic_all_database_data.json', 'utf8'));

let found = false;
for (const patient of data.patients || []) {
  if (patient.procedures) {
    let procs = typeof patient.procedures === 'string' ? JSON.parse(patient.procedures) : patient.procedures;
    for (const p of procs) {
      if (p.xrayImages && p.xrayImages.length > 0) {
        console.log("Found in procedures!");
        console.log(p.xrayImages.slice(0, 2));
        found = true;
        break;
      }
    }
  }
  if (found) break;
}

if (!found) console.log("No non-empty xrayImages found in procedures.");
