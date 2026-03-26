import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("=== DEEP SUPABASE DIAGNOSTICS ===\n");

  // 1. Check all tables exist and are accessible
  const tables = [
    'patients_v2', 'appointments_v2', 'expenses_v2',
    'app_users', 'app_supply_requests', 'app_tasks', 'app_settings'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${table}: ERROR - ${error.message} (code: ${error.code})`);
    } else {
      console.log(`✅ ${table}: accessible (${count} rows)`);
    }
  }

  // 2. Test INSERT with all possible field types for patients_v2
  console.log("\n=== TEST INSERT ===");
  const testId = 'diag-test-' + Date.now();
  
  const patientPayload = {
    id: testId,
    name: 'Diagnostic Test',
    phone: '07701234567',
    age: 25,
    medical_history: 'test',
    general_notes: 'test',
    treatment_plans: [{ id: 'plan1', name: 'test plan', steps: [] }],
  };
  
  console.log("Inserting patient:", JSON.stringify(patientPayload, null, 2));
  const { data: insertData, error: insertErr } = await supabase
    .from('patients_v2')
    .upsert(patientPayload)
    .select();
  
  if (insertErr) {
    console.log(`❌ Patient INSERT FAILED: ${insertErr.message}`);
    console.log("   Details:", insertErr.details);
    console.log("   Hint:", insertErr.hint);
    console.log("   Code:", insertErr.code);
  } else {
    console.log(`✅ Patient INSERT SUCCESS:`, insertData);
  }

  // 3. Verify the row is retrievable
  const { data: verifyData, error: verifyErr } = await supabase
    .from('patients_v2')
    .select('*')
    .eq('id', testId)
    .single();
  
  if (verifyErr) {
    console.log(`❌ Patient VERIFY FAILED: ${verifyErr.message}`);
  } else {
    console.log(`✅ Patient VERIFY SUCCESS - treatment_plans type: ${typeof verifyData.treatment_plans}, value:`, verifyData.treatment_plans);
  }

  // 4. Test expenses_v2 with supply_request_id column
  console.log("\n=== TEST EXPENSES ===");
  const expensePayload = {
    id: 'diag-exp-' + Date.now(),
    amount: 50000,
    category: 'supply',
    description: 'Test expense',
    date: new Date().toISOString(),
    created_by_user_id: 'test-user',
    supply_request_id: 'test-supply',
  };
  
  const { error: expErr } = await supabase.from('expenses_v2').upsert(expensePayload);
  if (expErr) {
    console.log(`❌ Expense INSERT FAILED: ${expErr.message}`);
    console.log("   Details:", expErr.details);
    console.log("   Hint:", expErr.hint);
    // Try without supply_request_id
    delete expensePayload.supply_request_id;
    const { error: expErr2 } = await supabase.from('expenses_v2').upsert({...expensePayload, id: expensePayload.id + 'b'});
    if (expErr2) {
      console.log(`❌ Expense INSERT without supply_request_id also FAILED: ${expErr2.message}`);
    } else {
      console.log(`⚠️  Expense INSERT works WITHOUT supply_request_id - column missing!`);
    }
  } else {
    console.log(`✅ Expense INSERT SUCCESS (with supply_request_id)`);
  }

  // 5. Test app_settings upsert
  console.log("\n=== TEST SETTINGS ===");
  const settingsPayload = {
    id: 'default',
    clinic_name: 'Iris Clinic Test',
    clinic_phone: '07701234567',
    clinic_address: 'Baghdad',
  };
  const { error: settErr } = await supabase.from('app_settings').upsert(settingsPayload);
  if (settErr) {
    console.log(`❌ Settings UPSERT FAILED: ${settErr.message}`);
    console.log("   Code:", settErr.code);
  } else {
    console.log(`✅ Settings UPSERT SUCCESS`);
  }

  // 6. Test app_users with all salary fields
  console.log("\n=== TEST USERS ===");
  const userPayload = {
    id: 'diag-user-' + Date.now(),
    username: 'diag_test_' + Date.now(),
    display_name: 'Diag Test',
    phone: '07701234567',
    role: 'secretary',
    is_active: true,
    permissions: {},
    color: '#10B981',
    specialization: null,
    salary_type: 'fixed',
    fixed_salary: 500000,
    percentage: null,
    salary_start_date: '1',
    bonuses: [],
    deductions: [],
    salary_notes: 'test',
  };
  const { error: userErr } = await supabase.from('app_users').upsert(userPayload);
  if (userErr) {
    console.log(`❌ User INSERT FAILED: ${userErr.message}`);
    console.log("   Details:", userErr.details);
    // Try with only basic fields
    const basicUser = { id: userPayload.id, username: userPayload.username, display_name: 'Basic', role: 'secretary' };
    const { error: userErr2 } = await supabase.from('app_users').upsert(basicUser);
    if (userErr2) {
      console.log(`❌ Basic User INSERT also FAILED: ${userErr2.message}`);
    } else {
      console.log(`⚠️  User INSERT works with basic fields only - some columns missing!`);
    }
  } else {
    console.log(`✅ User INSERT SUCCESS (with all salary fields)`);
  }

  // 7. Test app_supply_requests
  console.log("\n=== TEST SUPPLY REQUESTS ===");
  const supplyPayload = {
    id: 'diag-supply-' + Date.now(),
    name: 'Test Supply',
    quantity: 5,
    unit: 'box',
    urgency: 'normal',
    notes: 'test',
    requested_by_user_id: 'test-user',
    status: 'pending',
    created_at: new Date().toISOString(),
    purchased_at: null,
    purchase_price: null,
  };
  const { error: supplyErr } = await supabase.from('app_supply_requests').upsert(supplyPayload);
  if (supplyErr) {
    console.log(`❌ Supply INSERT FAILED: ${supplyErr.message}`);
  } else {
    console.log(`✅ Supply INSERT SUCCESS`);
  }

  // 8. Test app_tasks
  console.log("\n=== TEST TASKS ===");
  const taskPayload = {
    id: 'diag-task-' + Date.now(),
    title: 'Test Task',
    description: 'test',
    priority: 'normal',
    assigned_to_user_id: 'test-user',
    created_by_user_id: 'test-user',
    status: 'pending',
    related_patient_id: null,
    due_date: '2026-03-30',
    created_at: new Date().toISOString(),
    completed_at: null,
  };
  const { error: taskErr } = await supabase.from('app_tasks').upsert(taskPayload);
  if (taskErr) {
    console.log(`❌ Task INSERT FAILED: ${taskErr.message}`);
  } else {
    console.log(`✅ Task INSERT SUCCESS`);
  }

  // Cleanup
  console.log("\n=== CLEANUP ===");
  await supabase.from('patients_v2').delete().eq('id', testId);
  await supabase.from('expenses_v2').delete().like('id', 'diag-exp-%');
  await supabase.from('app_users').delete().like('id', 'diag-user-%');
  await supabase.from('app_supply_requests').delete().like('id', 'diag-supply-%');
  await supabase.from('app_tasks').delete().like('id', 'diag-task-%');
  console.log("Cleanup done.");
}

run().catch(console.error);
