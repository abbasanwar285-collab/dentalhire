import fs from 'fs';
const data = JSON.parse(fs.readFileSync('clinic/clinic_all_database_data.json', 'utf8'));
const sample = {
  patient: data.patients[0],
  appointment: data.appointments ? data.appointments[0] : null
};
fs.writeFileSync('tmp_sample.json', JSON.stringify(sample, null, 2));
