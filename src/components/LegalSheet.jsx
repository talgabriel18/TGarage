import {useState} from 'react'
import {motion} from 'framer-motion'
import {LEGAL} from '../legal'
import {mailto} from '../lib/diag'
import {mode} from '../lib/supabase'
import {APP} from '../brand'

export default function LegalSheet({onClose, email}) {
  const [k, setK] = useState('termeni'), d = LEGAL[k]
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2 style={{margin: 0}}>Informații legale</h2><button className="g" aria-label="Închide" onClick={onClose}>✕</button></div>
      <div className="chips" style={{marginTop: 8}}>{Object.entries(LEGAL).map(([key, v]) => <button key={key} className={k === key ? 'sm' : 'g sm'} onClick={() => setK(key)}>{v.t}</button>)}</div>
      <h2 style={{margin: '8px 0'}}>{d.t}</h2>
      {d.body.map(([t, x]) => <div key={t} style={{marginBottom: 12}}><b>{t}</b><p className="mu" style={{margin: '4px 0 0'}}>{x}</p></div>)}
      {k === 'stergere' && (mode === 'local'
        ? <small className="mu">În modul Gratuit nu ai cont: ștergi tot din Cont → Confidențialitate și date.</small>
        : <a className="btn w" href={mailto(`Cerere ștergere cont ${APP}`, `Doresc ștergerea contului asociat adresei ${email || '[emailul contului]'} și a datelor din el.`)}>✉️ Cere ștergerea contului</a>)}
      <small className="mu" style={{display: 'block', marginTop: 14}}>Text-model, nefinalizat: completează datele operatorului și validează-l cu un specialist înainte de lansarea publică.</small>
    </motion.div></>
}
