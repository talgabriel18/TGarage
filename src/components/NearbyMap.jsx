import {useEffect, useRef, useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))
const dist = (a, b, c, d) => { const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)) }
const nav = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

export default function NearbyMap({kind}) {
  const el = useRef(null)
  const [pos, setPos] = useState(null), [list, setList] = useState([]), [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const label = kind === 'fuel' ? 'Benzinării' : 'Stații de încărcare'
  const ask = () => {
    if (!navigator.geolocation) return setMsg('Locația nu e disponibilă pe acest dispozitiv.')
    setBusy(true); setMsg('Se caută locația…')
    navigator.geolocation.getCurrentPosition(p => { setPos([p.coords.latitude, p.coords.longitude]); setBusy(false); setMsg('') },
      () => { setBusy(false); setMsg('Nu am primit acces la locație. Permite-l din setările telefonului.') }, {enableHighAccuracy: true, timeout: 12000})
  }
  useEffect(() => {
    if (!pos || !el.current) return
    const map = L.map(el.current).setView(pos, 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap'}).addTo(map)
    L.circleMarker(pos, {radius: 9, color: '#ffffff', weight: 3, fillColor: '#3b82f6', fillOpacity: 1}).addTo(map).bindPopup('Tu ești aici')
    let dead = false
    const q = `[out:json][timeout:15];(node["amenity"="${kind}"](around:3000,${pos[0]},${pos[1]});way["amenity"="${kind}"](around:3000,${pos[0]},${pos[1]}););out center 40;`
    setMsg('Se caută în apropiere…')
    fetch('https://overpass-api.de/api/interpreter', {method: 'POST', body: 'data=' + encodeURIComponent(q), headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
      .then(r => r.json()).then(j => {
        if (dead) return
        const items = (j.elements || [])
          .map(e => ({lat: e.lat != null ? e.lat : e.center && e.center.lat, lng: e.lon != null ? e.lon : e.center && e.center.lon, name: (e.tags && (e.tags.brand || e.tags.name || e.tags.operator)) || (kind === 'fuel' ? 'Benzinărie' : 'Stație de încărcare')}))
          .filter(x => x.lat != null && x.lng != null).map(x => ({...x, d: dist(pos[0], pos[1], x.lat, x.lng)})).sort((a, b) => a.d - b.d)
        setList(items.slice(0, 8)); setMsg(items.length ? '' : 'Nu am găsit nimic în raza de 3 km (datele vin din OpenStreetMap).')
        items.slice(0, 40).forEach(x => L.marker([x.lat, x.lng], {icon: L.divIcon({className: '', html: `<div class="pin">${kind === 'fuel' ? '⛽' : '⚡'}</div>`, iconSize: [30, 30], iconAnchor: [15, 15]})})
          .addTo(map).bindPopup(`<b>${esc(x.name)}</b><br>${x.d.toFixed(1)} km<br><a href="${nav(x.lat, x.lng)}" target="_blank" rel="noreferrer">Navighează</a>`))
      }).catch(() => { if (!dead) setMsg('Căutarea în apropiere nu a mers. Încearcă din nou.') })
    return () => { dead = true; map.remove() }
  }, [pos, kind])
  return <div className="card"><b>🗺️ {label} în apropiere</b>
    {!pos && <><p className="mu" style={{margin: '6px 0'}}>Vezi pe hartă unde ești și ce {kind === 'fuel' ? 'benzinării' : 'stații de încărcare'} sunt în jur de 3 km. Locația se folosește doar după ce apeși butonul.</p>
      <button className="w" disabled={busy} onClick={ask}>📍 Arată harta</button></>}
    {pos && <div ref={el} style={{height: 260, borderRadius: 16, marginTop: 8, overflow: 'hidden', position: 'relative', zIndex: 0}}/>}
    {msg && <small className="mu" style={{display: 'block', marginTop: 6}}>{msg}</small>}
    {list.map((x, i) => <a key={i} className="row" style={{padding: '9px 0', borderBottom: '1px solid var(--bd)', color: 'var(--tx)', textDecoration: 'none'}} target="_blank" rel="noreferrer" href={nav(x.lat, x.lng)}>
      <span>{kind === 'fuel' ? '⛽' : '⚡'} {x.name}</span><span className="mu">{x.d.toFixed(1)} km ›</span></a>)}
    <small className="mu" style={{display: 'block', marginTop: 8, fontSize: 12}}>Date: © OpenStreetMap. Locația ta se trimite către serverele OpenStreetMap doar după ce apeși „Arată harta”. Pot lipsi stații.</small></div>
}
