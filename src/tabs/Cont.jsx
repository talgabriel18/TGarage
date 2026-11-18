import {useEffect, useState} from 'react'
import {motion} from 'framer-motion'
import {supabase as sb} from '../lib/supabase'
import {upload, useUrl} from '../lib/media'

const EMOJI = ['🚗', '🏎️', '🚙', '🛻', '⚡', '🔧', '🏁', '🛞', '🚘', '🦊', '🐺', '🌟']

function Mfa() {
  const [fac, setFac] = useState(null), [en, setEn] = useState(null), [code, setCode] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const load = async () => { const {data} = await sb.auth.mfa.listFactors(); setFac(data?.totp || []) }
  useEffect(() => { load() }, [])
  const start = async () => {
    setMsg(''); setBusy(true)
    const {data: all} = await sb.auth.mfa.listFactors()
    for (const x of all?.all || []) if (x.status === 'unverified') await sb.auth.mfa.unenroll({factorId: x.id})
    const {data, error} = await sb.auth.mfa.enroll({factorType: 'totp', friendlyName: 'TGarage ' + Date.now()})
    setBusy(false)
    if (error) return setMsg(error.message)
    setEn(data)
  }
  const confirmCode = async () => {
    setBusy(true); setMsg('')
    const ch = await sb.auth.mfa.challenge({factorId: en.id})
    if (ch.error) { setBusy(false); return setMsg(ch.error.message) }
    const v = await sb.auth.mfa.verify({factorId: en.id, challengeId: ch.data.id, code: code.trim()})
    setBusy(false)
    if (v.error) return setMsg('Cod greșit. Încearcă din nou.')
    setEn(null); setCode(''); setMsg('Verificarea în doi pași e activă ✓'); load()
  }
  const cancel = async () => { await sb.auth.mfa.unenroll({factorId: en.id}); setEn(null); setCode('') }
  const off = async () => {
    if (!window.confirm('Dezactivezi verificarea în doi pași?')) return
    const {error} = await sb.auth.mfa.unenroll({factorId: fac[0].id}); setMsg(error ? error.message : 'Dezactivat'); load()
  }
  return <div className="card"><b>🔐 Verificare în doi pași (2FA)</b>
    {fac === null && <p className="mu">Se încarcă…</p>}
    {fac && fac.length > 0 && !en && <><p style={{margin: '8px 0'}}>✅ Activă. La fiecare autentificare ți se cere un cod din aplicația de autentificare.</p><button className="g w" onClick={off}>Dezactivează</button></>}
    {fac && fac.length === 0 && !en && <><p className="mu" style={{margin: '8px 0'}}>Adaugă un cod din Google Authenticator, Microsoft Authenticator sau Authy la autentificare. Atenție: dacă pierzi telefonul fără să păstrezi cheia secretă, poți rămâne blocat.</p><button className="w" disabled={busy} onClick={start}>Activează 2FA</button></>}
    {en && <div style={{marginTop: 8}}>
      <p className="mu" style={{margin: '0 0 8px'}}>1. Scanează codul QR cu aplicația de autentificare (sau scrie cheia manual). Păstrează cheia într-un loc sigur.</p>
      <div style={{textAlign: 'center'}}><img src={en.totp.qr_code} alt="QR 2FA" style={{width: 190, height: 190, background: '#fff', borderRadius: 14, padding: 8}}/></div>
      <p style={{wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 13, textAlign: 'center'}}>{en.totp.secret}</p>
      <p className="mu" style={{margin: '0 0 4px'}}>2. Scrie codul de 6 cifre afișat de aplicație:</p>
      <input inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}/>
      <div className="grid" style={{marginTop: 6}}><button className="g" onClick={cancel}>Anulează</button><button disabled={busy || code.length < 6} onClick={confirmCode}>Confirmă</button></div></div>}
    {msg && <p className="mu" style={{marginBottom: 0}}>{msg}</p>}
  </div>
}

export default function Cont({user, onTheme}) {
  const md = user.user_metadata || {}
  const [f, setF] = useState({name: md.name || '', full_name: md.full_name || '', phone: md.phone || '', city: md.city || ''})
  const [msg, setMsg] = useState({}), say = (k, m) => setMsg(x => ({...x, [k]: m}))
  const [mail, setMail] = useState(''), [p1, setP1] = useState(''), [p2, setP2] = useState('')
  const photo = useUrl(md.avatar_photo)
  const upd = async (data, k) => { const {error} = await sb.auth.updateUser({data}); say(k, error ? error.message : 'Salvat ✓') }
  const upPhoto = async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return
    try { await upd({avatar_photo: await upload(file), avatar_emoji: null}, 'a') } catch (x) { say('a', x.message) }
  }
  const changeMail = async () => {
    if (!/\S+@\S+\.\S+/.test(mail)) return say('m', 'Email invalid')
    const {error} = await sb.auth.updateUser({email: mail}); say('m', error ? error.message : 'Ți-am trimis un link de confirmare. Deschide-l ca să finalizezi schimbarea.')
  }
  const changePass = async () => {
    if (p1.length < 6) return say('w', 'Minim 6 caractere')
    if (p1 !== p2) return say('w', 'Parolele nu coincid')
    const {error} = await sb.auth.updateUser({password: p1}); say('w', error ? error.message : 'Parola a fost schimbată ✓')
    if (!error) { setP1(''); setP2('') }
  }
  const set = k => ({value: f[k], onChange: e => setF({...f, [k]: e.target.value})})
  return <>
    <div className="card" style={{textAlign: 'center'}}>
      <motion.div key={md.avatar_emoji || photo || 'l'} initial={{scale: .6}} animate={{scale: 1}} transition={{type: 'spring', stiffness: 260, damping: 14}} className="logo big av" style={{margin: '0 auto'}}>
        {photo ? <img src={photo} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24}}/> : md.avatar_emoji || <img src="/logo.png" alt="" style={{width: '100%'}}/>}</motion.div>
      <p style={{margin: '10px 0 2px', fontWeight: 700, fontSize: 18}}>{md.name || md.full_name || 'Contul tău'}</p><small className="mu">{user.email}</small>
      <div className="chips" style={{justifyContent: 'center', flexWrap: 'wrap', marginTop: 10}}>{EMOJI.map(e => <button key={e} className="g sm" style={{fontSize: 20}} onClick={() => upd({avatar_emoji: e, avatar_photo: null}, 'a')}>{e}</button>)}</div>
      <button className="g sm" onClick={() => document.getElementById('av').click()}>📷 Poză de profil</button>
      <input id="av" type="file" accept="image/*" hidden onChange={upPhoto}/>
      {msg.a && <p className="mu" style={{margin: '6px 0 0'}}>{msg.a}</p>}</div>
    <div className="card"><b>👤 Date personale</b>
      <input placeholder="Cum să te strig (ex. Gabriel)" {...set('name')}/><input placeholder="Nume complet" {...set('full_name')}/>
      <input placeholder="Telefon (opțional)" inputMode="tel" {...set('phone')}/><input placeholder="Localitate (opțional)" {...set('city')}/>
      <motion.button whileTap={{scale: .96}} className="w" style={{marginTop: 6}} onClick={() => upd({...f}, 'p')}>Salvează</motion.button>{msg.p && <p className="mu" style={{margin: '6px 0 0'}}>{msg.p}</p>}</div>
    <div className="card"><b>✉️ Schimbă emailul</b><p className="mu" style={{margin: '4px 0'}}>Acum: {user.email}</p>
      <input type="email" placeholder="Email nou" value={mail} onChange={e => setMail(e.target.value)}/><button className="w" onClick={changeMail}>Trimite link de confirmare</button>{msg.m && <p className="mu" style={{margin: '6px 0 0'}}>{msg.m}</p>}</div>
    <div className="card"><b>🔑 Schimbă parola</b>
      <input type="password" placeholder="Parolă nouă (min. 6 caractere)" value={p1} onChange={e => setP1(e.target.value)}/><input type="password" placeholder="Repetă parola" value={p2} onChange={e => setP2(e.target.value)}/>
      <button className="w" onClick={changePass}>Schimbă parola</button>{msg.w && <p className="mu" style={{margin: '6px 0 0'}}>{msg.w}</p>}</div>
    <Mfa/>
    <div className="card"><b>⚙️ Aplicație</b><div className="grid" style={{marginTop: 8}}><button className="g" onClick={onTheme}>🎨 Aspect și teme</button><button className="g" onClick={() => sb.auth.signOut()}>Deconectare</button></div></div>
  </>
}
