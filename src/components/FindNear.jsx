import {useState} from 'react'
import {BRANDS} from '../data'

const IOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
const url = (prov, q) => prov === 'apple' ? `https://maps.apple.com/?q=${encodeURIComponent(q)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const EV = [['Toate stațiile', 'stație încărcare mașini electrice'], ['Tesla Supercharger', 'Tesla Supercharger'], ['MOL Plugee', 'MOL Plugee'], ['Eldrive', 'Eldrive'], ['Renovatio', 'Renovatio'], ['Publice / primărie', 'stație încărcare electrică publică']]

// Fără hartă în aplicație: deschide aplicația de hărți a telefonului, cu căutarea făcută în jurul tău.
export default function FindNear({ev}) {
  const dflt = IOS ? 'apple' : 'google'
  const [prov, setProv] = useState(() => { try { return localStorage.getItem('tgarage.maps') || dflt } catch { return dflt } })
  const pick = p => { setProv(p); try { localStorage.setItem('tgarage.maps', p) } catch {} }
  const items = ev ? EV : [['Toate', 'benzinărie'], ...BRANDS.map(b => [b, `${b} benzinărie`])]
  return <div className="card">
    <div className="row"><b>{ev ? '⚡ Stații de încărcare lângă tine' : '⛽ Benzinării lângă tine'}</b>
      <span style={{display: 'flex', gap: 6}}>{[['apple', 'Apple'], ['google', 'Google']].map(([k, l]) => <button key={k} className={prov === k ? 'sm' : 'g sm'} onClick={() => pick(k)}>{l}</button>)}</span></div>
    <small className="mu" style={{display: 'block', margin: '6px 0 8px'}}>Se deschide aplicația de hărți aleasă, cu căutarea făcută în jurul tău. Datele vin de la Hărți (stații noi, Tesla Supercharger, stații ale primăriilor), nu din aplicația noastră, iar prețurile nu apar acolo.</small>
    <div className="chips" style={{flexWrap: 'wrap'}}>{items.map(([n, q]) => <a key={n} className="btn g sm" href={url(prov, q)} target="_blank" rel="noreferrer">{n}</a>)}</div>
  </div>
}
