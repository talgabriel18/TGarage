// Funcție serverless (Vercel): citește fluxuri RSS publice ale publicațiilor auto și întoarce top 10 titluri din ziua curentă.
// Se afișează doar titlul, sursa și linkul către articol. Verifică termenii fiecărei publicații înainte de lansarea publică.
// ATENȚIE: adresele fluxurilor românești de mai jos NU sunt verificate. Dacă una nu răspunde, e ignorată, iar aplicația arată ce surse au funcționat.
const FEEDS = [
  {name: 'Autoblog.ro', url: 'https://www.autoblog.ro/feed/'},
  {name: 'Automarket', url: 'https://www.automarket.ro/rss/'},
  {name: 'Auto Bild România', url: 'https://www.auto-bild.ro/rss.xml'},
  {name: 'Autocar (UK)', url: 'https://www.autocar.co.uk/rss/latestnews'},
]

const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&amp;/g, '&')
const text = (b, t) => { const m = b.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'i')); return m ? dec(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '')).trim() : '' }
function parse(xml, source) {
  return xml.split(/<item[\s>]|<entry[\s>]/i).slice(1).map(b => {
    let link = text(b, 'link')
    if (!link) { const m = b.match(/<link[^>]*href=["']([^"']+)["']/i); link = m ? m[1] : '' }
    const d = Date.parse(text(b, 'pubDate') || text(b, 'published') || text(b, 'updated') || text(b, 'dc:date'))
    return {title: text(b, 'title'), link, ts: isNaN(d) ? 0 : d, source}
  }).filter(x => x.title && /^https?:\/\//.test(x.link))
}

export default async function handler(req, res) {
  const results = await Promise.allSettled(FEEDS.map(async f => {
    const r = await fetch(f.url, {headers: {'User-Agent': 'PitVaultNews/1.0'}, signal: AbortSignal.timeout(8000)})
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return parse(await r.text(), f.name)
  }))
  const sources = results.map((r, i) => ({name: FEEDS[i].name, ok: r.status === 'fulfilled' && r.value.length > 0, count: r.status === 'fulfilled' ? r.value.length : 0}))
  const now = Date.now(), seen = new Set()
  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []).filter(x => x.ts && x.ts <= now + 36e5).sort((a, b) => b.ts - a.ts)
    .filter(x => { const k = x.title.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true })
  const today = all.filter(x => now - x.ts < 864e5)
  const items = (today.length >= 10 ? today : all.filter(x => now - x.ts < 3 * 864e5)).slice(0, 10)
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600')
  res.status(200).json({items, sources, at: now})
}
