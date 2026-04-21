import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseAnonKey = "sb_publishable_XO0EyqiIlkNG48GCQYYNow_h05FRQtK";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase connection...');
  try {
      // Just testing authentication/connection, we don't know the table names
      const { data, error } = await supabase.auth.getSession();
      if (error) {
          console.error("Supabase connection/auth error:", error);
      } else {
          console.log("Supabase connected successfully! Auth session:", data);
      }
  } catch (err) {
      console.error("Failed to connect:", err);
  }
}

test();
