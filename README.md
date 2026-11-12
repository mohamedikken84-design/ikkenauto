# IKKENAUTO — dealerportaal en toekomstige automarktplaats

IKKENAUTO is een Belgisch platform voor autohandelaars. **De eerste release is het privédealerportaal; de publieke automarktplaats is nog in ontwikkeling.** Dealers kunnen zich met e-mail aanmelden, een garageprofiel maken, voertuigen beheren, foto's uploaden en een CSV-import uitvoeren.

## Eén project: source of truth

| Onderdeel | Actieve omgeving | Doel |
| --- | --- | --- |
| Code | GitHub: mohamedikken84-design/ikkenauto | Eén repository |
| Webapp | Vercel: ikkenauto-cursor-keep-alive-6ada | Next.js webapp en portal.ikkenauto.be |
| Database en auth | Supabase: mprzchltmidpuglzzupt | Dealers, privévoorraad, aanvragen, login, foto-opslag |
| Domein en e-mail | Hostinger | ikkenauto.be DNS en bestaande mail |
| Design | DESIGN.md | **Luxury Minimal:** zwart/wit, subtiel goud; alleen de tweede K goud |

**Huidige branches:** op 12 november 2026 draait productie nog van audit/dealer-onboarding-2026-11-12. De verbeteringen staan in design/dealer-dashboard-design-md-2026-11-12 en concept-PR #15. De default main bevat nog oudere startcode. Breng main pas na gecontroleerde migratie naar de goedgekeurde versie. De migratie is nog niet uitgevoerd.

Zie docs/PROJECT_CLEANUP_PLAN.md voor het consolidatie- en opruimplan. Verwijder geen actieve infrastructuur of klantdata alleen om oude namen op te ruimen.

## Product

- **Dealerregistratie:** Supabase Auth met e-mailbevestiging; het claimen van een vermelding vraagt verificatie.
- **Garageprofiel:** bedrijfsgegevens, logo en omslagfoto.
- **Dashboard:** overzicht, privévoorraad, invoer, CSV-import, aanvragen en garageprofiel.
- **Auto toevoegen:** begeleide stappen voor basis, kenmerken, uitrusting en controle; daarna foto's naar eigen privévoorraad.
- **Foto's:** directe browserupload naar privé-Supabase Storage met eigenaars-RLS; maximaal 10 bestanden per selectie, 25 per voertuig, maximaal 3,5 MB per bestand.
- **Voorraad:** zoeken op merk/model/stocknummer, filteren op status, pagina-indeling en beheeracties.
- **CSV:** preview, maximaal 1.500 voertuigen, bijwerken via stocknummer. AutoScout24 en 2dehands worden **niet automatisch** gesynchroniseerd.

Directoryrecords zijn **geen** dealeraccounts. De publieke marktplaats is nog niet live; status 'klaar voor lancering' publiceert geen advertentie.

## De belangrijkste routes

| Route | Taak |
| --- | --- |
| /portal | Start, aanmelden, dashboard |
| /portal/voorraad/nieuw | Auto toevoegen |
| /portal?tab=voertuigen | Voorraad, zoek- en statusfilters |
| /portal?tab=importeren | CSV-import |
| /portal?tab=aanvragen | Aanvragen |
| /portal/garage | Garageprofiel |
| /portal/wachtwoord | Wachtwoordherstel |

De oudere /account-routes en hun lokale PostgreSQL-/sessiemodel zijn historische code voor de marketplace. De actieve dealerportal gebruikt Supabase Auth via /portal. Verwijder deze oudere routes pas nadat hun afhankelijkheden en eventuele gebruikers gemigreerd zijn.

## Lokaal ontwikkelen

Installeer de Node-versie die de CI gebruikt. In de repository-root: voer npm ci uit, vervolgens npm run lint, npm test, npm run build en npm run dev. Voor integratietests is een lokale PostgreSQL-testdatabase nodig; de CI-configuratie staat in .github/workflows/ci.yml.

Voor de portal zijn de openbare Supabase URL en anon/publishable key nodig. Bewaar omgevingsvariabelen in lokale .env-bestanden of Vercel-instellingen; zet nooit een service-role key in de browser of repository. Zie .env.example.

## Release- en beveiligingscontrole

Laat de designbranch slagen voor lint, tests en de Next.js production build. Controleer daarna in een browser met twee testdealers: registratie en verificatie, garageprofiel, auto toevoegen/bewerken, meerdere foto's, uploadverwijdering, CSV, statuswijzigingen, filters, mobiel en RLS-eigenaarschap. Bevestig Auth Redirect URL's, SMTP en juridische teksten vóór dealeruitnodigingen.

Maak pas daarna de gekozen codeversie canoniek en ruim overbodige Vercel-projecten en branches op. **Behoud de bestaande Supabase-database, klantdata, Hostinger DNS en e-mail.**
