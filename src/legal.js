import {APP, OPERATOR, SUPPORT_EMAIL} from './brand'

// TEXTE-MODEL, în limbaj simplu. NU sunt consultanță juridică: completează datele operatorului și validează-le cu un specialist înainte de lansarea publică.
export const LEGAL = {
  termeni: {t: 'Termeni și condiții', body: [
    [`1. Ce este ${APP}`, `${APP} te ajută să ții evidența întreținerii mașinii tale: piese, service, consum, cheltuieli și acte, cu estimări și memento-uri.`],
    ['2. Estimările sunt orientative', 'Intervalele de înlocuire, estimările de uzură și costurile sunt orientative și pot conține greșeli. Nu înlocuiesc cartea de service, recomandările producătorului, un mecanic autorizat sau inspecția tehnică periodică. Deciziile despre mașina ta și răspunderea pentru ele îți aparțin.'],
    ['3. Contul și datele tale', 'Datele pe care le introduci îți aparțin. Ești responsabil pentru corectitudinea lor și pentru păstrarea parolei. În modul gratuit datele rămân doar pe dispozitiv și se pot pierde dacă ștergi aplicația sau datele browserului: exportă din când în când o copie (Acte → Backup).'],
    ['4. Utilizare corectă', 'Nu folosi aplicația pentru activități ilegale, nu încerca să accesezi datele altor utilizatori și nu perturba funcționarea serviciului.'],
    ['5. Disponibilitate și modificări', 'Aplicația este oferită „ca atare”, fără garanția funcționării neîntrerupte. Putem modifica sau opri funcții, cu anunț rezonabil acolo unde e posibil.'],
    ['6. Limitarea răspunderii', 'În limita permisă de lege, nu răspundem pentru pagube rezultate din folosirea estimărilor, din pierderea datelor locale sau din indisponibilitatea serviciului. Aceste limitări nu afectează drepturile tale legale de consumator.'],
    ['7. Contact', `${OPERATOR} · ${SUPPORT_EMAIL}`],
  ]},
  confid: {t: 'Politica de confidențialitate', body: [
    ['1. Cine răspunde de date', `${OPERATOR}, contact: ${SUPPORT_EMAIL}.`],
    ['2. Ce date folosim', 'Cont (modul Pro): adresa de email și parola (stocată securizat, nu o vedem). Profil, opțional: nume, telefon, localitate, poză. Date introduse de tine: mașini, piese, service, alimentări, cheltuieli, acte (tip, dată de expirare, număr poliță), prețuri și poze atașate.'],
    ['3. De ce le folosim', 'Doar ca să îți oferim funcțiile aplicației: evidență, estimări, memento-uri, rapoarte și export. Nu folosim datele pentru reclame sau profilare.'],
    ['4. Unde sunt stocate', 'Modul Gratuit: doar pe dispozitivul tău, în browser. Modul Pro: în contul tău din cloud (furnizor: Supabase; aplicația este găzduită pe Vercel). Verifică și completează aici regiunea/țara serverelor folosite.'],
    ['5. Servicii externe, doar când le folosești', 'Butonul „Din VIN” trimite seria de șasiu către serviciul public NHTSA. Fila Știri cere titlurile de la serverul aplicației, care citește fluxuri RSS publice. Butoanele pentru benzinării, stații și „Verifică pe internet” deschid Hărți (Apple/Google) sau o căutare web, care primesc locația ta sau textul căutării conform propriilor politici.'],
    ['6. Reclame și analitice', 'Nu folosim reclame, module de urmărire sau analitice. Folosim stocarea locală a browserului doar pentru preferințe (tema, alegeri de afișare) și, în modul Gratuit, pentru datele tale.'],
    ['7. Cât timp păstrăm datele', 'Cât timp ai cont (Pro) sau cât timp le păstrezi pe dispozitiv (Gratuit). Le poți șterge oricând din Cont → Confidențialitate și date.'],
    ['8. Drepturile tale (GDPR)', 'Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate (Acte → Backup JSON/CSV), opoziție și retragerea consimțământului, precum și dreptul de a depune plângere la ANSPDCP. Le poți exercita din aplicație sau scriind la adresa de contact.'],
    ['9. Securitate', 'Accesul la datele din cont este restricționat prin autentificare, cu verificare în doi pași opțională. Nicio metodă nu garantează securitate absolută.'],
    ['10. Minori și modificări', 'Aplicația nu este destinată copiilor sub 16 ani. Dacă modificăm politica, vei vedea versiunea actualizată aici.'],
  ]},
  stergere: {t: 'Ștergerea datelor și a contului', body: [
    ['Ștergerea datelor', 'Din Cont → Confidențialitate și date → „Șterge toate datele mele”. Se șterg mașinile, istoricul și pozele de pe acest dispozitiv sau din contul tău.'],
    ['Ștergerea contului (modul Pro)', 'Ștergerea contului în sine se face la cerere: apasă butonul de mai jos și trimite emailul pregătit. Completează termenul de răspuns promis: [ex. 30 de zile].'],
    ['Copie a datelor', 'Înainte de ștergere poți descărca o copie: Acte → Backup JSON sau CSV.'],
  ]},
}
