# Garaj 3D
Aplicatie in romana pentru intretinere auto, uzura prezisa si consum (benzina, diesel, GPL, hibrid, PHEV, electric). Date in cloud (Supabase), pe mai multe masini.

## Test local (laptop)
1. Instaleaza Node.js LTS. In acest folder: `npm install`
2. Copiaza `.env.example` in `.env` si completeaza cele 2 valori din Supabase (Settings > API).
3. `npm run dev` si deschide adresa afisata.

## Supabase
1. Proiect nou > SQL Editor > ruleaza tot `supabase/schema.sql`.
2. Authentication > URL Configuration: pune adresa site-ului (Netlify) la Site URL. Pentru test local adauga `http://localhost:5173` la Redirect URLs.
3. Authentication > Providers > Email: daca nu vrei confirmare prin email, dezactiveaza "Confirm email".
4. **Dupa ce iti creezi contul**: Authentication > Sign In / Providers > dezactiveaza "Allow new users to sign up", ca sa nu-si poata face altcineva cont.

## Publicare
1. Urca folderul pe GitHub (nu urca `.env`).
2. Netlify > Add new site > Import from Git. Setarile sunt in `netlify.toml`.
3. Site configuration > Environment variables: adauga `VITE_SUPABASE_URL` si `VITE_SUPABASE_ANON_KEY`.
4. Pe iPhone: Safari > Distribuie > Adauga pe ecranul principal.

## Modele 3D
Vezi `public/models/CITESTE.txt`. Pozitiile punctelor pulsatorii si rotatia modelelor se ajusteaza in `src/data.js` (HOT_OVERRIDE, ROT).

## Preturi
Se editeaza manual in tab-ul Consum (cu data ultimei modificari). Butoanele "cea mai apropiata benzinarie" deschid Google Maps.
