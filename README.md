# RandoChat

Random 1-on-1 video chat. Two services:

- `client/` — Next.js 15 app (deploy to Vercel)
- `server/` — Node + Socket.IO signaling (deploy to Koyeb)

## Local dev

```bash
# terminal 1
cd server && npm install && npm run dev   # :4000

# terminal 2
cd client && npm install && npm run dev   # :3000
```

Set `NEXT_PUBLIC_SIGNAL_URL` in `client/.env.local` to the signaling URL (defaults to `http://localhost:4000`).

## Optional: persist reports to Supabase

Run `server/schema.sql` in the Supabase SQL editor, then set on the server:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Without these the server logs reports to stdout.
