import {useState} from 'react'
import {motion} from 'framer-motion'
import {LEGAL} from '../legal'
import {mailto} from '../lib/diag'
import {mode} from '../lib/supabase'
import {APP} from '../brand'

const SHORT = {termeni: ['📜', 'Termeni și condiții'], confid: ['🔒', 'Confidențialitate'], stergere: ['🗑️', 'Ștergere date și cont']}

export default function LegalSheet({onClose, email}) {
  const [k, setK] = useState(null), d = k && LEGAL[k]
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row">{k ? <button className="g sm" onClick={() => setK(null)}>‹ Înapoi</button> : <h2 style={{margin: 0}}>Informații legale</h2>}<button className="g" aria-label="Închide" onClick={onClose}>✕</button></div>
      {!k && <div style={{display: 'grid', gap: 12, marginTop: 10}}>
        {Object.keys(LEGAL).map(key => <button key={key} className="g" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '16px 18px'}} onClick={() => setK(key)}>
          <span>{SHORT[key][0]} {SHORT[key][1]}</span><span className="mu">›</span></button>)}
        <small className="mu">Texte-model, nefinalizate: completează datele operatorului și validează-le cu un specialist înainte de lansarea publică.</small></div>}
      {d && <>
        <h2 style={{margin: '14px 0 10px'}}>{d.t}</h2>
        {d.body.map(([t, x]) => <div key={t} style={{marginBottom: 14}}><b>{t}</b><p className="mu" style={{margin: '4px 0 0'}}>{x}</p></div>)}
        {k === 'stergere' && (mode === 'local'
          ? <small className="mu">În modul Gratuit nu ai cont: ștergi tot din Cont → Confidențialitate și date.</small>
          : <a className="btn w" href={mailto(`Cerere ștergere cont ${APP}`, `Doresc ștergerea contului asociat adresei ${email || '[emailul contului]'} și a datelor din el.`)}>✉️ Cere ștergerea contului</a>)}</>}
    </motion.div></>
}
