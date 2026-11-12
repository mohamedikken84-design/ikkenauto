# IKKENAUTO — één project, gecontroleerd opschonen

Inventaris gecontroleerd op 12 november 2026. Doel: één goed werkende repository, één actief webapp-project, één Supabase-project en Hostinger uitsluitend voor het domein en e-mail. Geen productiebreuk of verlies van dealers/voertuigen.

## Behouden — noodzakelijk

| Platform | Object | Waarom behouden |
| --- | --- | --- |
| GitHub | mohamedikken84-design/ikkenauto | Enige repository; actieve portalcode staat nog niet op main |
| Vercel | ikkenauto-cursor-keep-alive-6ada | Actieve Next.js portal; domein portal.ikkenauto.be |
| Supabase | mprzchltmidpuglzzupt (eu-west-1) | Enige database/Auth/Storage-project; bestaande dealeraccounts en bedrijvengids |
| Hostinger | ikkenauto.be + mail | DNS, domeinbeheer en zakelijke e-mail; MX, SPF, DKIM en DMARC niet verstoren |

Supabase heeft momenteel onder meer 3 dealerrecords, 5062 gidsvermeldingen, 0 voertuigen; dit is een momentopname, geen rechtvaardiging om tabellen of gebruikers te verwijderen.

## Kandidaat om later op te ruimen

| Platform | Object | Vastgesteld | Actie na goedkeuring |
| --- | --- | --- | --- |
| Vercel | ikkenauto-znge | Geen toegewezen domein en geen deployment | Mogelijk verwijderen na bevestiging dat geen externe integratie verwijst naar het project |
| Vercel | ikkenauto | Oud Next.js-starterproject zonder eigen aangepast domein | Verwijderen nadat de publieke plannen en eventuele aliases zijn verplaatst |
| GitHub | oude cursor- en auditbranches | Meerdere historische branches en backups | Pas opschonen nadat de goedgekeurde portal op een canonieke branch staat, tests groen zijn en een terugvalcommit is bewaard |
| GitHub | historische /account-routes | Ander authenticatie- en datamodel naast actieve /portal | Alleen in een aparte geteste migratie; niet blind verwijderen |
| Hostinger/Netlify | oude site-instellingen | Actuele DNS/hostingrelaties niet via gekoppelde hPanel-tool verifieerbaar | Eerst actuele DNS en live domeinhost controleren; nooit mailrecords wijzigen |
| Supabase | tabellen, buckets, Auth-gebruikers | Actief productieproject en RLS | Geen verwijdering nodig voor een schone UI, alleen bij concrete gearchiveerde data na backup |

**Deleten vereist aparte bevestiging per concreet project.** Hiermee worden oudere setups als opruimkandidaat gemarkeerd; dit document verwijdert niets.

## Doelarchitectuur

- Eén GitHub-repository met de uiteindelijk goedgekeurde broncode op main.
- Eén Vercel-webapp met portal.ikkenauto.be als portalingang. De toekomstige publieke marketplace kan in dezelfde Next.js-codebasis draaien onder ikkenauto.be.
- Eén Supabase Auth/PostgreSQL/Storage-omgeving, gescheiden per dealer via RLS.
- Hostinger blijft registrar/DNS/mail, zonder extra WordPress-site of dubbele hosting nodig voor het portal.
- Designregels in DESIGN.md: Luxury Minimal, gebroken wit, zwart, subtiel goud; alleen tweede K goud.

## In deze ontwerpbranch uitgevoerd

- Eerlijke registratiepagina, nieuw dashboard en gescheiden navigatie.
- Voertuiginvoer als wizard; voertuigen bewerken in gegroepeerde formulieren.
- Server-side voorraadfiltering en zoekactie, KPI's die echt doorklikken, profiel op mobiel.
- Foto's uploaden rechtstreeks vanuit de browser naar private Supabase Storage; de 4,5 MB serverfunctie-limiet wordt omzeild. RLS voor objecten en fotorecords gecontroleerd.
- Vercel Functions regio Dublin om databasevertraging met Supabase EU-West te beperken.
- Minder databaseaanvragen per scherm, laadstatussen, verbeterde status- en save-redirects.
- Niet-klikbare informatieve elementen niet als actie presenteren.
- Verouderde starterinformatie in README vervangen.

## Uitrolstappen voor definitieve consolidatie

1. Laat alle CI-checks groen worden (lint, PostgreSQL-integratietests en Next.js-build).
2. Test UX/functionaliteit in de browser met minimaal twee nieuw aangemaakte testgarages, ook op mobiel.
3. Controleer de juiste Supabase Auth Site URL/Redirect URLs en SMTP-bezorging, plus juridische en privacyteksten.
4. Keur het ontwerp en de echte gebruikersflow goed; merge pas daarna de designwijzigingen naar de actieve portalbron en zet de juiste branch naar productie.
5. Maak main de bron van de werkende portal/app en maak een veilig recovery-point.
6. Herleid Vercel naar één project en controleer de domeinen, redirects, DNS en mail.
7. Na afzonderlijke bevestiging: verwijder ongebruikte Vercel-starters en opruimbare branches. Verwijder geen actieve database of Hostinger-domein.

## Open punten

- Geen volledige gesimuleerde browser-e2e van nieuwe registratie, bevestigingsmail, foto-upload en data-isolatie uitgevoerd.
- Live snelheidsmetingen op desktop/mobiel niet beschikbaar vanuit code/build alleen.
- Hostinger hPanel website- en DNS-beheer is niet rechtstreeks gekoppeld; de beschikbare Hostinger-connector beheert alleen mail.
- Vercel-projecten zijn geïnventariseerd, maar niet verwijderd of hernoemd.
