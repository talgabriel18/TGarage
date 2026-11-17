import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {upload} from '../lib/media'
import {TIPURI, BODY, template} from '../data'

export default function CarForm({car, onClose, onSaved}) {
  const [f, setF] = useState(car ? {...car, year: car.year ?? '', odometer: car.odometer ?? ''} : {brand: '', model: '', year: '', odometer: '', monthly_km: 1200, powertrain: 'Benzină', body: 'Sedan', color: '#35507a'})
  const [file, setFile] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = (k, v) => setF({...f, [k]: v})
  const save = async () => {
    if (!f.brand.trim()) return
    setBusy(true); setErr('')
    try {
      const row = {brand: f.brand.trim(), model: f.model, year: +f.year || null, odometer: +f.odometer || 0, monthly_km: +f.monthly_km || 1200, powertrain: f.powertrain, body: f.body, color: f.color}
      if (file) row.image_url = await upload(file)
      let id = car?.id
      if (car) { const {error} = await sb.from('vehicles').update(row).eq('id', car.id); if (error) throw error }
      else {
        const {data, error} = await sb.from('vehicles').insert(row).select().single(); if (error) throw error
        id = data.id
        await sb.from('vehicle_parts').insert(template(row.powertrain).map(p => ({...p, vehicle_id: id, last_odo: row.odometer})))
      }
      await onSaved(id)
    } catch (e) { setErr(e.message); setBusy(false) }
  }
  const del = async () => { if (confirm('Ștergi mașina și tot istoricul ei?')) { await sb.from('vehicles').delete().eq('id', car.id); await onSaved(null) } }
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>{car ? 'Editează mașina' : 'Mașină nouă'}</h2><button className="g" onClick={onClose}>✕</button></div>
      <input placeholder="Marcă (ex. Dacia)" value={f.brand} onChange={e => set('brand', e.target.value)}/>
      <input placeholder="Model (ex. Duster)" value={f.model || ''} onChange={e => set('model', e.target.value)}/>
      <div className="grid"><input type="number" placeholder="An" value={f.year} onChange={e => set('year', e.target.value)}/><input type="number" placeholder="Km actuali" value={f.odometer} onChange={e => set('odometer', e.target.value)}/></div>
      <input type="number" placeholder="Km pe lună (medie)" value={f.monthly_km} onChange={e => set('monthly_km', e.target.value)}/>
      <select value={f.powertrain} onChange={e => set('powertrain', e.target.value)}>{TIPURI.map(t => <option key={t}>{t}</option>)}</select>
      <select value={f.body} onChange={e => set('body', e.target.value)}>{Object.keys(BODY).map(t => <option key={t}>{t}</option>)}</select>
      <div className="row"><span>Culoare</span><input type="color" style={{width: 90}} value={f.color || '#35507a'} onChange={e => set('color', e.target.value)}/></div>
      <small className="mu">Poză mașină (opțional)</small><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}/>
      {err && <p style={{color: 'var(--ur)'}}>{err}</p>}
      <motion.button whileTap={{scale: .96}} className="w" disabled={busy} onClick={save}>{busy ? 'Se salvează…' : 'Salvează'}</motion.button>
      {car && <button className="g w" style={{marginTop: 8}} onClick={del}>Șterge mașina</button>}
    </motion.div></>
}
