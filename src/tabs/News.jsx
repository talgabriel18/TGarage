import {useEffect, useState} from 'react'
import {motion} from 'framer-motion'

const ago = ts => { const m = Math.max(1, Math.round((Date.now() - ts) / 6e4)); return m < 60 ? `acum ${m} min` : m < 1440 ? `acum ${Math.round(m / 60)} h` : `acum ${Math.round(m / 1440)} zile` }

export default function News() {
  const [d, setD] = useState(null), [err, setErr] = useState(''), [n, setN] = useState(0)
  useEffect(() => {
    let dead = false
    try { const c = JSON.parse(sessionStorage.getItem('pv.news') || 'null'); if (c && n === 0 && Date.now() - c.at < 6e5) { setD(c); return } } catch {}
    setErr(''); setD(null)
    fetch('/api/news').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(j => { if (dead) return; setD(j); try { sessionStorage.setItem('pv.news', JSON.stringify(j)) } catch {} })
      .catch(() => { if (!dead) setErr('Nu am putut încărca știrile acum. Încearcă din nou peste puțin timp.') })
    return () => { dead = true }
  }, [n])
  const ok = d ? d.sources.filter(s => s.ok).map(s => s.name) : [], bad = d ? d.sources.filter(s => !s.ok).map(s => s.name) : []
  return <>
    <div className="row" style={{marginBottom: 14}}><small className="mu">Top 10 știri auto de azi</small><button className="g sm" onClick={() => setN(x => x + 1)}>↻ Reîncarcă</button></div>
    {err && <div className="card"><p className="mu" style={{margin: 0}}>{err}</p></div>}
    {!d && !err && <div className="card shimmer" style={{height: 130}}/>}
    {d && d.items.length === 0 && <div className="card"><p className="mu" style={{margin: 0}}>Nu sunt știri disponibile acum.</p></div>}
    {d && d.items.map((x, i) => <motion.a key={x.link} className="card" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: i * .04}} href={x.link} target="_blank" rel="noreferrer" style={{display: 'block', color: 'var(--tx)', textDecoration: 'none'}}>
      <div className="row" style={{alignItems: 'flex-start', gap: 14}}><b style={{opacity: .45, minWidth: 18}}>{i + 1}</b><span style={{flex: 1}}><b style={{fontWeight: 650}}>{x.title}</b><br/><small className="mu">{x.source} · {ago(x.ts)}</small></span></div></motion.a>)}
    {d && <small className="mu" style={{display: 'block', margin: '4px 0 10px'}}>Titlurile aparțin publicațiilor; apasă ca să citești articolul. Surse active: {ok.join(', ') || 'niciuna'}{bad.length ? ` · fără răspuns: ${bad.join(', ')}` : ''}.</small>}
  </>
}
