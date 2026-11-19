# TGarage
Aplicatie in romana pentru intretinere auto: piese cu estimari, consum, cheltuieli, acte, raport PDF. Scena 3D, mai multe masini.

## Doua moduri (se aleg la prima deschidere)
- **Gratuit · pe dispozitiv**: fara cont, datele raman in browserul telefonului (localStorage + IndexedDB). Se pierd daca stergi aplicatia sau datele site-ului; se poate face Backup JSON.
- **Pro · cont si cloud**: cont cu email si parola (+ 2FA), date in Supabase. Plata nu este implementata: deocamdata alegerea Pro doar activeaza autentificarea.
Modul se schimba din Cont > Confidentialitate si date.

## Test local
1. Node.js LTS. In acest folder: `npm install`
2. `.env` (dupa `.env.example`) cu `VITE_SUPABASE_URL` si `VITE_SUPABASE_ANON_KEY` (necesare doar pentru modul Pro).
3. `npm run dev`

## Supabase (modul Pro)
1. Proiect nou > SQL Editor > ruleaza `supabase/schema.sql` (pentru cheltuieli pe un proiect mai vechi: `supabase/migration-v7.sql`).
2. Authentication > URL Configuration: adresa site-ului la Site URL.
3. Authentication > Providers > Email: "Confirm email" dupa preferinta. Multi-Factor (TOTP) activ pentru 2FA.
4. Dupa ce iti creezi contul, poti dezactiva inscrierile noi.

## Publicare pe Vercel
1. Urca proiectul pe GitHub.
2. vercel.com > Add New > Project > importa repository-ul (Vite e recunoscut automat: `npm run build`, folder `dist`).
3. Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Apoi Deploy.
4. Planul gratuit Vercel (Hobby) e doar pentru uz necomercial.

## Modele 3D
`public/models/CITESTE.txt`. Pozitiile punctelor si rotatia modelelor: `src/data.js` (HOT_OVERRIDE, ROT).

## Redenumire
Numele e in `src/brand.js`, plus `<title>` si `apple-mobile-web-app-title` din `index.html` si `name` din `public/manifest.webmanifest`.

## Date si import/export
`src/catalog.js` (piese), `src/carsdb.js` (masini), Backup JSON si CSV in tab-ul Acte.
