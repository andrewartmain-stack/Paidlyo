---
name: create-component
description: How to create UI components in this project with shadcn/ui and Tailwind - where they go, when to reuse, and styling rules. Use when building any new UI component.
---

# Creating a component

1. **Reuse first.** Check `src/components/ui/` (shadcn) and existing feature components.
   If shadcn has it but it is not installed, propose `npx shadcn@latest add <name>` (needs approval
   if it adds npm dependencies).
2. **Pick the location:**
   - Used by one feature → `src/features/<domain>/components/<name>.tsx`
   - Used by 2+ features → `src/components/<name>.tsx`
   - App layout pieces → `src/components/layout/`
   - Never put custom components in `src/components/ui/` (reserved for shadcn).
3. **Server or client?** Server Component unless it needs state, effects, browser APIs or
   event handlers. Keep client components small; pass data in as props.
4. **Write it:**
   - kebab-case filename, PascalCase named export, explicit props type.
   - Compose shadcn primitives; merge classes with `cn()` from `@/lib/utils`.
   - Tokens only (`bg-card`, `text-muted-foreground`, `border-border`), no hex colours.
   - Responsive (mobile-first) and accessible (labels, `aria-*` where needed, focus states).
   - No data fetching inside reusable components; no business logic (put it in the feature).
5. **States:** handle loading, empty and error states where data is shown.
6. Run `npm run lint && npm run typecheck`.
