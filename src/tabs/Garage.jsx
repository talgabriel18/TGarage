import {lazy, Suspense, useMemo, useState} from 'react'
import {motion} from 'framer-motion'
const Car3D = lazy(() => import('../components/Car3D'))
import CarForm from '../components/CarForm'
import {useUrl} from '../lib/media'
import {wear, ro, durata, daysTo} from '../lib/util'
import {Num} from '../components/YearReview'
import {supabase as sb} from '../lib/supabase'
import {hotFor} from '../catalog'
import {posFor, sitesOf} from '../data'
import {APP} from '../brand'

function Gauge({p, col}) {
  const r = 34, C = 2 * Math.PI * r
  return <svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r={r} fill="none" stroke="#8884" strokeWidth="8"/>
    <motion.circle cx="42" cy="42" r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} initial={{strokeDashoffset: C}} animate={{strokeDashoffset: C * (1 - p)}} transition={{duration: 1.2, ease: 'easeOut'}} transform="rotate(-90 42 42)"/>
    <text x="42" y="47" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">{Math.round(p * 100)}%</text></svg>
}

export default function Garage({D, car, setCar, reload, stage, onService}) {
  const [xr, setXr] = useState(0), [pick, setPick] = useState(null), [site, setSite] = useState(null), [form, setForm] = useState(null)
  const [cm, setCm] = useState(() => { try { return localStorage.getItem('tgarage.cm') || 'zona' } catch { return 'zona' } })
  const setCM = v => { setCm(v); try { localStorage.setItem('tgarage.cm', v) } catch {} }
  const parts = useMemo(() => car ? D.parts.filter(p => p.vehicle_id === car.id).map(p => { const hot = p.hot && p.hot !== 'caroserie' ? p.hot : hotFor(p.name, p.category); return {...p, hot, ...wear(p, car), pos: posFor(car.body, hot)} }) : [], [D, car])
  const sites = useMemo(() => sitesOf(parts, car?.body), [parts, car?.body])
  const view = useMemo(() => sites.map(s => ({sid: s.id, pos: s.pos, count: s.parts.length, ring: s.col, col: cm === 'zona' ? s.zoneColor : s.col, site: s})), [sites, cm])
  const clear = () => { setSite(null); setPick(null) }
  const onSite = sp => { const st = sp.site; setSite(st); setPick([...st.parts].sort((a, b) => a.pct - b.pct)[0]) }
  const img = useUrl(car?.image_url)
  const avg = parts.length ? parts.reduce((a, p) => a + p.pct, 0) / parts.length : 0
  const urgent = [...parts].sort((a, b) => a.pct - b.pct).filter(p => p.pct < .25).slice(0, 3)
  const soon = D.docs.filter(d => d.vehicle_id === car?.id && daysTo(d.expires_on) <= 30)
  const rd = parts.length === 0 ? ['Adaugă piese în tab-ul Piese', '🔧'] : urgent.some(p => p.pct < .1) ? ['Necesită service', '🚨'] : avg > .6 && urgent.length === 0 ? ['Gata de drum', '✅'] : ['Verifică piesele', '⚠️']
  return <>
    
    {D.cars.length > 0 && <select value={car?.id} onChange={e => { setCar(e.target.value); clear() }}>{D.cars.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.powertrain} · {c.body}</option>)}</select>}
    <div className="grid" style={{margin: '6px 0'}}><button className="g" onClick={() => setForm('new')}>＋ Mașină nouă</button>{car && <button className="g" onClick={() => setForm('edit')}>✎ Editează</button>}</div>
    {car ? <>
      <div className="card cv" style={{marginTop: 10, position: 'relative'}}><Suspense fallback={<div className="shimmer"/>}><Car3D car={car} parts={view} xray={xr / 100} focus={site ? site.pos : null} onPick={onSite} onMiss={clear} stage={stage}/></Suspense>
        {site && site.parts.length > 1 && <div className="picker"><div className="row" style={{marginBottom: 8}}><b>{site.name} · {site.parts.length} piese</b><button className="g sm" onClick={clear}>✕</button></div>
          <div className="pk">{[...site.parts].sort((a, b) => a.pct - b.pct).map(p => <button key={p.id} className={pick && pick.id === p.id ? 'sm' : 'g sm'} onClick={() => setPick(p)}><b style={{color: p.col}}>●</b> {p.name} {Math.round(p.pct * 100)}%</button>)}</div></div>}</div>
      <p key={pick ? pick.name : 'none'} className={pick ? 'mu pulse' : 'mu'}>{pick ? <><b style={{color: pick.col}}>{pick.name}</b> · {Math.round(pick.pct * 100)}% · ~{ro(Math.round(pick.rem))} km · ~{durata(pick.luni)}</> : 'Atinge un punct pulsatoriu pentru focalizare.'}</p>
      {pick && <button className="g sm" style={{marginBottom: 8}} onClick={() => onService(pick.id)}>✔ Am înlocuit-o</button>}
      <div className="card"><div className="row"><span>Caroserie Transparentă</span><small>{xr}%</small></div><input type="range" min="0" max="100" value={xr} onChange={e => setXr(+e.target.value)}/></div>
      <div className="card" style={{padding: 12}}>
        <div className="row"><small className="mu">Culori puncte</small><span style={{display: 'flex', gap: 6}}>{[['zona', 'Zone'], ['stare', 'Stare']].map(([k, l]) => <button key={k} className={cm === k ? 'sm' : 'g sm'} onClick={() => setCM(k)}>{l}</button>)}</span></div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8}}>{(cm === 'zona' ? [...new Map(sites.map(s => [s.zoneName, s.zoneColor])).entries()] : [['Bună', '#10b981'], ['Atenție', '#f59e0b'], ['Urgent', '#ef4444']]).map(([n, c]) => <small key={n} className="mu"><b style={{color: c}}>●</b> {n}</small>)}</div>
        {cm === 'zona' && <small className="mu" style={{display: 'block', marginTop: 6}}>Culoarea centrală arată zona, iar inelul care pulsează arată starea piesei.</small>}</div>
      
      <div className="grid"><div className="card"><Gauge p={avg} col={avg > .4 ? '#10b981' : avg > .15 ? '#f59e0b' : '#ef4444'}/><br/><small className="mu">Sănătate generală</small><div style={{fontWeight: 700, marginTop: 2}}>{rd[1]} {rd[0]}</div></div>
        <div className="card"><div className="big"><Num v={car.odometer}/></div><small className="mu">km · {car.powertrain}</small><br/><small className="mu">{car.year || ''} {car.body}</small><br/><button className="g sm" style={{marginTop: 6}} onClick={async () => { const v = prompt('Km actuali:', car.odometer); if (v && +v > 0) { await sb.from('vehicles').update({odometer: +v}).eq('id', car.id); reload(car.id) } }}>✎ Km</button></div></div>
      {(urgent.length > 0 || soon.length > 0) && <div className="card"><b>⚠️ De rezolvat curând</b>{urgent.map(p => <div key={p.id} className="row" style={{marginTop: 6}}><span>{p.name}</span><span className="bd" style={{background: p.col}}>{Math.round(p.pct * 100)}%</span></div>)}{soon.map(d => <div key={d.id} className="row" style={{marginTop: 6}}><span>{d.type}</span><span className="bd" style={{background: '#f59e0b'}}>{daysTo(d.expires_on) < 0 ? 'Expirat' : daysTo(d.expires_on) + ' zile'}</span></div>)}</div>}
      {img && <img src={img} alt="" style={{width: '100%', borderRadius: 20, marginTop: 10, maxHeight: 220, objectFit: 'cover'}}/>}
    </> : <div className="card" style={{textAlign: 'center'}}><div style={{fontSize: 56}}>🚘</div><h2>Bun venit în {APP}</h2><p className="mu">Adaugă prima ta mașină. Începe să scrii marca și restul se completează singur.</p><button className="w" onClick={() => setForm('new')}>＋ Adaugă mașina ta</button></div>}
    {form && <CarForm car={form === 'edit' ? car : null} onClose={() => setForm(null)} onSaved={async id => { setForm(null); await reload(id) }}/>}
  </>
}
