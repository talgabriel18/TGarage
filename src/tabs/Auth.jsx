import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'

export default function Auth() {
  const [em, setEm] = useState(''), [pw, setPw] = useState(''), [mode, setMode] = useState('in'), [msg, setMsg] = useState('')
  const go = async () => {
    setMsg('')
    const r = mode === 'in' ? await sb.auth.signInWithPassword({email: em, password: pw}) : await sb.auth.signUp({email: em, password: pw})
    if (r.error) setMsg(r.error.message)
    else if (mode === 'up' && !r.data.session) setMsg('Cont creat. Confirmă emailul, apoi intră.')
  }
  return <main><h2>TGarage</h2><div className="card">
    <input type="email" placeholder="Email" value={em} onChange={e => setEm(e.target.value)}/>
    <input type="password" placeholder="Parolă (min. 6 caractere)" value={pw} onChange={e => setPw(e.target.value)}/>
    <motion.button whileTap={{scale: .96}} className="w" style={{marginTop: 8}} onClick={go}>{mode === 'in' ? 'Intră' : 'Creează cont'}</motion.button>
    {msg && <p className="mu">{msg}</p>}
    <button className="g w" style={{marginTop: 8}} onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Nu ai cont? Creează unul' : 'Ai deja cont? Intră'}</button></div></main>
}
