const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aW5wamVkemN5bXZtdnR2cXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ1MjM2NiwiZXhwIjoyMDkwMDI4MzY2fQ.mTZmJN42COtxhEpAf3gX9T1x_HoaZbsBf_vlTSXWKcA";

async function getCsvHeaders() {
  const res = await fetch("https://ryinpjedzcymvmvtvqqu.supabase.co/rest/v1/class_enrollments?limit=1", {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Accept": "text/csv"
    }
  });
  console.log(await res.text());
}
getCsvHeaders();
