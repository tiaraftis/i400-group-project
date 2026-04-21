import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseAnonKey = "sb_publishable_XO0EyqiIlkNG48GCQYYNow_h05FRQtK";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aW5wamVkemN5bXZtdnR2cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MjM2NiwiZXhwIjoyMDkwMDI4MzY2fQ.mTZmJN42COtxhEpAf3gX9T1x_HoaZbsBf_vlTSXWKcA";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("--- Querying 'users' table using Service Role (Bypasses RLS) ---")
  const { data: adminData, error: adminError } = await supabaseAdmin.from('users').select('*').limit(5);
  console.log("Data:", adminData);
  console.log("Error:", adminError);

  console.log("\n--- Querying 'users' table using Anon Key (Subject to RLS) ---")
  const { data: anonData, error: anonError } = await supabaseAnon.from('users').select('*').limit(5);
  console.log("Data:", anonData);
  console.log("Error:", anonError);
}

check();
