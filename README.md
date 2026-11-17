# TapEpo Dynamic QR

A small MERN-style dynamic QR project with:
- React + Vite admin dashboard
- Express + MongoDB backend
- Random, unguessable QR identifiers
- HTTPS-only destination validation
- Admin JWT authentication
- Login rate limiting
- Enable/disable controls
- Total redirect counter

## Requirements

- Node.js 18 or newer
- MongoDB Atlas account or local MongoDB

## 1. Configure the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`, then fill in:
- `MONGO_URI`: your MongoDB connection string
- `ADMIN_PASSWORD`: a strong unique admin password
- `JWT_SECRET`: a random secret of at least 32 characters
- `BASE_URL`: `http://localhost:5000` for local testing

For example, generate a secret using Node:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Do not commit `.env` to Git.

## 2. Configure the frontend

In another terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`.
Set `VITE_API_URL=http://localhost:5000` for local development.

## 3. Run both apps

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the frontend terminal (usually http://localhost:5173).

## 4. How it works

1. Sign in with the backend `ADMIN_PASSWORD`.
2. Enter an HTTPS destination URL and create a QR.
3. The generated QR contains `BASE_URL/q/<random-id>`.
4. Scanning it looks up the latest destination in MongoDB and redirects there.
5. Change the destination in the dashboard; the printed QR remains unchanged.

## Important production notes

This is a starter project for one administrator, not a multi-business SaaS platform.
Before public production use:
- Deploy both services with HTTPS and set the production environment URLs.
- Use a strong unique admin password and JWT secret.
- Keep secrets in the hosting provider's environment settings, never in Git.
- Add CSRF-safe authentication using secure, HttpOnly cookies if you later move beyond the bearer-token demo.
- Add scan rate limiting, bot filtering, audit logs, backups, and monitoring.
- Add business ownership/tenant authorization before allowing multiple businesses.
- Use a proper account system rather than a shared admin password for a commercial product.

Scan count measures redirect requests, not unique people.
