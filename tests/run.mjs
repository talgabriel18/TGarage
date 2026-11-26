// Teste pentru logica de bază, fără dependențe: `npm test`
import {mkdtempSync, cpSync, readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'

const tmp = mkdtempSync(join(tmpdir(), 'tgarage-'))
cpSync('src', join(tmp, 'src'), {recursive: true})
cpSync('api', join(tmp, 'api'), {recursive: true})
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}')
const walk = d => readdirSync(d).forEach(f => { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) {
  writeFileSync(p, readFileSync(p, 'utf8').replace(/(from\s+['"])(\.{1,2}\/[^'"]+?)(['"])/g, (m, a, q, c) => /\.(js|jsx|css|json)$/.test(q) ? m : a + q + '.js' + c)) } })
walk(join(tmp, 'src'))

const store = {}
globalThis.localStorage = {getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] }}
globalThis.sessionStorage = globalThis.localStorage
const imp = f => import(pathToFileURL(join(tmp, 'src', f)).href)
const [util, cat, data, csv, db, cars, intervals, legal] = await Promise.all(['lib/util.js', 'catalog.js', 'data.js', 'lib/csv.js', 'lib/localdb.js', 'carsdb.js', 'intervals.js', 'legal.js'].map(imp))

let n = 0, bad = 0
const t = async (name, fn) => { try { await fn(); n++; console.log('OK  ', name) } catch (e) { bad++; console.log('FAIL', name, '\n    ', e.message.split('\n')[0]) } }

const car = {brand: 'Dacia', model: 'Duster', odometer: 150000, monthly_km: 1000, style: 1}
await t('wear: estimare schimbare = km ultima înlocuire + interval', () => {
  const w = util.wear({name: 'X', life_km: 60000, life_months: 48, last_odo: 120000, last_date: '2025-02-01'}, car)
  assert.equal(w.nextKm, 180000); assert.ok(w.pct > 0 && w.pct < 1); assert.ok(w.due > Date.parse('2028-12-01') && w.due < Date.parse('2029-03-01'))
})
await t('wear: piesa fără luni nu are dată', () => assert.equal(util.wear({name: 'X', life_km: 1000, life_months: null, last_odo: 149500, last_date: '2026-01-01'}, car).due, null))
await t('wear: intervalul oficial are prioritate', () => {
  intervals.INTERVALS['Dacia|Duster'] = {Ulei: {km: 10000, luni: 6, sursa: 'test'}}
  const w = util.wear({name: 'Ulei', life_km: 60000, life_months: 48, last_odo: 140000, last_date: '2026-06-01'}, car)
  delete intervals.INTERVALS['Dacia|Duster']
  assert.equal(w.nextKm, 150000)
})
await t('durata: ani și luni', () => { assert.equal(util.durata(15), '1 an și 3 luni'); assert.equal(util.durata(24), '2 ani'); assert.equal(util.durata(0.2), 'sub o lună') })
await t('estimate: arcuri față = arcuri spate', () => { const a = cat.estimate('Arcuri față', 'Suspensie & Direcție'), b = cat.estimate('Arcuri spate', 'Suspensie & Direcție'); assert.equal(a.km, b.km); assert.equal(a.mo, b.mo); assert.equal(a.hot, 'amortizor') })
await t('hotFor: zona după nume', () => { assert.equal(cat.hotFor('Pompă de apă', 'Motor & Propulsie'), 'racire'); assert.equal(cat.hotFor('Amortizoare față', 'Motor & Propulsie'), 'amortizor'); assert.equal(cat.hotFor('Ulei motor + filtru ulei', 'Filtre & Lichide'), 'ulei'); assert.equal(cat.hotFor('Plăcuțe față', 'Sistem Frânare'), 'frana') })
await t('catalog: fără piese termice la electric', () => { const e = cat.forType('Electric').map(c => c.name); assert.ok(!e.some(x => /Bujii/.test(x))); assert.ok(e.some(x => /Baterie de tracțiune/.test(x))) })
await t('catalog: date complete', () => assert.ok(cat.CATALOG.every(c => c.category && c.life_km > 0 && c.life_months > 0 && c.hot)))
await t('parseLook: dus-întors și compatibil cu valoarea veche', () => { const L = {...data.LOOK_DEF, body: '#b91c1c', finish: 'metal'}; assert.deepEqual(data.parseLook(data.stringifyLook(L)), L); assert.equal(data.parseLook('#1d4ed8').body, '#1d4ed8'); assert.equal(data.parseLook('nu-e-culoare').body, data.LOOK_DEF.body) })
await t('sitesOf: roți pe pozițiile modelului Sedan', () => {
  const P = (n, h) => ({id: n, name: n, hot: h, pct: .8, col: '#10b981'})
  const s = data.sitesOf([P('Plăcuțe față', 'frana'), P('Anvelope', 'anvelope'), P('Ulei', 'ulei')], 'Sedan')
  assert.equal(s.filter(x => x.id[0] === 'w').length, 4); assert.deepEqual(s.find(x => x.id === 'w0').pos, [1.18, .23, .7]); assert.equal(s.find(x => x.id === 'w2').parts.length, 1)
})
await t('csv: format românesc și englezesc', () => {
  let r = csv.mapFuel(csv.parseCsv('Data;Km;Cantitate;Preț unitar;Total;Plin\n15.01.2026;100000;40,5;9,80;396,9;da'), {powertrain: 'Diesel'})
  assert.equal(r[0].quantity, 40.5); assert.equal(r[0].date, '2026-01-15'); assert.equal(r[0].unit, 'L')
  r = csv.mapFuel(csv.parseCsv('Date,Odometer,Liters,Price,Total Cost,Full\n2026-03-01,101200,"42.1",9.9,416.8,1'), {powertrain: 'Diesel'}); assert.equal(r[0].odometer, 101200)
  r = csv.mapFuel(csv.parseCsv('Data;Km;Cantitate;Total\n2026-01-01;10;20;100'), {powertrain: 'Electric'}); assert.equal(r[0].unit, 'kWh')
})
await t('baza de mașini: Duster = SUV', () => { const m = cars.DB.Dacia.find(x => x.name === 'Duster'); assert.equal(m.body, 'SUV'); assert.ok(m.pw.includes('Diesel')); assert.ok(cars.BRANDS.length > 40) })
await t('localdb: inserare, actualizare, upsert, cascadă', async () => {
  const sb = db.local
  const v = await sb.from('vehicles').insert({brand: 'A', powertrain: 'Benzină'}).select().single(); assert.equal(v.data.monthly_km, 1200)
  await sb.from('vehicle_parts').insert([{vehicle_id: v.data.id, name: 'P', life_km: 1}]); await sb.from('vehicles').update({odometer: 5}).eq('id', v.data.id)
  assert.equal((await sb.from('vehicles').select('*')).data[0].odometer, 5)
  await sb.from('prices').upsert({user_id: 'local', key: 'k', price: 1}, {onConflict: 'user_id,key'}); await sb.from('prices').upsert({user_id: 'local', key: 'k', price: 2}, {onConflict: 'user_id,key'})
  assert.equal((await sb.from('prices').select('*')).data.length, 1)
  await sb.from('vehicles').delete().eq('id', v.data.id); assert.equal((await sb.from('vehicle_parts').select('*')).data.length, 0)
})
await t('legal: documente complete', () => { assert.equal(Object.keys(legal.LEGAL).length, 3); Object.values(legal.LEGAL).forEach(d => assert.ok(d.body.length >= 3 && d.body.every(b => b[0] && b[1]))) })

await t('distribuție: curea și lanț separate, cu intervalele cerute', () => {
  const b = cat.estimate('Distribuție pe curea', 'Motor & Propulsie'), l = cat.estimate('Distribuție pe lanț', 'Motor & Propulsie')
  assert.equal(b.km, 75000); assert.equal(b.mo, 60); assert.equal(l.km, 200000); assert.equal(l.hot, 'distributie')
  assert.ok(cat.CATALOG.some(c => c.name === 'Distribuție pe curea (+ pompă de apă)') && cat.CATALOG.some(c => c.name === 'Distribuție pe lanț'))
})
await t('wheelSpec: model cunoscut și implicit', () => { assert.equal(data.wheelSpec('Sedan').z, .565); assert.equal(data.wheelSpec('SUV').f, 1.15) })
await t('știri: top 10 din ziua curentă, fără dubluri, cu starea surselor', async () => {
  const now = Date.now(), rss = items => `<rss><channel>${items.map(([t, ms]) => `<item><title><![CDATA[${t}]]></title><link>https://ex.ro/${encodeURIComponent(t)}</link><pubDate>${new Date(ms).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`
  const A = Array.from({length: 8}, (_, i) => [`Stire A ${i} &amp; co`, now - (i + 1) * 36e5]), B = [['Stire A 0 & co', now - 5e5], ...Array.from({length: 6}, (_, i) => [`Stire B ${i}`, now - (i + 2) * 40e5]), ['Veche', now - 9 * 864e5]]
  globalThis.fetch = async u => u.includes('autoblog') ? {ok: true, text: async () => rss(A)} : u.includes('automarket') ? {ok: true, text: async () => rss(B)} : {ok: false, status: 404}
  const news = (await import(pathToFileURL(join(tmp, 'api', 'news.js')).href)).default
  let out; await news({}, {setHeader() {}, status() { return {json: j => { out = j }} }})
  assert.equal(out.items.length, 10); assert.ok(out.items.every(x => now - x.ts < 864e5)); assert.equal(new Set(out.items.map(x => x.title.toLowerCase())).size, 10)
  assert.ok(out.items.some(x => x.title === 'Stire A 1 & co')); assert.ok(out.items.every((x, i, a) => !i || a[i - 1].ts >= x.ts))
  assert.equal(out.sources.filter(s => s.ok).length, 2); assert.equal(out.sources.length, 4)
})

console.log(`\n${n} teste trecute, ${bad} eșuate`)
process.exit(bad ? 1 : 0)
