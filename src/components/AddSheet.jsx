import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {upload} from '../lib/media'
import {CATS, DEFAULT_PRICES, EXP_CATS, fuelKey} from '../data'
import {today, durata} from '../lib/util'
import {search, estimate, hotFor} from '../catalog'

export default function AddSheet({D, car, parts, tab, edit, onClose, onSaved, onKeep, preset}) {
  const ev = car.powertrain === 'Electric', phev = car.powertrain === 'PHEV', row = edit?.row
  const [kind, setKind] = useState(edit?.kind || (preset ? 'service' : tab === 2 ? 'fuel' : tab === 3 ? 'doc' : 'service'))
  const init = () => {
    if (!edit) return {date: today(), odo: car.odometer, part: preset || parts[0]?.id || 'new', cat: CATS[0], lk: 20000, ly: 2, lm: 0, unit: ev ? 'kWh' : 'L', full: true, type: 'ITP', pu: '', ecat: EXP_CATS[0], amt: ''}
    if (edit.kind === 'service') return {date: row.date, odo: row.odometer, pname: row.part_name, oem: row.brand_oem || '', pc: row.part_cost, lc: row.labor_cost, notes: row.notes || ''}
    if (edit.kind === 'fuel') return {date: row.date, odo: row.odometer, q: row.quantity, pu: row.price_per_unit, station: row.station || '', full: row.full_tank, unit: row.unit}
    if (edit.kind === 'expense') return {date: row.date, ecat: row.category, amt: row.amount, enote: row.note || ''}
    if (edit.kind === 'doc') return {type: row.type, pol: row.policy_number || '', exp: row.expires_on}
    return {pname: row.name, cat: row.category || CATS[0], lk: row.life_km, ly: Math.floor((row.life_months || 0) / 12), lm: (row.life_months || 0) % 12, lo: row.last_odo, ld: row.last_date}
  }
  const [f, setF] = useState(init), [file, setFile] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = (k, v) => setF({...f, [k]: v}), I = k => ({value: f[k] ?? '', onChange: e => set(k, e.target.value)})
  const TT = k => ({value: f[k] ?? '', onChange: e => setF({...f, [k]: e.target.value, touched: true})})
  const total = (+f.ly || 0) * 12 + (+f.lm || 0)
  const est = () => { const r = estimate(f.name || f.pname || '', f.cat); setF(x => ({...x, lk: r.km, ly: Math.floor(r.mo / 12), lm: r.mo % 12, hot: r.hot, note: r.note, touched: false})) }
  const life = <><small className="mu">Durată de viață: km · ani · luni (poți completa ambele, anii și lunile se adună)</small>
    <div className="grid" style={{gridTemplateColumns: '1.4fr 1fr 1fr'}}><input type="number" placeholder="km" {...TT('lk')}/><input type="number" placeholder="ani" {...TT('ly')}/><input type="number" placeholder="luni" {...TT('lm')}/></div>
    <small className="mu">{total ? `= ${durata(total)}. ` : ''}{f.note || ''}</small><br/><button className="g sm" style={{marginTop: 6}} onClick={est}>✨ Estimează automat</button></>
  const unit = ev ? 'kWh' : phev ? f.unit : 'L'
  const defPrice = unit === 'kWh' ? D.prices.kWh : (D.prices[fuelKey(car.powertrain)] ?? DEFAULT_PRICES.Benzină)
  const ok = x => { if (x.error) throw x.error }
  const save = async again => {
    setBusy(true); setErr('')
    try {
      const odo = +f.odo || car.odometer, receipt = file ? await upload(file) : null
      if (kind === 'service') {
        if (edit) {
          ok(await sb.from('maintenance_logs').update({part_name: f.pname, brand_oem: f.oem, date: f.date, odometer: odo, part_cost: +f.pc || 0, labor_cost: +f.lc || 0, notes: f.notes, ...(receipt ? {receipt_url: receipt} : {})}).eq('id', row.id))
          const last = D.logs.filter(l => l.vehicle_id === car.id && l.part_name === f.pname && l.id !== row.id).concat([{date: f.date, odometer: odo}]).sort((a, b) => a.date.localeCompare(b.date)).pop()
          const p = parts.find(x => x.name === f.pname)
          if (p) ok(await sb.from('vehicle_parts').update({last_odo: last.odometer, last_date: last.date}).eq('id', p.id))
        } else {
          let part = parts.find(p => p.id === f.part)
          if (f.part === 'new') {
            if (!f.name) throw new Error('Scrie numele piesei')
            const r = await sb.from('vehicle_parts').insert({vehicle_id: car.id, name: f.name, category: f.cat, hot: f.hot || hotFor(f.name, f.cat), life_km: +f.lk || 20000, life_months: total || 24, last_odo: odo, last_date: f.date}).select().single(); ok(r); part = r.data
          } else ok(await sb.from('vehicle_parts').update({last_odo: odo, last_date: f.date}).eq('id', part.id))
          ok(await sb.from('maintenance_logs').insert({vehicle_id: car.id, part_name: part.name, category: part.category, brand_oem: f.oem, date: f.date, odometer: odo, part_cost: +f.pc || 0, labor_cost: +f.lc || 0, notes: f.notes, receipt_url: receipt}))
        }
      }
      if (kind === 'fuel') {
        const q = +f.q, pu = +f.pu || +defPrice
        if (!q) throw new Error('Completează cantitatea')
        const r = {date: f.date, odometer: odo, quantity: q, unit: edit ? f.unit : unit, price_per_unit: pu, total_cost: +(q * pu).toFixed(2), station: f.station, full_tank: f.full, ...(receipt ? {receipt_url: receipt} : {})}
        ok(edit ? await sb.from('fuel_logs').update(r).eq('id', row.id) : await sb.from('fuel_logs').insert({...r, vehicle_id: car.id}))
      }
      if (kind === 'doc') {
        if (!f.exp) throw new Error('Alege data expirării')
        const r = {type: f.type, policy_number: f.pol, expires_on: f.exp}
        ok(edit ? await sb.from('documents').update(r).eq('id', row.id) : await sb.from('documents').insert({...r, vehicle_id: car.id}))
      }
      if (kind === 'expense') {
        if (!(+f.amt > 0)) throw new Error('Completează suma')
        const r = {date: f.date, category: f.ecat, amount: +f.amt, note: f.enote}
        ok(edit ? await sb.from('expenses').update(r).eq('id', row.id) : await sb.from('expenses').insert({...r, vehicle_id: car.id}))
      }
      if (kind === 'part') ok(await sb.from('vehicle_parts').update({name: f.pname, category: f.cat, life_km: +f.lk || 1, life_months: total || null, hot: hotFor(f.pname, f.cat), last_odo: +f.lo || 0, last_date: f.ld || today()}).eq('id', row.id))
      if ((kind === 'service' || kind === 'fuel') && odo > car.odometer) await sb.from('vehicles').update({odometer: odo}).eq('id', car.id)
      if (again === true && kind === 'service' && !edit) {
        const i = parts.findIndex(p => p.id === f.part), nx = parts.length ? parts[(i + 1) % parts.length].id : 'new'
        setF(x => ({...x, part: nx, pc: '', lc: '', oem: '', notes: '', name: '', touched: false})); setFile(null); setBusy(false); await onKeep()
      } else await onSaved(kind)
    } catch (e) { setErr(e.message); setBusy(false) }
  }
  const delPart = async () => { if (confirm('Ștergi piesa din listă?')) { await sb.from('vehicle_parts').delete().eq('id', row.id); await onSaved() } }
  const title = edit ? 'Editează' : 'Adaugă'
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>{title}</h2><button className="g" onClick={onClose}>✕</button></div>
      {!edit && <div className="chips">{[['service', 'Service'], ['fuel', ev ? 'Încărcare' : 'Alimentare'], ['doc', 'Act'], ['expense', 'Cheltuială']].map(([k, l]) => <button key={k} className={kind === k ? 'on' : 'g'} onClick={() => setKind(k)}>{l}</button>)}</div>}
      {(kind === 'service' || kind === 'fuel') && <div className="grid"><input type="date" {...I('date')}/><input type="number" placeholder="Km" {...I('odo')}/></div>}
      {kind === 'service' && <>
        {edit ? <input placeholder="Piesă" {...I('pname')}/> : <select value={f.part} onChange={e => set('part', e.target.value)}>{parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="new">＋ Altă piesă din catalog…</option></select>}
        {!edit && f.part === 'new' && <><input placeholder="🔎 Caută în catalog (ex. bujii, amortizor)" {...I('q')}/>{f.q && <div className="chips" style={{flexWrap: 'wrap'}}>{search(f.q, car.powertrain).slice(0, 8).map(c => <button key={c.name} className="g sm" onClick={() => setF({...f, name: c.name, cat: c.category, lk: c.life_km, ly: Math.floor(c.life_months / 12), lm: c.life_months % 12, hot: c.hot, q: '', touched: true, note: 'Din catalog (valori orientative).'})}>{c.name}</button>)}</div>}<input placeholder="Nume piesă" {...I('name')} onBlur={() => { if (f.name && !f.touched) est() }}/>
          <select {...I('cat')}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
          {life}</>}
        <input placeholder="Marcă / cod OEM" {...I('oem')}/>
        <div className="grid"><input type="number" placeholder="Cost piesă (RON)" {...I('pc')}/><input type="number" placeholder="Manoperă (RON)" {...I('lc')}/></div>
        <textarea rows="2" placeholder="Note" {...I('notes')}/></>}
      {kind === 'fuel' && <>
        {phev && !edit && <select {...I('unit')}><option value="L">Benzină (L)</option><option value="kWh">Încărcare (kWh)</option></select>}
        <div className="grid"><input type="number" step="0.01" placeholder={unit} {...I('q')}/><input type="number" step="0.01" placeholder={`Preț/${unit} (implicit ${defPrice})`} {...I('pu')}/></div>
        <input placeholder="Stație (opțional)" {...I('station')}/>
        <label className="row"><span>{ev ? 'Încărcare completă' : 'Plin complet'}</span><input type="checkbox" style={{width: 26}} checked={!!f.full} onChange={e => set('full', e.target.checked)}/></label></>}
      {kind === 'expense' && <><input type="date" {...I('date')}/><select {...I('ecat')}>{EXP_CATS.map(c => <option key={c}>{c}</option>)}</select><input type="number" step="0.01" placeholder="Sumă (RON)" {...I('amt')}/><input placeholder="Notă (opțional)" {...I('enote')}/></>}
      {kind === 'doc' && <>
        <select {...I('type')}>{['ITP', 'RCA', 'CASCO', 'Rovinieta'].map(t => <option key={t}>{t}</option>)}</select>
        <input placeholder="Număr poliță (opțional)" {...I('pol')}/>
        <small className="mu">Data expirării</small><input type="date" {...I('exp')}/></>}
      {kind === 'part' && <>
        <input placeholder="Nume piesă" {...I('pname')}/><select {...I('cat')}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
        {life}
        <small className="mu">Ultima înlocuire</small><div className="grid"><input type="date" {...I('ld')}/><input type="number" placeholder="La km" {...I('lo')}/></div>
        <div className="plan" style={{marginTop: 10}}><small className="mu">ℹ️ Valorile sunt estimări orientative din catalogul aplicației și pot conține greșeli. Verifică în cartea de service a mașinii.</small>
          <a className="btn g sm" style={{marginTop: 8}} target="_blank" rel="noreferrer" href={`https://www.google.com/search?q=${encodeURIComponent(`${car.brand} ${car.model || ''} ${car.year || ''} ${f.pname || ''} interval înlocuire km`)}`}>🔎 Verifică pe internet</a>
          <small className="mu" style={{display: 'block', marginTop: 6}}>Căutarea se deschide în browser. Aplicația nu trimite nimic singură.</small></div></>}
      {(kind === 'service' || kind === 'fuel') && <><small className="mu">{edit ? 'Poză bon nouă (înlocuiește cea veche)' : 'Poză bon / factură (opțional)'}</small><input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}/></>}
      {err && <p style={{color: 'var(--ur)'}}>{err}</p>}
      <motion.button whileTap={{scale: .96}} className="w" style={{marginTop: 8}} disabled={busy} onClick={save}>{busy ? 'Se salvează…' : 'Salvează'}</motion.button>
      {kind === 'service' && !edit && <button className="g w" style={{marginTop: 8}} disabled={busy} onClick={() => save(true)}>Salvează și adaugă încă o piesă</button>}
      {kind === 'part' && <button className="g w" style={{marginTop: 8}} onClick={delPart}>Șterge piesa</button>}
    </motion.div></>
}
