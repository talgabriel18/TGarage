import {useEffect, useState} from 'react'
import {motion} from 'framer-motion'
import {ro, ron, dt} from '../lib/util'

function Num({v, f = ro}) {
  const [x, setX] = useState(0)
  useEffect(() => {
    let r, t0
    const step = t => { if (t0 == null) t0 = t; const p = Math.min(1, (t - t0) / 900); setX(v * (1 - Math.pow(1 - p, 3))); if (p < 1) r = requestAnimationFrame(step) }
    r = requestAnimationFrame(step); return () => cancelAnimationFrame(r)
  }, [v])
  return <>{f(Math.round(x))}</>
}

export default function YearReview({D, car, onClose}) {
  const fuel = D.fuel.filter(x => x.vehicle_id === car.id), logs = D.logs.filter(x => x.vehicle_id === car.id), exps = (D.exp || []).filter(x => x.vehicle_id === car.id)
  const years = [...new Set([...fuel, ...logs, ...exps].map(x => x.date.slice(0, 4)))].sort().reverse()
  const [y, setY] = useState(years[0] || String(new Date().getFullYear()))
  const f = fuel.filter(x => x.date.startsWith(y)), l = logs.filter(x => x.date.startsWith(y)), e = exps.filter(x => x.date.startsWith(y))
  const odos = f.map(x => x.odometer).concat(l.map(x => x.odometer)).filter(Boolean), km = odos.length > 1 ? Math.max(...odos) - Math.min(...odos) : 0
  const S = (a, k) => a.reduce((s, x) => s + Number(x[k] || 0), 0)
  const sF = S(f, 'total_cost'), sS = S(l, 'part_cost') + S(l, 'labor_cost'), sE = S(e, 'amount'), tot = sF + sS + sE
  const cost = x => Number(x.part_cost) + Number(x.labor_cost), big = [...l].sort((a, b) => cost(b) - cost(a))[0]
  const u = f[0]?.unit, priced = f.filter(x => x.unit === u && Number(x.price_per_unit) > 0).sort((a, b) => a.price_per_unit - b.price_per_unit)
  const cnt = {}; f.forEach(x => { if (x.station) cnt[x.station] = (cnt[x.station] || 0) + 1 })
  const fav = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]
  const cards = [
    {k: 'km', i: '🛣️', t: 'Kilometri parcurși', v: <><Num v={km}/> km</>, ok: km > 0},
    {k: 'tot', i: '💸', t: 'Cheltuieli totale', v: <Num v={tot} f={n => ron(n)}/>, ok: tot > 0},
    {k: 'f', i: '⛽', t: u === 'kWh' ? 'Încărcare' : 'Combustibil', v: <Num v={sF} f={n => ron(n)}/>, s: `${f.length} alimentări`, ok: sF > 0},
    {k: 's', i: '🔧', t: 'Service și piese', v: <Num v={sS} f={n => ron(n)}/>, s: `${l.length} intervenții`, ok: sS > 0},
    {k: 'e', i: '🧾', t: 'Alte cheltuieli', v: <Num v={sE} f={n => ron(n)}/>, ok: sE > 0},
    {k: 'b', i: '🏆', t: 'Cel mai scump service', v: big ? ron(cost(big)) : '', s: big ? `${big.part_name} · ${dt(big.date)}` : '', ok: !!big},
    {k: 'c', i: '🎯', t: 'Cea mai ieftină alimentare', v: priced[0] ? `${Number(priced[0].price_per_unit).toFixed(2).replace('.', ',')} RON/${u}` : '', s: priced[0] ? `${priced[0].station || ''} ${dt(priced[0].date)}` : '', ok: priced.length > 1},
    {k: 'st', i: '📍', t: 'Stația preferată', v: fav ? fav[0] : '', s: fav ? `${fav[1]} vizite` : '', ok: !!fav},
  ].filter(c => c.ok)
  const share = async () => {
    const text = `TGarage ${y} · ${car.brand} ${car.model || ''}: ${km ? ro(km) + ' km, ' : ''}${ron(tot)} cheltuieli${big ? ', cel mai scump service ' + ron(cost(big)) : ''}.`
    try { if (navigator.share) await navigator.share({title: 'TGarage', text}); else { await navigator.clipboard.writeText(text); alert('Copiat în clipboard') } } catch {}
  }
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}} style={{maxHeight: '92%'}}>
      <div className="row"><h2>🎉 {y} în cifre</h2><button className="g" onClick={onClose}>✕</button></div>
      <small className="mu">{car.brand} {car.model}</small>
      {years.length > 1 && <div className="chips">{years.map(x => <button key={x} className={x === y ? 'on' : 'g'} onClick={() => setY(x)}>{x}</button>)}</div>}
      {cards.length === 0 ? <p className="mu">Nu ai înregistrări în {y}.</p> : <div className="grid" style={{marginTop: 10}}>
        {cards.map((c, k) => <motion.div key={y + c.k} className="card" initial={{opacity: 0, y: 30, scale: .9}} animate={{opacity: 1, y: 0, scale: 1}} transition={{delay: k * .08, type: 'spring', stiffness: 220, damping: 20}}>
          <div style={{fontSize: 26}}>{c.i}</div><div className="big" style={{fontSize: 20, wordBreak: 'break-word'}}>{c.v}</div><small className="mu">{c.t}</small>{c.s && <div><small className="mu">{c.s}</small></div>}</motion.div>)}</div>}
      {cards.length > 0 && <button className="w" style={{marginTop: 14}} onClick={share}>📤 Distribuie rezumatul</button>}
    </motion.div></>
}
