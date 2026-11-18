import {useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'

export default function MfaGate({onDone}) {
  const [code, setCode] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true); setMsg('')
    const {data: l} = await sb.auth.mfa.listFactors(), f = l?.totp?.[0]
    if (!f) { setBusy(false); return onDone() }
    const ch = await sb.auth.mfa.challenge({factorId: f.id})
    if (ch.error) { setBusy(false); return setMsg(ch.error.message) }
    const v = await sb.auth.mfa.verify({factorId: f.id, challengeId: ch.data.id, code: code.trim()})
    setBusy(false)
    if (v.error) return setMsg('Cod greșit sau expirat.')
    onDone()
  }
  return <main>
    <div style={{textAlign: 'center', padding: '34px 0 12px'}}><motion.img src="/logo.png" className="logo big" alt="" initial={{scale: .5, opacity: 0}} animate={{scale: 1, opacity: 1}}/><h1 style={{margin: '14px 0 2px', fontSize: 28}}>Verificare în doi pași</h1></div>
    <div className="card"><p className="mu" style={{marginTop: 0}}>Introdu codul de 6 cifre din aplicația de autentificare.</p>
      <input inputMode="numeric" autoFocus maxLength={6} placeholder="123456" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} style={{fontSize: 24, textAlign: 'center', letterSpacing: 6}}/>
      {msg && <p style={{color: 'var(--ur)'}}>{msg}</p>}
      <motion.button whileTap={{scale: .96}} className="w" disabled={busy || code.length < 6} onClick={go}>{busy ? 'Se verifică…' : 'Verifică'}</motion.button>
      <button className="g w" style={{marginTop: 8}} onClick={() => sb.auth.signOut()}>Deconectare</button></div>
  </main>
}
