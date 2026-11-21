import {FINISHES, LOOK_PARTS} from '../data'

export default function LookPanel({look, onChange, onSave, onReset, dirty}) {
  const set = (k, v) => onChange({...look, [k]: v})
  const fin = FINISHES.find(f => f[0] === look.finish) || FINISHES[0]
  return <div className="card">
    <b>🎨 Culorile mașinii</b>
    <p className="mu" style={{margin: '4px 0 0', fontSize: 13}}>Alegi o culoare, iar mașina de sus se schimbă pe loc. Apasă „Salvează” ca să o păstrezi.</p>
    {LOOK_PARTS.map(p => {
      const cur = (look[p.k] || '').toLowerCase(), nm = (p.sw.find(s => s[1] === cur) || [])[0] || 'Culoare personalizată'
      return <div key={p.k} style={{marginTop: 14}}>
        <div className="row"><span><b>{p.t}</b> <small className="mu">· {nm}</small></span><input type="color" value={look[p.k]} onChange={e => set(p.k, e.target.value)} style={{width: 46, height: 32, margin: 0, padding: 2}} aria-label={`Culoare ${p.t}`}/></div>
        <small className="mu">{p.d}</small>
        <div className="swatches">{p.sw.map(([n, c]) => <button key={c} title={n} aria-label={n} className={'sw' + (cur === c ? ' on' : '')} style={{background: c}} onClick={() => set(p.k, c)}/>)}</div>
        {p.k === 'body' && <>
          <div style={{marginTop: 10}}><b>Finisaj</b> <small className="mu">· cum arată vopseaua</small></div>
          <div className="chips">{FINISHES.map(([k, n]) => <button key={k} className={look.finish === k ? 'sm' : 'g sm'} onClick={() => set('finish', k)}>{n}</button>)}</div>
          <small className="mu">{fin[1]}: {fin[2]}</small></>}
      </div>
    })}
    {dirty && <small className="mu" style={{display: 'block', marginTop: 12}}>Ai modificări nesalvate.</small>}
    <div className="grid" style={{marginTop: 12}}><button className="g" onClick={onReset}>Resetează</button><button onClick={onSave}>Salvează</button></div>
  </div>
}
