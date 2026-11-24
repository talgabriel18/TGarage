// Intervale OFICIALE pe model, luate din cartea de service / manualul producătorului.
// Completează DOAR cu valori verificate. Cheie: 'Marcă|Model'. Valoare: { 'Numele exact al piesei din catalog': {km, luni, sursa} }
// Exemplu (NU e activ): 'Dacia|Duster': {'Ulei motor + filtru ulei (diesel)': {km: 15000, luni: 12, sursa: 'Cartea de service, pag. X'}}
// Când o piesă are interval oficial, aplicația îl folosește în locul estimării din catalog și arată sursa.
export const INTERVALS = {}
export const officialFor = (car, name) => { const m = car && INTERVALS[`${car.brand}|${car.model || ''}`]; return (m && m[name]) || null }
