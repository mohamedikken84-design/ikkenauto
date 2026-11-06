# IKKENAUTO.be

Belgische automarktplaats. Deze repository bevat het eerste web-skelet: Next.js 16, React 19 en Tailwind 4.

## Starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Wat er nu staat

- Thema in wit, zwart en goud
- Gedeelde header en footer
- Homepage met zoekbalk naar de dealerseed
- `/nl/autos` met filters, resultaatkaarten en advertentiedetail
- Typed seed plus `data/dealer-listings.csv` (zelfde `Listing`-model)
- Routes voor adverteren, berichten, account, handelaars en juridische placeholders

Er is nog geen mailbackend, live productieauth, scraping of Car-Pass. Favorieten en contactberichten op de publieke pagina blijven in de browser. De pagina's over privacy, cookies en voorwaarden zijn nog geen geldige juridische teksten.

## Dealerstock

Deze stap zit in een vervolg-PR op de UI-branch en is nog niet de productie. PostgreSQL is lokaal. `AUTH_MODE=development-session` is geen login en weigert in productie. Er is geen identiteitsprovider gekoppeld. Een sessietoken komt uit de database, nooit uit een rol die de browser zelf kiest.

```bash
bash scripts/setup-local-db.sh
export DATABASE_URL=postgres://ikkenauto:local-dev-only@127.0.0.1:5432/ikkenauto_test
export AUTH_MODE=development-session
npm run db:migrate
npm test
```

`npm run db:dev-session` maakt een ontwikkelsessie en print een token. Daarmee kan een dealer zijn eigen auto's invoeren, pauzeren, publiceren of als verkocht markeren via `/api/dealer/stock`. CSV-import staat op `/api/dealer/import` en wist geen voorraad bij een lege of foute feed. `/nl/autos` toont alleen gepubliceerde, niet-fictieve records. Zet `DEV_SHOW_FICTIONAL_CATALOG=1` buiten productie om de oude seed apart te zien, gelabeld als fictieve ontwikkeldata.

Het bookingdatamodel (vestiging, resource, openingstijden, buffers, Europe/Brussels, overlap-uitsluiting) staat in de database. Er is geen boekingsendpoint en er wordt geen afspraak gemaakt.

## Zoeken uitproberen

Zonder database toont `/nl/autos` geen echte voorraad. De voorbeeldseed zie je alleen met `DEV_SHOW_FICTIONAL_CATALOG=1` tijdens `npm run dev`, onder het label fictieve ontwikkeldata.

- Filter op merk, dan model. De fictieve telling hoort te dalen.
- Zet postcode `2000` en straal `10 km`: alleen Antwerpen in die fictieve lijst.
- Een onmogelijke combinatie, bijvoorbeeld Golf onder € 1.000, toont nul fictieve resultaten en voorstellen om een filter te lossen.

Gepubliceerde dealerstock verschijnt pas na een sessie, een auto en status `published`. Een auto met status `sold` verdwijnt daar weer.
