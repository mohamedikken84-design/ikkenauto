# IKKENAUTO dealerportaal op eigen domein

## Voorgestelde URL's
- Hoofdpagina voor autohandelaars: `https://portal.ikkenauto.be/` (stuurt naar `/portal`)
- Registratie: `https://portal.ikkenauto.be/registreer`
- Aanmelden: `https://portal.ikkenauto.be/inloggen`

Het domein `ikkenauto.be` blijft ongewijzigd. De portal heeft eigen Next.js/Supabase-hosting op Vercel. Verander de nameservers, A-records, MX/SPF/DKIM/DMARC van het hoofddomein niet voor deze taak.

## Hostinger DNS
Vercel heeft `portal.ikkenauto.be` al toegevoegd en als domein geverifieerd, maar meldt een ontbrekende DNS-koppeling.

In Hostinger: Domains → ikkenauto.be → DNS / Nameservers → voeg toe:
- Type: CNAME
- Name / Host: `portal`
- Target / Points to: `96d23c086167ec05.vercel-dns-017.com` (huidig projectspecifiek advies uit Vercel; controleer vóór definitief instellen nogmaals de waarden in Vercel)
- TTL: standaard

Vervang alleen een reeds bestaande en conflicterende `portal`-record na controle; laat mail en overige domeinrecords ongemoeid.

Daarna in Vercel de domeinstatus opnieuw controleren. DNS-propagatie kan tijd kosten. Vermeld een domein niet als live voordat een echte HTTPS-request is geslaagd.

## Releaseblokkeerders
- Gecontroleerde registratie, e-mailbevestiging en wachtwoordreset met 2 testaccounts.
- Supabase Site URL/redirect allowlist met `https://portal.ikkenauto.be/portal/auth/callback`, plus vertrouwde preview-URL's voor testen.
- SMTP, afzenderauthenticatie en mailbezorgbaarheid.
- Browser-e2e van aanmaken garage, voertuig, afbeeldingen, CSV en eigen-data-isolatie.
- Juridische gegevens, AVG, voorwaarden en privacyverklaring.
- Adminrechten (momenteel nul adminaccounts).
- Pas daarna productiebranch / deployment op Vercel uitrollen.

## Onderhoud
Gebruik Vercel voor applicatiedeployments en Hostinger enkel voor domein/DNS en bestaande mail. Verplaats de hoofdwebsite niet voor de dealerportal-lancering.

## Supabase Auth links (controle vereist vóór dealeruitnodigingen)
1. Ga naar [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/mprzchltmidpuglzzupt/auth/url-configuration).
2. Stel de **Site URL** in op `https://portal.ikkenauto.be`.
3. Voeg bij **Redirect URLs** minstens toe:
   - `https://portal.ikkenauto.be/portal/auth/callback`
   - `https://portal.ikkenauto.be/portal/auth/callback?next=reset`
4. Controleer onder Authentication → Email Templates dat bevestigingslinks `{{ .ConfirmationURL }}` gebruiken, of een eigen `/auth/confirm?token_hash={{ .TokenHash }}&type=email` endpoint op het juiste domein. Gebruik niet per ongeluk `localhost:3000` en plaats geen extra `/auth/confirm` achter een al volledig `RedirectTo` pad.
5. Controleer in de Supabase Auth SMTP-instellingen een eigen SMTP-provider. De ingebouwde dienst is niet geschikt voor echte uitnodigingen aan willekeurige adressen.
6. Test een **nieuw** account met een ander e-mailadres en controleer verificatie en wachtwoordreset. Bestaande, verlopen bevestigingslinks worden niet vanzelf geldig.
7. Op het portal ondersteunt de app nu ook `/auth/confirm` en `/auth/callback` als alias naar de server-side callback. Dat repareert legacy e-mailsjablonen die naar die paden verwijzen, maar vervangt de URL-allowlist niet.

## Dealer-only wijziging (12 november 2026)
- Het portal-project gebruikt `IKKENAUTO_PORTAL_ONLY=true` op Vercel (production/preview) om marketing-/marketplace-routes te blokkeren.
- De host `portal.ikkenauto.be` is ook zonder vlag dealer-only.
- `/registreren` is de voorkeurslink; `/registreer` blijft als doorverwijzing werken.
- Het root-layout verbergt de algemene marketplaceheader en -footer voor alle dealerpagina's.
- Voertuigmerken en modelsuggesties komen uit één gedeelde lijst; handelaars mogen nog steeds zelf een ander merk/model typen.
