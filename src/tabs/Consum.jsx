import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {openFile} from '../lib/media'
import {ro, ron, dt, durata} from '../lib/util'
import {priceKeys, fuelKey, BRANDS, EVP} from '../data'
import {Num} from '../components/YearReview'
import TripCalc from '../components/TripCalc'
import FindNear from '../components/FindNear'
const MN = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec']
const kfmt = v => v >= 1000 ? (v / 1000).toFixed(1).replace('.', ',') + 'k' : String(Math.round(v))

const map = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

function stats(fuel, logs, unit) {
  const L = fuel.filter(x => x.unit === unit && x.odometer).sort((a, b) => a.odometer - b.odometer), full = L.filter(x => x.full_tank)
  if (full.length < 2) return null
  const a = full[0], z = full[full.length - 1], d = z.odometer - a.odometer; if (d <= 0) return null
  const seg = L.filter(x => x.odometer > a.odometer && x.odometer <= z.odometer)
  const q = seg.reduce((s, x) => s + Number(x.quantity), 0), c = seg.reduce((s, x) => s + Number(x.total_cost), 0)
  const m = logs.filter(x => x.odometer > a.odometer && x.odometer <= z.odometer).reduce((s, x) => s + Number(x.part_cost) + Number(x.labor_cost), 0)
  return {per100: q / d * 100, fuelKm: c / d, totKm: (c + m) / d, d}
}

export default function Consum({D, car, reload, onEdit}) {
  const ev = car.powertrain === 'Electric', [tot, setTot] = useState(false)
  const units = ev ? ['kWh'] : car.powertrain === 'PHEV' ? ['L', 'kWh'] : ['L']
  const fuel = D.fuel.filter(x => x.vehicle_id === car.id), logs = D.logs.filter(x => x.vehicle_id === car.id)
  const months = {}; fuel.forEach(x => { const k = x.date.slice(0, 7); months[k] = (months[k] || 0) + Number(x.total_cost) })
  const sumF = fuel.reduce((s, x) => s + Number(x.total_cost), 0), sumS = logs.reduce((s, x) => s + Number(x.part_cost) + Number(x.labor_cost), 0)
  const exps = (D.exp || []).filter(x => x.vehicle_id === car.id), sumE = exps.reduce((s, x) => s + Number(x.amount), 0), grand = sumF + sumS + sumE
  const odos = fuel.map(x => x.odometer).concat(logs.map(x => x.odometer)).filter(Boolean), kmR = odos.length > 1 ? Math.max(...odos) - Math.min(...odos) : 0
  const dts = fuel.map(x => x.date).concat(logs.map(x => x.date), exps.map(x => x.date)).sort(), mo = dts.length ? Math.max(1, (Date.now() - new Date(dts[0])) / 2.63e9) : 1
  const keys = Array.from({length: 6}, (_, i) => { const d = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + i, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') })
  const agg = Object.fromEntries(keys.map(k => [k, {f: 0, s: 0, e: 0}]))
  fuel.forEach(x => { const a = agg[x.date.slice(0, 7)]; if (a) a.f += Number(x.total_cost) })
  logs.forEach(x => { const a = agg[x.date.slice(0, 7)]; if (a) a.s += Number(x.part_cost) + Number(x.labor_cost) })
  exps.forEach(x => { const a = agg[x.date.slice(0, 7)]; if (a) a.e += Number(x.amount) })
  const bars = keys.map(k => ({k, ...agg[k], t: agg[k].f + agg[k].s + agg[k].e})), bmax = Math.max(1, ...bars.map(b => b.t)), bavg = bars.reduce((s, b) => s + b.t, 0) / 6
  const ms = Object.entries(months).sort().slice(-6), mx = Math.max(1, ...ms.map(m => m[1]))
  const save = async (key, v) => { if (!(+v > 0)) return; await sb.from('prices').upsert({user_id: D.uid, key, price: +v, updated_at: new Date().toISOString()}, {onConflict: 'user_id,key'}); reload(car.id) }
  const old = k => D.pdates[k] && (Date.now() - new Date(D.pdates[k])) / 864e5 > 14
  const delE = async id => { if (confirm('Ștergi cheltuiala?')) { await sb.from('expenses').delete().eq('id', id); reload(car.id) } }
  const delF = async id => { if (confirm('Ștergi înregistrarea?')) { await sb.from('fuel_logs').delete().eq('id', id); reload(car.id) } }
  return <>
    
    {units.map(u => { const s = stats(fuel, logs, u); return <div key={u} className="grid" style={{marginBottom: 10}}>
      <div className="card"><div className="big">{s ? ro(s.per100) : '—'}</div><small className="mu">{u}/100 km</small></div>
      <div className="card"><div className="big">{s ? (tot ? s.totKm : s.fuelKm).toFixed(2).replace('.', ',') : '—'}</div><small className="mu">RON/km</small></div></div> })}
    <div className="chips"><button className={tot ? 'g' : 'on'} onClick={() => setTot(false)}>{ev ? 'Doar încărcare' : 'Doar combustibil'}</button><button className={tot ? 'on' : 'g'} onClick={() => setTot(true)}>Total (cu service)</button></div>
    <small className="mu">Calculul folosește înregistrările cu plin/încărcare completă (minim două).</small>
    <div className="card"><div className="row"><b>📊 Cheltuieli pe luni</b><small className="mu">ultimele 6 luni</small></div>
      {bmax <= 1 ? <p className="mu" style={{margin: '8px 0 0'}}>Încă nu ai cheltuieli în ultimele 6 luni.</p> : <>
        <div style={{position: 'relative', height: 120, marginTop: 12}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 100 * bavg / bmax, borderTop: '1px dashed var(--mu)', opacity: .7}}/>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, height: '100%'}}>
            {bars.map(b => <div key={b.k} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end'}}>
              <small style={{fontSize: 11, color: 'var(--mu)', marginBottom: 3}}>{b.t ? kfmt(b.t) : ''}</small>
              <div style={{width: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: 8, overflow: 'hidden'}}>
                {[[b.f, 'var(--ac)'], [b.s, '#f59e0b'], [b.e, '#a78bfa']].map(([v, c], i) => <motion.div key={i} initial={{height: 0}} animate={{height: v / bmax * 100}} transition={{duration: .6, delay: i * .08}} style={{background: c}}/>)}</div></div>)}</div></div>
        <div style={{display: 'flex', gap: 8, marginTop: 6}}>{bars.map((b, i) => <small key={b.k} style={{flex: 1, textAlign: 'center', fontWeight: i === 5 ? 700 : 400, color: i === 5 ? 'var(--tx)' : 'var(--mu)'}}>{MN[+b.k.slice(5) - 1]}</small>)}</div>
        <div className="row" style={{marginTop: 10, flexWrap: 'wrap'}}><small><b style={{color: 'var(--ac)'}}>●</b> {ev ? 'Încărcare' : 'Combustibil'}</small><small><b style={{color: '#f59e0b'}}>●</b> Service</small><small><b style={{color: '#a78bfa'}}>●</b> Altele</small><small className="mu">linie punctată = media {ron(bavg)}/lună</small></div></>}</div>
    <div className="card"><b>💰 Cât te costă mașina</b>
      <p className="mu" style={{margin: '4px 0 10px', fontSize: 13}}>Aici se adună tot ce ai plătit pentru ea: {ev ? 'încărcare' : 'combustibil'}, service și alte cheltuieli.</p>
      <div className="big"><Num v={grand} f={n => ron(n)}/></div>
      <small className="mu" style={{display: 'block', marginBottom: 12}}>total în {durata(Math.round(mo))}{kmR > 0 ? ` · ${ro(kmR)} km parcurși` : ''}</small>
      <div style={{display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', margin: '0 0 8px', background: 'var(--gbtn)'}}>{[[sumF, 'var(--ac)'], [sumS, '#f59e0b'], [sumE, '#a78bfa']].map(([v, c], i) => <i key={i} style={{width: `${grand ? v / grand * 100 : 0}%`, background: c}}/>)}</div>
      {[[ev ? 'Încărcare' : 'Combustibil', sumF, 'var(--ac)'], ['Service și piese', sumS, '#f59e0b'], ['Alte cheltuieli', sumE, '#a78bfa']].map(([n, v, c]) => <div key={n} className="row" style={{padding: '3px 0'}}><span><b style={{color: c}}>●</b> {n}</span><span>{ron(v)} <small className="mu">· {grand ? Math.round(v / grand * 100) : 0}%</small></span></div>)}</div>
    <div className="card"><b>Prețuri la Zi (RON)</b>
      {priceKeys(car.powertrain).map(k => <div key={k} className="row"><span>{k}<br/><small className="mu">{D.pdates[k] ? (old(k) ? '⚠ vechi: ' : 'actualizat ') + dt(D.pdates[k]) : 'valoare implicită'}</small></span>
        <input style={{width: 100}} type="number" step="0.01" defaultValue={D.prices[k]} key={D.prices[k]} onBlur={e => save(k, e.target.value)}/></div>)}</div>
    {ev ? <div className="card"><div className="row"><b>⚡ Preț kWh</b><small className="mu">apasă ca să setezi</small></div>
      <div className="chips" style={{flexWrap: 'wrap'}}>{EVP.slice(0, 3).map(([n, p]) => <button key={n} className={D.prices.kWh === p ? 'sm' : 'g sm'} onClick={() => save('kWh', p)}>{n.replace(' (medie)', '')} · {p.toFixed(2)}</button>)}</div>
      <details style={{marginTop: 6}}><summary className="mu" style={{fontSize: 13}}>Tarife pe operatori (orientative)</summary>
        {EVP.slice(3).map(([n, p]) => <div key={n} className="row" style={{padding: '6px 0'}} onClick={() => save('kWh', p)}><small>{n}</small><small className="mu">{p.toFixed(2)}</small></div>)}
        <small className="mu" style={{display: 'block', marginTop: 4}}>Tarifele se schimbă des; verifică în aplicația operatorului.</small></details></div> : null}
    <FindNear ev={ev}/>
    <TripCalc per100={stats(fuel, logs, units[0])?.per100} unit={units[0]} price={D.prices[fuelKey(car.powertrain)] ?? 0}/>
    <h2 style={{marginTop: 18}}>{ev ? 'Încărcări' : 'Alimentări'}</h2>
    {fuel.length === 0 && <p className="mu">Nicio înregistrare. Apasă „+ Adaugă”.</p>}
    {[...fuel].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(x => <div key={x.id} className="card"><div className="row"><b>{ro(x.quantity)} {x.unit}</b><span>{ron(x.total_cost)}</span></div>
      <small className="mu">{dt(x.date)} · {ro(x.odometer)} km {x.station ? '· ' + x.station : ''} {x.full_tank ? '· complet' : ''}</small>
      <div className="row" style={{marginTop: 6}}>{x.receipt_url ? <button className="g" onClick={() => openFile(x.receipt_url)}>📎 Bon</button> : <span/>}<span style={{display: 'flex', gap: 6}}><button className="g sm" onClick={() => onEdit({kind: 'fuel', row: x})}>✎ Editează</button><button className="g sm" onClick={() => delF(x.id)}>Șterge</button></span></div></div>)}
  <h2 style={{marginTop: 18}}>Alte cheltuieli</h2>
    {!D.expOk && <p className="mu">Funcția nu e activată încă. Rulează fișierul supabase/migration-v7.sql în Supabase (SQL Editor).</p>}
    {D.expOk && exps.length === 0 && <p className="mu">Nicio cheltuială. Apasă „+ Adaugă” și alege Cheltuială.</p>}
    {[...exps].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(x => <div key={x.id} className="card"><div className="row"><b>{x.category}</b><span>{ron(x.amount)}</span></div>
      <small className="mu">{dt(x.date)} {x.note ? '· ' + x.note : ''}</small>
      <div className="row" style={{marginTop: 6}}><span/><span style={{display: 'flex', gap: 6}}><button className="g sm" onClick={() => onEdit({kind: 'expense', row: x})}>✎ Editează</button><button className="g sm" onClick={() => delE(x.id)}>Șterge</button></span></div></div>)}
  </>
}
