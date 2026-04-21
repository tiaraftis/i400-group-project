import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aW5wamVkemN5bXZtdnR2cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MjM2NiwiZXhwIjoyMDkwMDI4MzY2fQ.mTZmJN42COtxhEpAf3gX9T1x_HoaZbsBf_vlTSXWKcA";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data, error } = await supabaseAdmin.from('users').select('*').limit(1);
  if (error) {
    console.error("users table error:", error);
  } else {
    console.log("users table columns:", data.length > 0 ? Object.keys(data[0]) : "Empty table");
    if (data.length > 0) console.log("Example row:", data[0]);
  }

  // Also check skating_classes
  const { data: clsData, error: clsErr } = await supabaseAdmin.from('skating_classes').select('*').limit(1);
  if (clsErr) console.error("skating_classes error:", clsErr);
  else console.log("skating_classes columns:", clsData.length > 0 ? Object.keys(clsData[0]) : "Empty table");
}

check();
