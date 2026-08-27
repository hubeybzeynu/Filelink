# FileLink

Peer-to-peer file & remote-control web app built with TanStack Start + Supabase.

**Live app**: https://pcctrl.lovable.app

## Development

Requires Node.js 20+ and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
cp .env.example .env      # then fill in your Supabase project values
npm run dev
```

### Bring your own database

The app talks to a Supabase project through the env vars in `.env`. You can
point it at any Supabase project you own — free tier works fine:

1. Create a project at https://supabase.com and grab the URL, the
   `sb_publishable_...` (anon) key, and the `sb_secret_...` service-role key.
2. Copy `.env.example` to `.env` and paste those values in.
3. Apply the SQL migrations in `supabase/migrations/` to your project
   (Supabase Dashboard → SQL Editor, or `supabase db push` with the CLI).
4. Create a private storage bucket called `shares`.
5. `npm run dev` — the SSR server, API routes, and Vite client all read from
   the same `.env`, so no other configuration is needed.

The Supabase client automatically falls back from `import.meta.env.VITE_*`
(client bundle) to `process.env.*` (SSR / Node), so the same `.env` works in
both environments.
