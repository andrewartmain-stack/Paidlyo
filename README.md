# Paidlyo

Affordable time tracking and invoicing for freelancers and small agencies — [paidlyo.com](https://paidlyo.com).

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · Stripe · Zod · Vitest

## Quick start
```bash
npm install
cp .env.example .env.local   # fill in Supabase DEV project + Stripe test keys
npx supabase link --project-ref <dev-project-ref>
npm run dev
```

## Docs
- [Development setup & scripts](docs/DEVELOPMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md) · [API](docs/API.md)
- [Product & competitors](docs/PRODUCT.md) · [Roadmap](docs/ROADMAP.md) · [Progress](docs/PROGRESS.md) · [Design](docs/DESIGN.md)
- [Agentic development protocol](agentic-development-protocol.md)

Claude Code config lives in `CLAUDE.md` and `.claude/` (agents, skills, permissions).
