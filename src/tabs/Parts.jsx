import {useMemo, useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {openFile} from '../lib/media'
import {wear, ro, ron, dt, STIL_N} from '../lib/util'
import {CATS} from '../data'

export default function Parts({D, car, reload}) {
  const [cat, setCat] = useState('Toate')
  const parts = useMemo(() => D.parts.filter(p => p.vehicle_id === car.id).map(p => ({...p, ...wear(p, car)})).sort((a, b) => a.pct - b.pct), [D, car])
  const cats = ['Toate', ...CATS.filter(c => parts.some(p => p.category === c))]
  const logs = D.logs.filter(l => l.vehicle_id === car.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15)
  const setStyle = async v => { await sb.from('vehicles').update({style: v}).eq('id', car.id); reload(car.id) }
  const delLog = async id => { if (confirm('Ștergi înregistrarea?')) { await sb.from('maintenance_logs').delete().eq('id', id); reload(car.id) } }
  return <>
    <h2>Piese & AI</h2>
    <div className="card"><div className="row"><b>Stil de Condus</b><small>{STIL_N[car.style ?? 1]}</small></div>
      <input type="range" min="0" max="2" value={car.style ?? 1} onChange={e => setStyle(+e.target.value)}/>
      <small className="mu">Estimarea ține cont de km, de vârsta piesei și de ~{ro(car.monthly_km)} km/lună.</small></div>
    <div className="chips">{cats.map(c => <button key={c} className={c === cat ? 'on' : 'g'} onClick={() => setCat(c)}>{c}</button>)}</div>
    <AnimatePresence mode="popLayout">{parts.filter(p => cat === 'Toate' || p.category === cat).map((p, i) =>
      <motion.div layout key={p.id} className="card" initial={{opacity: 0, y: 18}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{delay: i * .05, type: 'spring', stiffness: 260, damping: 26}} whileTap={{scale: .98}}>
        <div className="row"><b>{p.name}</b><span className="bd" style={{background: p.col}}>{Math.round(p.pct * 100)}%</span></div>
        <small className="mu">{p.category} · ultima: {dt(p.last_date)} la {ro(p.last_odo)} km</small>
        <div className="bar"><motion.i initial={{width: 0}} animate={{width: `${p.pct * 100}%`}} transition={{duration: 1, ease: 'easeOut'}} style={{background: p.col}}/></div>
        <small>Estimat: ~{ro(Math.round(p.rem))} km · ~{p.luni > 99 ? '99+' : ro(p.luni)} luni</small></motion.div>)}</AnimatePresence>
    <h2 style={{marginTop: 22}}>Istoric service</h2>
    {logs.length === 0 && <p className="mu">Nicio înregistrare încă. Apasă „+ Adaugă”.</p>}
    {logs.map(l => <div key={l.id} className="card"><div className="row"><b>{l.part_name}</b><small>{ron(Number(l.part_cost) + Number(l.labor_cost))}</small></div>
      <small className="mu">{dt(l.date)} · {ro(l.odometer)} km {l.brand_oem ? '· ' + l.brand_oem : ''}</small>{l.notes && <div><small>{l.notes}</small></div>}
      <div className="row" style={{marginTop: 6}}>{l.receipt_url ? <button className="g" onClick={() => openFile(l.receipt_url)}>📎 Bon</button> : <span/>}<button className="g" onClick={() => delLog(l.id)}>Șterge</button></div></div>)}
  </>
}
