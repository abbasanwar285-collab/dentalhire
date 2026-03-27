
/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);


async function debugData() {
    console.log('Fetching one patient...');
    const { data: patients, error: pError } = await supabase.from('patients').select('*').limit(1);
    if (pError) {
        console.error('Patient Error:', pError);
    } else {
        console.log('Patient Columns:', Object.keys(patients[0] || {}), patients[0]);
    }

    console.log('Fetching one appointment...');
    const { data: appointments, error: aError } = await supabase.from('appointments').select('*').limit(1);
    if (aError) {
        console.error('Appointment Error:', aError);
    } else {
        console.log('Appointment Columns:', Object.keys(appointments[0] || {}), appointments[0]);
    }
}

debugData();
