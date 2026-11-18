export const CAT_NAMES = {M: 'Motor & Propulsie', L: 'Filtre & Lichide', F: 'Sistem Frânare', S: 'Suspensie & Direcție', B: 'Baterie & Electrică', A: 'Anvelope & Roți', T: 'Transmisie & Ambreiaj', K: 'Climatizare & Confort', I: 'Iluminat & Vizibilitate', X: 'Evacuare & Emisii', C: 'Caroserie'}
export const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
// nume|categorie|km|luni|punct 3D|tipuri (A=toate, X=motor termic, B=benzină, D=diesel, G=GPL, H=baterie hibrid/HV, P=PHEV, E=electric; * = urmărită implicit)
const RAW = `Ulei motor + filtru ulei (benzină/GPL/hibrid)|L|15000|12|ulei|B*
Ulei motor + filtru ulei (diesel)|L|10000|12|ulei|D*
Filtru de aer motor|L|30000|24|filtre|X*
Filtru de habitaclu (polen/carbon)|L|20000|12|habitaclu|A*
Filtru de combustibil (motorină)|L|30000|24|filtre|D
Filtru de combustibil (benzină)|L|60000|48|filtre|B
Lichid de răcire (antigel)|L|60000|48|racire|X*
Lichid de răcire baterie / electronică de putere (HV)|L|60000|48|racire|EH*
Lichid de frână (DOT)|F|60000|24|frana|A*
Lichid servodirecție hidraulică|L|80000|60|directie|X
Ulei cutie de viteze manuală|T|90000|72|transmisie|X
Ulei cutie automată (ATF) + filtru|T|60000|48|transmisie|X
Ulei diferențial / cutie transfer (4x4)|T|80000|60|transmisie|A
Ulei reductor transmisie (EV)|T|100000|96|transmisie|E
Aditiv AdBlue (sistem SCR)|X|20000|12|evacuare|D
Curea / lanț de distribuție + pompă de apă|M|120000|72|distributie|X*
Curea de accesorii (poly-V) + rolă întinzătoare|M|90000|60|distributie|X
Bujii|M|60000|48|ulei|B*
Bujii incandescente (diesel)|M|100000|96|ulei|D
Bobine de inducție|M|120000|96|ulei|B
Termostat|M|120000|96|racire|X
Pompă de apă|M|120000|72|racire|X
Radiator de răcire|M|200000|120|racire|A
Pompă de combustibil|M|150000|120|filtre|X
Injectoare|M|150000|120|ulei|X
Turbosuflantă|M|200000|144|ulei|X
Intercooler|M|200000|144|filtre|X
Suporți motor / cutie (tampoane)|M|120000|96|ulei|X
Volant bimasă|T|200000|144|transmisie|D
Revizie instalație GPL (filtre, regulator, injectoare)|M|15000|12|gpl|G*
Kit ambreiaj (disc, placă presiune, rulment)|T|150000|120|transmisie|X
Planetare / articulații homocinetice (cardani)|T|150000|120|transmisie|A
Burduf planetară|T|100000|72|transmisie|A
Arbore cardanic (4x4)|T|200000|144|transmisie|A
Plăcuțe de frână față|F|40000|48|frana|A*
Plăcuțe de frână spate|F|60000|60|frana|A
Discuri de frână față|F|80000|72|frana|A
Discuri de frână spate|F|100000|84|frana|A
Etriere de frână|F|200000|144|frana|A
Furtunuri de frână|F|120000|84|frana|A
Plăcuțe / saboți frână de mână (parcare)|F|100000|84|frana|A
Senzori uzură plăcuțe|F|80000|60|frana|A
Senzor ABS|F|120000|96|frana|A
Amortizoare față|S|90000|96|amortizor|A*
Amortizoare spate|S|90000|96|amortizor|A
Arcuri elicoidale|S|200000|144|amortizor|A
Rulmenți amortizor + cuzineți|S|90000|96|amortizor|A
Bielete stabilizator|S|60000|60|amortizor|A
Bucșe bară stabilizatoare|S|100000|84|amortizor|A
Brațe suspensie (triunghiuri)|S|120000|96|amortizor|A
Bucșe brațe suspensie (silentblocuri)|S|100000|84|amortizor|A
Pivoți / articulații sferice|S|100000|84|directie|A
Capete de bară direcție|S|100000|84|directie|A
Bare de direcție (axiale)|S|120000|96|directie|A
Casetă de direcție|S|250000|180|directie|A
Rulmenți roți (butuc)|S|120000|96|anvelope|A
Geometrie roți (control + reglaj)|S|20000|12|anvelope|A*
Baterie 12V (acumulator)|B|80000|60|baterie12|A*
Alternator|B|200000|144|baterie12|X
Electromotor (demaror)|B|200000|144|baterie12|X
Sondă lambda (senzor oxigen)|X|100000|84|evacuare|X
Baterie de tracțiune HV (verificare stare, SOH)|B|200000|96|bateriaHV|H*
Port și cablu de încărcare (inspecție)|B|100000|60|bateriaHV|EP
Anvelope vară|A|50000|60|anvelope|A*
Anvelope iarnă|A|40000|48|anvelope|A
Anvelope all-season|A|50000|60|anvelope|A
Echilibrare roți|A|10000|12|anvelope|A
Senzori presiune anvelope (TPMS)|A|100000|84|anvelope|A
Încărcare freon + dezinfecție climatizare|K|40000|24|clima|A*
Filtru uscător climatizare|K|60000|48|clima|A
Compresor climatizare|K|180000|144|clima|A
Faruri: reglaj și becuri / LED|I|30000|24|lumini|A
Ștergătoare parbriz|I|30000|12|caroserie|A
Filtru de particule (DPF)|X|200000|144|evacuare|D
Filtru de particule benzină (GPF)|X|200000|144|evacuare|B
Catalizator|X|200000|168|evacuare|X
Toba de eșapament (amortizor zgomot)|X|150000|96|evacuare|X
Supapă EGR|X|120000|96|evacuare|X
Suporți gaz capotă / portbagaj|C|100000|96|caroserie|A
Tratament antiruginizare / ceară cavități|C|60000|36|caroserie|A`
export const CATALOG = RAW.split('\n').map(l => { const [name, c, km, mo, hot, t] = l.split('|'); return {name, category: CAT_NAMES[c], life_km: +km, life_months: +mo, hot, tags: t.replace('*', ''), def: t.includes('*')} })
const LET = {'Benzină': 'AXB', Diesel: 'AXD', GPL: 'AXBG', Hibrid: 'AXBH', PHEV: 'AXBHP', Electric: 'AEH'}
export const forType = t => CATALOG.filter(c => [...c.tags].some(x => (LET[t] || LET['Benzină']).includes(x)))
const CD = {M: [120000, 72], L: [30000, 24], F: [50000, 48], S: [100000, 84], B: [80000, 60], A: [50000, 60], T: [120000, 96], K: [60000, 48], I: [40000, 36], X: [150000, 96], C: [100000, 72]}
export function estimate(name, category) {
  const w = norm(name).split(/\s+/).filter(x => x.length > 2); let best = null, bs = 0
  CATALOG.forEach(c => { const n = norm(c.name), s = w.filter(x => n.includes(x)).length; if (s > bs) { bs = s; best = c } })
  if (best && bs >= Math.max(1, Math.ceil(w.length / 2))) return {km: best.life_km, mo: best.life_months, note: `Estimat după „${best.name}” din catalog (valori orientative, nu sursă oficială).`}
  const k = Object.keys(CAT_NAMES).find(x => CAT_NAMES[x] === category), d = CD[k] || [80000, 60]
  return {km: d[0], mo: d[1], note: `Estimare orientativă pentru categoria „${category}”. Verifică în manualul mașinii.`}
}
export const search = (q, t) => { const w = norm(q).split(/\s+/).filter(Boolean); return forType(t).filter(c => w.every(x => norm(c.name).includes(x))) }
