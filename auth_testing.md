# Auth Testing Playbook (Forneto)

Auth model: JWT Bearer tokens (12h expiry), admin seeded idempotently from env (ADMIN_EMAIL / ADMIN_PASSWORD in /app/backend/.env), bcrypt hashes, no cookies.

## Step 1: MongoDB
- db.users.find({role:"admin"}) — password_hash starts with $2b$
- Index: unique on users.email

## Step 2: API
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@forneto.com","password":"forneto123"}'
# -> {access_token, user}
curl $API/api/auth/me -H "Authorization: Bearer <token>"
# -> {email, name}
curl $API/api/admin/items -H "Authorization: Bearer <token>"   # 200
curl $API/api/admin/items                                       # 401
```

## Admin CRUD surface
- /api/admin/categories (GET/POST/PUT/DELETE) — delete blocked if category has items
- /api/admin/items (GET/POST/PUT/DELETE)
- /api/admin/settings (PUT), /api/settings (GET public), /api/menu (GET public)
