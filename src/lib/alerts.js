import {wear, daysTo, ro, durata} from './util'
import {priceKeys} from '../data'
export function computeAlerts(D) {
  const out = [], m = new Date().getMonth() + 1
  D.cars.forEach(c => {
    const n = `${c.brand} ${c.model || ''}`.trim()
    D.docs.filter(d => d.vehicle_id === c.id).forEach(d => {
      const x = daysTo(d.expires_on)
      if (x <= 30) out.push({id: 'd' + d.id, sev: x <= 7 ? 2 : 1, icon: '📄', title: `${d.type} · ${n}`, text: x < 0 ? `Expirat de ${-x} zile` : x === 0 ? 'Expiră azi' : `Expiră în ${x} zile`})
    })
    D.parts.filter(p => p.vehicle_id === c.id).forEach(p => {
      const w = wear(p, c)
      if (w.pct < .25) out.push({id: 'p' + p.id, sev: w.pct < .1 ? 2 : 1, icon: '🔧', title: `${p.name} · ${n}`, text: `~${ro(Math.round(w.rem))} km sau ${durata(w.luni)} rămase`})
    })
    const last = [...D.fuel, ...D.logs].filter(x => x.vehicle_id === c.id).map(x => x.date).sort().pop()
    if (last) { const g = Math.floor((Date.now() - new Date(last)) / 864e5); if (g > 45) out.push({id: 'k' + c.id, sev: 0, icon: '📍', title: n, text: `Ultima înregistrare acum ${g} zile. Actualizează kilometrii.`}) }
    if ((m >= 10 && m <= 11) || (m >= 3 && m <= 4)) out.push({id: 'a' + c.id + m, sev: 0, icon: '🛞', title: n, text: m >= 10 ? 'Sezon rece: verifică anvelopele de iarnă' : 'Sezon cald: verifică anvelopele de vară'})
  })
  const rel = new Set(D.cars.flatMap(c => priceKeys(c.powertrain)))
  Object.entries(D.pdates).forEach(([k, d]) => { if (rel.has(k) && (Date.now() - new Date(d)) / 864e5 > 14) out.push({id: 'pr' + k, sev: 0, icon: '⛽', title: `Preț ${k}`, text: 'Nu a fost actualizat de peste 14 zile'}) })
  return out.sort((a, b) => b.sev - a.sev)
}
