import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'

export default function Auth() {
  const [em, setEm] = useState(''), [pw, setPw] = useState(''), [mode, setMode] = useState('in'), [msg, setMsg] = useState('')
  const forgot = async () => {
    if (!em) return setMsg('Scrie emailul mai sus.')
    const {error} = await sb.auth.resetPasswordForEmail(em, {redirectTo: window.location.origin}); setMsg(error ? error.message : 'Dacă emailul există, ai primit un link de resetare a parolei.')
  }
  const go = async () => {
    setMsg('')
    const r = mode === 'in' ? await sb.auth.signInWithPassword({email: em, password: pw}) : await sb.auth.signUp({email: em, password: pw})
    if (r.error) setMsg(r.error.message)
    else if (mode === 'up' && !r.data.session) setMsg('Cont creat. Confirmă emailul, apoi intră.')
  }
  return <main><div style={{textAlign: 'center', padding: '34px 0 12px'}}><motion.img src="/logo.png" className="logo big" alt="TGarage" initial={{scale: .4, rotate: -12, opacity: 0}} animate={{scale: 1, rotate: 0, opacity: 1}} transition={{type: 'spring', stiffness: 180, damping: 12}}/><h1 style={{margin: '14px 0 2px', fontSize: 32, letterSpacing: -.5}}>TGarage</h1><p className="mu" style={{margin: 0}}>Garajul tău digital</p></div><div className="card">
    <input type="email" placeholder="Email" value={em} onChange={e => setEm(e.target.value)}/>
    <input type="password" placeholder="Parolă (min. 6 caractere)" value={pw} onChange={e => setPw(e.target.value)}/>
    <motion.button whileTap={{scale: .96}} className="w" style={{marginTop: 8}} onClick={go}>{mode === 'in' ? 'Intră' : 'Creează cont'}</motion.button>
    {msg && <p className="mu">{msg}</p>}
    {mode === 'in' && <button className="g w" style={{marginTop: 8}} onClick={forgot}>Am uitat parola</button>}
    <button className="g w" style={{marginTop: 8}} onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Nu ai cont? Creează unul' : 'Ai deja cont? Intră'}</button></div></main>
}
