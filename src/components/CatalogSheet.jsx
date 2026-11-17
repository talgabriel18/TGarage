import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {forType, norm} from '../catalog'
import {CATS} from '../data'
import {ro, durata, today} from '../lib/util'

export default function CatalogSheet({car, parts, onClose, onSaved}) {
  const have = new Set(parts.map(p => p.name.toLowerCase())), [q, setQ] = useState(''), [sel, setSel] = useState({}), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const w = norm(q).split(/\s+/).filter(Boolean)
  const items = forType(car.powertrain).filter(c => !have.has(c.name.toLowerCase()) && w.every(x => norm(c.name).includes(x)))
  const n = Object.keys(sel).length
  const save = async () => {
    setBusy(true)
    const rows = items.concat(forType(car.powertrain)).filter((c, i, a) => sel[c.name] && a.findIndex(x => x.name === c.name) === i)
      .map(c => ({vehicle_id: car.id, name: c.name, category: c.category, hot: c.hot, life_km: c.life_km, life_months: c.life_months, last_odo: car.odometer, last_date: today()}))
    const {error} = await sb.from('vehicle_parts').insert(rows)
    if (error) { setErr(error.message); setBusy(false) } else onSaved()
  }
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>Catalog de piese</h2><button className="g" onClick={onClose}>✕</button></div>
      <input placeholder="🔎 Caută (ex. bujii, amortizor, cardan)" value={q} onChange={e => setQ(e.target.value)}/>
      <small className="mu">Piesele noi pornesc de la data de azi. Cu ✎ poți seta ultima înlocuire reală.</small>
      {items.length === 0 && <p className="mu">Nicio piesă disponibilă (sau toate sunt deja urmărite).</p>}
      {CATS.map(cat => { const L = items.filter(c => c.category === cat); return L.length > 0 && <div key={cat} style={{marginTop: 10}}><b>{cat}</b>
        {L.map(c => <label key={c.name} className="row" style={{padding: '8px 0', borderBottom: '1px solid var(--bd)'}}><span>{c.name}<br/><small className="mu">{ro(c.life_km)} km · {durata(c.life_months)}</small></span>
          <input type="checkbox" style={{width: 26}} checked={!!sel[c.name]} onChange={e => setSel(s => { const x = {...s}; if (e.target.checked) x[c.name] = 1; else delete x[c.name]; return x })}/></label>)}</div> })}
      {err && <p style={{color: 'var(--ur)'}}>{err}</p>}
      <button className="w" style={{marginTop: 12, position: 'sticky', bottom: 0}} disabled={!n || busy} onClick={save}>{n ? `Adaugă ${n} ${n === 1 ? 'piesă' : 'piese'}` : 'Alege piese'}</button>
    </motion.div></>
}
