const url = "https://ryinpjedzcymvmvtvqqu.supabase.co/rest/v1/";
const key = "sb_publishable_XO0EyqiIlkNG48GCQYYNow_h05FRQtK";

fetch(url, { headers: { "apikey": key, "Authorization": `Bearer ${key}` } })
  .then(res => res.json())
  .then(data => {
    const def = data.components?.schemas || data.definitions;
    if (def && def.class_enrollments) {
      console.log("class_enrollments columns:", Object.keys(def.class_enrollments.properties));
    } else {
      console.log("Could not find class_enrollments schema.");
      console.log("Available tables:", Object.keys(def || {}).filter(k => !k.includes(' ')));
    }
  })
  .catch(console.error);
