# SBM-NAC — Deployment Guide

This guide covers deploying SBM-NAC **for free, without a credit card**. Read the first
section before picking a path — the app's shape (a persistent Express process, a database,
and long-lived Socket.io connections) rules out several popular "free" platforms, and it's
better to know that upfront.

> **Correction from an earlier version of this guide**: an earlier draft recommended Fly.io
> as a free, credit-card-optional backend host. That was wrong — checked directly against
> Fly.io's own pricing docs, their free allowance was discontinued for new accounts on
> October 7, 2024. Every new organization now requires a credit card and is billed for usage.
> Fly.io is still mentioned below as a low-cost *paid* fallback (~$2-5/month), not as part of
> the free path.

## Why not just pick any free host?

This app has three concerns with different hosting needs:

1. **The database** needs to persist data reliably.
2. **`apps/api`** (Express) needs a **long-running process** for Socket.io (live metrics,
   live notifications) and exactly **one** running instance (the metrics scheduler and
   Socket.io both assume a single instance — see the note in `fly.toml`).
3. **`apps/web`** (Next.js) is stateless — it can run anywhere.

The database used to be the hard constraint: this app was originally built on local SQLite,
which meant the API's *host* also had to provide a persistent disk — ruling out Render's
free tier, whose docs state free web services have an ephemeral filesystem where "local
SQLite databases... are lost every time the service redeploys, restarts, or spins down."

**Switching the database to Neon (free managed Postgres, no credit card, not a trial)
removes that constraint entirely.** Once the database lives somewhere else, the API's host
no longer needs its own persistent disk — it only needs to run continuously and reach the
internet. That's exactly what Render's free Web Service tier provides, without a credit
card.

| Component | Where | Cost | Credit card? |
|---|---|---|---|
| Database | Neon (neon.tech) | Free (permanent, not a trial) | No |
| API (apps/api) | Render free Web Service | Free | No |
| Web (apps/web) | Vercel free Hobby plan | Free | No |

The one real trade-off: Render's free web services spin down after 15 minutes of no
incoming traffic and take ~30-60 seconds to cold-start on the next request — including
dropping any open Socket.io connections, which reconnect automatically once the service is
back up. For a thesis defense demo or a low-traffic personal deployment, that's a reasonable
trade for $0 and no credit card. It is not what you'd want for something people rely on being
instantly responsive 24/7 — if that ever matters, upgrading this exact Render service to its
$7/month Starter tier removes the spin-down entirely, with no other changes needed.

---

## Step 1 — Database on Neon

1. Sign up at neon.tech (email only, no card).
2. Create a project. Note the connection string Neon shows you — copy the **direct**
   connection string, not the pooled one (this app is a single persistent process, not a
   serverless function, so it doesn't need PgBouncer's transaction pooling).
3. It looks like:
   ```
   postgresql://user:password@ep-example-12345.region.aws.neon.tech/sbm_nac?sslmode=require
   ```
4. That's the whole step. Neon's compute scales to zero after 5 minutes of inactivity and
   wakes on the next query in well under a second — this is a latency detail, not a
   data-loss risk (unlike Render's ephemeral filesystem problem above, Neon's storage is
   always persisted; only *compute* pauses).

## Step 2 — API on Render

Render can build this directly from GitHub without a Dockerfile at all — that's the
simpler, recommended way. (Render also supports Docker as a runtime option if you'd
rather use `apps/api/Dockerfile`; see the note at the end of this step for when that's
actually worth it. Reaching for Docker by default was an unnecessary complication in an
earlier version of this guide — apologies for the detour if you already fought through it.)

1. Push this repo to GitHub.
2. In Render, **New** -> **Web Service** -> connect the repo.
3. Set:
   - **Root Directory**: leave blank (repo root) — this is an npm workspace, so the build
     needs to see every workspace's `package.json`, not just `apps/api`'s.
   - **Runtime**: Node
   - **Build Command**:
     ```
     npm ci && npm run build --workspace=packages/shared-types && cd apps/api && npx prisma generate && cd ../.. && npm run build --workspace=apps/api
     ```
     (`apps/api`'s own `build` script already runs `prisma generate` first automatically via
     a `prebuild` hook in its `package.json`, so the explicit `npx prisma generate` above is
     technically redundant — but spelling it out here means the build doesn't silently depend
     on that hook being present and correctly wired. If you ever see the compiled output
     complaining that `@prisma/client` "has no exported member X", this is the step that
     didn't run — check for that exact error before assuming it's a code bug.)
   - **Start Command**:
     ```
     cd apps/api && npx prisma migrate deploy && node dist/server.js
     ```
     (applies any pending database migrations, then starts the server — the same thing
     `apps/api/Dockerfile`'s `CMD` does, just without a container around it)
   - **Instance Type**: Free
4. Add environment variables (Render dashboard -> Environment) — same list either way:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | your Neon direct connection string |
   | `JWT_ACCESS_SECRET` | output of `openssl rand -base64 48` |
   | `JWT_REFRESH_SECRET` | output of `openssl rand -base64 48` (a different one) |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | your Vercel URL (fill in after Step 3) |
   | `METRIC_SAMPLE_INTERVAL_MS` | `2000` |
   | `LOG_LEVEL` | `info` |
   | `SEED_ADMIN_EMAIL` | your admin email |
   | `SEED_ADMIN_PASSWORD` | a real password |

   Render applies these during the build step too (not just at runtime), which is what lets
   `prisma generate` resolve `DATABASE_URL` at build time.
5. Deploy. Every `git push` after this redeploys automatically.
6. Seed the database once, from Render's **Shell** tab:
   ```bash
   cd apps/api && npx prisma db seed
   ```
7. Your API is live at `https://sbm-nac-api.onrender.com` (or whatever name you chose).

**When Docker (`apps/api/Dockerfile`) is actually worth using on Render instead:** if you
want to guarantee the exact OS/library versions your app runs on rather than trusting
Render's native Node buildpack — mainly relevant if Prisma's engine binary detection ever
behaves differently between Render's build step and its runtime step. In practice this is
uncommon, and the native path above is what most people should start with. Docker earns its
keep in this repo on the self-hosted path below, where there's no buildpack to lean on at
all — the machine is just Linux, and something has to build the app the same way every time.

## Step 3 — Web on Vercel

1. In Vercel, **Add New Project** -> import the same repo.
2. Set **Root Directory** to `apps/web`. Vercel detects the npm workspace automatically and
   installs from the monorepo root.
3. Override the **Build Command**:
   ```
   cd ../.. && npm run build --workspace=packages/shared-types && cd apps/web && npx next build
   ```
   (`apps/web` imports `@sbm-nac/shared-types`'s compiled output, so it must be built first —
   Vercel doesn't know that automatically.)
4. Environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://sbm-nac-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_WS_URL` = `https://sbm-nac-api.onrender.com`
5. Deploy.
6. Go back to Render and update `CORS_ORIGIN` to your real `*.vercel.app` URL, then redeploy
   the API service (env var changes on Render require a redeploy to take effect).

**A note on Vercel's free Hobby tier**: genuinely free for a project this size, but Vercel
moved to credit-based billing in late 2025 — keep an eye on usage in the dashboard so a
traffic spike doesn't turn into a surprise bill.

---

## Alternative: one machine you fully control (still no credit card if it's your own hardware)

If you'd rather not depend on three separate platforms' free-tier policies, `docker-compose.yml`,
`apps/api/Dockerfile`, `apps/web/Dockerfile`, and `deploy/nginx.sbm-nac.conf.example` in this
repo run both services together on any Linux machine you already control — a spare PC, a
Raspberry Pi, or a VPS. The database is still Neon (external), so the machine itself doesn't
need to be particularly powerful or reliable for data safety.

```bash
git clone <your-repo-url> sbm-nac && cd sbm-nac
cp .env.docker.example .env
nano .env   # fill in your Neon DATABASE_URL, real secrets, real domain names
docker compose up -d --build
docker compose exec api npx prisma db seed
```

Then front it with Nginx + free HTTPS via Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx.sbm-nac.conf.example /etc/nginx/sites-available/sbm-nac
sudo nano /etc/nginx/sites-available/sbm-nac   # replace yourdomain.com with your real domain
sudo ln -s /etc/nginx/sites-available/sbm-nac /etc/nginx/sites-enabled/sbm-nac
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d sbm-nac.yourdomain.com -d api.sbm-nac.yourdomain.com
```

If the machine is at home rather than a cloud VPS, you don't need a credit card anywhere in
this path — but you're also responsible for its uptime, power, and internet connection, and
you'll need to either open ports on your router or use a tunnel service (e.g. Cloudflare
Tunnel, free tier) if it's behind CGNAT/no public IP.

**If you do have a cloud VM already** (Oracle Cloud Always Free, a university-provided VM,
etc.), the same `docker compose up -d --build` steps apply — Oracle's Always Free tier does
require a credit card for identity verification (not charged within free limits), which is
exactly what this whole guide is otherwise avoiding, so it's listed here as a fallback, not
the primary recommendation.

---

## Environment variables — production checklist

| Variable | Where | Must change from the example? |
|---|---|---|
| `DATABASE_URL` | API | Yes — your real Neon connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | API | Yes — generate with `openssl rand -base64 48` each |
| `SEED_ADMIN_PASSWORD` | API | Yes — never ship the example password |
| `CORS_ORIGIN` | API | Yes — must be your real frontend URL, not `localhost` |
| `NAC_AGENT_SECRET` | API | Only if you use the `/nac/sightings` endpoint |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` | Web (build-time) | Yes — your real API URL, baked in at build time |
| `NODE_ENV` | API | Should be `production` |

## Post-deploy smoke test

```bash
curl https://sbm-nac-api.onrender.com/health
# {"success":true,"data":{"status":"ok","timestamp":"..."}}

curl -X POST https://sbm-nac-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your-seeded-password"}'
# should return {"success":true,"data":{"admin":{...},"accessToken":"..."}}
```

Then open the frontend URL, sign in, and confirm the dashboard's live metric cards start
updating within a few seconds — that confirms the Socket.io WebSocket upgrade is working
end-to-end. If the API had spun down (Render free tier, 15+ min idle), the first page load
will hang for up to a minute while it cold-starts — that's expected, not a bug.

## Security hardening already in place vs. what's on you

**Already handled by the code** (Phases 4-6): Helmet security headers, CORS restricted to an
explicit origin, rate limiting on auth and general API routes, bcrypt password hashing,
httpOnly refresh-token cookies, Zod input validation on every mutating endpoint, centralized
error handling that never leaks stack traces to clients.

**On you, at deploy time:**
- Generate real JWT secrets — don't deploy with anything from `.env.example`.
- Use HTTPS in production (`secure: config.isProduction` is already set on the refresh
  cookie, meaning it will not be sent at all over plain HTTP in production — Render and
  Vercel both provide HTTPS automatically, so this is only something to double check on the
  self-hosted path).
- Don't expose `npx prisma studio` on a public port — it has no auth of its own.
- Neon backs up automatically (point-in-time restore within your plan's history window), so
  there's no separate backup step to remember on the free path — one more advantage of not
  self-managing the database file.

## What this guide does not cover

- **Horizontal scaling.** Every path here runs exactly one API instance, by design. Scaling
  past one instance needs a Redis adapter for Socket.io — a real architecture change, not a
  deployment tweak.
- **CI/CD.** Render and Vercel both auto-deploy on `git push` once connected, which is most
  of the way there; the self-hosted path is still a manual `git pull && docker compose up
  --build` after changes.
- **Free-tier terms changing.** Render, Vercel, and Neon's free tiers have all been stable
  as described at time of writing, but platforms do change terms — see the Fly.io correction
  at the top of this document; it happened once already in this exact guide. Verify current
  limits before relying on any of this for something that matters.
