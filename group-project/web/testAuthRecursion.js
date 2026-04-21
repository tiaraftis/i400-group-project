import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseAnonKey = "sb_publishable_XO0EyqiIlkNG48GCQYYNow_h05FRQtK";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const email = `test${Date.now()}@test.com`;
  const password = "password123";
  
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
  if (signUpErr) {
    console.error("SignUp error:", signUpErr);
    return;
  }
  
  console.log("Logged in. UID:", signUpData.user.id);
  
  const { data, error } = await supabase.from('users').select('role').eq('id', signUpData.user.id).maybeSingle();
  console.log("Fetch Role Data:", data);
  console.log("Fetch Role Error:", error);
}

test();
