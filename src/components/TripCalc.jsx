import {useState} from 'react'
import {ron, ro} from '../lib/util'

export default function TripCalc({per100, unit, price}) {
  const [km, setKm] = useState(''), [pax, setPax] = useState(1), [rt, setRt] = useState(false), [extra, setExtra] = useState('')
  const c = per100 || (unit === 'kWh' ? 17 : 7), d = (+km || 0) * (rt ? 2 : 1), q = d * c / 100
  const cost = q * price + (+extra || 0), p = Math.max(1, +pax || 1)
  return <div className="card"><b>🧭 Calculator de drum</b><br/>
    <small className="mu">Folosește consumul tău real{per100 ? '' : ' (încă nu ai destule date, folosesc o medie)'} și prețul din „Prețuri la Zi”.</small>
    <div className="grid" style={{marginTop: 8}}><input type="number" placeholder="Distanță (km)" value={km} onChange={e => setKm(e.target.value)} style={{margin: 0}}/><input type="number" placeholder="Pasageri" value={pax} onChange={e => setPax(e.target.value)} style={{margin: 0}}/></div>
    <input type="number" placeholder="Taxe drum / parcare (RON, opțional)" value={extra} onChange={e => setExtra(e.target.value)}/>
    <label className="row"><span>Dus-întors</span><input type="checkbox" style={{width: 26}} checked={rt} onChange={e => setRt(e.target.checked)}/></label>
    {d > 0 && <><div className="grid" style={{marginTop: 10}}><div><div className="big">{ron(cost)}</div><small className="mu">cost total</small></div><div><div className="big">{ron(cost / p)}</div><small className="mu">pe persoană</small></div></div>
      <small className="mu">≈ {ro(q)} {unit} pentru {ro(d)} km · {ro(c)} {unit}/100 km · {Number(price).toFixed(2).replace('.', ',')} RON/{unit}</small></>}
  </div>
}
