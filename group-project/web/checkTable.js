import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aW5wamVkemN5bXZtdnR2cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MjM2NiwiZXhwIjoyMDkwMDI4MzY2fQ.mTZmJN42COtxhEpAf3gX9T1x_HoaZbsBf_vlTSXWKcA";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  // Query class_registrations 
  const { data, error } = await supabaseAdmin.from('class_registrations').select('*').limit(1);
  if (error) {
    console.error("class_registrations error:", error);
  } else {
    console.log("class_registrations exists! Rows:", data.length);
  }

  // we can also try to infer what tables exist by querying something else
  // if class_registrations doesn't exist, we will create it if needed? 
  // No, I can't create it without the postgres connection string! Let's see if it just has a different name!
}

check();
