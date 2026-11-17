import {useCallback, useEffect, useState} from 'react'
import {motion, AnimatePresence, MotionConfig} from 'framer-motion'
import {supabase as sb} from './lib/supabase'
import {useTheme} from './lib/theme'
import {DEFAULT_PRICES} from './data'
import Auth from './tabs/Auth'
import Garage from './tabs/Garage'
import Parts from './tabs/Parts'
import Consum from './tabs/Consum'
import Acte from './tabs/Acte'
import AddSheet from './components/AddSheet'
import Settings from './components/Settings'
import Alerts from './components/Alerts'
import {computeAlerts} from './lib/alerts'

const TABS = [['🚗', 'Garaj 3D'], ['🔧', 'Piese & AI'], ['⛽', 'Consum'], ['📄', 'Acte']]
const T = ['vehicles', 'vehicle_parts', 'maintenance_logs', 'fuel_logs', 'documents', 'prices']
const empty = {cars: [], parts: [], logs: [], fuel: [], docs: [], prices: DEFAULT_PRICES, pdates: {}, raw: {}, uid: null}

export default function App() {
  const [s, setS] = useState(null), [ready, setReady] = useState(false), [D, setD] = useState(empty)
  const [carId, setCarId] = useState(null), [tab, setTab] = useState(0), [add, setAdd] = useState(false), [edit, setEdit] = useState(null), [cfg, setCfg] = useState(false), [al, setAl] = useState(false), [toast, setToast] = useState(''), [err, setErr] = useState('')
  const {th, setTh, img, setImg, t} = useTheme()
  useEffect(() => {
    sb.auth.getSession().then(({data}) => { setS(data.session); setReady(true) })
    const {data: l} = sb.auth.onAuthStateChange((_, x) => setS(x)); return () => l.subscription.unsubscribe()
  }, [])
  const load = useCallback(async pick => {
    const r = await Promise.all(T.map(x => sb.from(x).select('*').order('created_at')))
    if (r.some(x => x.error)) { setErr(r.find(x => x.error).error.message); return }
    const [cars, parts, logs, fuel, docs, pr] = r.map(x => x.data), prices = {...DEFAULT_PRICES}, pdates = {}
    pr.forEach(x => { prices[x.key] = Number(x.price); pdates[x.key] = x.updated_at })
    setD({cars, parts, logs, fuel, docs, prices, pdates, raw: Object.fromEntries(T.map((x, i) => [x, r[i].data])), uid: s?.user?.id})
    setCarId(cur => pick === null ? null : pick || (cars.find(c => c.id === cur) ? cur : cars[0]?.id || null))
  }, [s])
  useEffect(() => { if (s) load() }, [s])
  useEffect(() => {
    try {
      if (!s || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const a = computeAlerts(D).filter(x => x.sev > 0), k = new Date().toDateString()
      if (a.length && localStorage.getItem('garaj3d.notified') !== k) { localStorage.setItem('garaj3d.notified', k); new Notification('Garaj 3D', {body: `${a.length} lucruri de rezolvat la mașinile tale`}) }
    } catch {}
  }, [D, s])
  const custom = th.id === 'custom' && img
  const bg = <div className="bg" style={{background: custom ? `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),url(${img}) center/cover` : t.bg}}>
    {!custom && t.blobs && t.blobs.map((c, i) => <i key={i} className="blob" style={{background: c, left: ['-10%', '45%', '15%'][i], top: ['5%', '35%', '65%'][i], animationDelay: `${i * -7}s`}}/>)}</div>
  if (!ready) return bg
  if (!s) return <MotionConfig reducedMotion={th.calm ? 'always' : 'never'}>{bg}<Auth/></MotionConfig>
  const car = D.cars.find(c => c.id === carId) || D.cars[0]
  const parts = car ? D.parts.filter(p => p.vehicle_id === car.id) : []
  const flash = m => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const reload = async p => { await load(p); flash('Actualizat ✓') }
  const alerts = computeAlerts(D)
  const props = {D, car, reload, setCar: setCarId, onEdit: setEdit}
  const page = tab === 0 || !car ? <Garage {...props}/> : [null, <Parts {...props}/>, <Consum {...props}/>, <Acte {...props}/>][tab]
  const closeAdd = () => { setAdd(false); setEdit(null) }
  return <MotionConfig reducedMotion={th.calm ? 'always' : 'never'}>
    {bg}
    <header className="top"><div><small className="mu">{car ? `${car.brand} ${car.model || ''}` : 'Bun venit'}</small><h1>{TABS[tab][1]}</h1></div>
      <div style={{display: 'flex', gap: 8}}><motion.button className="icon" whileTap={{scale: .85}} onClick={() => setAl(true)} aria-label="Notificări">🔔{alerts.length > 0 && <i className="badge">{alerts.length}</i>}</motion.button><motion.button className="icon" whileTap={{scale: .85, rotate: 60}} onClick={() => setCfg(true)} aria-label="Setări">⚙️</motion.button></div></header>
    <main>{err && <p style={{color: 'var(--ur)'}}>Eroare: {err}. Ai rulat schema.sql în Supabase?</p>}
      <AnimatePresence mode="wait"><motion.div className="page" key={tab} initial={{opacity: 0, y: 24}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{type: 'spring', stiffness: 260, damping: 26}}>{page}</motion.div></AnimatePresence></main>
    {car && <motion.button className="fab" whileTap={{scale: .92}} initial={{scale: 0}} animate={{scale: 1}} onClick={() => setAdd(true)}>+ Adaugă</motion.button>}
    {(add || edit) && car && <AddSheet key={edit ? edit.row.id : 'new'} D={D} car={car} parts={parts} tab={tab} edit={edit} onClose={closeAdd} onSaved={async () => { closeAdd(); await reload(car.id) }}/>}
    {al && <Alerts list={alerts} onClose={() => setAl(false)}/>}
    {toast && <div className="toast">{toast}</div>}
    {cfg && <Settings th={th} setTh={setTh} setImg={setImg} onClose={() => setCfg(false)}/>}
    <nav>{TABS.map(([ic, l], k) => <button key={l} className={k === tab ? 'on' : ''} onClick={() => setTab(k)}>
      {k === tab && <motion.span layoutId="pill" className="pill" transition={{type: 'spring', stiffness: 400, damping: 32}}/>}<span>{ic}</span><span>{l}</span></button>)}</nav>
  </MotionConfig>
}
