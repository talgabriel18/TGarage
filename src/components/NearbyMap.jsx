import {useEffect, useRef, useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))
const dist = (a, b, c, d) => { const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)) }
const nav = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
const kwOf = t => { const v = Object.entries(t || {}).filter(([k]) => /^socket:.*:output$/.test(k) || k === 'charging_station:output').map(([, x]) => parseFloat(x)).filter(n => !isNaN(n)); return v.length ? Math.max(...v) : 0 }

// Serverele publice Overpass sunt uneori aglomerate: încercăm pe rând mai multe, fiecare cu limită de timp
async function overpass(q) {
  let last
  for (const u of MIRRORS) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000)
    try {
      const r = await fetch(u, {method: 'POST', body: 'data=' + encodeURIComponent(q), headers: {'Content-Type': 'application/x-www-form-urlencoded'}, signal: ctl.signal})
      clearTimeout(t); if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) { clearTimeout(t); last = e }
  }
  throw last
}

export default function NearbyMap({kind}) {
  const el = useRef(null), ev = kind === 'charging_station', R = ev ? 5000 : 3000
  const [pos, setPos] = useState(null), [list, setList] = useState([]), [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [err, setErr] = useState(false), [tries, setTries] = useState(0)
  const label = ev ? 'Stații de încărcare' : 'Benzinării'
  const ask = () => {
    if (!navigator.geolocation) return setMsg('Locația nu e disponibilă pe acest dispozitiv.')
    setBusy(true); setMsg('Se caută locația…')
    navigator.geolocation.getCurrentPosition(p => { setPos([p.coords.latitude, p.coords.longitude]); setBusy(false); setMsg('') },
      e => { setBusy(false); setMsg(e && e.code === 1 ? 'Accesul la locație e blocat. Pe iPhone: Setări → Confidențialitate și securitate → Servicii de localizare → Site-uri Safari → „Cât timp folosești aplicația”. Apoi reîncarcă și apasă din nou. În aplicația de pe ecranul principal, alege „Permite” când ți se cere.' : e && e.code === 3 ? 'Găsirea locației a durat prea mult. Încearcă din nou, de preferat afară.' : 'Locația nu e disponibilă acum. Verifică dacă Serviciile de localizare sunt pornite.') }, {enableHighAccuracy: true, timeout: 12000})
  }
  useEffect(() => {
    if (!pos || !el.current) return
    const map = L.map(el.current).setView(pos, ev ? 13 : 14)
    map.attributionControl.setPrefix(false)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap'}).addTo(map)
    L.circleMarker(pos, {radius: 9, color: '#ffffff', weight: 3, fillColor: '#3b82f6', fillOpacity: 1}).addTo(map).bindPopup('Tu ești aici')
    let dead = false
    const show = items => {
      if (dead) return
      setErr(false); setList(items.slice(0, 8))
      setMsg(items.length ? `Am găsit ${items.length} în jur de ${R / 1000} km.` : `Nu am găsit nimic în raza de ${R / 1000} km în OpenStreetMap. Datele pot fi incomplete.`)
      items.slice(0, 60).forEach(x => L.marker([x.lat, x.lng], {icon: L.divIcon({className: '', html: `<div class="pin">${ev ? '⚡' : '⛽'}</div>`, iconSize: [30, 30], iconAnchor: [15, 15]})})
        .addTo(map).bindPopup(`<b>${esc(x.name)}</b>${x.kw ? `<br>până la ${x.kw} kW` : ''}<br>${x.d.toFixed(1)} km<br><a href="${nav(x.lat, x.lng)}" target="_blank" rel="noreferrer">Navighează</a>`))
    }
    const ck = `nm:${kind}:${pos[0].toFixed(2)},${pos[1].toFixed(2)}`
    let cached = null; try { cached = JSON.parse(sessionStorage.getItem(ck) || 'null') } catch {}
    if (cached && tries === 0) show(cached)
    else {
      setMsg('Se caută în apropiere…'); setErr(false)
      const q = `[out:json][timeout:20];(node["amenity"="${kind}"](around:${R},${pos[0]},${pos[1]});way["amenity"="${kind}"](around:${R},${pos[0]},${pos[1]}););out center 80;`
      overpass(q).then(j => {
        const items = (j.elements || []).map(e => { const t = e.tags || {}; return {lat: e.lat != null ? e.lat : e.center && e.center.lat, lng: e.lon != null ? e.lon : e.center && e.center.lon,
          name: ev ? (t.brand || t.operator || t.name || 'Stație de încărcare') : (t.brand || t.name || t.operator || 'Benzinărie'), kw: ev ? kwOf(t) : 0} })
          .filter(x => x.lat != null && x.lng != null).map(x => ({...x, d: dist(pos[0], pos[1], x.lat, x.lng)})).sort((a, b) => a.d - b.d)
        try { sessionStorage.setItem(ck, JSON.stringify(items)) } catch {}
        show(items)
      }).catch(() => { if (!dead) { setErr(true); setMsg('Serviciul de hărți e ocupat acum. Reîncearcă peste câteva secunde.') } })
    }
    return () => { dead = true; map.remove() }
  }, [pos, kind, tries])
  return <div className="card"><b>🗺️ {label} în apropiere</b>
    {!pos && <><p className="mu" style={{margin: '6px 0'}}>Vezi pe hartă unde ești și ce {ev ? 'stații de încărcare' : 'benzinării'} sunt în jur de {R / 1000} km. Locația se folosește doar după ce apeși butonul.</p>
      <button className="w" disabled={busy} onClick={ask}>📍 Arată harta</button></>}
    {pos && <div ref={el} style={{height: 260, borderRadius: 16, marginTop: 8, overflow: 'hidden', position: 'relative', zIndex: 0}}/>}
    {msg && <small className="mu" style={{display: 'block', marginTop: 6}}>{msg}</small>}
    {err && <button className="g sm" style={{marginTop: 6}} onClick={() => setTries(n => n + 1)}>↻ Reîncearcă</button>}
    {list.map((x, i) => <a key={i} className="row" style={{padding: '9px 0', borderBottom: '1px solid var(--bd)', color: 'var(--tx)', textDecoration: 'none'}} target="_blank" rel="noreferrer" href={nav(x.lat, x.lng)}>
      <span>{ev ? '⚡' : '⛽'} {x.name}{x.kw ? <small className="mu"> · {x.kw} kW</small> : null}</span><span className="mu">{x.d.toFixed(1)} km ›</span></a>)}
    <small className="mu" style={{display: 'block', marginTop: 8, fontSize: 12}}>Date: © OpenStreetMap, adăugate de comunitate. Pot lipsi stații sau pot fi vechi; disponibilitatea în timp real nu e inclusă. Locația ta se trimite către serverele OpenStreetMap doar după ce apeși „Arată harta”.</small></div>
}
