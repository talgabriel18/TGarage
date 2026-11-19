import {useState} from 'react'
import {motion} from 'framer-motion'

export default function Alerts({list, onClose}) {
  const sup = typeof Notification !== 'undefined'
  const [perm, setPerm] = useState(sup ? Notification.permission : 'unsupported')
  const col = ['#8a93a6', '#f59e0b', '#ef4444']
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>Notificări</h2><button className="g" onClick={onClose}>✕</button></div>
      {list.length === 0 && <p className="mu">Totul e în regulă ✅ Nu ai nimic de rezolvat.</p>}
      {list.map(a => <div key={a.id} className="row" style={{padding: '10px 0', borderBottom: '1px solid var(--bd)'}}>
        <span>{a.icon} <b>{a.title}</b><br/><small className="mu">{a.text}</small></span>
        <i style={{width: 10, height: 10, borderRadius: 5, background: col[a.sev], flexShrink: 0}}/></div>)}
      <div className="card" style={{marginTop: 14}}>
        <b>Memento-uri pe telefon</b>
        <p className="mu" style={{margin: '6px 0'}}>Pentru memento-uri sigure, chiar dacă aplicația e închisă, folosește „Calendar (acte + service)” din tab-ul Acte: evenimentele intră în calendarul telefonului, cu alertă cu 14 zile înainte.</p>
        {perm === 'default' && <button className="g w" onClick={async () => setPerm(await Notification.requestPermission())}>🔔 Activează notificări în browser</button>}
        {perm === 'granted' && <small className="mu">Notificările din browser sunt active (apar când deschizi aplicația).</small>}
        {(perm === 'denied' || perm === 'unsupported') && <small className="mu">Notificările din browser nu sunt disponibile pe acest dispozitiv.</small>}
      </div>
    </motion.div></>
}
