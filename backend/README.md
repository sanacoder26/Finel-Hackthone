# Backend Deployment

Deploy this folder as a separate Vercel project with:

- Root directory: `backend`
- Install command: `npm install`
- Start command: handled by `backend/vercel.json`

Required Vercel environment variables:

```env
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=https://YOUR-VERCEL-FRONTEND-URL
GEMINI_API_KEY=
NODE_ENV=production
```

`PORT` is not required for Vercel serverless functions. The local `npm start` path still uses `PORT` and binds to `0.0.0.0`.

The API health check is `/api/health`. This deployment exports the Express app as a serverless handler and keeps MongoDB connections cached across warm invocations.

Socket.IO is retained for local and persistent-server deployments, but Vercel serverless functions do not provide the persistent connection required for Socket.IO real-time events. Keep Railway or another persistent host as the backend when the hackathon requires live ticket and message updates.