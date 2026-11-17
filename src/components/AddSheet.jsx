import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {upload} from '../lib/media'
import {CATS, DEFAULT_PRICES, fuelKey} from '../data'
import {today} from '../lib/util'

export default function AddSheet({D, car, parts, tab, onClose, onSaved}) {
  const ev = car.powertrain === 'Electric', phev = car.powertrain === 'PHEV'
  const [kind, setKind] = useState(tab === 2 ? 'fuel' : tab === 3 ? 'doc' : 'service')
  const [f, setF] = useState({date: today(), odo: car.odometer, part: parts[0]?.id || 'new', cat: CATS[0], lk: 20000, lm: 24, unit: ev ? 'kWh' : 'L', full: true, type: 'ITP', pu: ''})
  const [file, setFile] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = (k, v) => setF({...f, [k]: v})
  const unit = ev ? 'kWh' : phev ? f.unit : 'L'
  const defPrice = (unit === 'kWh' ? D.prices.kWh : D.prices[fuelKey(car.powertrain)]) ?? DEFAULT_PRICES.kWh
  const save = async () => {
    setBusy(true); setErr('')
    try {
      const odo = +f.odo || car.odometer, receipt = file ? await upload(file) : null
      if (kind === 'service') {
        let part = parts.find(p => p.id === f.part)
        if (f.part === 'new') {
          if (!f.name) throw new Error('Scrie numele piesei')
          const {data, error} = await sb.from('vehicle_parts').insert({vehicle_id: car.id, name: f.name, category: f.cat, hot: 'caroserie', life_km: +f.lk || 20000, life_months: +f.lm || 24, last_odo: odo, last_date: f.date}).select().single()
          if (error) throw error; part = data
        } else { const {error} = await sb.from('vehicle_parts').update({last_odo: odo, last_date: f.date}).eq('id', part.id); if (error) throw error }
        const {error} = await sb.from('maintenance_logs').insert({vehicle_id: car.id, part_name: part.name, category: part.category, brand_oem: f.oem, date: f.date, odometer: odo, part_cost: +f.pc || 0, labor_cost: +f.lc || 0, notes: f.notes, receipt_url: receipt})
        if (error) throw error
      }
      if (kind === 'fuel') {
        const q = +f.q, pu = +f.pu || +defPrice
        if (!q) throw new Error('Completează cantitatea')
        const {error} = await sb.from('fuel_logs').insert({vehicle_id: car.id, date: f.date, odometer: odo, quantity: q, unit, price_per_unit: pu, total_cost: +(q * pu).toFixed(2), station: f.station, full_tank: f.full, receipt_url: receipt})
        if (error) throw error
      }
      if (kind === 'doc') {
        if (!f.exp) throw new Error('Alege data expirării')
        const {error} = await sb.from('documents').insert({vehicle_id: car.id, type: f.type, policy_number: f.pol, expires_on: f.exp})
        if (error) throw error
      }
      if (kind !== 'doc' && odo > car.odometer) await sb.from('vehicles').update({odometer: odo}).eq('id', car.id)
      await onSaved()
    } catch (e) { setErr(e.message); setBusy(false) }
  }
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>Adaugă</h2><button className="g" onClick={onClose}>✕</button></div>
      <div className="chips">{[['service', 'Service'], ['fuel', ev ? 'Încărcare' : 'Alimentare'], ['doc', 'Act']].map(([k, l]) => <button key={k} className={kind === k ? 'on' : 'g'} onClick={() => setKind(k)}>{l}</button>)}</div>
      {kind !== 'doc' && <div className="grid"><input type="date" value={f.date} onChange={e => set('date', e.target.value)}/><input type="number" placeholder="Km" value={f.odo} onChange={e => set('odo', e.target.value)}/></div>}
      {kind === 'service' && <>
        <select value={f.part} onChange={e => set('part', e.target.value)}>{parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="new">Altă piesă…</option></select>
        {f.part === 'new' && <><input placeholder="Nume piesă" value={f.name || ''} onChange={e => set('name', e.target.value)}/>
          <select value={f.cat} onChange={e => set('cat', e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
          <div className="grid"><input type="number" placeholder="Durată km" value={f.lk} onChange={e => set('lk', e.target.value)}/><input type="number" placeholder="Durată luni" value={f.lm} onChange={e => set('lm', e.target.value)}/></div></>}
        <input placeholder="Marcă / cod OEM" onChange={e => set('oem', e.target.value)}/>
        <div className="grid"><input type="number" placeholder="Cost piesă (RON)" onChange={e => set('pc', e.target.value)}/><input type="number" placeholder="Manoperă (RON)" onChange={e => set('lc', e.target.value)}/></div>
        <textarea rows="2" placeholder="Note" onChange={e => set('notes', e.target.value)}/></>}
      {kind === 'fuel' && <>
        {phev && <select value={f.unit} onChange={e => set('unit', e.target.value)}><option value="L">Benzină (L)</option><option value="kWh">Încărcare (kWh)</option></select>}
        <div className="grid"><input type="number" step="0.01" placeholder={unit} onChange={e => set('q', e.target.value)}/><input type="number" step="0.01" placeholder={`Preț/${unit} (implicit ${defPrice})`} onChange={e => set('pu', e.target.value)}/></div>
        <input placeholder="Stație (opțional)" onChange={e => set('station', e.target.value)}/>
        <label className="row"><span>{ev ? 'Încărcare completă' : 'Plin complet'}</span><input type="checkbox" style={{width: 26}} checked={f.full} onChange={e => set('full', e.target.checked)}/></label></>}
      {kind === 'doc' && <>
        <select value={f.type} onChange={e => set('type', e.target.value)}>{['ITP', 'RCA', 'CASCO', 'Rovinieta'].map(t => <option key={t}>{t}</option>)}</select>
        <input placeholder="Număr poliță (opțional)" onChange={e => set('pol', e.target.value)}/>
        <small className="mu">Data expirării</small><input type="date" onChange={e => set('exp', e.target.value)}/></>}
      {kind !== 'doc' && <><small className="mu">Poză bon / factură (opțional)</small><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}/></>}
      {err && <p style={{color: 'var(--ur)'}}>{err}</p>}
      <motion.button whileTap={{scale: .96}} className="w" style={{marginTop: 8}} disabled={busy} onClick={save}>{busy ? 'Se salvează…' : 'Salvează'}</motion.button>
    </motion.div></>
}
