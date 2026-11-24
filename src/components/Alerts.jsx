import {useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'

export default function Alerts({list, read, onRead, onDel, onReadAll, onDelAll, onClose}) {
  const sup = typeof Notification !== 'undefined'
  const [perm, setPerm] = useState(sup ? Notification.permission : 'unsupported')
  const col = ['#8a93a6', '#f59e0b', '#ef4444'], unread = list.filter(a => !read.includes(a.id)).length
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>Notificări</h2><button className="g" onClick={onClose} aria-label="Închide">✕</button></div>
      {list.length > 0 && <div className="row" style={{margin: '2px 0 6px', flexWrap: 'wrap'}}>
        <small className="mu">{unread ? `${unread} necitite` : 'Toate sunt citite'}</small>
        <span style={{display: 'flex', gap: 6}}><button className="g sm" disabled={!unread} onClick={onReadAll}>Marchează tot citit</button><button className="g sm" onClick={onDelAll}>Șterge tot</button></span></div>}
      {list.length === 0 && <p className="mu">Totul e în regulă ✅ Nu ai nimic de rezolvat.</p>}
      <AnimatePresence initial={false}>
        {list.map(a => {
          const isRead = read.includes(a.id)
          return <motion.div key={a.id} layout initial={{opacity: 0}} animate={{opacity: isRead ? .55 : 1}} exit={{opacity: 0, x: 80, height: 0}} transition={{duration: .25}}
            onClick={() => onRead(a.id)} className="row" style={{padding: '10px 0', borderBottom: '1px solid var(--bd)', overflow: 'hidden', cursor: 'pointer'}}>
            <span style={{flex: 1}}>{a.icon} <b style={{fontWeight: isRead ? 500 : 700}}>{a.title}</b><br/><small className="mu">{a.text}</small></span>
            {!isRead && <i style={{width: 10, height: 10, borderRadius: 5, background: col[a.sev], flexShrink: 0}}/>}
            <button className="g sm" aria-label="Șterge notificarea" onClick={e => { e.stopPropagation(); onDel(a.id) }}>🗑</button>
          </motion.div>
        })}
      </AnimatePresence>
      <div className="card" style={{marginTop: 14}}>
        <b>Memento-uri pe telefon</b>
        <p className="mu" style={{margin: '6px 0'}}>Pentru memento-uri sigure, chiar dacă aplicația e închisă, folosește „Calendar (acte + service)” din tab-ul Acte: evenimentele intră în calendarul telefonului, cu alertă cu 14 zile înainte.</p>
        {perm === 'default' && <button className="g w" onClick={async () => setPerm(await Notification.requestPermission())}>🔔 Activează notificări în browser</button>}
        {perm === 'granted' && <small className="mu">Notificările din browser sunt active (apar când deschizi aplicația).</small>}
        {(perm === 'denied' || perm === 'unsupported') && <small className="mu">Notificările din browser nu sunt disponibile pe acest dispozitiv.</small>}
      </div>
    </motion.div></>
}
