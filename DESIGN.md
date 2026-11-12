# DESIGN.md — IKKENAUTO Dealerportaal
Version: 2026-11-12 | Scope: dealer dashboard, onboarding, vehicle inventory, edit and import.

## 1. Product intent
IKKENAUTO is a Belgian automotive marketplace in preparation. Today the portal is a **private dealer workspace** for free garage onboarding and stock preparation. The public marketplace is not yet launched. Do not imply vehicles are already publicly listed, that dealer directory records are registered accounts, or that external-site imports are automatic.
Audience: busy Belgian vehicle dealers, often mobile users. Optimize for someone who can create one real listing without instruction. Default Dutch; design must allow long French labels.
Keep existing Next.js, React, Supabase Auth, RLS, Storage, dealer identities, records, and routes working. This design system is not a license to rebuild the backend.

## 2. References — use principles, NOT copies
- VoltAgent/awesome-design-md: the DESIGN.md conventions.
- Linear: dense but calm workspace navigation, precise typography, neutral hierarchy.
- Vercel: restrained monochrome controls and consistent layout rhythm.
- AutoScout24 Belgium: logical ordering and terminology for vehicle attributes.
- Carnet Belgium: clear professional garage onboarding and inventory tasks.
- 2dehands Belgium: practical mobile-first selling flow.
Do not clone proprietary layouts, assets, trademarks, text, images or icons. IKKENAUTO must have its own appearance.

## 3. Visual identity

**Approved by the project owner: Design 1 — Luxury Minimal.** Use restrained editorial layout with warm off-white background, fine gray/beige borders, true black primary actions and a single subtle gold brand accent. Do not switch to the alternative dark SaaS dashboard or image-heavy automotive showroom style. Preserve the second K as the **only gold letter** in every rendered IKKENAUTO wordmark.
- Brand: IKKENAUTO with **second K in gold**, as per approved wordmark. Reuse existing `PortalLogo` / logo assets; do not create placeholder logos.
- Palette:
  - --ia-canvas: #F7F7F6 (page background)
  - --ia-surface: #FFFFFF (cards, forms)
  - --ia-ink: #141414 (primary text, primary buttons)
  - --ia-muted: #616161 (secondary text)
  - --ia-border: #E5E5E5 (dividers and input strokes)
  - --ia-subtle: #F2F2F0 (hover/secondary surfaces)
  - --ia-gold: #BA9349 (small brand accents, active focus, links when useful)
  - --ia-gold-contrast: #795C22 (readable small gold labels)
  - --ia-danger: #A82D2D
  - --ia-success: #256E4B
- Prefer light workspace surfaces, black primary actions, subtle gold only for identity and focus. No gradients, glows, glassmorphism, neon, gaudy shadows, marketing-style oversized headings or decorative emoji.
- Use one coherent sans-serif stack (e.g. Arial/Inter/Geist fallback), regular body weight; avoid mixing existing public-site serif display typography into the portal.
- Type hierarchy: page heading 26–30 px, section heading 18–20 px, body 14–16 px, helper 12–13 px, high-contrast labels 13–14 px. Avoid ALL-CAPS except tiny overlines.
- Radius: 8 px inputs/buttons, 12 px cards; shadows rare; 1 px neutral borders.
- Spacing: 4/8/12/16/24/32 px. Consistent 44 px minimum touch targets.

## 4. Information architecture
Dealer navigation, in this order:
1. Overzicht — small KPI row, most recent vehicles, primary action.
2. Mijn voertuigen — searchable inventory with thumbnails and status.
3. Auto toevoegen — één doorlopende, overzichtelijke pagina met zichtbare secties en een compacte anker-navigatie. Geen wizard, vervolgstappen of verborgen verplichte invoer.
4. Importeren — distinct CSV flow with preview and warnings; do not offer fake one-click AutoScout24/2dehands import.
5. Aanvragen — buyer leads with clear unread/answered statuses.
6. Garageprofiel — company details and media.
Use top bar + compact sidebar on desktop, accessible compact nav on mobile. Keep admin-only prospects, directory and approvals OUT of normal dealer navigation. Allow just one prominent primary CTA per screen. Do not duplicate marketplace header/footer inside workspace.

## 5. Vehicle entry — critical UX
- Offer a single unmistakable path "Auto toevoegen" from dashboard and inventory.
- Actual creation flow: all 8 information groups on ONE continuous page (vehicle, technology, equipment, appearance, history, price/tax, photos/description, review). A single bottom action creates a private draft. Selected photos upload directly to private Supabase storage after the draft is persisted; editing stays available afterwards.
  1. Basis: merk, model, uitvoering, bouwjaar, kilometerstand, prijs.
  2. Kenmerken: brandstof, transmissie, carrosserie, staat en technische details.
  3. Uitrusting: categorized options and description.
  4. Controleren: confirm data and save as draft.
  5. Photos are uploaded directly from the authenticated browser to private Supabase Storage after the draft has an ID.
- Never route several large photos through a Vercel Server Action: the deployed function request limit is 4.5 MB; use the private Supabase browser upload and preserve Storage + photo-record RLS.
- Important constraints: the current backend inserts a vehicle before photos can attach to its ID. Preserve this requirement and make the transition transparent; do not claim photos upload before persistence until implemented.
- Brand/model: searchable suggestions + free typing for rare brands; never crash when make/model is blank or changes.
- Every required field identified clearly, with units (€, km, pk). Use real domain validation and accessible, nearby errors; preserve entered values when validation fails.
- Optional details belong in sensible groups, not a 40-field wall.
- "Volgende", "Vorige", "Concept opslaan" must work as labeled; never place a dead control.
- Reuse one data model and common component patterns for add/edit; do not introduce a third incompatible auth/vehicle system.

## 6. Inventory
- Desktop: structured table with photo/placeholder, "merk model", version/year/km, price, stock number, visibility/readiness status, context actions (Bewerken, Foto's, Verkocht, Verwijderen).
- Mobile: readable cards, no horizontal swipe required for primary actions.
- Empty state: one short sentence and clear "Eerste auto toevoegen".
- Show truthful counts and paginated results, loading states, no-results and error messages; do not show stale directory search results.
- Deleting cars is destructive and requires clear confirmation; never silently overwrite or delete stored information.

## 7. Forms, feedback, accessibility

- Do not reintroduce multi-step creation. All relevant fields, including advanced EV and van specifications and equipment categories, are visible in the scrollable page. Sticky compact section anchors and a single save action replace the old wizard.
- Keep the dealer-portal brand Luxury Minimal: warm off-white, ink black, subtle gold second K, no generic oversized AI-looking cards.
- Protect production and previews with Vercel Authentication for every deployment. Do not make public again without explicit owner authorization. Root Hostinger/Netlify site protection is managed separately if still deployed.
- Labels outside inputs; examples as placeholders only, never as sole labels.
- Clear visible focus ring, semantic form controls, correct keyboard tab order, explicit error and success messaging.
- Contrast target WCAG AA, touch targets >= 44 px, responsive at 375/768/1024/1440 widths.
- Preserve useful values on submit errors, allow users to backtrack without data loss. Validate file type, size and duplicate stock numbers.
- Every button, link and menu has an actual function. Informational cards must not have arrow or hover affordances unless interactive. Dashboard KPI cards link to working filtered screens. No dummy KPIs, fake reviews, dead import options, or speculative marketplace metrics.
- Never expose another dealer's data. Preserve all existing Supabase RLS and server-side owner checks.
- Handle slow uploads, empty records, long dealer names, and screens at mobile width.

## 8. Code ownership and implementation guardrails
- Current active source branch at authoring: `audit/dealer-onboarding-2026-11-12`, NOT the outdated starter `main`.
- Main portal files: `app/portal/page.tsx`, `app/portal/vehicle-editor.tsx`, `app/portal/vehicle-edit-form.tsx`, `app/portal/quick-import.tsx`, `app/portal/portal.css`.
- Legacy `/account/*` pages also exist. Avoid casually mixing their custom-cookie auth with Supabase-powered `/portal` routes; create a deliberate migration plan before consolidation.
- Refactor repeated CSS overrides into named tokens and reusable primitives. Ensure styles stay scoped to portal, so public marketplace remains unchanged.
- Do not rewrite/delete DB tables, storage buckets, auth settings or live data. No automated production release in a design-only task.
- No extra UI kit dependency without a concrete need. Prefer existing Next.js + React + CSS/Tailwind and accessible native controls.
- All UX changes must pass lint, unit/integration tests, Next build, and real browser/mobile flows with test accounts before a production release.

## 9. Definition of done for each page
1. Matches IKKENAUTO tokens and spacing, not a generic AI-looking template.
2. Primary user task obvious within 3 seconds; every visible control works.
3. No duplicated actions/nav, no hidden required inputs, no pointless accordion mazes.
4. Keyboard/mobile/long text/error/empty/loading tested.
5. End-to-end behavior preserved for Supabase and stock/photos.
6. Tested on preview, then explicitly approved before releasing to production.

## 10. Coding-agent instruction
Read `DESIGN.md` before editing ANY portal UI. Audit the existing implementation before code changes. Preserve functioning logic and data. Compare the finished result with screenshots and relevant real dealer workflows, not with generic SaaS mockups. Make small, reviewable, testable changes, and report any features that cannot be verified.
