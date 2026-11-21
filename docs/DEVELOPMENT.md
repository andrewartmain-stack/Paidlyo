# Development

## Prerequisites
- Node.js 24+ and npm
- **Stripe CLI** (to receive webhooks locally) — `brew install stripe/stripe-cli/stripe`
- Supabase CLI is installed as a dev dependency (`npx supabase ...`), no global install needed.
- No Docker: development uses a hosted Supabase project.

## Environments
| Environment | App runs on | Supabase project | Stripe |
|---|---|---|---|
| Development | `npm run dev` (localhost) | `<name>-dev` (free) | test mode |
| Production | Vercel | `<name>-prod` | live mode |

Never point local development at the prod project. Prod keys live only in Vercel env vars.

## First-time setup
1. Create two projects at https://supabase.com/dashboard: `<name>-dev` and `<name>-prod`.
2. Configure the app and link the CLI to the **dev** project:
```bash
npm install
cp .env.example .env.local      # paste the DEV project URL, publishable key, secret key
npx supabase login
npx supabase link --project-ref <dev-project-ref>   # ref = the id in the dashboard URL
stripe login
stripe listen --print-secret  # webhook signing secret -> STRIPE_WEBHOOK_SECRET
npm run stripe:listen     # forwards billing events to /api/webhooks/stripe
npm run dev               # http://localhost:3000
```
3. In the dev project: Authentication → URL Configuration → add `http://localhost:3000/**`
   to Redirect URLs.

## Supabase Auth setup (per project: dev now, prod before launch)
1. **Authentication → URL Configuration**: Site URL = `http://localhost:3000` (prod:
   `https://paidlyo.com`); Redirect URLs: add `http://localhost:3000/**`.
2. **Authentication → Emails → Templates** — make links hit `/auth/confirm` (works across devices):
   - *Confirm signup*: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>`
   - *Reset password*: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset your password</a>`
3. **Sign In / Providers → Email**: "Confirm email" on (default). The built-in mailer only sends
   a few emails per hour — fine for dev; prod needs custom SMTP (see open decisions).

## Environment variables
| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Site origin: `metadataBase` (canonical/OG URLs), sitemap, email links. `http://localhost:3000` locally, `https://paidlyo.com` in prod |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser/server clients |
| `SUPABASE_SECRET_KEY` | Admin client (webhooks only), server-only |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe API + webhook signature (server-only) |
| `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` | Price ids (`price_…`) of the Paidlyo plan; amounts are set in Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Not used yet (hosted Checkout needs no client key) |

Tailwind v4 runs through PostCSS (`postcss.config.mjs`, `@tailwindcss/postcss`), as in the
Next.js docs. If styles ever look stale in dev, stop the server and `rm -rf .next`.

Database UI: Supabase dashboard → Table Editor / SQL Editor of the dev project.

Free-tier notes: inactive projects pause after ~1 week (resume from the dashboard); the
built-in auth email sender is heavily rate-limited — configure custom SMTP before launch.

## Google sign-in (Supabase OAuth)
Supabase → Authentication → URL Configuration → Redirect URLs: `http://localhost:3000/**` and
`https://paidlyo.com/**`. Google Cloud Console → OAuth consent screen (External) → Clients →
Web application; Authorized redirect URI = `https://<project-ref>.supabase.co/auth/v1/callback`.
Paste the client ID + secret into Supabase → Authentication → Sign In / Providers → Google.

## Scripts
| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run check` | lint + typecheck + tests — run before every commit |
| `npm run lint` / `typecheck` / `test` / `test:watch` | individual checks |
| `npm run db:migration <name>` | create a new empty migration file |
| `npm run db:push` | apply pending migrations to the **linked** project (dev) |
| `npm run db:types` | regenerate `src/types/database.ts` from the linked project |
| `npm run stripe:listen` | forward Stripe webhooks to localhost |

## Adding a shadcn component
```bash
npx shadcn@latest add <component>
```
Components land in `src/components/ui/`. They are our code — edit only when needed.

## Feature workflow (from agentic-development-protocol.md)
1. **Plan** — "I want to implement: X" → Claude proposes a plan (no edits).
2. **Approve** — you correct/approve.
3. **Implement** — Claude uses the `create-feature` skill; delegates to `frontend`/`backend` agents when useful.
4. **Verify** — `npm run check` + click through it in the browser.
5. **Review** — "Review the latest diff" → `reviewer` agent.
6. **Accept** — you read the diff, then `git commit -m "feat: ..."`.

Start a fresh session (`/clear`) for each new feature. Claude reads `docs/PROGRESS.md` first.

## Parallel work with worktrees
Only for truly independent features, after shared interfaces/schema are agreed:
```bash
claude --worktree feature-clients   # or: git worktree add ../ha-clients -b feature/clients
```
Each worktree needs its own `.env.local` and `npm install`.

## Deployment (Vercel)
1. Import the Git repo in Vercel. Add env vars from `.env.example` with **prod** Supabase
   keys, Stripe **live** keys, and `NEXT_PUBLIC_APP_URL=https://<your-domain>`.
2. In the prod Supabase project: Authentication → URL Configuration → Site URL = your domain.
3. Stripe dashboard: add a webhook endpoint `https://<your-domain>/api/webhooks/stripe`,
   put its signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`. Events: `checkout.session.completed`,
   `customer.subscription.created/updated/deleted/paused/resumed`. Create the live product +
   prices and set `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`; enable the Customer Portal.
4. Apply migrations to prod **before** deploying code that needs them — you run this, never Claude:
```bash
npx supabase link --project-ref <prod-project-ref>
npx supabase db push --remote   # CLI v3 targets local Docker without --remote
npx supabase link --project-ref <dev-project-ref>   # always switch back to dev afterwards
```
