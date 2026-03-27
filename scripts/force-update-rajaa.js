import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmjqdtupptbakhpihqfc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanFkdHVwcHRiYWtocGlocWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDYyMDg3NSwiZXhwIjoyMDg2MTk2ODc1fQ.ku27wJucwlWEj8Gui3I2Qyam8XPbdqsTzVtv8t7t6s8';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const RAJAA_ID = 'afb93278-ca88-472b-9251-f34026ae5914';

async function forceUpdateRajaa() {
    const plans = [
        {
          "id": "rajaa-gen1",
          "patientId": RAJAA_ID,
          "name": "علاج عام",
          "createdAt": "2024-05-18T09:28:12.750Z",
          "totalCost": 65,
          "paidAmount": 0,
          "status": "in_progress",
          "treatments": [
            {
              "id": "rajaa-proc1",
              "treatmentType": "إجراء طبي عام",
              "cost": 65,
              "doctorId": "dr_abbas",
              "toothNumber": 0,
              "notes": ""
            }
          ],
          "payments": [],
          "steps": [],
          "notes": "تم ترحيل البيانات من النظام القديم"
        }
    ];

    console.log("Pushing rigidly constructed payload to Supabase...");
    const { data, error } = await supabase
        .from('patients_v2')
        .update({ treatment_plans: plans })
        .eq('id', RAJAA_ID)
        .select();

    if (error) {
        console.error("FAILED to update:", error);
    } else {
        console.log("SUCCESSFULLY forced update.");
        console.log("Result length:", data.length);
        console.log("Plans saved:", JSON.stringify(data[0].treatment_plans, null, 2));
    }
}

forceUpdateRajaa();
