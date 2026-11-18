import {useEffect, useState} from 'react'
import {supabase as sb} from '../lib/supabase'
import {ro, ron, dt, daysTo, wear} from '../lib/util'
import YearReview from '../components/YearReview'
import {buildReport} from '../lib/report'
import {useUrl} from '../lib/media'
import {exportCsv, templateCsv, parseCsv, mapFuel} from '../lib/csv'

const TABLES = ['vehicles', 'vehicle_parts', 'maintenance_logs', 'fuel_logs', 'documents', 'prices', 'expenses']

function ics(docs, car, parts) {
  const e = d => d.replaceAll('-', ''), ev = []
  docs.forEach(d => ev.push({id: d.id, date: d.expires_on, t: `${d.type} expiră – ${car.brand} ${car.model || ''}`}))
  parts.forEach(p => { const w = wear(p, car); if (w.pct < .6 && isFinite(w.luni)) ev.push({id: p.id, date: new Date(Date.now() + Math.min(w.luni, 120) * 30.4 * 864e5).toISOString().slice(0, 10), t: `Service estimat: ${p.name} – ${car.brand} ${car.model || ''}`}) })
  const body = ev.map(x => `BEGIN:VEVENT\r\nUID:${x.id}@garaj3d\r\nDTSTAMP:${e(new Date().toISOString().slice(0, 10))}T000000Z\r\nDTSTART;VALUE=DATE:${e(x.date)}\r\nSUMMARY:${x.t}\r\nBEGIN:VALARM\r\nTRIGGER:-P14D\r\nACTION:DISPLAY\r\nDESCRIPTION:${x.t}\r\nEND:VALARM\r\nEND:VEVENT`).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Garaj3D//RO\r\n${body}\r\nEND:VCALENDAR`], {type: 'text/calendar'}))
  a.download = 'garaj3d-memento.ics'; a.click()
}

export default function Acte({D, car, reload, onEdit}) {
  const [rep, setRep] = useState(false), [msg, setMsg] = useState(''), [yr, setYr] = useState(false)
  const docs = D.docs.filter(d => d.vehicle_id === car.id).sort((a, b) => a.expires_on.localeCompare(b.expires_on))
  const logs = D.logs.filter(l => l.vehicle_id === car.id).sort((a, b) => a.date.localeCompare(b.date))
  const cost = logs.reduce((s, l) => s + Number(l.part_cost) + Number(l.labor_cost), 0)
  const photoUrl = useUrl(car.image_url), [pdf, setPdf] = useState(null)
  useEffect(() => {
    if (!rep) { setPdf(null); return }
    let ok = true; setPdf(null)
    buildReport({car, docs, logs, parts: D.parts.filter(p => p.vehicle_id === car.id), photoUrl}).then(b => ok && setPdf(b)).catch(() => ok && setPdf(false))
    return () => { ok = false }
  }, [rep, car.id, photoUrl])
  const savePdf = async () => {
    const name = `raport-${(car.brand + '-' + (car.model || '')).toLowerCase().replace(/\W+/g, '-')}.pdf`, file = new File([pdf], name, {type: 'application/pdf'})
    try { if (navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: 'Raport vânzare auto'}); return } } catch (e) { if (e && e.name === 'AbortError') return }
    const a = document.createElement('a'); a.href = URL.createObjectURL(pdf); a.download = name; document.body.appendChild(a); a.click(); a.remove()
  }
  const del = async id => { if (confirm('Ștergi actul?')) { await sb.from('documents').delete().eq('id', id); reload(car.id) } }
  const importCsv = async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return
    try {
      const rows = mapFuel(parseCsv(await file.text()), car)
      if (!rows.length) throw new Error('nu am găsit alimentări valide (verifică antetul: data, km, cantitate…)')
      if (!confirm(`Import ${rows.length} alimentări în ${car.brand} ${car.model || ''}?`)) return
      for (let i = 0; i < rows.length; i += 200) { const {error} = await sb.from('fuel_logs').insert(rows.slice(i, i + 200).map(r => ({...r, vehicle_id: car.id}))); if (error) throw error }
      const mx = Math.max(car.odometer, ...rows.map(r => r.odometer || 0)); if (mx > car.odometer) await sb.from('vehicles').update({odometer: mx}).eq('id', car.id)
      setMsg(`Importate ${rows.length} alimentări.`); reload(car.id)
    } catch (x) { setMsg('Import eșuat: ' + x.message) }
  }
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
    <div className="row noprint"><button className="g" onClick={() => setRep(false)}>← Înapoi</button><button disabled={!pdf} onClick={savePdf}>{pdf === null ? 'Se pregătește…' : pdf === false ? 'Eroare PDF' : '📄 Salvează / trimite PDF'}</button></div>
    {pdf && <p className="mu noprint" style={{margin: '4px 0'}}>PDF gata. Pe iPhone alegi „Salvează în Fișiere”, WhatsApp, Mail sau AirDrop.</p>}
    <h2>Raport Vânzare Auto</h2>
    <div className="card"><b>{car.brand} {car.model}</b> {car.year}<br/>{car.powertrain} · {car.body} · {ro(car.odometer)} km{car.vin ? <><br/>VIN {car.vin}</> : null}</div>
    <div className="card"><b>Acte</b>{docs.length ? docs.map(d => <div key={d.id} className="row"><span>{d.type}</span><span>până la {dt(d.expires_on)}</span></div>) : <p className="mu">—</p>}</div>
    <div className="card"><b>Istoric service</b> · total {ron(cost)}{logs.map(l => <div key={l.id} className="row" style={{padding: '6px 0', borderBottom: '1px solid #8882'}}><span>{dt(l.date)} · {l.part_name}<br/><small className="mu">{ro(l.odometer)} km {l.brand_oem || ''}</small></span><span>{ron(Number(l.part_cost) + Number(l.labor_cost))}</span></div>)}</div></>
  return <>
    
    {docs.length === 0 && <div className="card"><p className="mu">Adaugă ITP, RCA, CASCO sau Rovinietă cu butonul „+ Adaugă”.</p></div>}
    {docs.map(d => { const n = daysTo(d.expires_on), col = n > 60 ? '#10b981' : n > 14 ? '#f59e0b' : '#ef4444'
      return <div key={d.id} className="card"><div className="row"><b>{d.type}</b><span className="bd" style={{background: col}}>{n < 0 ? 'Expirat' : n + ' zile'}</span></div>
        <small className="mu">Expiră {dt(d.expires_on)} {d.policy_number ? '· Poliță ' + d.policy_number : ''}</small>
        <div className="row" style={{marginTop: 6}}><button className="g sm" onClick={() => onEdit({kind: 'doc', row: d})}>✎ Editează</button><button className="g sm" onClick={() => del(d.id)}>Șterge</button></div></div> })}
    <div className="grid" style={{margin: '10px 0'}}><button className="g" onClick={() => ics(docs, car, D.parts.filter(p => p.vehicle_id === car.id))}>📅 Calendar (acte + service)</button><button onClick={() => setRep(true)}>📄 Raport vânzare</button></div>
    <button className="w g" style={{marginBottom: 10}} onClick={() => setYr(true)}>🎉 Anul tău în cifre</button>
    <div className="card"><b>📊 Excel (CSV)</b><p className="mu" style={{margin: '6px 0'}}>Exportă istoricul mașinii sau importă alimentări din alte aplicații (Fuelio, Drivvo, Simply Auto) ori din Excel. Importul recunoaște coloane precum data, km, cantitate, preț, total.</p>
      <div className="grid"><button className="g" onClick={() => exportCsv(D, car)}>Exportă CSV</button><button className="g" onClick={() => document.getElementById('cf').click()}>Importă alimentări</button></div>
      <button className="g sm" style={{marginTop: 8}} onClick={templateCsv}>Descarcă modelul CSV</button>
      <input id="cf" type="file" accept=".csv,text/csv,text/plain" hidden onChange={importCsv}/>{msg && <p className="mu">{msg}</p>}</div>
    <div className="card"><b>Setări și backup</b><div className="grid" style={{marginTop: 8}}><button className="g" onClick={backup}>Exportă JSON</button><button className="g" onClick={() => document.getElementById('rf').click()}>Importă JSON</button></div>
      <input id="rf" type="file" accept=".json" hidden onChange={restore}/>{msg && <p className="mu">{msg}</p>}
      <button className="g w" style={{marginTop: 8}} onClick={() => sb.auth.signOut()}>Deconectare</button></div>
  {yr && <YearReview D={D} car={car} onClose={() => setYr(false)}/>}
  </>
}
