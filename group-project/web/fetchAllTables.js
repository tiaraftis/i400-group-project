const url = "https://ryinpjedzcymvmvtvqqu.supabase.co/graphql/v1";
const key = "sb_publishable_XO0EyqiIlkNG48GCQYYNow_h05FRQtK";

const query = `
  {
    __schema {
      types {
        name
        kind
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
  const types = result.data.__schema.types;
  const objectTypes = types.filter(t => t.kind === 'OBJECT' && !t.name.startsWith('__'));
  console.log("All Object Types (Tables):", objectTypes.map(t => t.name).join(', '));
})
.catch(console.error);
