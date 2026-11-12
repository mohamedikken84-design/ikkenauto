<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## IKKENAUTO dealerportal design and release rules

Before changing anything under `app/portal/**`, `components/vehicle-editor.tsx`, or portal-facing styles, read the root `DESIGN.md` and follow its IA, colors, components, form flows, accessibility and testing checklist.

- Source of truth for the deployed portal is the `audit/dealer-onboarding-2026-11-12` branch until explicitly migrated; do not assume that `main` contains the portal.
- Keep Supabase Auth, existing dealership records, stock data, photo buckets, RLS and API behavior intact.
- For vehicle creation, preserve the association of photos to a persisted vehicle ID; implement a genuine multi-step experience without fake actions.
- Never deploy an untested design change to the dealer production domain.
