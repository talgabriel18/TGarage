import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {upload} from '../lib/media'
import {TIPURI, BODY} from '../data'
import {norm} from '../catalog'
import {BRANDS, modelsOf, brandKey} from '../carsdb'
import {decodeVin, mapBody, mapFuel, modelsOnline} from '../lib/vin'

const CY = new Date().getFullYear(), YEARS = Array.from({length: CY - 1988}, (_, i) => CY + 1 - i)

export default function CarForm({car, onClose, onSaved}) {
  const [f, setF] = useState(car ? {...car, year: car.year ?? '', odometer: car.odometer ?? ''} : {brand: '', model: '', vin: '', year: '', odometer: '', monthly_km: 1200, powertrain: 'Benzină', body: 'Sedan', color: '#35507a'})
  const [file, setFile] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [info, setInfo] = useState(''), [online, setOnline] = useState([])
  const set = (k, v) => setF({...f, [k]: v})
  const bk = brandKey(f.brand), models = bk ? modelsOf(bk) : []
  const hit = models.find(m => norm(m.name) === norm(f.model || ''))
  const bSug = !bk && f.brand ? BRANDS.filter(b => norm(b).includes(norm(f.brand))).slice(0, 6) : []
  const mSug = bk && !hit ? models.filter(m => norm(m.name).includes(norm(f.model || ''))).slice(0, 12) : []
  const allowed = hit ? hit.pw : [], opts = [...allowed, ...TIPURI.filter(t => !allowed.includes(t))]
  const pick = m => setF({...f, brand: bk, model: m.name, body: m.body, powertrain: m.pw.includes(f.powertrain) ? f.powertrain : m.pw[0]})
  const fromVin = async () => {
    setInfo('Se caută…')
    try {
      const r = await decodeVin(f.vin.trim()); if (!r.brand) throw new Error('x')
      const title = s => s.charAt(0) + s.slice(1).toLowerCase(), b = brandKey(title(r.brand)) || title(r.brand)
      setF(x => ({...x, brand: b, model: r.model || x.model, year: r.year || x.year, body: mapBody(r.bodyClass), powertrain: mapFuel(r.fuel, r.elec)}))
      setInfo('✓ Completat din VIN. Verifică datele.')
    } catch { setInfo('VIN-ul nu a putut fi citit. Completează manual.') }
  }
  const findOnline = async () => { setInfo('Se caută…'); try { setOnline((await modelsOnline(f.brand)).slice(0, 30)); setInfo('') } catch { setInfo('Căutarea online nu a mers.') } }
  const save = async () => {
    if (!f.brand.trim()) return
    setBusy(true); setErr('')
    try {
      const row = {brand: bk || f.brand.trim(), model: f.model, vin: f.vin ? f.vin.trim().toUpperCase() : null, year: +f.year || null, odometer: +f.odometer || 0, monthly_km: +f.monthly_km || 1200, powertrain: f.powertrain, body: f.body, color: f.color}
      if (file) row.image_url = await upload(file)
      let id = car?.id
      if (car) { const {error} = await sb.from('vehicles').update(row).eq('id', car.id); if (error) throw error }
      else {
        const {data, error} = await sb.from('vehicles').insert(row).select().single(); if (error) throw error
        id = data.id
      }
      await onSaved(id)
    } catch (e) { setErr(e.message); setBusy(false) }
  }
  const del = async () => { if (confirm('Ștergi mașina și tot istoricul ei?')) { await sb.from('vehicles').delete().eq('id', car.id); await onSaved(null) } }
  const chips = (arr, fn) => arr.length > 0 && <div className="chips" style={{flexWrap: 'wrap'}}>{arr.map(x => <button key={x.name || x} className="g sm" onClick={() => fn(x)}>{x.name || x}</button>)}</div>
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>{car ? 'Editează mașina' : 'Mașină nouă'}</h2><button className="g" onClick={onClose}>✕</button></div>
      <input placeholder="Marcă (începe să scrii, ex. Dac…)" value={f.brand} onChange={e => set('brand', e.target.value)}/>
      {chips(bSug, b => set('brand', b))}
      <input placeholder="Model (ex. Duster)" value={f.model || ''} onChange={e => set('model', e.target.value)}/>
      {chips(mSug, pick)}
      {hit && <small className="mu">✓ Găsit în baza de date · {hit.body} · motorizări: {hit.pw.join(', ')}</small>}
      {f.brand && !bk && bSug.length === 0 && <small className="mu">Marcă necunoscută în listă. O poți folosi oricum, alege manual caroseria și motorul.</small>}
      {f.brand && !bk && <button className="g sm" onClick={findOnline}>🌐 Caută modele online</button>}{chips(online, m => setF({...f, model: m}))}
      <div className="grid" style={{marginTop: 6}}><input placeholder="VIN (opțional)" value={f.vin || ''} onChange={e => set('vin', e.target.value)} style={{margin: 0}}/><button className="g" disabled={(f.vin || '').length < 11} onClick={fromVin}>🔎 Din VIN</button></div>
      {info && <small className="mu">{info}</small>}
      <div className="grid"><select value={f.year} onChange={e => set('year', e.target.value)}><option value="">An fabricație</option>{YEARS.map(y => <option key={y}>{y}</option>)}</select>
        <input type="number" placeholder="Km actuali" value={f.odometer} onChange={e => set('odometer', e.target.value)}/></div>
      <input type="number" placeholder="Km pe lună (medie)" value={f.monthly_km} onChange={e => set('monthly_km', e.target.value)}/>
      <select value={f.powertrain} onChange={e => set('powertrain', e.target.value)}>{opts.map(t => <option key={t} value={t}>{allowed.includes(t) ? '★ ' : ''}{t}</option>)}</select>
      <select value={f.body} onChange={e => set('body', e.target.value)}>{Object.keys(BODY).map(t => <option key={t}>{t}</option>)}</select>
      <div className="row"><span>Culoare</span><input type="color" style={{width: 90}} value={f.color || '#35507a'} onChange={e => set('color', e.target.value)}/></div>
      <small className="mu">Poză mașină (opțional)</small><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}/>
      {err && <p style={{color: 'var(--ur)'}}>{err}</p>}
      <motion.button whileTap={{scale: .96}} className="w" disabled={busy} onClick={save}>{busy ? 'Se salvează…' : 'Salvează'}</motion.button>
      {car && <button className="g w" style={{marginTop: 8}} onClick={del}>Șterge mașina</button>}
    </motion.div></>
}
