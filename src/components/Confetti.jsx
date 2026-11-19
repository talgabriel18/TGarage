import {useEffect, useMemo, useState} from 'react'
import {motion} from 'framer-motion'

const COL = ['#6ea8ff', '#f59e0b', '#10b981', '#f472b6', '#a78bfa', '#facc15']

export default function Confetti() {
  const [on, setOn] = useState(true)
  const bits = useMemo(() => Array.from({length: 26}, (_, i) => ({x: (Math.random() - .5) * 340, y: -(220 + Math.random() * 260), r: Math.random() * 540 - 270, c: COL[i % COL.length], s: 8 + Math.random() * 7, d: Math.random() * .12})), [])
  useEffect(() => { const t = setTimeout(() => setOn(false), 1800); return () => clearTimeout(t) }, [])
  if (!on) return null
  return <div style={{position: 'fixed', left: '50%', bottom: 120, zIndex: 40, pointerEvents: 'none'}}>
    {bits.map((b, i) => <motion.i key={i} style={{position: 'absolute', width: b.s, height: b.s * .6, background: b.c, borderRadius: 2}}
      initial={{x: 0, y: 0, opacity: 1, rotate: 0}} animate={{x: b.x, y: [0, b.y, b.y + 260], opacity: [1, 1, 0], rotate: b.r}} transition={{duration: 1.5, delay: b.d, ease: 'easeOut'}}/>)}
  </div>
}
