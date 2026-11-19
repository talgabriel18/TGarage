import {useState} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {APP} from '../brand'

const SL = [
  ['🚗', 'Garajul tău, în 3D', 'Rotește mașina cu degetul și atinge punctele pulsatorii: vezi cât mai ține fiecare piesă.'],
  ['🔧', 'Estimări pentru piese', 'Alege piesele din catalog, iar aplicația estimează cât mai rezistă, în km și în ani.'],
  ['🔔', 'Memento-uri și PDF', 'ITP, RCA, CASCO, rovinietă, plus un raport PDF pentru vânzare, gata de trimis.'],
  ['👆', 'Glisează între taburi', 'Treci de la un tab la altul trăgând cu degetul spre stânga sau spre dreapta.'],
]

export default function Tour({onDone}) {
  const [i, setI] = useState(0), last = i === SL.length - 1
  return <div className="bk" style={{zIndex: 50, display: 'grid', placeItems: 'center'}}>
    <motion.div className="card" initial={{scale: .85, opacity: 0}} animate={{scale: 1, opacity: 1}} style={{width: 'min(90vw, 380px)', textAlign: 'center', padding: 26, background: 'var(--sheet)'}}>
      <small className="mu">Bine ai venit în {APP}</small>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{opacity: 0, x: 40}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -40}}>
          <div style={{fontSize: 64, margin: '14px 0 8px'}}>{SL[i][0]}</div><h2 style={{margin: '0 0 6px'}}>{SL[i][1]}</h2><p className="mu" style={{margin: 0}}>{SL[i][2]}</p>
        </motion.div>
      </AnimatePresence>
      <div style={{display: 'flex', gap: 6, justifyContent: 'center', margin: '18px 0'}}>{SL.map((_, k) => <i key={k} style={{width: k === i ? 22 : 8, height: 8, borderRadius: 4, background: k === i ? 'var(--ac)' : 'var(--gbtn)', transition: 'width .3s'}}/>)}</div>
      <div className="grid"><button className="g" onClick={onDone}>Sari peste</button><button onClick={() => last ? onDone() : setI(i + 1)}>{last ? 'Începe' : 'Mai departe'}</button></div>
    </motion.div>
  </div>
}
