import {motion} from 'framer-motion'
import {APP} from '../brand'

export default function Splash() {
  return <div style={{position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', zIndex: 30}}>
    <div style={{textAlign: 'center'}}>
      <motion.img src="/logo.png" className="logo big" alt="" initial={{scale: .3, opacity: 0, rotate: -15}} animate={{scale: 1, opacity: 1, rotate: 0}} transition={{type: 'spring', stiffness: 160, damping: 11}}/>
      <motion.h1 initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{delay: .25}} style={{margin: '14px 0 4px', fontSize: 30, letterSpacing: -.5}}>{APP}</motion.h1>
      <div style={{height: 4, width: 120, margin: '14px auto 0', borderRadius: 2, background: 'var(--gbtn)', overflow: 'hidden'}}>
        <motion.i style={{display: 'block', height: '100%', width: '40%', background: 'var(--ac)', borderRadius: 2}} animate={{x: [-50, 130]}} transition={{repeat: Infinity, duration: 1.1, ease: 'easeInOut'}}/></div>
    </div></div>
}
