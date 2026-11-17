export const TIPURI = ['Benzină', 'Diesel', 'GPL', 'Hibrid', 'PHEV', 'Electric']
export const CATS = ['Motor & Propulsie', 'Sistem Frânare', 'Suspensie & Direcție', 'Filtre & Lichide', 'Baterie & Electrică', 'Anvelope & Roți', 'Caroserie']
export const DEFAULT_PRICES = {Benzină: 9.8, Motorină: 10.84, GPL: 4.78, kWh: 1.9}
export const priceKeys = t => ({Electric: ['kWh'], Diesel: ['Motorină'], GPL: ['GPL', 'Benzină'], PHEV: ['Benzină', 'kWh']}[t] || ['Benzină'])
export const fuelKey = t => ({Electric: 'kWh', Diesel: 'Motorină', GPL: 'GPL'}[t] || 'Benzină')
export const BRANDS = ['Petrom', 'OMV', 'MOL', 'Rompetrol', 'Lukoil', 'Socar']
// Tarife orientative încărcare (nov 2026) – apeși un rând ca să-l setezi
export const EVP = [['Acasă', 1.0], ['Public AC (medie)', 1.5], ['Public DC (medie)', 2.1], ['MOL Plugee AC', 1.7], ['MOL Plugee DC', 2.3], ['MOL Plugee UDC', 2.85], ['Eldrive standard', 2.55], ['Eldrive abonament', 1.75]]

// [contur lateral, geamuri] – model de rezervă când lipsește fișierul .glb
export const BODY = {
  Sedan: [[[-1.75,.3],[-1.82,.6],[-1.7,.9],[-1.4,1],[-.95,1.4],[.25,1.42],[.8,1],[1.55,.92],[1.82,.7],[1.82,.4],[1.7,.3]], [[-1,1.06],[-.82,1.38],[.2,1.4],[.68,1.06]]],
  SUV: [[[-1.8,.35],[-1.85,.7],[-1.8,1.15],[-1.5,1.55],[.35,1.6],[.85,1.15],[1.6,1],[1.85,.8],[1.85,.45],[1.7,.35]], [[-1.45,1.2],[-1.35,1.52],[.3,1.55],[.72,1.2]]],
  Hatchback: [[[-1.5,.3],[-1.58,.6],[-1.5,1.1],[-1.25,1.4],[.15,1.42],[.65,1],[1.4,.9],[1.62,.7],[1.62,.4],[1.5,.3]], [[-1.2,1.1],[-1.1,1.36],[.1,1.38],[.55,1.06]]],
  Break: [[[-1.85,.3],[-1.9,.65],[-1.85,1.1],[-1.6,1.4],[.2,1.42],[.8,1],[1.6,.92],[1.88,.7],[1.88,.4],[1.75,.3]], [[-1.5,1.06],[-1.4,1.36],[.15,1.38],[.68,1.06]]],
  Coupe: [[[-1.75,.28],[-1.82,.55],[-1.65,.85],[-1.2,1],[-.5,1.22],[.2,1.25],[.9,.9],[1.6,.82],[1.85,.62],[1.85,.38],[1.7,.28]], [[-.85,1.03],[-.5,1.2],[.15,1.22],[.7,.98]]],
  Pickup: [[[-1.9,.35],[-1.9,.95],[-.5,.95],[-.5,1.45],[.5,1.48],[.9,1],[1.7,.95],[1.9,.75],[1.9,.4],[1.75,.35]], [[-.4,1],[-.4,1.4],[.45,1.43],[.8,1]]],
}
// Rotația modelului .glb pe axa Y (radiani). Fața mașinii trebuie să fie spre +X. Ajustează dacă apare întors.
export const ROT = {Sedan: 0, SUV: 0, Hatchback: 0, Break: 0, Coupe: 0, Pickup: 0}
// Poziții puncte pulsatorii [x,y,z], pentru modelul de bază. Suprascrie per caroserie după ce pui modelele .glb.
export const HOT = {ulei: [1.5,.6,0], frana: [1.3,.3,.9], amortizor: [-1.3,.3,-.9], anvelope: [-1.3,.2,.9], baterie12: [1.2,.7,-.5], distributie: [1.6,.5,.3], filtre: [1.2,.8,.4], habitaclu: [0,.9,.3], bateriaHV: [0,.1,0], racire: [.8,.2,-.6], caroserie: [0,1,.8], gpl: [-1.4,.5,0]}
export const HOT_OVERRIDE = {} // ex: {SUV: {bateriaHV: [0,.2,0]}}
export const posFor = (body, key) => (HOT_OVERRIDE[body] && HOT_OVERRIDE[body][key]) || HOT[key] || [0, .8, 0]

// Piese urmărite (durată în km și în luni)
export function template(t) {
  const T = (name, category, hot, life_km, life_months) => ({name, category, hot, life_km, life_months})
  if (t === 'Electric') return [T('Filtru habitaclu','Filtre & Lichide','habitaclu',25000,12), T('Plăcuțe frână','Sistem Frânare','frana',80000,60), T('Lichid frână','Sistem Frânare','frana',60000,24), T('Anvelope','Anvelope & Roți','anvelope',45000,60), T('Amortizoare','Suspensie & Direcție','amortizor',100000,96), T('Baterie tracțiune','Baterie & Electrică','bateriaHV',250000,96), T('Lichid răcire baterie','Filtre & Lichide','racire',60000,48), T('Baterie 12V','Baterie & Electrică','baterie12',80000,48)]
  const ice = [T('Ulei motor','Motor & Propulsie','ulei',t === 'Diesel' ? 10000 : 15000,12), T('Filtre (aer, polen)','Filtre & Lichide','filtre',30000,24), T('Distribuție','Motor & Propulsie','distributie',120000,72), T('Plăcuțe frână față','Sistem Frânare','frana',40000,48), T('Lichid frână','Sistem Frânare','frana',60000,24), T('Amortizoare','Suspensie & Direcție','amortizor',90000,96), T('Anvelope','Anvelope & Roți','anvelope',50000,60), T('Baterie 12V','Baterie & Electrică','baterie12',80000,60)]
  if (t === 'GPL') ice.push(T('Revizie instalație GPL','Motor & Propulsie','gpl',15000,12))
  if (t === 'Hibrid' || t === 'PHEV') ice.push(T('Baterie tracțiune','Baterie & Electrică','bateriaHV',200000,96))
  return ice
}
