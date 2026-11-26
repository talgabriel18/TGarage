import {useEffect, useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {supabase as sb, mode, switchMode} from '../lib/supabase'
import LegalSheet from '../components/LegalSheet'
import {mailto} from '../lib/diag'
import {APP} from '../brand'
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
    const {data, error} = await sb.auth.mfa.enroll({factorType: 'totp', friendlyName: 'PitVault ' + Date.now()})
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
      <p className="sel" style={{wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 13, textAlign: 'center'}}>{en.totp.secret}</p>
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
  const [mail, setMail] = useState(''), [p1, setP1] = useState(''), [p2, setP2] = useState(''), [page, setPage] = useState(null), [legal, setLegal] = useState(false)
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
  const wipe = async () => {
    if (!window.confirm('Ștergi TOATE mașinile și istoricul lor? Acțiunea nu se poate anula.')) return
    const t = window.prompt('Scrie STERGE ca să confirmi:'); if ((t || '').trim().toUpperCase() !== 'STERGE') return say('x', 'Anulat.')
    const a = await sb.from('vehicles').delete().not('id', 'is', null), b = await sb.from('prices').delete().not('key', 'is', null)
    try { const {data} = await sb.storage.from('media').list(user.id); if (data && data.length) await sb.storage.from('media').remove(data.map(x => `${user.id}/${x.name}`)) } catch {}
    say('x', a.error || b.error ? (a.error || b.error).message : 'Datele au fost șterse. Reîncarcă aplicația.')
  }
  const set = k => ({value: f[k], onChange: e => setF({...f, [k]: e.target.value})})
  const local = mode === 'local'
  const swap = () => {
    const txt = local ? 'Treci la Pro? Datele de pe acest telefon rămân aici. Ca să le muți în cont: exportă acum Backup JSON (tab Acte), apoi importă-l după ce te autentifici.' : 'Treci la modul gratuit? Datele din cloud rămân în contul tău. În modul gratuit începi cu un spațiu gol, pe acest telefon.'
    if (window.confirm(txt)) switchMode(local ? 'cloud' : 'local')
  }
  const Row = ({i, t, s, onClick}) => <div className="mrow" onClick={onClick}><span className="mi">{i}</span><span style={{flex: 1}}><b>{t}</b>{s && <><br/><small className="mu">{s}</small></>}</span><span className="mu">›</span></div>
  const Back = ({t}) => <div className="row" style={{justifyContent: 'flex-start', gap: 10, margin: '2px 0 8px'}}><button className="g sm" onClick={() => setPage(null)}>‹ Înapoi</button><b style={{fontSize: 18}}>{t}</b></div>
  const face = photo ? <img src={photo} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : md.avatar_emoji || <img src="/logo.png" alt="" style={{width: '100%'}}/>
  return <>
    {!page && <>
      <div className="card" style={{display: 'flex', alignItems: 'center', gap: 12, padding: 12}}>
        <div className="logo av" style={{width: 46, height: 46, fontSize: 24}}>{face}</div>
        <div style={{flex: 1, minWidth: 0}}><div style={{fontWeight: 700, fontSize: 17}}>{md.name || md.full_name || 'Contul tău'}</div><small className="mu">{local ? 'Mod gratuit · pe dispozitiv' : user.email}</small></div></div>
      <div className="card" style={{padding: 12}}><div className="eyebrow">● CONFIDENȚIALITATE</div>
        <div style={{fontWeight: 700, marginTop: 4}}>{local ? 'Nimic nu pleacă de pe acest telefon fără să ceri tu.' : 'Datele tale sunt doar ale tale.'}</div>
        <small className="mu">{local ? 'Datele, estimările și PDF-urile rămân pe dispozitiv. Fără cont, reclame sau urmărire.' : 'Salvate în contul tău, vizibile doar ție. Fără reclame sau urmărire.'}</small></div>
      <div className="card" style={{padding: '4px 14px'}}>
        <Row i="👤" t="Detalii personale" s="Nume, telefon, localitate, poză" onClick={() => setPage('personal')}/>
        {!local && <Row i="🔐" t="Securitate" s="Email, parolă, verificare în doi pași" onClick={() => setPage('sec')}/>}
        <Row i="🛡️" t="Confidențialitate și date" s={local ? 'Gratuit · pe dispozitiv' : 'Pro · cont și cloud'} onClick={() => setPage('priv')}/>
        <Row i="🎨" t="Aspect și teme" s="Fundal, culoare, scena 3D" onClick={onTheme}/>
        <Row i="📄" t="Informații legale" s="Termeni, confidențialitate, ștergerea datelor" onClick={() => setLegal(true)}/>
        <Row i="💬" t="Feedback și probleme" s="Trimite un email cu detaliile tehnice" onClick={() => { window.location.href = mailto(`Feedback ${APP}`, 'Scrie aici mesajul tău:') }}/>
        {!local && <Row i="🚪" t="Deconectare" onClick={() => sb.auth.signOut()}/>}
      </div></>}
    <AnimatePresence mode="wait">{page && <motion.div key={page} initial={{opacity: 0, x: 40}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -40}} transition={{duration: .2}}>
      {page === 'personal' && <>
        <Back t="Detalii personale"/>
        <div className="card" style={{textAlign: 'center'}}>
          <motion.div key={md.avatar_emoji || photo || 'l'} initial={{scale: .6}} animate={{scale: 1}} transition={{type: 'spring', stiffness: 260, damping: 14}} className="logo av" style={{width: 64, height: 64, fontSize: 34, margin: '0 auto'}}>{face}</motion.div>
          <div className="chips" style={{justifyContent: 'center', flexWrap: 'wrap', marginTop: 10}}>{EMOJI.map(e => <button key={e} className="g sm" style={{fontSize: 20}} onClick={() => upd({avatar_emoji: e, avatar_photo: null}, 'a')}>{e}</button>)}</div>
          <button className="g sm" onClick={() => document.getElementById('av').click()}>📷 Poză de profil</button>
          <input id="av" type="file" accept="image/*" hidden onChange={upPhoto}/>
          {msg.a && <p className="mu" style={{margin: '6px 0 0'}}>{msg.a}</p>}</div>
        <div className="card"><b>Date personale</b>
          <input placeholder="Cum să te strig (ex. Gabriel)" {...set('name')}/><input placeholder="Nume complet" {...set('full_name')}/>
          <input placeholder="Telefon (opțional)" inputMode="tel" {...set('phone')}/><input placeholder="Localitate (opțional)" {...set('city')}/>
          <motion.button whileTap={{scale: .96}} className="w" style={{marginTop: 6}} onClick={() => upd({...f}, 'p')}>Salvează</motion.button>{msg.p && <p className="mu" style={{margin: '6px 0 0'}}>{msg.p}</p>}</div></>}
      {page === 'sec' && <>
        <Back t="Securitate"/>
        <div className="card"><b>✉️ Schimbă emailul</b><p className="mu" style={{margin: '4px 0'}}>Acum: {user.email}</p>
          <input type="email" placeholder="Email nou" value={mail} onChange={e => setMail(e.target.value)}/><button className="w" onClick={changeMail}>Trimite link de confirmare</button>{msg.m && <p className="mu" style={{margin: '6px 0 0'}}>{msg.m}</p>}</div>
        <div className="card"><b>🔑 Schimbă parola</b>
          <input type="password" placeholder="Parolă nouă (min. 6 caractere)" value={p1} onChange={e => setP1(e.target.value)}/><input type="password" placeholder="Repetă parola" value={p2} onChange={e => setP2(e.target.value)}/>
          <button className="w" onClick={changePass}>Schimbă parola</button>{msg.w && <p className="mu" style={{margin: '6px 0 0'}}>{msg.w}</p>}</div>
        <Mfa/></>}
      {page === 'priv' && <>
        <Back t="Confidențialitate și date"/>
        <div className="card"><b>📍 Unde îți sunt datele</b>
          <p className="mu" style={{margin: '6px 0 0'}}>{local ? 'Sunt salvate doar pe acest dispozitiv, în browser. Nu le trimitem nicăieri. Dacă ștergi aplicația sau datele site-ului, se pierd. Exportă din când în când o copie (tab Acte → Backup JSON sau CSV). Pe iPhone, adaugă aplicația pe ecranul principal.' : 'Sunt salvate în contul tău din cloud, vizibile doar ție, cu autentificare (și cu 2FA, dacă îl activezi). Poți exporta oricând o copie (tab Acte → Backup JSON sau CSV).'}</p></div>
        <div className="card"><b>Modul aplicației</b>
          <div className="plan"><div className="row"><b>Gratuit · pe dispozitiv</b>{local && <span className="bd" style={{background: 'var(--ok)'}}>Activ</span>}</div><small className="mu">Fără cont. Totul rămâne pe acest telefon.</small></div>
          <div className="plan"><div className="row"><b>Pro · cont și cloud</b>{!local && <span className="bd" style={{background: 'var(--ok)'}}>Activ</span>}</div><small className="mu">Cont cu email și parolă. Copie în cloud, sincronizare între dispozitive și recuperare dacă îți pierzi telefonul.</small></div>
          <button className="g w" style={{marginTop: 10}} onClick={swap}>{local ? 'Treci la Pro (cont + cloud)' : 'Treci la modul gratuit (local)'}</button></div>
        <div className="card"><b>🌐 Servicii externe</b>
          <p className="mu" style={{margin: '6px 0 0'}}>Butonul „Din VIN” trimite seria de șasiu către un serviciu public (NHTSA), doar când îl apeși. Butoanele din Consum pentru benzinării și stații de încărcare deschid aplicația de hărți aleasă (Apple sau Google), care folosește locația ta. Fila Știri cere titlurile de la serverul aplicației. {local ? 'În afară de acestea, nimic nu pleacă de pe telefon.' : 'În afară de acestea, aplicația trimite doar datele tale către contul tău din cloud.'}</p></div>
        <div className="card"><b>🗑️ Șterge datele</b><p className="mu" style={{margin: '6px 0'}}>Șterge toate mașinile, istoricul și pozele {local ? 'de pe acest telefon' : 'din contul tău'}. Acțiunea nu se poate anula.</p><button className="g w" onClick={wipe}>Șterge toate datele mele</button>{msg.x && <p className="mu" style={{margin: '6px 0 0'}}>{msg.x}</p>}</div></>}
    </motion.div>}</AnimatePresence>
  {legal && <LegalSheet email={user.email} onClose={() => setLegal(false)}/>}
  </>
}
