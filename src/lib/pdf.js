// Asamblare PDF fara biblioteci: fiecare pagina e o imagine JPEG A4
export function pdfFromJpegs(pages) {
  const enc = new TextEncoder(), chunks = [], off = []
  let len = 0
  const w = x => { const u = typeof x === 'string' ? enc.encode(x) : x; chunks.push(u); len += u.length }
  const n = 2 + pages.length * 3
  w('%PDF-1.4\n')
  off[1] = len; w('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  off[2] = len; w(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, k) => `${3 + 3 * k} 0 R`).join(' ')}] >>\nendobj\n`)
  pages.forEach((p, k) => {
    const pg = 3 + 3 * k, ct = pg + 1, im = pg + 2, c = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q'
    off[pg] = len; w(`${pg} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>\nendobj\n`)
    off[ct] = len; w(`${ct} 0 obj\n<< /Length ${c.length} >>\nstream\n${c}\nendstream\nendobj\n`)
    off[im] = len; w(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.data.length} >>\nstream\n`)
    w(p.data); w('\nendstream\nendobj\n')
  })
  const x = len
  w(`xref\n0 ${n + 1}\n0000000000 65535 f \n` + Array.from({length: n}, (_, i) => String(off[i + 1]).padStart(10, '0') + ' 00000 n \n').join(''))
  w(`trailer\n<< /Size ${n + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`)
  return new Blob(chunks, {type: 'application/pdf'})
}
