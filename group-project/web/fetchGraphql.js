const url = "https://ryinpjedzcymvmvtvqqu.supabase.co/graphql/v1";
const key = "sb_publishable_XO0EyqiIlkNG48GCQYYNow_h05FRQtK";

const query = `
  {
    __schema {
      types {
        name
        fields {
          name
        }
      }
    }
  }
`;

fetch(url, {
  method: 'POST',
  headers: { 
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query })
})
.then(res => res.json())
.then(result => {
  if (result.errors) {
    console.error("GraphQL Errors:", result.errors);
    return;
  }
  const types = result.data.__schema.types;
  const enrollments = types.find(t => t.name.toLowerCase().includes('enrollment') || t.name.toLowerCase().includes('registration'));
  console.log("Found related tables:", enrollments ? enrollments.name : "None");
  if (enrollments && enrollments.fields) {
    console.log("Fields:", enrollments.fields.map(f => f.name));
  } else {
      console.log("Listing all matching object types:", types.filter(t => t.fields).map(t => t.name).join(', '));
  }
})
.catch(console.error);
