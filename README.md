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

Er is nog geen authenticatie, mailbackend, live voorraad, scraping of Car-Pass. Favorieten en contactberichten blijven in de browser. De pagina's over privacy, cookies en voorwaarden zijn nog geen geldige juridische teksten.

## Zoeken uitproberen

```bash
npm run dev
```

- [http://localhost:3000/nl/autos](http://localhost:3000/nl/autos)
- Filter op merk, dan model. De telling hoort te dalen.
- Zet postcode `2000` en straal `10 km`: alleen Antwerpen.
- Open een kaart, gebruik de browser terug: filters en positie blijven behouden.
- Deel de URL met queryparameters: dezelfde filters komen terug.
- Een onmogelijke combinatie, bijvoorbeeld Golf onder € 1.000, toont nul resultaten en voorstellen om een filter te lossen.
