# Yetunde & Babatunde

Wedding website for 9th October 2026 at Elite Venue, Gravesend.

Built with Astro (static), Tailwind, Alpine.js, and Supabase for the RSVP form.

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
npm run preview
```

## Environment variables

Copy `.env.example` → `.env` and fill in real values:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Never commit `.env`. Astro only reads `.env` at startup — restart the dev server after changes.

## RSVP form behaviour

The form submits directly to Supabase's `rsvps` table from the browser. A few UX/security details worth knowing:

### Duplicate-submission protection

- Row-level security on the `rsvps` table allows inserts but blocks reads/updates/deletes via the anon key
- A unique index on `email` prevents duplicate submissions — raw Postgres errors are caught and translated to friendly messages (see `friendlyError()` in `RSVPForm.astro`)

### Returning-visitor cookie

On successful submission the form sets a cookie:

```
rsvp_submitted=<email>;  max-age=1 year;  path=/;  SameSite=Lax
```

On subsequent visits the form is hidden and replaced with an **"You've Already RSVP'd"** card showing the email they used. A **"RSVP for someone else"** button lets a second family member submit from the same device.

### Admin escape hatch

If a guest needs to submit again (e.g. lost confirmation, shared family device, testing), append `?rsvp=new` to any URL on the site:

```
https://yoursite.com/?rsvp=new#rsvp
```

This bypasses the cookie check for that visit only — the cookie itself is not deleted, so returning without the param shows the "already submitted" card again.

### Guest-side reset

Guests can also clear the cookie manually: browser settings → clear cookies for the site, or open the site in an incognito window.

## Supabase setup

SQL to run once in your Supabase project (SQL Editor):

```sql
create table rsvps (
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  first_name    text not null,
  last_name     text not null,
  email         text not null unique,
  phone         text,
  attending     text not null,
  relationship  text not null,
  dietary       text,
  message       text
);

alter table rsvps enable row level security;

create policy "Anyone can submit an RSVP"
  on rsvps for insert
  to anon
  with check (true);
```

Viewing RSVPs: Supabase dashboard → **Table Editor → rsvps**. The dashboard uses the `service_role` key internally and bypasses RLS.

## Deployment (Cloudflare Pages)

1. Push to GitHub
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Environment variables → add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` for **Production** and **Preview**
5. Save → auto-build → live at `<project>.pages.dev`

Custom domain: Cloudflare Pages → **Settings → Custom domains**.

Env var changes require a fresh deploy (Cloudflare builds bake `PUBLIC_*` vars into the output).

---

Made by [Kinetech Lab](https://kinetechlab.uk).
