import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aW5wamVkemN5bXZtdnR2cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MjM2NiwiZXhwIjoyMDkwMDI4MzY2fQ.mTZmJN42COtxhEpAf3gX9T1x_HoaZbsBf_vlTSXWKcA";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const { data, error } = await supabaseAdmin.from('class_enrollments').insert([
    { class_id: '00000000-0000-0000-0000-000000000000', skater_id: '00000000-0000-0000-0000-000000000000' }
  ]).select();

  console.log("Insert with skater_id error:", error);
}

test();
