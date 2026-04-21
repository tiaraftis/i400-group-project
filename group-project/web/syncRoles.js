import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ryinpjedzcymvmvtvqqu.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aW5wamVkemN5bXZtdnR2cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MjM2NiwiZXhwIjoyMDkwMDI4MzY2fQ.mTZmJN42COtxhEpAf3gX9T1x_HoaZbsBf_vlTSXWKcA";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function sync() {
  const { data: users, error } = await supabaseAdmin.from('users').select('id, role');
  if (error) {
    console.error("Failed to fetch users", error);
    return;
  }

  for (const user of users) {
    // Map instructor->coach and parent->skater just in case
    let mappedRole = user.role;
    if (mappedRole === 'instructor') mappedRole = 'coach';
    if (mappedRole === 'parent') mappedRole = 'skater';

    console.log(`Syncing ${user.id} to role ${mappedRole}...`);
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { role: mappedRole }
    });
    
    if (updateErr) {
        console.error(`Failed to update ${user.id}:`, updateErr);
    }
  }
  console.log("All existing roles synced to auth metadata!");
}

sync();
