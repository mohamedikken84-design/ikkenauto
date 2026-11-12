# IKKENAUTO — dealerportaal audit (12 november 2026)

## Herstelpunt en scope
- Basisbranch: cursor/keep-alive-6ada (ongewijzigd).
- Werkbranch: audit/onboarding-ux-20261112.
- Bestaand Vercel-project: ikkenauto-cursor-keep-alive-6ada.
- Geen bestaande dealer- of voertuiggegevens verwijderd.

## Uitgevoerde verbeteringen
- Nieuwe zakelijke pre-lanceringspagina met registreren als primaire actie en ingelogde dealerroute.
- De bedrijvengids staat achter een subtiele uitklapbare zoekoptie; geen misleidende dealerstatistieken.
- Geselecteerde bedrijfsvermelding wordt als niet-geverifieerd invulvoorstel doorgegeven naar registratie.
- Vierstappenformulier voor één auto; aparte eigenaar-afgeschermde bewerkpagina.
- CSV-import toont verplichte kolommen, voorbeeldrijen en doublures binnen het bestand voordat een handelaar bevestigt.
- Losse garageprofielpagina met contactgegevens, logo en omslagfoto via private Supabase Storage.
- Extra verificatiecheck voordat een platformadmin een bedrijfsclaim kan goedkeuren.
- Dubbele bevestiging voor een dealer die een voertuig wil verwijderen.
- Support voor PKCE en token_hash bevestigingslinks van Supabase Auth.
- Onnodige anonieme SELECT-toegang op de tabel met bedrijfscontacten ingetrokken.
- Minimalistisch zwart/wit/goud en een zakelijke, eerlijke uitleg over de toekomstige lancering.

## Veilige database-uitbreiding
- Toegevoegd: description, logo_path en cover_path aan portal_dealers.
- Toegevoegd: private media-bucket portal-garage-media, 3 MB, JPG/PNG/WebP.
- RLS op alle gecontroleerde public portal-tabellen actief.
- Bestaande 5.062 bedrijvengidsrecords blijven behouden en zijn geen actieve dealers.

## Verificatie
- Vercel Next.js productiebuild en TypeScript geslaagd op een aparte preview.
- Beveiligingsadviseurs gecontroleerd; alleen leaked-password protection blijft als instelling openstaan.
- Databasebevoegdheden en enkele roltoegangstests uitgevoerd.

## Nog NIET gevalideerd of voltooid
1. Echte end-to-end tests met een geautoriseerde dealeraccount, bevestigingsmail en wachtwoordherstel.
2. Supabase Site URL, redirect allowlist en SMTP op het werkelijke portal-domein.
3. Toestemming voor productie-merge, domeinswitch en publieksopening.
4. Browser- en mobiele screenshots, toegankelijkheid en performance met echte toestellen.
5. Volledige voertuigdatacatalogus met erkende licentie; de suggesties zijn nog niet compleet.
6. Officiële AutoScout24/2dehands-voorraadfeed; een advertentielink is nog geen automatische import.
7. Tests van CSV-import tegen echte exports en reeds aanwezige voorraad.
8. Definitieve juridische teksten, verificatieproces en privacyvriendelijke funnelmeting.
9. Opschonen van legacy marketplace-routes nadat afhankelijkheden zijn bevestigd.

## Inspiratiebronnen
- https://carnet.be/nl/marketplace
- https://carnet.be/nl/voor-handelaars
- https://www.autoscout24.be/nl/partner-infoportal/inserieren/
- https://www.2dehands.be/

Deze audit is geen claim dat een daadwerkelijke browser-E2E-test of volledige concurrentiepariteit al is bereikt.