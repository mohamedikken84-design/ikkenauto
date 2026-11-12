# IKKENAUTO — dealerportaal audit (12 november 2026)

## Doel en grenzen
De bestaande Next.js-/Supabase-code en data behouden. Prioriteit: professioneel, rustig dealer-first portaal voor outreach naar Belgische autohandelaars. Geen productie-push, destructieve migratie, externe scraping, AI-achtige marketingclaims of automatische publicatie zonder afzonderlijke vrijgave.

## Bevestigd
- Supabase in regio EU West, actieve database met 5.062 directoryvermeldingen, 1 dealerrecord, 0 ingevoerde voertuigen en 0 administratoren op auditmoment.
- Auth-, voorraad-, lead-, import-, prospect- en directorytabellen gebruiken RLS; twee mediabuckets zijn private.
- Oorspronkelijke audit-PR #14 stond open; eerdere branch faalde bij build van `/portal/wachtwoord/nieuw`.
- CI had 45 geslaagde tests; vóór de correcties faalde de productiebuild bij prerenderen zonder Supabase-omgeving.
- Marketplace shell toonde dubbele navigatie rond het dealerportaal.
- Dealer dashboard telde maximaal 1.000 geladen voertuigen; daardoor kon het totaal misleidend worden.
- Voertuigfotolink verwees naar een ontbrekend anker.
- Directory-search liet oude resultaten zien tijdens nieuwe invoer en maakte API-fouten niet duidelijk.

## Geïmplementeerde codecorrecties
- Runtime rendering van alle drie private pagina's die de Supabase-omgeving of ingelogde gebruiker vereisen.
- Portal-only styling zonder dubbele marketplace header/footer.
- Paginering en exacte aantallen voor dealerstock, status en leadinbox.
- Bij leeg dealerbestand staat handmatige toevoeging meteen open.
- Echte foto-sectie met werkend `#photos`-anker.
- Bedrijfszoeker met invoer-reset, laad-/fout-/geen-resultaatstatus en zoeken op naam of gemeente; uitgeschakelde oude selectie bij opnieuw typen.
- Aangescherpte database Storage-policy voor voertuigfoto's: corrigeren van het objectpad en upload beperken tot voertuig van eigenaar (zie 015-migratie).

## Nog te verifiëren vóór outreach
1. Volledige registratie met twee afzonderlijke testdealers inclusief mailverificatie en unieke KBO/claimcontrole.
2. Supabase Auth Site URL, toegestane redirect-URL's, SMTP/bezorgbaarheid en password-reset in preview én gekozen productiedomein.
3. Browser-/mobiele end-to-end testen van bedrijf zoeken, garage aanmaken, logo/cover, 1 auto, foto-upload, statussen, CSV import/duplicaten, eigen-data-isolatie en logout.
4. Juridische identiteit en AVG-teksten/termijnen, verwerkersovereenkomst, voorwaarden en privacyverklaring.
5. Verificatie van voldoende rechten vóór gebruik van AutoScout24/2dehands-imports; geen niet-toegestane scraping.
6. Beveiligde inrichting van eerste adminaccount (er staat nu geen adminrecord) en beheerflow.
7. Expliciete vrijgave van preview naar productie na onafhankelijke checks.

## Criteria
- GitHub lint, tests en `npm run build` allemaal groen.
- Preview HTTP 200 voor `/portal` en directory-API; private pagina's vragen login en geven geen persoonsgegevens vrij.
- Ongeautoriseerde dealer kan geen andere garage, voertuig of foto zien of wijzigen.
- Marketing communiceert onderscheid tussen **bedrijvengids**, **accounts** en **gepubliceerde voertuigen**.
- Geen enkele code in deze audit verwijdert of migreert bestaande bedrijfs-/voertuigdata destructief.

## Externe UX-referenties
Carnet dealer-onboarding en garageclaims; AutoScout24 voorraad-/dealerbediening; 2dehands verkoopflows. Alleen principes gebruiken, niet letterlijke teksten of beschermd ontwerp kopiëren.
