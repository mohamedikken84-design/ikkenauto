# IKKENAUTO V2 — DESIGN.md

> This is IKKENAUTO's own design system for the **dealer portal only**. Visual foundation: VoltAgent's independent [Apple DESIGN.md analysis](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md), adapted for dense business workflows. Not affiliated with Apple. Never use Apple logos or proprietary fonts/assets.

## Product strategy
- This product is a free onboarding and inventory-management portal for Belgian automotive dealers.
- The public consumer marketplace is **out of scope** for V2.
- Primary jobs: create an account, complete a company profile, add/edit/manage vehicles, import listings (only after integration is validated).
- Keep Supabase production data untouched during design work; preview data must be unmistakably labelled.

## Design principles
1. Apple-like restraint, not imitation: whitespace, typographic hierarchy, near-invisible chrome, simple decisions.
2. Business usability takes priority over cinematic emptiness. Tables and forms need usable density.
3. Functional, not decorative: no gradients, floating glass cards, fake KPIs, 3D icons or loud shadows.
4. One consistent system. Every state (default, hover, focus, disabled, error, success, loading, empty) must be defined.
5. Every core action reachable in 1-2 clicks. Adding a car must be one long, logically sectioned form.
6. WCAG AA contrast, semantic controls, keyboard navigation, 44px touch targets, visible focus.
7. Mobile-first: collapsible nav, responsive list cards, single-column forms.

## Tokens
- Canvas: #ffffff
- Secondary canvas: #f5f5f7
- Primary ink: #1d1d1f
- Muted ink: #6e6e73
- Hairline: #e5e5e7
- Tinted surface: #fafafa
- Action: #1d1d1f (not Apple blue; business action is black)
- Accent gold: #b99349 (logo mark and small highlights ONLY)
- Good: #287a54, Warning: #9b6d2c, Danger: #b42318
- Radius: 8px fields, 12px small surfaces, 16px panels, 9999px pills
- Spacing: 4/8/12/16/24/32/48/64px
- Font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif. Never distribute SF Pro.
- Heading: 30-36px, 600 weight, tight tracking; UI body 14-16px. Vehicle tables use 13-14px.
- Sidebar: 236px desktop; main column maximum width ~1320px.
- Shadows: almost none. Prefer hairline borders and surface contrast.

## Components
- Top header: slim white utility bar; icon + IKKENAUTO wordmark with restrained gold second K treatment; right profile indicator.
- Sidebar: clean label+icon navigation, active item on subtle gray background, no solid gold blocks.
- Primary button: near-black pill, white text; secondary: white with 1px hairline.
- Card/panel: white on #f5f5f7, subtle border, 16px radius, generous but useful spacing.
- Data table: bold vehicle name, compact details, statuses in semantic neutral pills; responsive list on mobile.
- Inputs/selects: 44px minimum, real labels, light border, visible focus, accessible errors.
- Vehicle form: one scrollable page with sections "Basisgegevens", "Techniek", "Uitrusting", "Staat & historie", "Foto's", "Prijs & publicatie"; no wizard.
- Empty state: precise next step rather than made-up data. Never disguise demo values as real.

## Anti-patterns
- No violet/pink gradients, glassmorphism, heavy shadows, unnecessary charts, emoji dashboards, skeletons used as finished UI, nonfunctional buttons, or random mock data on a live account.
- No copying competitors' proprietary components, content, or brand identity.
- No public sharing of dealer profile/contact data without appropriate access controls.

## Implementation guardrails
- Work on branch feat/dealerportal-v2-apple, never production main while designing.
- Do not mutate Supabase tables or Vercel production settings.
- Before enabling production features, wire authentication, tenant-scoped RLS, storage and verified vehicle metadata.
- Importing external listings must be a supported integration with source terms respected; never pretend pasted links have already been imported.
- Audit mobile/tablet/desktop layouts and loading/empty/error states.
