import {lazy, Suspense, useMemo, useState} from 'react'
import {motion} from 'framer-motion'
const Car3D = lazy(() => import('../components/Car3D'))
import CarForm from '../components/CarForm'
import {useUrl} from '../lib/media'
import {wear, ro, ron, durata, daysTo, dt, lunaAn} from '../lib/util'
import {Num} from '../components/YearReview'
import {supabase as sb} from '../lib/supabase'
import {hotFor} from '../catalog'
import {posFor, sitesOf, parseLook, stringifyLook} from '../data'
import LookPanel from '../components/LookPanel'
import {APP} from '../brand'

function Gauge({p, col}) {
  const r = 34, C = 2 * Math.PI * r
  return <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`Sănătate generală ${Math.round(p * 100)}%`}><circle cx="42" cy="42" r={r} fill="none" stroke="#8884" strokeWidth="8"/>
    <motion.circle cx="42" cy="42" r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} initial={{strokeDashoffset: C}} animate={{strokeDashoffset: C * (1 - p)}} transition={{duration: 1.2, ease: 'easeOut'}} transform="rotate(-90 42 42)"/>
    <text x="42" y="47" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">{Math.round(p * 100)}%</text></svg>
}

export default function Garage({D, car, setCar, reload, stage, onService, onQuick}) {
  const [xr, setXr] = useState(0), [pick, setPick] = useState(null), [site, setSite] = useState(null), [form, setForm] = useState(null), [insp, setInsp] = useState(null)
  const [panel, setPanel] = useState(null), [menu, setMenu] = useState(false), [lk, setLk] = useState(null)
  const [cm, setCm] = useState(() => { try { return localStorage.getItem('tgarage.cm') || 'zona' } catch { return 'zona' } })
  const setCM = v => { setCm(v); try { localStorage.setItem('tgarage.cm', v) } catch {} }
  const parts = useMemo(() => car ? D.parts.filter(p => p.vehicle_id === car.id).map(p => { const hot = p.hot && p.hot !== 'caroserie' ? p.hot : hotFor(p.name, p.category); return {...p, hot, ...wear(p, car), pos: posFor(car.body, hot)} }) : [], [D, car])
  const sites = useMemo(() => sitesOf(parts, car?.body), [parts, car?.body])
  const view = useMemo(() => sites.map(s => ({sid: s.id, pos: s.pos, count: s.parts.length, ring: s.col, col: cm === 'zona' ? s.zoneColor : s.col, site: s})), [sites, cm])
  const clear = () => { setSite(null); setPick(null) }
  const look = lk || parseLook(car && car.color)
  const saveLook = async () => { await sb.from('vehicles').update({color: stringifyLook(look)}).eq('id', car.id); setLk(null); setPanel(null); reload(car.id) }
  const cur = insp && insp.i < insp.ids.length ? parts.find(p => p.id === insp.ids[insp.i]) : null
  const checks = useMemo(() => { try { return JSON.parse(localStorage.getItem('tgarage.checks') || '{}') } catch { return {} } }, [insp])
  const focusPart = id => { const p = parts.find(x => x.id === id); if (!p) return; setSite(sites.find(s => s.parts.some(x => x.id === id)) || null); setPick(p) }
  const startInsp = () => { const ids = [...parts].sort((a, b) => a.pct - b.pct).map(p => p.id); if (!ids.length) return; setPanel(null); setInsp({ids, i: 0, res: {}}); focusPart(ids[0]) }
  const step = (res, d = 1) => {
    const id = insp.ids[insp.i], r = res ? {...insp.res, [id]: res} : insp.res, n = insp.i + d
    if (res === 'ok') { try { const c = JSON.parse(localStorage.getItem('tgarage.checks') || '{}'); c[id] = new Date().toISOString().slice(0, 10); localStorage.setItem('tgarage.checks', JSON.stringify(c)) } catch {} }
    if (n < 0) return
    setInsp({...insp, res: r, i: n})
    if (n >= insp.ids.length) clear(); else focusPart(insp.ids[n])
  }
  const replaced = () => { onService(cur.id); step('replaced') }
  const cnt = k => insp ? Object.values(insp.res).filter(v => v === k).length : 0
  const onSite = sp => { const st = sp.site; setSite(st); setPick([...st.parts].sort((a, b) => a.pct - b.pct)[0]) }
  const img = useUrl(car?.image_url)
  const avg = parts.length ? parts.reduce((a, p) => a + p.pct, 0) / parts.length : 0
  const urgent = [...parts].sort((a, b) => a.pct - b.pct).filter(p => p.pct < .25).slice(0, 3)
  const soon = D.docs.filter(d => d.vehicle_id === car?.id && daysTo(d.expires_on) <= 30)
  const rd = parts.length === 0 ? ['Adaugă piese în tab-ul Piese', '🔧'] : urgent.some(p => p.pct < .1) ? ['Necesită service', '🚨'] : avg > .6 && urgent.length === 0 ? ['Gata de drum', '✅'] : ['Verifică piesele', '⚠️']
  const cost = (() => {
    if (!car) return null
    const f = D.fuel.filter(x => x.vehicle_id === car.id), l = D.logs.filter(x => x.vehicle_id === car.id), e = (D.exp || []).filter(x => x.vehicle_id === car.id)
    const t = f.reduce((s, x) => s + Number(x.total_cost), 0) + l.reduce((s, x) => s + Number(x.part_cost) + Number(x.labor_cost), 0) + e.reduce((s, x) => s + Number(x.amount), 0)
    const ds = [...f, ...l, ...e].map(x => x.date).sort()
    return ds.length ? t / Math.max(1, (Date.now() - new Date(ds[0])) / 2.63e9) : null
  })()
  const nextDue = (() => {
    const c = []
    D.docs.filter(d => d.vehicle_id === car?.id).forEach(d => c.push({n: d.type, ts: new Date(d.expires_on).getTime()}))
    parts.forEach(p => { if (p.due) c.push({n: p.name, ts: p.due}) })
    c.sort((a, b) => a.ts - b.ts); return c[0] || null
  })()
  const when = ts => { const d = Math.ceil((ts - Date.now()) / 864e5); return d < 0 ? 'scadent' : d < 60 ? `în ${d} zile` : `în ${durata(Math.round(d / 30.4))}` }
  const ev = car && car.powertrain === 'Electric'
  const tgl = k => setPanel(p => p === k ? null : k)
  return <>
    <div className="row" style={{marginBottom: 12, alignItems: 'stretch'}}>
      {D.cars.length > 0 && <select style={{flex: 1, margin: 0}} aria-label="Alege mașina" value={car?.id} onChange={e => { setCar(e.target.value); clear(); setInsp(null); setLk(null); setPanel(null) }}>{D.cars.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.powertrain}</option>)}</select>}
      <button className="g" aria-label="Meniu mașină" onClick={() => setMenu(true)} style={{minWidth: 48}}>⋯</button>
    </div>
    {car ? <>
      <div className="card cv" style={{position: 'relative'}}><Suspense fallback={<div className="shimmer"/>}><Car3D car={car} look={look} parts={view} xray={xr / 100} focus={site ? site.pos : null} onPick={onSite} onMiss={clear} stage={stage}/></Suspense>
        {site && site.parts.length > 1 && !insp && <div className="picker"><div className="row" style={{marginBottom: 8}}><b>{site.name} · {site.parts.length} piese</b><button className="g sm" aria-label="Închide" onClick={clear}>✕</button></div>
          <div className="pk">{[...site.parts].sort((a, b) => a.pct - b.pct).map(p => <button key={p.id} className={pick && pick.id === p.id ? 'sm' : 'g sm'} onClick={() => setPick(p)}><b style={{color: p.col}}>●</b> {p.name} {Math.round(p.pct * 100)}%</button>)}</div></div>}</div>
      {!insp && <>
        <p key={pick ? pick.name : 'none'} className={pick ? 'mu pulse' : 'mu'} style={{margin: '0 0 8px'}}>{pick ? <><b style={{color: pick.col}}>{pick.name}</b> · {Math.round(pick.pct * 100)}% · ~{ro(Math.round(pick.rem))} km · ~{durata(pick.luni)}</> : 'Atinge un punct pulsatoriu pentru focalizare.'}</p>
        {pick && <button className="g sm" style={{marginBottom: 10}} onClick={() => onService(pick.id)}>✔ Am înlocuit-o</button>}
        <div className="grid3" role="group" aria-label="Aspect">{[['look', '🎨 Culori'], ['xray', '🫥 Transparență'], ['dots', '● Puncte']].map(([k, l]) => <button key={k} className={panel === k ? 'sm' : 'g sm'} aria-pressed={panel === k} onClick={() => tgl(k)}>{l}</button>)}</div>
        {panel === 'xray' && <div className="card" style={{padding: '10px 14px'}}><div className="row"><small className="mu">Transparență caroserie</small><small>{xr}%</small></div><input type="range" min="0" max="100" value={xr} aria-label="Transparență caroserie" onChange={e => setXr(+e.target.value)} style={{margin: '2px 0'}}/></div>}
        {panel === 'look' && <LookPanel look={look} onChange={setLk} onSave={saveLook} onReset={() => setLk(null)} dirty={!!lk}/>}
        {panel === 'dots' && <div className="card" style={{padding: 14}}>
          <div className="row"><small className="mu">Culori puncte</small><span style={{display: 'flex', gap: 6}}>{[['zona', 'Zone'], ['stare', 'Stare']].map(([k, l]) => <button key={k} className={cm === k ? 'sm' : 'g sm'} onClick={() => setCM(k)}>{l}</button>)}</span></div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8}}>{(cm === 'zona' ? [...new Map(sites.map(s => [s.zoneName, s.zoneColor])).entries()] : [['Bună', '#10b981'], ['Atenție', '#f59e0b'], ['Urgent', '#ef4444']]).map(([n, c]) => <small key={n} className="mu"><b style={{color: c}}>●</b> {n}</small>)}</div>
          {cm === 'zona' && <small className="mu" style={{display: 'block', marginTop: 6}}>Culoarea centrală arată zona, iar inelul care pulsează arată starea piesei.</small>}</div>}
        <div className="grid3" style={{marginTop: 4}}>
          <div className="card stat"><div className="v">{parts.length}</div><small className="mu">piese urmărite</small></div>
          <div className="card stat"><div className="v" style={{fontSize: 15}}>{nextDue ? nextDue.n : '—'}</div><small className="mu">{nextDue ? when(nextDue.ts) : 'nicio scadență'}</small></div>
          <div className="card stat"><div className="v">{cost == null ? '—' : ron(cost)}</div><small className="mu">cost pe lună</small></div>
        </div>
        <div className="grid3" role="group" aria-label="Acțiuni rapide">
          <button className="g" onClick={() => onQuick('fuel')}>＋ {ev ? 'Încărcare' : 'Alimentare'}</button>
          <button className="g" onClick={async () => { const v = prompt('Km actuali:', car.odometer); if (v && +v > 0) { await sb.from('vehicles').update({odometer: +v}).eq('id', car.id); reload(car.id) } }}>✎ Km</button>
          <button disabled={parts.length === 0} onClick={startInsp}>▶ Inspecție</button>
        </div></>}
      {insp && cur && <div className="card">
        <div className="row"><b>🔍 Inspecție · {insp.i + 1} din {insp.ids.length}</b><button className="g sm" onClick={() => { setInsp(null); clear() }}>Încheie</button></div>
        <div className="bar"><i style={{width: `${insp.i / insp.ids.length * 100}%`, background: 'var(--ac)', transition: 'width .4s'}}/></div>
        <div className="row" style={{marginTop: 10}}><b style={{fontSize: 18}}>{cur.name}</b><span className="bd" style={{background: cur.col}}>{Math.round(cur.pct * 100)}%</span></div>
        <small className="mu">{site ? site.name + ' · ' : ''}~{ro(Math.round(cur.rem))} km sau ~{durata(cur.luni)} rămase · schimbare la ~{ro(Math.round(cur.nextKm))} km{cur.due ? ` sau ${lunaAn(cur.due)}` : ''} · ultima înlocuire {dt(cur.last_date)} la {ro(cur.last_odo)} km{checks[cur.id] ? ` · verificată ${dt(checks[cur.id])}` : ''}</small>
        <div className="grid" style={{marginTop: 10}}><button onClick={() => step('ok')}>✔ OK, e în regulă</button><button className="g" onClick={replaced}>🔧 Am înlocuit-o</button></div>
        <div className="grid" style={{marginTop: 8}}><button className="g sm" disabled={insp.i === 0} onClick={() => step(null, -1)}>‹ Înapoi</button><button className="g sm" onClick={() => step('skip')}>Sari peste ›</button></div></div>}
      {insp && !cur && <div className="card"><b>✅ Inspecție încheiată</b>
        <div className="grid3" style={{marginTop: 8}}><div><div className="big">{cnt('ok')}</div><small className="mu">în regulă</small></div><div><div className="big">{cnt('replaced')}</div><small className="mu">înlocuite</small></div><div><div className="big">{cnt('skip')}</div><small className="mu">sărite</small></div></div>
        <small className="mu" style={{display: 'block', marginTop: 8}}>„OK” doar notează că ai verificat piesa. Estimările nu se schimbă decât dacă o înlocuiești.</small>
        <div className="grid" style={{marginTop: 10}}><button className="g" onClick={startInsp}>Reia</button><button onClick={() => { setInsp(null); clear() }}>Închide</button></div></div>}
      <div className="card" style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <Gauge p={avg} col={avg > .4 ? '#10b981' : avg > .15 ? '#f59e0b' : '#ef4444'}/>
        <div style={{flex: 1}}><div style={{fontWeight: 700}}>{rd[1]} {rd[0]}</div><small className="mu">Sănătate generală</small>
          <div className="big" style={{marginTop: 6}}><Num v={car.odometer}/> <small className="mu" style={{fontSize: 13, fontWeight: 400}}>km</small></div><small className="mu">{car.year || ''} {car.body} · {car.powertrain}</small></div></div>
      {(urgent.length > 0 || soon.length > 0) && <div className="card"><b>⚠️ De rezolvat curând</b>{urgent.map(p => <div key={p.id} className="row" style={{marginTop: 8}}><span>{p.name}</span><span className="bd" style={{background: p.col}}>{Math.round(p.pct * 100)}%</span></div>)}{soon.map(d => <div key={d.id} className="row" style={{marginTop: 8}}><span>{d.type}</span><span className="bd" style={{background: '#f59e0b'}}>{daysTo(d.expires_on) < 0 ? 'Expirat' : daysTo(d.expires_on) + ' zile'}</span></div>)}</div>}
      {img && <img src={img} alt="Poza mașinii" style={{width: '100%', borderRadius: 20, maxHeight: 220, objectFit: 'cover'}}/>}
    </> : <div className="card" style={{textAlign: 'center'}}><div style={{fontSize: 56}}>🚘</div><h2>Bun venit în {APP}</h2><p className="mu">Adaugă prima ta mașină. Începe să scrii marca și restul se completează singur.</p><button className="w" onClick={() => setForm('new')}>＋ Adaugă mașina ta</button></div>}
    {menu && <><div className="bk" onClick={() => setMenu(false)}/><motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2 style={{margin: 0}}>Mașina ta</h2><button className="g" aria-label="Închide" onClick={() => setMenu(false)}>✕</button></div>
      <div className="grid" style={{marginTop: 12}}><button onClick={() => { setMenu(false); setForm('new') }}>＋ Mașină nouă</button>{car && <button className="g" onClick={() => { setMenu(false); setForm('edit') }}>✎ Editează mașina</button>}</div></motion.div></>}
    {form && <CarForm car={form === 'edit' ? car : null} onClose={() => setForm(null)} onSaved={async id => { setForm(null); await reload(id) }}/>}
  </>
}
