import {useState} from 'react'
import {supabase as sb} from '../lib/supabase'
import {ro, ron, dt, daysTo} from '../lib/util'

const TABLES = ['vehicles', 'vehicle_parts', 'maintenance_logs', 'fuel_logs', 'documents', 'prices']

function ics(docs, car) {
  const e = d => d.replaceAll('-', '')
  const ev = docs.map(d => `BEGIN:VEVENT\r\nUID:${d.id}@garaj3d\r\nDTSTAMP:${e(new Date().toISOString().slice(0, 10))}T000000Z\r\nDTSTART;VALUE=DATE:${e(d.expires_on)}\r\nSUMMARY:${d.type} expiră – ${car.brand} ${car.model || ''}\r\nBEGIN:VALARM\r\nTRIGGER:-P14D\r\nACTION:DISPLAY\r\nDESCRIPTION:${d.type} expiră în 14 zile\r\nEND:VALARM\r\nEND:VEVENT`).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Garaj3D//RO\r\n${ev}\r\nEND:VCALENDAR`], {type: 'text/calendar'}))
  a.download = 'acte-auto.ics'; a.click()
}

export default function Acte({D, car, reload}) {
  const [rep, setRep] = useState(false), [msg, setMsg] = useState('')
  const docs = D.docs.filter(d => d.vehicle_id === car.id).sort((a, b) => a.expires_on.localeCompare(b.expires_on))
  const logs = D.logs.filter(l => l.vehicle_id === car.id).sort((a, b) => a.date.localeCompare(b.date))
  const cost = logs.reduce((s, l) => s + Number(l.part_cost) + Number(l.labor_cost), 0)
  const del = async id => { if (confirm('Ștergi actul?')) { await sb.from('documents').delete().eq('id', id); reload(car.id) } }
  const backup = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({v: 2, at: new Date().toISOString(), data: D.raw}, null, 1)], {type: 'application/json'}))
    a.download = `garaj3d-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  const restore = async e => {
    try {
      const j = JSON.parse(await e.target.files[0].text()); setMsg('Se restaurează…')
      for (const t of TABLES) { const rows = (j.data[t] || []).map(({user_id, ...r}) => r); if (rows.length) { const {error} = await sb.from(t).upsert(rows); if (error) throw error } }
      setMsg('Restaurat.'); reload(car.id)
    } catch (x) { setMsg('Eroare: ' + x.message) }
  }
  if (rep) return <>
    <div className="row noprint"><button className="g" onClick={() => setRep(false)}>← Înapoi</button><button onClick={() => window.print()}>Salvează PDF / Printează</button></div>
    <h2>Raport Vânzare Auto</h2>
    <div className="card"><b>{car.brand} {car.model}</b> {car.year}<br/>{car.powertrain} · {car.body} · {ro(car.odometer)} km{car.vin ? <><br/>VIN {car.vin}</> : null}</div>
    <div className="card"><b>Acte</b>{docs.length ? docs.map(d => <div key={d.id} className="row"><span>{d.type}</span><span>până la {dt(d.expires_on)}</span></div>) : <p className="mu">—</p>}</div>
    <div className="card"><b>Istoric service</b> · total {ron(cost)}{logs.map(l => <div key={l.id} className="row" style={{padding: '6px 0', borderBottom: '1px solid #8882'}}><span>{dt(l.date)} · {l.part_name}<br/><small className="mu">{ro(l.odometer)} km {l.brand_oem || ''}</small></span><span>{ron(Number(l.part_cost) + Number(l.labor_cost))}</span></div>)}</div></>
  return <>
    <h2>Acte</h2>
    {docs.length === 0 && <div className="card"><p className="mu">Adaugă ITP, RCA, CASCO sau Rovinietă cu butonul „+ Adaugă”.</p></div>}
    {docs.map(d => { const n = daysTo(d.expires_on), col = n > 60 ? '#10b981' : n > 14 ? '#f59e0b' : '#ef4444'
      return <div key={d.id} className="card"><div className="row"><b>{d.type}</b><span className="bd" style={{background: col}}>{n < 0 ? 'Expirat' : n + ' zile'}</span></div>
        <small className="mu">Expiră {dt(d.expires_on)} {d.policy_number ? '· Poliță ' + d.policy_number : ''}</small>
        <div style={{marginTop: 6}}><button className="g" onClick={() => del(d.id)}>Șterge</button></div></div> })}
    <div className="grid" style={{margin: '10px 0'}}><button className="g" disabled={!docs.length} onClick={() => ics(docs, car)}>📅 Export calendar</button><button onClick={() => setRep(true)}>📄 Raport vânzare</button></div>
    <div className="card"><b>Setări și backup</b><div className="grid" style={{marginTop: 8}}><button className="g" onClick={backup}>Exportă JSON</button><button className="g" onClick={() => document.getElementById('rf').click()}>Importă JSON</button></div>
      <input id="rf" type="file" accept=".json" hidden onChange={restore}/>{msg && <p className="mu">{msg}</p>}
      <button className="g w" style={{marginTop: 8}} onClick={() => sb.auth.signOut()}>Deconectare</button></div>
  </>
}
