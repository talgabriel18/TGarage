import {useState} from 'react'
import {supabase as sb} from '../lib/supabase'
import {openFile} from '../lib/media'
import {ro, ron, dt} from '../lib/util'
import {priceKeys, BRANDS, EVP} from '../data'

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

export default function Consum({D, car, reload}) {
  const ev = car.powertrain === 'Electric', [tot, setTot] = useState(false)
  const units = ev ? ['kWh'] : car.powertrain === 'PHEV' ? ['L', 'kWh'] : ['L']
  const fuel = D.fuel.filter(x => x.vehicle_id === car.id), logs = D.logs.filter(x => x.vehicle_id === car.id)
  const months = {}; fuel.forEach(x => { const k = x.date.slice(0, 7); months[k] = (months[k] || 0) + Number(x.total_cost) })
  const ms = Object.entries(months).sort().slice(-6), mx = Math.max(1, ...ms.map(m => m[1]))
  const save = async (key, v) => { if (!(+v > 0)) return; await sb.from('prices').upsert({user_id: D.uid, key, price: +v, updated_at: new Date().toISOString()}, {onConflict: 'user_id,key'}); reload(car.id) }
  const old = k => D.pdates[k] && (Date.now() - new Date(D.pdates[k])) / 864e5 > 14
  const delF = async id => { if (confirm('Ștergi înregistrarea?')) { await sb.from('fuel_logs').delete().eq('id', id); reload(car.id) } }
  return <>
    <h2>Consum</h2>
    {units.map(u => { const s = stats(fuel, logs, u); return <div key={u} className="grid" style={{marginBottom: 10}}>
      <div className="card"><div className="big">{s ? ro(s.per100) : '—'}</div><small className="mu">{u}/100 km</small></div>
      <div className="card"><div className="big">{s ? (tot ? s.totKm : s.fuelKm).toFixed(2).replace('.', ',') : '—'}</div><small className="mu">RON/km</small></div></div> })}
    <div className="chips"><button className={tot ? 'g' : 'on'} onClick={() => setTot(false)}>Doar combustibil</button><button className={tot ? 'on' : 'g'} onClick={() => setTot(true)}>Total (cu service)</button></div>
    <small className="mu">Calculul folosește înregistrările cu plin/încărcare completă (minim două).</small>
    <div className="card"><b>Cost lunar</b>{ms.length === 0 ? <p className="mu">Fără date încă.</p> : <div style={{display: 'flex', alignItems: 'end', gap: 8, height: 110, marginTop: 8}}>
      {ms.map(([k, v]) => <div key={k} style={{flex: 1, textAlign: 'center'}}><div style={{height: Math.max(4, v / mx * 80), background: 'var(--ac)', borderRadius: 8}}/><small>{Math.round(v)}</small><br/><small className="mu">{k.slice(5)}</small></div>)}</div>}</div>
    <div className="card"><b>Prețuri la Zi (RON)</b>
      {priceKeys(car.powertrain).map(k => <div key={k} className="row"><span>{k}<br/><small className="mu">{D.pdates[k] ? (old(k) ? '⚠ vechi: ' : 'actualizat ') + dt(D.pdates[k]) : 'valoare implicită'}</small></span>
        <input style={{width: 100}} type="number" step="0.01" defaultValue={D.prices[k]} key={D.prices[k]} onBlur={e => save(k, e.target.value)}/></div>)}</div>
    {ev ? <div className="card"><b>⚡ Tarife încărcare (orientative)</b><br/><small className="mu">Apasă un rând ca să-l setezi ca preț kWh.</small>
      {EVP.map(([n, p]) => <div key={n} className="row" style={{padding: '8px 0', borderBottom: '1px solid #8882'}} onClick={() => save('kWh', p)}><span>{n}</span><span className="bd" style={{background: D.prices.kWh === p ? 'var(--ok)' : '#8886'}}>{p.toFixed(2)}</span></div>)}
      <a className="btn g w" style={{marginTop: 10}} href={map('stație încărcare mașini electrice')} target="_blank" rel="noreferrer">📍 Cea mai apropiată stație de încărcare</a></div>
      : <div className="card"><b>⛽ Cea mai apropiată benzinărie</b><div className="chips" style={{flexWrap: 'wrap'}}>{BRANDS.map(b => <a key={b} className="btn g" href={map(`${b} benzinărie`)} target="_blank" rel="noreferrer">{b}</a>)}</div></div>}
    <h2 style={{marginTop: 18}}>{ev ? 'Încărcări' : 'Alimentări'}</h2>
    {fuel.length === 0 && <p className="mu">Nicio înregistrare. Apasă „+ Adaugă”.</p>}
    {[...fuel].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(x => <div key={x.id} className="card"><div className="row"><b>{ro(x.quantity)} {x.unit}</b><span>{ron(x.total_cost)}</span></div>
      <small className="mu">{dt(x.date)} · {ro(x.odometer)} km {x.station ? '· ' + x.station : ''} {x.full_tank ? '· complet' : ''}</small>
      <div className="row" style={{marginTop: 6}}>{x.receipt_url ? <button className="g" onClick={() => openFile(x.receipt_url)}>📎 Bon</button> : <span/>}<button className="g" onClick={() => delF(x.id)}>Șterge</button></div></div>)}
  </>
}
