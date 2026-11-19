import {ro, ron, dt, daysTo, wear} from './util'
import {pdfFromJpegs} from './pdf'
import {APP} from '../brand'

const W = 1240, H = 1754, M = 90, F = '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif'
const loadImg = src => new Promise(res => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src })

export async function buildReport({car, docs, logs, parts, photoUrl}) {
  const logo = await loadImg('/logo.png'), photo = photoUrl ? await loadImg(photoUrl) : null
  const cvs = []
  let g, y
  const font = (s, w = 400) => { g.font = `${w} ${s}px ${F}` }
  const rr = (x, yy, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, yy, w, h, r); else g.rect(x, yy, w, h); g.fill() }
  const clip = (t, mw) => { if (!mw) return t; let s = t; while (s.length > 1 && g.measureText(s).width > mw) s = s.slice(0, -1); return s === t ? t : s.trimEnd() + '…' }
  const page = () => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; g = c.getContext('2d'); cvs.push(c)
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H)
    g.fillStyle = '#0b0d12'; g.fillRect(0, 0, W, 150)
    if (logo) { g.fillStyle = '#ffffff'; rr(M, 28, 94, 94, 22); g.drawImage(logo, M + 6, 34, 82, 82) }
    g.fillStyle = '#ffffff'; font(46, 700); g.fillText('Raport vânzare auto', M + 122, 80)
    g.fillStyle = '#9aa3b8'; font(27); g.fillText(`${APP} · ${new Date().toLocaleDateString('ro-RO')}`, M + 122, 120)
    y = 215
  }
  const need = h => { if (y + h > H - 130) page() }
  const h2 = t => { need(120); font(36, 700); g.fillStyle = '#0b0d12'; g.fillText(t, M, y); y += 22; g.fillStyle = '#e5e7eb'; g.fillRect(M, y, W - 2 * M, 3); y += 52 }
  const row = (cells, bold) => {
    need(60); font(27, bold ? 700 : 400); g.fillStyle = bold ? '#0b0d12' : '#1f2937'
    cells.forEach(([t, x, al, mw]) => { g.textAlign = al || 'left'; g.fillText(clip(String(t), mw), x, y) })
    g.textAlign = 'left'; g.fillStyle = '#eef2f7'; g.fillRect(M, y + 18, W - 2 * M, 2); y += 58
  }
  page()
  const top = y - 25, tw = photo ? 600 : W - 2 * M
  font(64, 700); g.fillStyle = '#0b0d12'; g.fillText(clip(`${car.brand} ${car.model || ''}`.trim(), tw), M, y + 35)
  font(30); g.fillStyle = '#374151'
  g.fillText(clip([car.year, car.powertrain, car.body, `${ro(car.odometer)} km`].filter(Boolean).join(' · '), tw), M, y + 95)
  if (car.vin) { font(26); g.fillStyle = '#6b7280'; g.fillText(`VIN ${car.vin}`, M, y + 140) }
  if (photo) {
    const bw = 460, bh = 300, bx = W - M - bw, k = Math.max(bw / photo.width, bh / photo.height), sw = bw / k, sh = bh / k
    g.save(); g.beginPath(); if (g.roundRect) g.roundRect(bx, top, bw, bh, 24); else g.rect(bx, top, bw, bh); g.clip()
    g.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, bx, top, bw, bh); g.restore(); y = top + bh + 50
  } else y += 200
  const tot = logs.reduce((s, l) => s + Number(l.part_cost) + Number(l.labor_cost), 0), bw3 = (W - 2 * M - 40) / 3
  need(160)
  ;[[String(logs.length), 'intervenții înregistrate'], [ron(tot), 'total investit în service'], [String(parts.length), 'piese urmărite']].forEach(([v, l], i) => {
    const x = M + i * (bw3 + 20); g.fillStyle = '#f1f5f9'; rr(x, y - 40, bw3, 130, 20)
    g.fillStyle = '#0b0d12'; font(40, 700); g.fillText(clip(v, bw3 - 30), x + 22, y + 18); g.fillStyle = '#6b7280'; font(24); g.fillText(clip(l, bw3 - 30), x + 22, y + 62)
  })
  y += 150
  h2('Acte')
  if (!docs.length) row([['Nu sunt înregistrate acte.', M]])
  docs.forEach(d => { const n = daysTo(d.expires_on); row([[d.type, M], [`valabil până la ${dt(d.expires_on)}${n < 0 ? ' (expirat)' : ''}`, M + 220, 'left', 560], [d.policy_number ? `poliță ${d.policy_number}` : '', W - M, 'right', 300]]) })
  y += 20; h2('Istoric service')
  if (!logs.length) row([['Nicio intervenție înregistrată.', M]])
  else {
    row([['Data', M], ['Km', M + 330, 'right'], ['Piesă / lucrare', M + 370], ['Cost', W - M, 'right']], true)
    logs.forEach(l => row([[dt(l.date), M], [ro(l.odometer), M + 330, 'right'], [l.part_name + (l.brand_oem ? ` · ${l.brand_oem}` : ''), M + 370, 'left', 520], [ron(Number(l.part_cost) + Number(l.labor_cost)), W - M, 'right']]))
    row([['Total', M], [ron(tot), W - M, 'right']], true)
  }
  y += 20; h2('Stare estimată a pieselor')
  parts.forEach(p => { const w = wear(p, car); row([[p.name, M, 'left', 560], [`ultima: ${dt(p.last_date)} · ${ro(p.last_odo)} km`, M + 600, 'left', 360], [`${Math.round(w.pct * 100)}%`, W - M, 'right']]) })
  need(70); font(22); g.fillStyle = '#6b7280'; g.fillText('Valorile pieselor sunt estimări orientative, calculate din datele introduse de proprietar.', M, y + 10)
  cvs.forEach((c, i) => { const x = c.getContext('2d'); x.fillStyle = '#9aa3b8'; x.font = `22px ${F}`; x.fillText(`Pagina ${i + 1} din ${cvs.length} · Date introduse de proprietar în ${APP}`, M, H - 60) })
  const pages = []
  for (const c of cvs) { const b = await new Promise(r => c.toBlob(r, 'image/jpeg', .88)); pages.push({w: W, h: H, data: new Uint8Array(await b.arrayBuffer())}) }
  return pdfFromJpegs(pages)
}
