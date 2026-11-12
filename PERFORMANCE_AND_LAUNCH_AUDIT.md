# IKKENAUTO — Performance, toegang en release-audit (13 november 2026)

## Reële bevindingen

- Vercel Runtime Errors toonden op 12 november twintig oude runtime fouten op `/portal` (`TypeError: Cannot read properties of undefined (reading 'trim')`) op een eerdere deployment. Dit is **geen** bewijs dat de nieuwe preview foutloos is. De inputnormalisatie in de ontwikkelcode is veiliger, maar echte sessietests blijven vereist.
- Twee Vercel-projecten met IKKENAUTO-domeinen zijn op projectniveau ingesteld met `ssoProtection.deploymentType = all`; dit beveiligt **zowel productie als previews**. De eerder aangetroffen share-bypass voor `portal.ikkenauto.be` is ingetrokken.
- `ikkenauto.be` en `www.ikkenauto.be` staan niet in de geregistreerde domeinen van deze Vercel-projecten. Hostinger/Netlify kan deze adressen nog bedienen. Omdat voor die hosting geen beheerconnector beschikbaar is, is **niet bewezen** dat deze twee rootdomeinen offline zijn. Ga niet uit van een volledige sitebrede afsluiting.

## Meetbaar: geïsoleerde synthetische databaseproef

- PostgreSQL CI-test op tijdelijke tabel met **2.000 dealers en 50.000 fictieve voertuigen**; geen productiegegevens gebruikt.
- Filter: dealer-ID, voorraadstatus, brandstof, verkoopprijs; sortering nieuwste eerst; limiet 25.
- Twaalf iteraties vóór en na indexering: mediane query-roundtrip **2,982 ms → 0,167 ms**, snelheid **17,86×** voor deze specifieke query. Resultatenrijen blijven identiek.
- Bron: `lib/dealer/stock-performance.test.ts`, uitvoer in GitHub Actions-run op commit `fba5d7fe` en opvolgende geslaagde runs.
- Dit is **geen** bewijs voor 17,86× sneller laden van de website. Real User Monitoring (LCP, INP, TTFB), Lighthouse en een gecontroleerde oud/nieuw browservergelijking ontbreken.

## Concrete reducties in aanvragen

| Bewerking | Eerder | Nu | Verificatie |
|---|---:|---:|---|
| Dashboard totalen van eigen garage | 4 afzonderlijke Supabase tellingen | 1 authenticated SECURITY INVOKER RPC | Geïmplementeerd; RPC rechten geverifieerd. Auth-browser-E2E nog open |
| Dashboard totale laadset voor garageoverzicht | 5 databankrequests voor tellingen plus voorraadpreview | 2 databankrequests (RPC + voorraadpreview) | Code + CI, geen netwerk-profiler op echte dealer |
| 25 privécarfoto's ondertekende URL's | 25 Storage aanvragen | 1 `createSignedUrls(paths)` bulk-aanroep, fallback bij fout | Officiële SDK-functionaliteit geverifieerd; echte browser nog open |
| 2 garageafbeeldingen ondertekenen | Opeenvolgend | Parallel | Code + CI |
| 10 geselecteerde nieuwe foto's uploaden | Opeenvolgend | Maximaal 3 tegelijk | Code + CI, opslag-RLS nog browser-E2E nodig |
| Merk/modelcatalogus | herhaalde losstaande reads | initiële bundel, cache en afhankelijke fetch | Code + CI, geen browsernetwerkmetingen |
| Bij typen in andere velden | herhaald renderen van uitrusting en catalogus | memoized componenten, deferred search | Code + CI, nog geen INP-meting |

## Niet als voltooid aanmerken

1. Snelheid desktop/mobiel met ingelogde testdealer via Playwright/Lighthouse en gecontroleerde throttling.
2. Supabase echte multi-account RLS en 10 fotouploads onder netwerkonderbreking.
3. Officiële KBO verrijking en automatische import via toegestane partners; beide vereisen credentials/rechten.
4. Volledig gecontroleerde rootdomeinbescherming via Hostinger/Netlify en opschonen van eventuele oudere openbare sites.
5. Definitieve promotie naar productie; vereist uitdrukkelijke toestemming van de eigenaar.

## Releasebeleid

Deze branch en de preview blijven beveiligd voor intern testen. De PR is draft. Productiecode en bestaande klantdata blijven behouden. Geen automatische publieke release voor schriftelijke toestemming.
