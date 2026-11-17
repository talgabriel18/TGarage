import {motion} from 'framer-motion'
import {THEMES, ACCENTS, fileToBg} from '../lib/theme'

export default function Settings({th, setTh, setImg, onClose}) {
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2>Setări</h2><button className="g" onClick={onClose}>✕</button></div>
      <b>Fundal</b>
      <div className="tiles">
        {THEMES.map(x => <motion.div key={x.id} whileTap={{scale: .94}} className={'tile' + (th.id === x.id ? ' on' : '')} style={{background: x.bg, color: x.light ? '#10131a' : '#fff'}} onClick={() => setTh({id: x.id})}>{x.n}</motion.div>)}
        <label className={'tile' + (th.id === 'custom' ? ' on' : '')} style={{background: 'var(--gbtn)'}}>📷 Poza mea
          <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files[0]; if (f) { setImg(await fileToBg(f)); setTh({id: 'custom'}) } }}/></label>
      </div>
      <b style={{display: 'block', marginTop: 16}}>Culoare accent</b>
      <div className="row" style={{justifyContent: 'flex-start', flexWrap: 'wrap', margin: '8px 0'}}>
        <button className="g sm" onClick={() => setTh({acc: null})}>Implicit</button>
        {ACCENTS.map(c => <motion.button key={c} whileTap={{scale: .85}} className={'sw' + (th.acc === c ? ' on' : '')} style={{background: c}} onClick={() => setTh({acc: c})}/>)}
      </div>
      <label className="row" style={{marginTop: 12}}><span>Animații reduse</span><input type="checkbox" style={{width: 26}} checked={!!th.calm} onChange={e => setTh({calm: e.target.checked})}/></label>
      <small className="mu">Alegerile se salvează pe acest dispozitiv.</small>
    </motion.div></>
}
