import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aW5wamVkemN5bXZtdnR2cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MjM2NiwiZXhwIjoyMDkwMDI4MzY2fQ.mTZmJN42COtxhEpAf3gX9T1x_HoaZbsBf_vlTSXWKcA";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data: usersData, error: usersErr } = await supabaseAdmin.from('users').select('*');
  const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers();

  if (authErr || usersErr) {
      console.error(authErr || usersErr);
      return;
  }

  console.log("Registered Accounts:");
  authUsers.users.forEach(u => {
      const dbRow = usersData.find(r => r.id === u.id);
      console.log(`Email: ${u.email} | ID: ${u.id} | DB Role: ${dbRow ? dbRow.role : 'NO ROW FOUND'}`);
  });
}

check();
