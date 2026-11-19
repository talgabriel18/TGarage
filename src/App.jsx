import {useCallback, useEffect, useRef, useState} from 'react'
import {motion, AnimatePresence, MotionConfig, animate, useMotionValue} from 'framer-motion'
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
import Splash from './components/Splash'
import MfaGate from './components/MfaGate'
import NamePrompt from './components/NamePrompt'
import Cont from './tabs/Cont'
import {useUrl} from './lib/media'
import Alerts from './components/Alerts'
import {computeAlerts} from './lib/alerts'
import Confetti from './components/Confetti'
import Tour from './components/Tour'
import {APP} from './brand'

const TABS = [['🚗', 'Garaj'], ['🔧', 'Piese'], ['⛽', 'Consum'], ['📄', 'Acte'], ['👤', 'Cont']]
const T = ['vehicles', 'vehicle_parts', 'maintenance_logs', 'fuel_logs', 'documents', 'prices']
const empty = {cars: [], parts: [], logs: [], fuel: [], docs: [], prices: DEFAULT_PRICES, pdates: {}, raw: {}, exp: [], expOk: true, uid: null}

const AK = 'tgarage.alerts'
const loadAk = () => { try { return {read: [], del: [], ...JSON.parse(localStorage.getItem(AK) || '{}')} } catch { return {read: [], del: []} } }
const slide = {in: d => ({opacity: 0, x: d * 70}), mid: {opacity: 1, x: 0}, out: d => ({opacity: 0, x: d * -70})}
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Noapte bună' : h < 12 ? 'Bună dimineața' : h < 18 ? 'Bună ziua' : 'Bună seara' }

export default function App() {
  const [s, setS] = useState(null), [ready, setReady] = useState(false), [D, setD] = useState(empty)
  const [carId, setCarId0] = useState(() => { try { return localStorage.getItem('tgarage.car') } catch { return null } }), [tab, setTab] = useState(0), [add, setAdd] = useState(false), [edit, setEdit] = useState(null), [cfg, setCfg] = useState(false), [loaded, setLoaded] = useState(false), [gate, setGate] = useState('check'), [al, setAl] = useState(false), [toast, setToast] = useState(''), [dir, setDir] = useState(1), [burst, setBurst] = useState(0), [tour, setTour] = useState(() => { try { return !localStorage.getItem('tgarage.tour') } catch { return false } }), [err, setErr] = useState('')
  const {th, setTh, img, setImg, t} = useTheme()
  const touch = useRef(null)
  const px = useMotionValue(0)
  const [ak, setAk0] = useState(loadAk)
  const setAk = fn => setAk0(cur => { const n = fn(cur); try { localStorage.setItem(AK, JSON.stringify(n)) } catch {} return n })
  const md = s?.user?.user_metadata || {}, nm = md.name, avatarUrl = useUrl(md.avatar_photo)
  const setCarId = v => setCarId0(cur => { const n = typeof v === 'function' ? v(cur) : v; try { if (n) localStorage.setItem('tgarage.car', n); else localStorage.removeItem('tgarage.car') } catch {} return n })
  useEffect(() => {
    sb.auth.getSession().then(({data}) => { setS(data.session); setReady(true) })
    const {data: l} = sb.auth.onAuthStateChange((ev, x) => { setS(x); if (ev === 'PASSWORD_RECOVERY') setTab(4) }); return () => l.subscription.unsubscribe()
  }, [])
  const load = useCallback(async pick => {
    const r = await Promise.all(T.map(x => sb.from(x).select('*').order('created_at')))
    const ex = await sb.from('expenses').select('*').order('created_at')
    if (r.some(x => x.error)) { setErr(r.find(x => x.error).error.message); return }
    const [cars, parts, logs, fuel, docs, pr] = r.map(x => x.data), prices = {...DEFAULT_PRICES}, pdates = {}
    pr.forEach(x => { prices[x.key] = Number(x.price); pdates[x.key] = x.updated_at })
    setD({cars, parts, logs, fuel, docs, prices, pdates, exp: ex.error ? [] : ex.data, expOk: !ex.error, raw: {...Object.fromEntries(T.map((x, i) => [x, r[i].data])), ...(ex.error ? {} : {expenses: ex.data})}, uid: s?.user?.id})
    setLoaded(true)
    setCarId(cur => pick === null ? null : pick || (cars.find(c => c.id === cur) ? cur : cars[0]?.id || null))
  }, [s])
  useEffect(() => { if (s && gate === 'ok') load() }, [s, gate])
  useEffect(() => {
    if (!s) { setGate('check'); return }
    sb.auth.mfa.getAuthenticatorAssuranceLevel().then(({data}) => setGate(data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2' ? 'need' : 'ok')).catch(() => setGate('ok'))
  }, [s?.user?.id])
  useEffect(() => {
    try {
      if (!s || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const a = computeAlerts(D).filter(x => x.sev > 0 && !ak.del.includes(x.id) && !ak.read.includes(x.id)), k = new Date().toDateString()
      if (a.length && localStorage.getItem('garaj3d.notified') !== k) { localStorage.setItem('garaj3d.notified', k); new Notification(APP, {body: `${a.length} lucruri de rezolvat la mașinile tale`}) }
    } catch {}
  }, [D, s])
  const custom = th.id === 'custom' && img
  const bg = <div className="bg" style={{background: custom ? `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),url(${img}) center/cover` : t.bg}}>
    {!custom && t.blobs && t.blobs.map((c, i) => <i key={i} className="blob" style={{background: c, left: ['-10%', '45%', '15%'][i], top: ['5%', '35%', '65%'][i], animationDelay: `${i * -7}s`}}/>)}</div>
  if (!ready) return <>{bg}<Splash/></>
  if (!s) return <MotionConfig reducedMotion={th.calm ? 'always' : 'never'}>{bg}<Auth/></MotionConfig>
  if (gate === 'check') return <>{bg}<Splash/></>
  if (gate === 'need') return <MotionConfig reducedMotion={th.calm ? 'always' : 'never'}>{bg}<MfaGate onDone={() => setGate('ok')}/></MotionConfig>
  if (!loaded && !err) return <>{bg}<Splash/></>
  const car = D.cars.find(c => c.id === carId) || D.cars[0]
  const parts = car ? D.parts.filter(p => p.vehicle_id === car.id) : []
  const go = k => { setDir(k >= tab ? 1 : -1); setTab(k) }
  const swStart = e => { const p = e.touches[0]; touch.current = e.target.closest('canvas,input,select,textarea,.chips,.sheet,button') ? null : {x: p.clientX, y: p.clientY, lock: null} }
  const swMove = e => {
    const o = touch.current; if (!o) return
    const p = e.touches[0], dx = p.clientX - o.x, dy = p.clientY - o.y
    if (!o.lock && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) o.lock = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'
    if (o.lock === 'x') { const edge = (tab === 0 && dx > 0) || (tab === TABS.length - 1 && dx < 0); px.set(dx * (edge ? .15 : .5)) }
  }
  const swEnd = e => {
    const o = touch.current; touch.current = null; if (!o) return
    const p = e.changedTouches[0], dx = p.clientX - o.x
    animate(px, 0, {type: 'spring', stiffness: 320, damping: 32})
    if (o.lock === 'x' && Math.abs(dx) > 60) { const n = tab + (dx < 0 ? 1 : -1); if (n >= 0 && n < TABS.length) go(n) }
  }
  const flash = m => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const reload = async p => { await load(p); flash('Actualizat ✓') }
  const alerts = computeAlerts(D).filter(a => !ak.del.includes(a.id)), unread = alerts.filter(a => !ak.read.includes(a.id)).length
  const readA = id => setAk(c => c.read.includes(id) ? c : {...c, read: [...c.read, id]})
  const delA = id => setAk(c => ({...c, del: [...c.del, id]}))
  const readAll = () => setAk(c => ({...c, read: [...new Set([...c.read, ...alerts.map(a => a.id)])]}))
  const delAll = () => setAk(c => ({...c, del: [...new Set([...c.del, ...alerts.map(a => a.id)])]}))
  const props = {D, car, reload, setCar: setCarId, onEdit: setEdit, stage: th.stage || 'studio'}
  const page = tab === 4 ? <Cont user={s.user} onTheme={() => setCfg(true)}/> : tab === 0 || !car ? <Garage {...props}/> : [null, <Parts {...props}/>, <Consum {...props}/>, <Acte {...props}/>][tab]
  const closeAdd = () => { setAdd(false); setEdit(null) }
  return <MotionConfig reducedMotion={th.calm ? 'always' : 'never'}>
    {bg}
    <header className="top"><div style={{display: 'flex', gap: 12, alignItems: 'center'}}><div onClick={() => go(4)} style={{cursor: 'pointer'}}>{avatarUrl ? <img src={avatarUrl} className="logo av" alt=""/> : md.avatar_emoji ? <span className="logo av">{md.avatar_emoji}</span> : <img src="/logo.png" className="logo" alt={APP}/>}</div><div><small className="mu">{greet()}{nm ? `, ${nm}` : ''}{car ? ` · ${car.brand} ${car.model || ''}` : ''}</small><h1>{TABS[tab][1]}</h1></div></div>
      <div style={{display: 'flex', gap: 8}}><motion.button className="icon" whileTap={{scale: .85}} onClick={() => setAl(true)} aria-label="Notificări">🔔{unread > 0 && <i className="badge">{unread}</i>}</motion.button><motion.button className="icon" whileTap={{scale: .85, rotate: 60}} onClick={() => setCfg(true)} aria-label="Setări">⚙️</motion.button></div></header>
    <main onTouchStart={swStart} onTouchMove={swMove} onTouchEnd={swEnd} onTouchCancel={swEnd} style={{touchAction: 'pan-y'}}>{err && <p style={{color: 'var(--ur)'}}>Eroare: {err}. Ai rulat schema.sql în Supabase?</p>}
      {tab === 0 && !nm && <NamePrompt/>}
      <motion.div style={{x: px}}><AnimatePresence mode="wait" custom={dir}><motion.div className="page" key={tab} custom={dir} variants={slide} initial="in" animate="mid" exit="out" transition={{type: 'spring', stiffness: 300, damping: 30}}>{page}</motion.div></AnimatePresence></motion.div></main>
    {car && tab !== 4 && <motion.button className="fab" whileTap={{scale: .92}} initial={{scale: 0}} animate={{scale: 1}} onClick={() => setAdd(true)}>+ Adaugă</motion.button>}
    {(add || edit) && car && <AddSheet key={edit ? edit.row.id : 'new'} D={D} car={car} parts={parts} tab={tab} edit={edit} onClose={closeAdd} onSaved={async k => { closeAdd(); await reload(car.id); if (k === 'service' || k === 'fuel' || k === 'expense') setBurst(Date.now()) }} onKeep={async () => { await reload(car.id); setBurst(Date.now()) }}/>}
    {al && <Alerts list={alerts} read={ak.read} onRead={readA} onDel={delA} onReadAll={readAll} onDelAll={delAll} onClose={() => setAl(false)}/>}
    {toast && <div className="toast">{toast}</div>}
    {burst > 0 && !th.calm && <Confetti key={burst}/>}
    {tour && <Tour onDone={() => { try { localStorage.setItem('tgarage.tour', '1') } catch {} setTour(false) }}/>}
    {cfg && <Settings th={th} setTh={setTh} setImg={setImg} onClose={() => setCfg(false)}/>}
    <nav>{TABS.map(([ic, l], k) => <button key={l} className={k === tab ? 'on' : ''} onClick={() => go(k)}>
      {k === tab && <motion.span layoutId="pill" className="pill" transition={{type: 'spring', stiffness: 400, damping: 32}}/>}<span>{ic}</span><span>{l}</span></button>)}</nav>
  </MotionConfig>
}
