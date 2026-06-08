fetch('http://localhost:3001/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@gannpro9.com', password: 'GannPro9!Admin@2026#Vx7k' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
