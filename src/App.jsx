import {useCallback, useEffect, useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {supabase as sb} from './lib/supabase'
import {DEFAULT_PRICES} from './data'
import Auth from './tabs/Auth'
import Garage from './tabs/Garage'
import Parts from './tabs/Parts'
import Consum from './tabs/Consum'
import Acte from './tabs/Acte'
import AddSheet from './components/AddSheet'

const TABS = ['🚗 Garaj 3D', '🔧 Piese & AI', '⛽ Consum', '📄 Acte']
const T = ['vehicles', 'vehicle_parts', 'maintenance_logs', 'fuel_logs', 'documents', 'prices']
const empty = {cars: [], parts: [], logs: [], fuel: [], docs: [], prices: DEFAULT_PRICES, pdates: {}, raw: {}, uid: null}

export default function App() {
  const [s, setS] = useState(null), [ready, setReady] = useState(false), [D, setD] = useState(empty)
  const [carId, setCarId] = useState(null), [tab, setTab] = useState(0), [add, setAdd] = useState(false), [err, setErr] = useState('')
  useEffect(() => {
    sb.auth.getSession().then(({data}) => { setS(data.session); setReady(true) })
    const {data: l} = sb.auth.onAuthStateChange((_, x) => setS(x)); return () => l.subscription.unsubscribe()
  }, [])
  const load = useCallback(async pick => {
    const r = await Promise.all(T.map(t => sb.from(t).select('*').order('created_at')))
    if (r.some(x => x.error)) { setErr(r.find(x => x.error).error.message); return }
    const [cars, parts, logs, fuel, docs, pr] = r.map(x => x.data), prices = {...DEFAULT_PRICES}, pdates = {}
    pr.forEach(x => { prices[x.key] = Number(x.price); pdates[x.key] = x.updated_at })
    setD({cars, parts, logs, fuel, docs, prices, pdates, raw: Object.fromEntries(T.map((t, i) => [t, r[i].data])), uid: s?.user?.id})
    setCarId(cur => pick === null ? null : pick || (cars.find(c => c.id === cur) ? cur : cars[0]?.id || null))
  }, [s])
  useEffect(() => { if (s) load() }, [s])
  if (!ready) return null
  if (!s) return <Auth/>
  const car = D.cars.find(c => c.id === carId) || D.cars[0]
  const parts = car ? D.parts.filter(p => p.vehicle_id === car.id) : []
  const props = {D, car, reload: load, setCar: setCarId}
  const page = tab === 0 || !car ? <Garage {...props}/> : [null, <Parts {...props}/>, <Consum {...props}/>, <Acte {...props}/>][tab]
  return <>
    <main>{err && <p style={{color: 'var(--ur)'}}>Eroare: {err}. Ai rulat schema.sql în Supabase?</p>}
      <AnimatePresence mode="wait"><motion.div key={tab} initial={{opacity: 0, y: 24}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{type: 'spring', stiffness: 260, damping: 26}}>{page}</motion.div></AnimatePresence></main>
    {car && <motion.button className="fab" whileTap={{scale: .92}} onClick={() => setAdd(true)}>+ Adaugă</motion.button>}
    {add && car && <AddSheet D={D} car={car} parts={parts} tab={tab} onClose={() => setAdd(false)} onSaved={async () => { setAdd(false); await load(car.id) }}/>}
    <nav>{TABS.map((t, k) => <button key={t} className={k === tab ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}</nav>
  </>
}
