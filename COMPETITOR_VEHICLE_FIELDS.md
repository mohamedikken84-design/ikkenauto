# COMPETITOR_VEHICLE_FIELDS.md — IKKENAUTO verified field inventory

**Current authoring UX (13 November 2026):** dealer vehicle entry is now a single long page. All eight information groups are simultaneously available, with sticky jump links, visible technical attributes and grouped searchable equipment. This replaces the previous 8-stage wizard; no additional steps/pages are required for data entry. The vehicle remains a private draft on save, and photos upload after the vehicle ID exists.

Date: 2026-11-12. Owner: IKKENAUTO. Scope: automotive inventory, dealer onboarding, private preparation for a future Belgian marketplace.

**Method & limitation:** Public website pages and published mobile.de API docs were inspected. A documented Seller/Search API schema establishes field *possibility*, not that the feature is available to our account, implemented in every UI, or licensed for copying. No authenticated competitor dealer workspace was accessed. This document does not claim full enumeration of private dropdowns, a scraped make/model database, or a licensed API feed. No protected source code, competitor media, trademarks, or database extracts were copied.

## 1. Primary evidence / provenance

| Platform | Source | Publicly verified | Unverified / authorization restriction |
| --- | --- | --- | --- |
| mobile.de | https://services.mobile.de/docs/seller-api.html | Public Seller API schema documents ad management, ad data, images, variants, technical and equipment concepts. Seller account API calls are gated. | Live API credentials, actual dealer UI at account level, individual dealer stock, current commercial access |
| mobile.de | https://services.mobile.de/manual/reference-data.html | Public reference data guide: feasible enum/set values; some refdata endpoints do not require authentication; use \`Accept: application/xml\` (the guide states JSON reference output is no longer supported). | No license to wholesale reproduce their reference or proprietary model database. IKKENAUTO does not automatically bulk-ingest their refdata |
| mobile.de | https://services.mobile.de/docs/search-api.html | Search API query and data format documentation. | Search API subscription and dealer-specific entitlements |
| mobile.de | https://www.mobile.de/s/auto | Public car search and listing taxonomy. | Full logged-in seller form field inventory |
| AutoScout24 | https://www.autoscout24.be/nl/auto-verkopen/adverteren/ | Public seller flow mentions vehicle registration document, optional details, descriptions, price, ad creation, promotions and incoming enquiries. | Full dealer cockpit/feeds and every conditional form option; public page is not proof of a production feed API |
| Carnet | https://carnet.be/nl/marketplace | Public inventory filters: brand, model, engine version, engine subversion, price range, year, mileage, fuel, transmission, body, exterior colour, doors, country/city, condition, seller type. | Dealer posting steps after login, full options and integration API |
| 2dehands | https://help.2dehands.be/articles/nl_NL/Knowledge/hoe-plaats-ik-een-zoekertje | Public placement guidance: title, category, maximum 24 JPEG/PNG pictures, description, possible French translation, condition and category-specific attributes. | Entire auto-category-specific logged-in dropdown data; no public permission for scraping/reposting seller ads |
| 2dehands | https://help.2dehands.be/articles/nl_NL/Knowledge/hoeveel-kost-een-zoekertje-plaatsen | Public conditions, paid/limited listings in car and motor categories. | 2dehands Pro / Admarkt contracted integration endpoints and limits |
| Belgian FPS Economy | https://economie.fgov.be/nl/themas/ondernemingen/kruispuntbank-van/diensten-voor-iedereen/hergebruik-van-publieke | Official KBO Public Search Webservice/public reuse information; see current fees and permissions for re-use. | No official lookup API credentials, no live entity enrichment performed |

The FPS Economy has differing pages concerning "free" Public Search services versus **re-use** webservice pricing; the dedicated re-use page (last updated 2026-04-20) says **€50/2,000 calls**. Do not automatically assume an unrestricted free commercial API. Verify intended usage and obtain a valid contract/account before enabling remote lookups.

## 2. Machine-readable automotive catalogue strategy

| Layer | mobile.de / competitors as reference | IKKENAUTO actual table/column | Verification / test status |
| --- | --- | --- | --- |
| Category | mobile.de vehicle taxonomy; AutoScout24 cars/motorcycles; 2dehands category-dependent fields | \`portal_vehicles.vehicle_class\` | Implemented with car/commercial/motorhome/truck/motorcycle/other; seller browser acceptance not yet E2E tested |
| Brand | public brand selectors | \`portal_vehicle_makes.id,name,slug\`, vehicle \`catalog_make_id\` and \`make\` | 115 editorial suggestions seeded; not complete European licensed catalogue |
| Model | public brand-dependent models | \`portal_vehicle_models.make_id,name\`, vehicle \`catalog_model_id\` and \`model\` | 364 editorial suggested records, dependent API; user can still type unknown |
| Generation / series | mobile.de model series, Carnet version/subversion | \`portal_vehicle_generations.model_id,code,year_from,year_to\`; \`catalog_generation_id,generation_code\` | Four supported reference examples, not universal coverage |
| Engine / motorisation | mobile.de technical variant, Carnet motorversion | \`portal_vehicle_powertrains.generation_id,name,fuel,power_kw\`; \`catalog_powertrain_id,motorization\` | Schema and selectors implemented, official variant dataset not licensed; currently no seeded engines |
| Trim / package | mobile.de model variants, AutoScout24 trim | \`portal_vehicle_trims.powertrain_id,name\`; \`catalog_trim_id,trim_line,version\` | Schema and free text fallback implemented, no licensed trim dataset |
| Provenance | API's document data types; public-facing labels not data-license | \`verified\`, \`source_url\` on generation/powertrains | Only some seed generations annotated; no automatic OEM option inference |

**Critical:** Selecting a Porsche 911 generation cannot automatically toggle rear-wheel steering or carbon brakes; equipment is only present when the dealer explicitly checks it. Unknown models/generations/engines are valid free-entry records with null catalogue IDs.

## 3. Field mapping: vehicle wizard and editor

Legend: **V** = publicly evidenced as a feature or data category; **S** = mobile.de Seller API schema/reference; **I** = IKKENAUTO implementation. "V" does NOT imply full private dealer form verified. "Partial" means features may exist in IKKENAUTO code but lack full live UI E2E.

| Domain / supported input | Reference / public status | IKKENAUTO storage | Implementation & verification |
| --- | --- | --- | --- |
| Brand, model, generation, engine, trim | mobile.de S; Carnet V model/motor/submotor | \`catalog_*_id\`, \`make,model,generation_code,motorization,trim_line\` | I: 5-level cascade, missing entries editable |
| Category / body variant | mobile.de S; AutoScout V category | \`vehicle_class,body_type\` | I: car/commercial/motorhome/truck/motorcycle, body from own labels |
| First registration, year, mileage | AutoScout24 V; mobile.de S; Carnet V | \`first_registration,year,mileage_km\` | I: numeric validation and free input |
| Engine size, cylinders, output, torque, gearing | mobile.de S | \`power_hp,power_kw,specifications.{displacement_cc,cylinders,torque_nm,gears}\` | I: advanced technical disclosure; no VIN decode |
| Acceleration, top speed | mobile.de S | \`specifications.{acceleration_0_100_s,top_speed_kmh}\` | I: optional numeric entries |
| Fuel, gearbox, drivetrain, emission class | mobile.de S; Carnet V fuel+transmission | \`fuel,transmission,drivetrain,emission_class\` | I: fuel-dependent EV fields |
| Consumption, CO2, test cycle | mobile.de S | \`specifications.{consumption_l_100km,co2_g_km,emission_test}\` | I: no vehicle model inferred values |
| Dimensions, mass, towing weight | mobile.de S | \`specifications.{length_mm,width_mm,height_mm,wheelbase_mm,weight_kg,gross_weight_kg,towing_braked_kg,towing_unbraked_kg}\` | I: validates numeric ranges |
| EV battery gross/net | mobile.de S EV-specific schema/reference | \`specifications.{battery_capacity_kwh,battery_usable_kwh}\` | I: EV/PHEV only |
| WLTP range, measured range | mobile.de S; public EV search categories | \`specifications.{wltp_range_km,real_world_range_km}\` | I: separate fields; no automatic estimates |
| Battery health (SoH), test date, ownership | EV market practice; platform-specific UI not exhaustively verified | \`specifications.{battery_soh_percent,battery_health_test_date,battery_owned}\` | I: optional/never assumed |
| AC/DC rate, connector, 10–80 time | mobile.de S EV scope + EV market practice | \`specifications.{ac_charge_kw,dc_charge_kw,charging_socket,charge_10_80_minutes}\` | I: EV/PHEV visibility |
| Wheel/tire/paint and interiors | mobile.de S; Carnet V colour | \`color,interior_color,specifications.{wheel_size_inch,tyre_condition,paint_finish,interior_material}\` | I: optional inputs and catalogue |
| Airbags, ABS, stability, brake assist | mobile.de S equipment categories | \`equipment_codes[]\` + legacy \`options[]\` | I: multiple explicit selections, catalog; no default checked |
| Lane assistance, adaptive cruise, blindspot | mobile.de S equipment | \`equipment_codes[]\` | I: category + text search |
| Parking sensors, cameras, night vision | mobile.de S equipment | \`equipment_codes[]\` | I: category + text search |
| Heating, ventilation, massage, electric seats | mobile.de S equipment | \`equipment_codes[]\` | I: multiple items and fine-grained variants |
| Navigation, DAB, Apple CarPlay, Android Auto | mobile.de S equipment; 2dehands V broad category | \`equipment_codes[]\` | I: original labels |
| Lighting LED, matrix, laser | mobile.de S equipment | \`equipment_codes[]\` | I: detailed options |
| Suspension, AWD, rear steering | mobile.de S equipment; rare equipment availability varies | \`equipment_codes[]\` | I: advanced entries |
| Charging cable, heatpump, V2L/V2G/V2H | EV-specific product features; competitor UI specifics not universally confirmed | \`equipment_codes[]\` | I: electric/PHEV compatible selection only |
| Commercial payload and cargo size | mobile.de commercial taxonomy, aftermarket data | \`specifications.{payload_kg,cargo_length_mm,cargo_width_mm,cargo_height_mm,pallet_capacity}\` | I: show for commercial |
| Service, prior owners, Car-Pass, keys, inspection | mobile.de S history + local BE sales practice | \`maintenance_history,condition_notes,specifications.*\` | I: optional, don't infer no accidents |
| Accident history, warranty | AutoScout24 V transparently disclose damage; mobile.de S | \`accident_history,warranty_months,condition,condition_notes\` | I: explicit |
| Price, VAT, margin scheme, negotiable | mobile.de S price/VAT; Carnet V price | \`price_eur,vat_regime,vat_deductible,specifications.price_negotiable\` | I: distinct tax regime, no accounting advice |
| Images, descriptions | mobile.de Seller API S; 2dehands public guidance V | \`portal_vehicle_photos\`, private Storage, \`description\` | I: 25 image slots, 10 direct uploads/batch; no copied seller images |
| Video | 2dehands public placement guidance not proof of car videos; mobile.de schema may support media | Not present | Not implemented; keep as gap |
| Saved drafts, publish, sold | mobile.de S ad status | \`status\`: draft/ready/sold | I: ready means **private ready for launch**, not public publication |
| Source link / importer | mobile.de documented API, AutoScout24 permission not verified | \`portal_import_links\` | I: links queued, no automatic fetch until licensed adapter |
| Bulk import | mobile.de API inventory / professional feeds (authorization) | \`portal_vehicles\` via CSV | I: existing working CSV upsert, max 1500 rows; no remote sync claim |

All 224 equipment entries are IKKENAUTO original taxonomy terms, stored in \`portal_vehicle_equipment_catalog\`. The per-vehicle \`equipment_codes\` GIN index and \`specifications\` JSONB provide search-ready data; **the future public search UI is separate from the private dealer portal and is NOT fully wired to this table yet**.

## 4. Usability and infrastructure

The chosen style is **Luxury Minimal** (warm off-white, black, restrained gold, second K alone gold). The one-page form shows all eight sections at the same time (essentials, technical specifications, equipment, appearance, condition, pricing, photos/description, review), with compact section navigation and one save button.

- The initial catalog API combines makes + equipment in one public cacheable read. Cascading data loads on demand; calls are cached in memory within a browser session.
- \`sessionStorage\` persists in-progress non-sensitive one-page form values on a per-dealer basis, debounced at 500 ms. VIN and photo bytes are not persisted locally.
- Sensitive photos are uploaded directly to private Supabase Storage only after a persisted draft returns an ID. Existing authenticated RLS policies control both image paths and DB associations.
- Server validates submitted IDs and equipment relationships instead of trusting unchecked hidden input IDs. No equipment is auto-assigned.
- Vercel app functions target Dublin near Supabase eu-west-1; no claim about measured user-perceived speed until RUM/Lighthouse testing is conducted.

## 5. Dealer registration / Belgian enterprise registry

- Registered dealership: Supabase Auth sign-up, email confirmation, unique owner and unique normalized enterprise number index.
- \`lib/dealer/kbo.ts\` parses \`BE 0123.456.749\`, \`0123.456.749\`, numbers with spaces/dots and 9 digits for older forms with leading zero; validates the Belgian mod-97 checksum.
- Entering a valid number is NOT proof the person is authorized to claim the business. Existing garage claims require review.
- KBO official live enrichment: **NOT ENABLED**. Requires approved official Public Search/re-use credentials, agreement and careful processing. Current internal directory is not an authoritative real-time KBO record.
- Production SMTP delivery, expiry/retry and duplicates: not validated with a live external test mailbox in this work.

## 6. Link-import authorization matrix

| Input source | Confirmed public contract/API docs | IKKENAUTO behavior | What is still missing |
| --- | --- | --- | --- |
| mobile.de | Seller API docs public; authenticated account/test access required | Dealer can submit his own URL; queue for review | Authorized seller credentials, API agreement, mapping/refresh |
| AutoScout24 | Public sale flow; no verified open dealer import endpoint in this research | Dealer URL queued | Authorized partner data feed/API or seller export |
| 2dehands | Public placement docs, professional plan documentation | Dealer URL queued | Allowed business feed/permission and approved importer |
| Dealer's own website | Seller controls his website but must prove authorization | URL queued, no untrusted URL fetched server-side | Verified website ownership and allowed structured feed or JSON-LD adapter |
| CSV export | Existing IKKENAUTO parser | Real multirow import and preview | More flexible mapping, batch rollback/reporting |

**Do not claim automatic import works by only saving a URL.** A queue entry is not an imported vehicle. No site is crawled, no dealer photos copied, and no authentication bypasses were attempted.

## 7. Acceptance scenarios and test matrix

| Scenario | What should be tested | Status at time of authoring |
| --- | --- | --- |
| Volkswagen Golf | Select VW→Golf→VIII; optional engine and trim; specs/options | 3-level relationship seeded; E2E pending |
| BMW X5 | BMW→X5→G05, choose free xDrive30d / M Sport | 3-level seeded; engine/trim licensed source absent; E2E pending |
| Mercedes-Benz E-Klasse | Mercedes-Benz→E-Klasse→W213, free E 220 d / AMG Line | 3-level seeded; E2E pending |
| Porsche 911 | Porsche→911→992; premium optional equipment | 3-level seeded; E2E pending |
| Tesla Model Y/3 | EV charging, WLTP, battery SoH, no fabricated equipment | Vehicle model seed and EV conditional fields; E2E pending |
| Plug-in hybrid | EV field conditions and combustion fields | Conditional display implemented; E2E pending |
| Commercial van | Payload, cargo dimensions, sliding doors / interior | Conditional fields and catalog; E2E pending |
| Missing rare execution | Free manual engine/trim, FK fields null | UI fallback + server accepts null catalogue IDs; E2E pending |
| Email signup and expired link | Supabase Auth + email template | Existing app behavior; live test pending |
| Photo direct upload | Signed-in dealer Storage RLS, multiple photos, delete | Code, database RLS reviewed; browser E2E pending |
| CSV | Upload accepted template, dedup, errors | Existing local test suite; browser E2E pending |
| External auto URL | Queue and status, no false import | Queuing implemented; **no real external import** |
| Browser benchmark | First-load latency, interaction delay, mobile | Not measured. Cannot claim faster without measurements |

Never mark individual scenarios passed based only on code review, a successful CI build or database row counts. Test data should be isolated from production dealers.

## 8. Data governance / gaps to close before claiming full mobile.de parity

1. A fully licensed frequently updated multi-brand model/generation/motorisation/trim database is not present. Add a contract or maintain editorial data with provenance.
2. mobile.de Seller/Search APIs require permission/test account; no automatic unauthorized scrape/import.
3. AutoScout24, Carnet, 2dehands private forms and integration contracts have not been exhaustively accessed, therefore no "literal every field" assertion.
4. No video upload yet, no comprehensive body/body-style catalog, no public marketplace release, no brokered KBO live API.
5. Separate legacy public marketplace/PostgreSQL code and Supabase dealer portal need an explicit migration before public search can use the full private inventory.
6. Synthetic PostgreSQL benchmark has now been run (50,000 rows, 2,000 dealers; median 2.982 ms unindexed vs 0.167 ms indexed for one filter query, 12 trials each). This is not a browser or Vercel latency measurement. Multi-dealer browser E2E and SMTP delivery still require live testing.
7. Open supplier/media policy, consumer-protection disclosure requirements, Car-Pass and legal terms should be reviewed before public launch.

### Change audit
- Schema and seed: \`db/supabase-migrations/016_vehicle_catalog_and_extended_specs.sql\`.
- Fields and validation: \`lib/dealer/vehicle-fields.ts\`, \`lib/dealer/kbo.ts\`.
- API: \`app/portal/api/catalog/route.ts\`.
- Single-page form: \`app/portal/vehicle-editor.tsx\`, \`app/portal/equipment-selection.tsx\`; editor: \`app/portal/vehicle-advanced-editor.tsx\`.
- Server actions: \`app/portal/improvements.ts\`, \`app/portal/vehicle-edit-actions.ts\`.
- Queue: \`app/portal/advertisement-link-import.tsx\`; CSV: \`app/portal/import-stock.ts\`.
