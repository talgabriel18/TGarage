import {CAT_NAMES, forType, norm} from './catalog'
export const TIPURI = ['Benzină', 'Diesel', 'GPL', 'Hibrid', 'PHEV', 'Electric']
export const CATS = Object.values(CAT_NAMES)
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
// Pozitionare modele .glb: rot = rotatie pe Y (fata masinii trebuie sa ajunga spre +X), wheels = pozitia rotilor in scena (f = fata, r = spate, y = inaltime butuc, z = jumatate din ecartament)
export const MODEL_CFG = {
  SUV: {rot: Math.PI / 2, wheels: {f: 1.1, r: -1.1, y: .31, z: .9}},
  Hatchback: {rot: Math.PI / 2, wheels: {f: 1.0, r: -1.15, y: .32, z: .86}},
  Sedan: {rot: Math.PI / 2, wheels: {f: 1.04, r: -.97, y: .3, z: .83}},
}
export const ROT = Object.fromEntries(Object.entries(MODEL_CFG).map(([k, v]) => [k, v.rot]))
// Poziții puncte pulsatorii [x,y,z], pentru modelul de bază. Suprascrie per caroserie după ce pui modelele .glb.
export const HOT = {ulei: [1.5,.6,0], frana: [1.3,.3,.9], amortizor: [-1.3,.3,-.9], anvelope: [-1.3,.2,.9], baterie12: [1.2,.7,-.5], distributie: [1.6,.5,.3], filtre: [1.2,.8,.4], habitaclu: [0,.9,.3], bateriaHV: [0,.1,0], racire: [.8,.2,-.6], caroserie: [0,1,.8], gpl: [-1.4,.5,0], transmisie: [0,.4,0], evacuare: [-1.6,.25,0], clima: [1.3,.7,-.3], lumini: [1.8,.6,.5], directie: [1.2,.35,-.9]}
export const HOT_OVERRIDE = {} // ex: {SUV: {bateriaHV: [0,.2,0]}}
export const posFor = (body, key) => (HOT_OVERRIDE[body] && HOT_OVERRIDE[body][key]) || HOT[key] || [0, .8, 0]

// Piese urmărite implicit la mașină nouă (restul se adaugă din catalog)
export const template = t => forType(t).filter(c => c.def).map(({name, category, hot, life_km, life_months}) => ({name, category, hot, life_km, life_months}))
export const EXP_CATS = ['Asigurare', 'Parcare', 'Spălătorie', 'Taxe și impozit', 'Taxe drum', 'Amenzi', 'Altele']

// Zone (culoare per zona) si pozitii multiple (4 roti etc.) pentru punctele pulsatorii
export const ZONE = {ulei: 'motor', distributie: 'motor', filtre: 'motor', racire: 'motor', frana: 'frane', amortizor: 'susp', directie: 'susp', anvelope: 'roti', baterie12: 'elec', bateriaHV: 'elec', habitaclu: 'cabina', clima: 'cabina', transmisie: 'trans', evacuare: 'evac', gpl: 'evac', lumini: 'caros', caroserie: 'caros'}
export const ZONES = {motor: ['Motor', '#fb923c'], frane: ['Frânare', '#f472b6'], susp: ['Suspensie', '#22d3ee'], roti: ['Roți', '#a3e635'], elec: ['Electric', '#a78bfa'], cabina: ['Habitaclu', '#60a5fa'], trans: ['Transmisie', '#facc15'], evac: ['Evacuare', '#94a3b8'], caros: ['Caroserie', '#e5e7eb']}
const KEYNAME = {ulei: 'Motor', distributie: 'Distribuție', filtre: 'Filtre', racire: 'Răcire', baterie12: 'Baterie 12V', bateriaHV: 'Baterie tracțiune', habitaclu: 'Habitaclu', clima: 'Climatizare', transmisie: 'Transmisie', evacuare: 'Evacuare', gpl: 'Instalație GPL', lumini: 'Iluminat', caroserie: 'Caroserie'}
const WHEELK = ['frana', 'anvelope', 'amortizor', 'directie']
const wheelsOf = body => {
  const w = (MODEL_CFG[body] || {}).wheels || {f: 1.15, r: -1.15, y: .5, z: .95}
  return [['față stânga', w.f, w.z, 'F', w.y], ['față dreapta', w.f, -w.z, 'F', w.y], ['spate stânga', w.r, w.z, 'R', w.y], ['spate dreapta', w.r, -w.z, 'R', w.y]]
}
const axle = p => { const n = norm(p.name); return /fata/.test(n) ? 'F' : /spate/.test(n) ? 'R' : p.hot === 'directie' ? 'F' : 'A' }
const worstOf = list => list.reduce((a, b) => b.pct < a.pct ? b : a)
// Un punct pe fiecare roata (cu meniu de piese) + un punct pe zona pentru restul pieselor. `parts` au deja pct si col (din wear).
export function sitesOf(parts, body) {
  const out = [], wp = parts.filter(p => WHEELK.includes(p.hot))
  wheelsOf(body).forEach(([n, x, z, ax, y], i) => {
    const L = wp.filter(p => axle(p) === 'A' || axle(p) === ax)
    if (L.length) out.push({id: 'w' + i, name: 'Roată ' + n, pos: [x, y, z], parts: L, col: worstOf(L).col, zoneColor: ZONES.roti[1], zoneName: ZONES.roti[0]})
  })
  const groups = {}
  parts.filter(p => !WHEELK.includes(p.hot)).forEach(p => { (groups[p.hot] = groups[p.hot] || []).push(p) })
  Object.entries(groups).forEach(([k, L]) => out.push({id: k, name: KEYNAME[k] || k, pos: posFor(body, k), parts: L, col: worstOf(L).col, zoneColor: (ZONES[ZONE[k]] || [])[1] || worstOf(L).col, zoneName: (ZONES[ZONE[k]] || [])[0] || KEYNAME[k] || k}))
  return out
}
