export const ro = n => Number(n || 0).toLocaleString('ro-RO', {maximumFractionDigits: 1})
export const ron = n => Number(n || 0).toLocaleString('ro-RO', {style: 'currency', currency: 'RON'})
export const dt = d => d ? new Date(d).toLocaleDateString('ro-RO') : '—'
export const today = () => new Date().toISOString().slice(0, 10)
export const STIL = [0.8, 1, 1.15] // Oraș, Mixt, Autostradă
export const STIL_N = ['Oraș', 'Mixt', 'Autostradă']
export function wear(p, car) {
  const LK = p.life_km || 1, LM = p.life_months
  const m = car.monthly_km || 1200, L = LK * STIL[car.style ?? 1]
  const remKm = Math.max(0, L - (car.odometer - (p.last_odo || 0)))
  const remMo = LM ? Math.max(0, LM - (Date.now() - new Date(p.last_date)) / 2.63e9) : Infinity
  const pct = Math.min(remKm / L, LM ? remMo / LM : 1)
  const rem = Math.min(remKm, remMo * m), luni = Math.min(remKm / m, remMo)
  const nextKm = (p.last_odo || 0) + L, due = LM ? new Date(p.last_date).getTime() + LM * 2.63e9 : null, first = !LM || remKm / m <= remMo ? 'km' : 'data'
  return {pct, rem, luni, nextKm, due, first, col: pct > 0.4 ? '#10b981' : pct > 0.15 ? '#f59e0b' : '#ef4444'}
}
export const durata = m => { if (m == null || !isFinite(m)) return '—'; const t = Math.round(m); if (t < 1) return 'sub o lună'; if (t >= 120) return 'peste 10 ani'; const a = Math.floor(t / 12), l = t % 12; return [a ? `${a} ${a === 1 ? 'an' : 'ani'}` : '', l ? `${l} ${l === 1 ? 'lună' : 'luni'}` : ''].filter(Boolean).join(' și ') }
export const daysTo = d => Math.ceil((new Date(d) - new Date(today())) / 864e5)
export const lunaAn = ts => ts ? new Date(ts).toLocaleDateString('ro-RO', {month: 'long', year: 'numeric'}) : '—'
