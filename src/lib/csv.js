const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const plain = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '')
  const first = text.split(/\r?\n/)[0] || '', d = [';', ',', '\t'].map(c => [c, first.split(c).length]).sort((a, b) => b[1] - a[1])[0][0]
  const rows = []; let row = [], cur = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += ch }
    else if (ch === '"') q = true
    else if (ch === d) { row.push(cur); cur = '' }
    else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = '' }
    else cur += ch
  }
  if (cur || row.length) { row.push(cur.replace(/\r$/, '')); rows.push(row) }
  const h = (rows.shift() || []).map(norm)
  return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(h.map((k, i) => [k, (r[i] || '').trim()])))
}

const num = s => {
  if (s == null || s === '') return NaN
  let t = String(s).replace(/[^\d,.\-]/g, '')
  if (t.includes(',') && t.includes('.')) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')
  else t = t.replace(',', '.')
  return parseFloat(t)
}
const date = s => {
  s = (s || '').trim(); let m
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  if ((m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/))) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}
const pick = (r, keys) => { for (const k of keys) if (r[k] !== undefined && r[k] !== '') return r[k]; return '' }

export function mapFuel(rows, car) {
  const unit = car.powertrain === 'Electric' ? 'kWh' : 'L', out = []
  rows.forEach(r => {
    const tip = pick(r, ['tip', 'type'])
    if (tip && !/alimentar|incarc|fuel|refuel|charg/.test(plain(tip))) return
    const d = date(pick(r, ['data', 'date', 'datum']))
    const q = num(pick(r, ['cantitate', 'quantity', 'litri', 'liters', 'litres', 'volume', 'kwh', 'qty']))
    const odo = num(pick(r, ['km', 'odometru', 'odometer', 'odo', 'mileage', 'kilometri']))
    let pu = num(pick(r, ['pretunitar', 'pret', 'priceunit', 'priceperunit', 'priceperlitre', 'price', 'unitprice']))
    let t = num(pick(r, ['total', 'totalcost', 'cost', 'suma', 'amount']))
    if (!d || !(q > 0)) return
    if (!(pu > 0) && t > 0) pu = t / q
    if (!(t > 0) && pu > 0) t = pu * q
    const full = pick(r, ['plin', 'full', 'fulltank', 'plincomplet', 'complet']), u = pick(r, ['unitate', 'unit'])
    out.push({date: d, odometer: isNaN(odo) ? null : Math.round(odo), quantity: +q.toFixed(2), unit: /kwh/i.test(u) ? 'kWh' : /^l/i.test(u) ? 'L' : unit,
      price_per_unit: pu > 0 ? +pu.toFixed(3) : null, total_cost: t > 0 ? +t.toFixed(2) : 0, station: pick(r, ['statie', 'station', 'stationname', 'descriere']) || null,
      full_tank: full === '' ? true : !/^(0|nu|no|false|n|f)$/i.test(full)})
  })
  return out
}

const COLS = [['tip', 'Tip'], ['data', 'Data'], ['km', 'Km'], ['descriere', 'Descriere'], ['cantitate', 'Cantitate'], ['unitate', 'Unitate'], ['pret_unitar', 'Preț unitar'], ['total', 'Total'], ['plin', 'Plin']]
function toCsv(rows) {
  const esc = v => { v = v == null ? '' : typeof v === 'number' ? String(v).replace('.', ',') : String(v); return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v }
  return '\uFEFF' + [COLS.map(c => c[1]).join(';'), ...rows.map(r => COLS.map(c => esc(r[c[0]])).join(';'))].join('\r\n')
}
function save(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type: 'text/csv;charset=utf-8'})); a.download = name; a.click() }
const N = v => v == null || v === '' ? null : Number(v)

export function exportCsv(D, car) {
  const rows = [
    ...D.fuel.filter(x => x.vehicle_id === car.id).map(x => ({tip: x.unit === 'kWh' ? 'Încărcare' : 'Alimentare', data: x.date, km: x.odometer, descriere: x.station || '', cantitate: N(x.quantity), unitate: x.unit, pret_unitar: N(x.price_per_unit), total: N(x.total_cost), plin: x.full_tank ? 'da' : 'nu'})),
    ...D.logs.filter(x => x.vehicle_id === car.id).map(x => ({tip: 'Service', data: x.date, km: x.odometer, descriere: x.part_name + (x.brand_oem ? ' (' + x.brand_oem + ')' : ''), total: Number(x.part_cost) + Number(x.labor_cost)})),
    ...(D.exp || []).filter(x => x.vehicle_id === car.id).map(x => ({tip: 'Cheltuială', data: x.date, descriere: x.category + (x.note ? ' – ' + x.note : ''), total: N(x.amount)})),
  ].sort((a, b) => a.data.localeCompare(b.data))
  save(`tgarage-${(car.brand + '-' + (car.model || '')).toLowerCase().replace(/\W+/g, '-')}.csv`, toCsv(rows))
}
export function templateCsv() {
  save('tgarage-model-import.csv', toCsv([{tip: 'Alimentare', data: '2026-01-15', km: 100000, descriere: 'Petrom', cantitate: 40, unitate: 'L', pret_unitar: 9.8, total: 392, plin: 'da'}]))
}
