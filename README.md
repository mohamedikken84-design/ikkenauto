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

Er is nog geen externe mail, live productieauth, scraping of Car-Pass. Favorieten en contactberichten op de publieke pagina blijven in de browser. De pagina's over privacy, cookies en voorwaarden zijn nog geen geldige juridische teksten. De homepage-zoekblokwijziging zit in een sibling-PR en wordt hier niet overschreven.

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

## Lokale registratie

Dit is werkende lokale auth voor tests, geen gekoppelde productie-identiteitsprovider. Wachtwoorden gaan via Argon2id (`@node-rs/argon2`). Sessies blijven de bestaande `sessions`-tabel, met intrekking. Verificatie en herstel schrijven alleen in `local_mail_messages` wanneer `MAIL_TRANSPORT=local` en de modus niet productie is. In productie weigert die sink.

```bash
export MAIL_TRANSPORT=local
export APP_ORIGIN=http://127.0.0.1:3000
export AUTH_MODE=development-session
```

Migratie `db/migrations/005_registration_auth.sql` voegt `private_user`, wachtwoordhashes, privéprofielen, professionele onboardings, tokens, de lokale post, de pogingenlimiet en garageclaims toe. Starten heeft geen externe dienst nodig: PostgreSQL lokaal, `MAIL_TRANSPORT=local` en `APP_ORIGIN`. Zonder die mailinstelling of met `AUTH_MODE=production` of `NODE_ENV=production` schrijft registratie niets en geeft de API 503. Wachtwoordlogin, bevestigen en herstel weigeren in die productiestand eveneens. Een bestaande dealersessie via het ontwikkelscript blijft de oude sessietabel, maar dat script weigert zelf in productie.

Open `/account/registreren`. Kies particulier of professioneel. Het verificatiebericht staat in de tabel `local_mail_messages`, niet in een externe mailbox. Daarna aanmelden, afmelden, en desnoods herstellen. Een professionele garage blijft `unverified` en niet openbaar. Een claim maakt alleen een aanvraag en wijzigt geen eigenaar.

De limiet is 5 pogingen per 15 minuten per actie en cliënt, opgeslagen in `auth_rate_limits`. Productie negeert `AUTH_RATE_LIMIT_MAX`. In test of ontwikkeling mag die variabele 1 tot 20 zijn. Er is geen marketingvinkje en geen abonnement. De privacytekst is nog niet juridisch beoordeeld.

`npm run db:dev-session` blijft een ontwikkelfixture. Dat token is geen gebruikerslogin.

## Zoeken uitproberen

Zonder database toont `/nl/autos` geen echte voorraad. De voorbeeldseed zie je alleen met `DEV_SHOW_FICTIONAL_CATALOG=1` tijdens `npm run dev`, onder het label fictieve ontwikkeldata.

- Filter op merk, dan model. De fictieve telling hoort te dalen.
- Zet postcode `2000` en straal `10 km`: alleen Antwerpen in die fictieve lijst.
- Een onmogelijke combinatie, bijvoorbeeld Golf onder € 1.000, toont nul fictieve resultaten en voorstellen om een filter te lossen.

Gepubliceerde dealerstock verschijnt pas na een sessie, een auto en status `published`. Een auto met status `sold` verdwijnt daar weer.
