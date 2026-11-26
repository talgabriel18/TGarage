import {motion} from 'framer-motion'
import {THEMES, ACCENTS, fileToBg} from '../lib/theme'
import {mode} from '../lib/supabase'

const Sec = ({t, d, children}) => <div style={{marginTop: 26}}><div style={{fontWeight: 700, fontSize: 16}}>{t}</div>{d && <small className="mu" style={{display: 'block', marginTop: 2}}>{d}</small>}<div style={{marginTop: 12}}>{children}</div></div>

export default function Settings({th, setTh, setImg, onClose}) {
  return <>
    <div className="bk" onClick={onClose}/>
    <motion.div className="sheet" initial={{y: '100%'}} animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 28}}>
      <div className="row"><h2 style={{margin: 0}}>Aspect</h2><button className="g" onClick={onClose} aria-label="Închide">✕</button></div>
      <Sec t="Fundal" d="Alege o temă sau o poză din galerie.">
        <div className="tiles">
          {THEMES.map(x => <motion.div key={x.id} whileTap={{scale: .94}} className={'tile' + (th.id === x.id ? ' on' : '')} style={{background: x.bg, color: x.light ? '#10131a' : '#fff'}} onClick={() => setTh({id: x.id})}>{x.n}</motion.div>)}
          <label className={'tile' + (th.id === 'custom' ? ' on' : '')} style={{background: 'var(--gbtn)'}}>📷 Poza mea
            <input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files[0]; if (f) { setImg(await fileToBg(f)); setTh({id: 'custom'}) } }}/></label>
        </div></Sec>
      <Sec t="Scena 3D" d="Cum arată spațiul din jurul mașinii.">
        <div className="grid3" style={{margin: 0}}>{[['studio', '🎬 Studio'], ['garaj', '🏠 Garaj'], ['neon', '🌃 Neon']].map(([k, l]) => <button key={k} className={(th.stage || 'studio') === k ? '' : 'g'} onClick={() => setTh({stage: k})}>{l}</button>)}</div></Sec>
      <Sec t="Culoare accent" d="Culoarea butoanelor și a evidențierilor.">
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center'}}>
          <button className="g sm" onClick={() => setTh({acc: null})}>Implicit</button>
          {ACCENTS.map(c => <motion.button key={c} aria-label={`Accent ${c}`} whileTap={{scale: .85}} className={'sw' + (th.acc === c ? ' on' : '')} style={{background: c}} onClick={() => setTh({acc: c})}/>)}
        </div></Sec>
      <Sec t="Animații">
        <label className="row" style={{gap: 16}}><span><span style={{display: 'block'}}>Animații reduse</span><small className="mu">Oprește mișcările de fundal și tranzițiile.</small></span>
          <input type="checkbox" className="switch" role="switch" checked={!!th.calm} onChange={e => setTh({calm: e.target.checked})}/></label></Sec>
      <small className="mu" style={{display: 'block', marginTop: 24}}>{mode === 'cloud' ? 'Alegerile se salvează și în contul tău, ca să le regăsești după reinstalare (poza de fundal rămâne doar pe acest dispozitiv).' : 'Alegerile se salvează pe acest dispozitiv.'}</small>
    </motion.div></>
}
