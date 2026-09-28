# Cine Club Roulette

Each guest enters their name and spins the wheel. They get one of **Starter**, **Main course** or **Dessert**.
A course can only go to one person, even when everyone spins at the same moment: the assignment runs as a
single atomic Redis script. If someone spins again with the same name, they get the course they already have.

## Deploy on Vercel

1. In Vercel, **Add New → Project** and import this repo. Set **Root Directory** to `cine-club`.
   Framework preset: **Other**. Leave the build settings empty.
2. In the project, open **Storage** (or **Marketplace**), add **Upstash for Redis** (free tier) and connect it
   to the project. This creates `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`), which the app reads.
3. In **Settings → Environment Variables**, add `ADMIN_PIN` (any code you choose). It lets you reset the
   wheel for the next night from the "Organizer" section at the bottom of the page.
4. Redeploy, then share the URL.

Without Redis the app refuses to run on Vercel, because separate serverless instances would not share memory
and two people could get the same course.

## Local preview

```
npm run dev   # http://localhost:3000, in-memory store, no Redis needed
ADMIN_PIN=1234 npm run dev   # to try the reset
```
