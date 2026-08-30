# AI Support Desk

This project contains:

- backend/ — Express + MongoDB + Socket.IO API
- frontend/ — React + Vite + React Router client

## Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Required backend environment variables:

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5174
NODE_ENV=development
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Required frontend environment variables:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Production deployment

### 1) Railway backend

- Root directory: `backend`
- Install command: `npm install`
- Start command: `npm start`

Required Railway environment variables:

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
CLIENT_URL=https://YOUR-VERCEL-FRONTEND-URL
CLIENT_URLS=
NODE_ENV=production
```

Health check:

```bash
https://YOUR-RAILWAY-BACKEND-URL/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "AI Support Desk API is running"
}
```

### 2) Vercel frontend

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Required Vercel environment variables:

```env
VITE_API_URL=https://YOUR-RAILWAY-BACKEND-URL/api
VITE_SOCKET_URL=https://YOUR-RAILWAY-BACKEND-URL
```

Configure Vercel SPA fallback by keeping `frontend/vercel.json` in place.

## Deployment order

1. Push project to GitHub.
2. Deploy backend/ to Railway.
3. Add Railway env vars.
4. Deploy backend.
5. Test the health route.
6. Copy the Railway backend URL.
7. Deploy frontend/ to Vercel.
8. Add frontend environment variables.
9. Deploy frontend.
10. Copy the Vercel frontend URL.
11. Return to Railway and set CLIENT_URL to the Vercel URL.
12. Redeploy Railway.
13. Test login/register.
14. Test ticket creation and AI triage.
15. Test agent reply and Socket.IO messages.
16. Test ticket status updates.
17. Test resolution.

## Security notes

- AI keys remain server-side only.
- MongoDB credentials are stored only in backend environment variables.
- JWT secrets are stored only in backend environment variables.
- No API keys or secrets are exposed to the frontend.
