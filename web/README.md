# Shop Pipeline (Next.js + Supabase)

## 1. Create tables in Supabase

The Cursor Supabase MCP may be **read-only**; apply DDL in the dashboard:

1. Open [Supabase SQL Editor](https://supabase.com/dashboard) for your project.
2. Paste and run the file **`../supabase/migrations/20260402140000_init_shop_schema.sql`**.

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
