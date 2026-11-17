import {useMemo, useState} from 'react'
import {motion} from 'framer-motion'
import Car3D from '../components/Car3D'
import CarForm from '../components/CarForm'
import {useUrl} from '../lib/media'
import {wear, ro} from '../lib/util'
import {posFor} from '../data'

function Gauge({p, col}) {
  const r = 34, C = 2 * Math.PI * r
  return <svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r={r} fill="none" stroke="#8884" strokeWidth="8"/>
    <motion.circle cx="42" cy="42" r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} initial={{strokeDashoffset: C}} animate={{strokeDashoffset: C * (1 - p)}} transition={{duration: 1.2, ease: 'easeOut'}} transform="rotate(-90 42 42)"/>
    <text x="42" y="47" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">{Math.round(p * 100)}%</text></svg>
}

export default function Garage({D, car, setCar, reload}) {
  const [xr, setXr] = useState(0), [pick, setPick] = useState(null), [form, setForm] = useState(null)
  const parts = useMemo(() => car ? D.parts.filter(p => p.vehicle_id === car.id).map(p => ({...p, ...wear(p, car), pos: posFor(car.body, p.hot)})) : [], [D, car])
  const img = useUrl(car?.image_url)
  const avg = parts.length ? parts.reduce((a, p) => a + p.pct, 0) / parts.length : 0
  return <>
    <h2>Garaj 3D</h2>
    {D.cars.length > 0 && <select value={car?.id} onChange={e => { setCar(e.target.value); setPick(null) }}>{D.cars.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.powertrain} · {c.body}</option>)}</select>}
    <div className="grid" style={{margin: '6px 0'}}><button className="g" onClick={() => setForm('new')}>＋ Mașină nouă</button>{car && <button className="g" onClick={() => setForm('edit')}>✎ Editează</button>}</div>
    {car ? <>
      <div className="card cv" style={{marginTop: 10}}><Car3D car={car} parts={parts} xray={xr / 100} focus={pick?.pos} onPick={setPick}/></div>
      <div className="card"><div className="row"><span>Caroserie Transparentă</span><small>{xr}%</small></div><input type="range" min="0" max="100" value={xr} onChange={e => setXr(+e.target.value)}/></div>
      <p className="mu">{pick ? <><b style={{color: pick.col}}>{pick.name}</b> · {Math.round(pick.pct * 100)}% · ~{ro(Math.round(pick.rem))} km · ~{pick.luni > 99 ? '99+' : ro(pick.luni)} luni</> : 'Atinge un punct pulsatoriu pentru focalizare.'}</p>
      <div className="grid"><div className="card"><Gauge p={avg} col={avg > .4 ? '#10b981' : avg > .15 ? '#f59e0b' : '#ef4444'}/><br/><small className="mu">Sănătate generală</small></div>
        <div className="card"><div className="big">{ro(car.odometer)}</div><small className="mu">km · {car.powertrain}</small><br/><small className="mu">{car.year || ''} {car.body}</small></div></div>
      {img && <img src={img} alt="" style={{width: '100%', borderRadius: 20, marginTop: 10, maxHeight: 220, objectFit: 'cover'}}/>}
    </> : <div className="card"><p className="mu">Garajul e gol. Adaugă prima mașină.</p></div>}
    {form && <CarForm car={form === 'edit' ? car : null} onClose={() => setForm(null)} onSaved={async id => { setForm(null); await reload(id) }}/>}
  </>
}
