import {useState} from 'react'
import {motion} from 'framer-motion'
import {APP, TAGLINE} from '../brand'
import {setMode} from '../lib/supabase'

const OPT = [
  ['local', 'Gratuit · pe dispozitiv', 'Fără cont', ['Totul rămâne pe acest telefon.', 'Nu ai nevoie de email sau parolă.', 'Dacă ștergi aplicația sau datele browserului, datele se pierd. Poți salva oricând o copie (Backup).', 'Sfat: adaugă aplicația pe ecranul principal.']],
  ['cloud', 'Pro · cont și cloud', 'Cu cont', ['Cont cu email și parolă, plus verificare în doi pași.', 'Datele sunt salvate în cloud.', 'Sincronizare între dispozitive și recuperare dacă îți pierzi telefonul.']],
]

export default function Chooser() {
  const [sel, setSel] = useState(null)
  const go = () => { setMode(sel); window.location.reload() }
  return <main>
    <div style={{textAlign: 'center', padding: '28px 0 8px'}}>
      <motion.img src="/logo.png" className="logo big" alt={APP} initial={{scale: .4, rotate: -12, opacity: 0}} animate={{scale: 1, rotate: 0, opacity: 1}} transition={{type: 'spring', stiffness: 180, damping: 12}}/>
      <h1 style={{margin: '14px 0 2px', fontSize: 30, letterSpacing: -.5}}>{APP}</h1><p className="mu" style={{margin: 0}}>{TAGLINE}</p>
      <p style={{margin: '16px 0 0', fontWeight: 600}}>Cum vrei să îți păstrezi datele?</p></div>
    {OPT.map(([k, t, b, items], i) => <motion.div key={k} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: .1 + i * .08}} whileTap={{scale: .98}} onClick={() => setSel(k)} className="card"
      style={{cursor: 'pointer', border: sel === k ? '2px solid var(--ac)' : '1px solid var(--bd)'}}>
      <div className="row"><b style={{fontSize: 18}}>{t}</b><span className="bd" style={{background: sel === k ? 'var(--ac)' : '#8886'}}>{b}</span></div>
      {items.map(x => <div key={x} style={{display: 'flex', gap: 8, marginTop: 6}}><span style={{color: 'var(--ok)'}}>✓</span><small className="mu" style={{fontSize: 14}}>{x}</small></div>)}
    </motion.div>)}
    <button className="w" disabled={!sel} onClick={go} style={{marginTop: 6}}>Continuă</button>
    <p className="mu" style={{textAlign: 'center', fontSize: 13}}>Poți schimba modul oricând din Cont → Confidențialitate și date.</p>
  </main>
}
