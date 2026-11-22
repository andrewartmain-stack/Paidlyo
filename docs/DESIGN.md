# Design

Source of truth: `design_system.html` (Paidlyo Design Tokens v1.1). Tokens live in
`src/app/globals.css`; fonts in `src/app/layout.tsx`.

## Principles
1. **White, green, black.** White canvas and surfaces, near-black ink `#0e0f0c`, cool neutrals
   with a faint green tint for secondary surfaces and borders (Wise-like). No warm/beige greys.
2. **One accent, no blue.** Green only: bright green `#9fe870` fills primary buttons (dark `#163300` text on it); forest green `#163300` (`--brand`, `text-brand`) for links, highlighted text, selected borders and focus. Never bright green text on white (unreadable).
   Never use `bg-primary` for hovers, selected rows or decoration — use `bg-accent` (pale green).
3. **Type leads, icons support.** Weight and size carry the hierarchy (600 sparingly); icons add
   recognition: a `PageIcon` badge next to every app page title, icons on stat and settings cards.
4. **Quiet depth.** No shadows. Elevation = 1px border + background tint.

> Palette updated 2026-11-20 (Wise-inspired); `design_system.html` still shows the original warm
> palette — `globals.css` is the source of truth for colours.

## Token mapping (design → shadcn)
| Design token | Value | shadcn token / class |
|---|---|---|
| canvas | `#ffffff` | `--background` · `bg-background`, `--sidebar` |
| surface | `#ffffff` | `--card`, `--popover` · `bg-card` (also form fields) |
| surface-alt | `#f0f2ee` | `--secondary`, `--muted`, `--sidebar-accent` |
| ink | `#0e0f0c` | `--foreground`, `--sidebar-foreground` |
| text-muted | `#5c6158` | `--muted-foreground`, `--sidebar-muted-foreground` |
| text-faint | `#8d9289` | `--faint-foreground` · `text-faint-foreground` |
| border | `#e2e5df` | `--border`, `--sidebar-border` |
| border-strong | `#c8ccc3` | `--input` |
| primary (bright green) | `#9fe870` · hover `#80e142` · text on it `#163300` | `--primary`, `--primary-hover`, `--primary-foreground` · filled buttons, default badge |
| brand (forest green) | `#163300` | `--brand` (`text-brand`, `border-brand`), `--ring` |
| accent-soft | `#e2f6d5` · text `#163300` | `--accent`, `--accent-foreground` |
| success / warning / error | `#2f5711` / `#9a5b00` / `#a8200d` | `--success` / `--warning` / `--destructive` |
| charts | `#163300`, `#9fe870`, `#5c6158`, `#9a5b00`, `#c8ccc3` | `--chart-1…5` |

## App sidebar
- White (`--sidebar`), ink text, muted section labels, hover `--sidebar-accent` (= surface-alt),
  selected item `--sidebar-active` `#0e0f0c` (black) with white text + icon
  (`--sidebar-active-foreground`) — no ring, shadow or side bar.
- Items are pill-shaped (`rounded-full`), 36px tall, 18px icons, `gap-1` between items and `gap-6`
  between groups; icons scale up slightly on hover.
- Structure: logo + org name → "Track time" button (timer icon) → Dashboard, Timesheet, Invoices,
  Reports → **Manage** (Team, Approvals, Clients, Projects, Tasks) → footer (Settings, account menu). Defined in
  `src/components/app-shell/sidebar-nav.tsx`. Only built features are listed; add V1 items (Team,
  Expenses, Estimates, Approvals, Time off…) when they ship.

## Motion
- Buttons: colour transitions, press = scale 0.97, `ArrowRight` icons nudge right and `Plus`
  icons rotate on hover (all in `src/components/ui/button.tsx`). Keep motion subtle (≤ 300 ms for
  interactions).
- Every animation is `motion-safe:` / inside `prefers-reduced-motion: no-preference`.

## Logo
- `Logo` (`components/app-shell/logo.tsx`) renders `public/logo.png`; with `animated` it renders
  `AnimatedLogoMark`: `public/logo-wordmark.png` (coins removed) + three vector coins traced from
  the PNG. Hover / keyboard focus (~1.2 s, `logo-*` keyframes in `globals.css`): the stack spreads
  and the coins turn 3D (grey rim = thickness, inner ring + shine), the top coin flips twice showing
  a solid edge, then everything lands with a bounce. At rest all 3D parts are hidden. Used on the public header and footer.
  If the logo artwork changes, re-trace the coins or replace them with the designer's SVG.

## Illustrations
- `src/components/illustrations/`: original flat SVGs (Stopwatch, Invoice, Clients, Projects,
  Reports, Import, Trial, Success), palette via CSS variables, CSS-only animations (`ill-*`
  classes at the end of `globals.css`). Server-component safe, decorative (`aria-hidden`).
- Use them in empty states (`EmptyState illustration={...}`, `h-32 w-auto`) and key moments
  (trial, import). No third-party logos — name other products in text only.

## Typography
- Body: Inter (`font-sans`). Headings: Manrope (`font-heading`), applied to `h1–h4` in base styles.
- Use Tailwind's text scale (it matches the design: xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30 · 4xl 36).
  Note: design's `--text-md` 18px = Tailwind `text-lg`, design `--text-lg` 20px = `text-xl`, etc.

## Radii
shadcn components use `rounded-lg` for controls and `rounded-xl` for cards, so the Tailwind
names are remapped:

| Class | Value | Design name | Used for |
|---|---|---|---|
| `rounded-sm` / `rounded-md` | 4px | xs | menu items, small chips |
| `rounded-lg` | 6px | sm | inputs, menus |
| `rounded-xl` | 10px | md | cards, dialogs |
| `rounded-2xl` | 16px | lg | large panels |
| `rounded-4xl` / `rounded-full` | pill | pill | all buttons (pill-shaped), badges, avatars |

## Controls
- Buttons and inputs: 36px (`h-9`), button padding 16px (`px-4`). Table rows 40–44px.
- Card padding 24px (`--card-spacing: --spacing(6)`).
- Focus ring: 2px forest green with 2px offset (`ring-2 ring-ring ring-offset-2`), never removed.
- Badge variants: `success`, `warning` added for invoice statuses.
- Dashboard pages (`/app/*`) use the full content width: no `max-w-*` / `mx-auto` wrappers.
  Only narrow forms (e.g. settings) may cap their own width.

## Customised shadcn components
These files in `src/components/ui/` were restyled (class names only): button, input, select,
textarea, card, dialog, dropdown-menu, sheet, badge, sonner (forced light theme).
**Don't run `npx shadcn add <name> --overwrite` on them** — it reverts the design. When adding a
new shadcn component, apply the same rules: remove `shadow-*`, replace `ring-foreground/10` with
`ring-border`, use the focus ring above, controls `h-9`.

## Dark mode
Not designed yet. `.dark` styles were removed; add a new roadmap item before reintroducing it.
