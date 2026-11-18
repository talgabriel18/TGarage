import {useState} from 'react'
import {supabase as sb} from '../lib/supabase'

export default function NamePrompt() {
  const [v, setV] = useState(''), [hide, setHide] = useState(() => { try { return !!localStorage.getItem('tgarage.noname') } catch { return false } })
  if (hide) return null
  const save = async () => { if (v.trim()) await sb.auth.updateUser({data: {name: v.trim()}}) }
  return <div className="card"><b>👋 Cum să te strig?</b>
    <p className="mu" style={{margin: '4px 0'}}>Scrie-ți prenumele și te salut pe nume.</p>
    <div className="grid"><input placeholder="Prenume" value={v} onChange={e => setV(e.target.value)} style={{margin: 0}}/><button onClick={save}>Salvează</button></div>
    <button className="g sm" style={{marginTop: 8}} onClick={() => { try { localStorage.setItem('tgarage.noname', '1') } catch {} setHide(true) }}>Nu acum</button></div>
}
