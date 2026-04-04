# Shop Pipeline (Next.js + Supabase)

## 1. Create tables in Supabase

Pick **one** of these.

### A. SQL Editor (dashboard)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard) for your project.
2. Paste and run **`../supabase/migrations/20260402140000_init_shop_schema.sql`**.

### B. Supabase CLI (matches dashboard “Run your first migration”)

From the **repo root** (not `web/`):

```bash
npx supabase login
npx supabase link --project-ref duwndvkeeeneaxlcvanm
npx supabase db push
```

You **do not** need `supabase migration new new-migration` — this repo already has  
`supabase/migrations/20260402140000_init_shop_schema.sql`. That command is only for adding a *new* empty migration file.

`db push` applies every file under `supabase/migrations/` to the linked project.

## 2. Environment

```bash
cp .env.example .env.local
# Set DATABASE_URL (direct URI locally; pooler URI on Vercel).
```

## 3. Seed from course SQLite (optional)

```bash
npm install
export DATABASE_URL="postgresql://..."
npm run db:seed
```

## 4. Local dev

```bash
npm run dev
```

## 5. Vercel

- Import the repo; set **Root Directory** to **`web`**.
- Add **`DATABASE_URL`** in Vercel → Settings → Environment Variables (use **pooler** `6543` for Production/Preview).
- Redeploy.

## Batch scoring

From repo root (not `web/`):

```bash
pip install -r jobs/requirements.txt
export DATABASE_URL="postgresql://..."
python3 jobs/run_inference.py
```

On Vercel, `/api/run-scoring` returns 503 unless **`SCORING_WEBHOOK_URL`** is set.
