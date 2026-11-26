import {useEffect, useRef, useState} from 'react'
import {supabase as sb, mode} from './supabase'
const D = {tx: '#f2f4f8', mu: '#b6bfd0', card: 'rgba(22,27,40,.62)', bd: 'rgba(255,255,255,.08)', gbtn: 'rgba(255,255,255,.1)', inp: 'rgba(0,0,0,.28)', sheet: 'rgba(18,22,34,.95)'}
export const THEMES = [
  {id: 'noapte', n: 'Noapte', ...D, acc: '#6ea8ff', bg: 'radial-gradient(900px 500px at 0% -10%,#22346d 0%,transparent 60%),radial-gradient(800px 500px at 100% 0%,#4a2275 0%,transparent 55%),#0a0c12'},
  {id: 'aurora', n: 'Aurora', ...D, acc: '#2dd4bf', bg: '#05111a', blobs: ['#10b981', '#6366f1', '#06b6d4']},
  {id: 'asfalt', n: 'Asfalt', ...D, acc: '#ff8a3d', bg: 'radial-gradient(circle at 50% 0%,rgba(255,138,61,.2),transparent 55%),repeating-linear-gradient(45deg,#14161b 0 6px,#101216 6px 12px)'},
  {id: 'apus', n: 'Apus', ...D, card: 'rgba(30,15,50,.5)', acc: '#fcd34d', bg: 'linear-gradient(165deg,#2b1055 0%,#7a2a6b 50%,#f2784b 100%)'},
  {id: 'ocean', n: 'Ocean', ...D, card: 'rgba(3,27,42,.55)', acc: '#5eead4', bg: 'linear-gradient(165deg,#031b2a 0%,#0a4a5f 55%,#0f8b8d 100%)', blobs: ['#22d3ee', '#0ea5e9']},
  {id: 'padure', n: 'Pădure', ...D, card: 'rgba(7,20,13,.55)', acc: '#a3e635', bg: 'linear-gradient(165deg,#07140d,#0f3d2a 60%,#1f6b45)'},
  {id: 'lumina', n: 'Lumină', light: true, tx: '#10131a', mu: '#4a5367', card: 'rgba(255,255,255,.72)', bd: 'rgba(16,19,26,.08)', gbtn: 'rgba(16,19,26,.07)', inp: 'rgba(255,255,255,.85)', sheet: 'rgba(255,255,255,.97)', acc: '#3b82f6', bg: 'linear-gradient(160deg,#e8eeff 0%,#f7f9fc 60%,#fff3e6 100%)'},
]
export const ACCENTS = ['#6ea8ff', '#a78bfa', '#ff8a3d', '#f472b6', '#2dd4bf', '#a3e635']
const K = 'garaj3d.theme'
const read = () => { try { return {id: 'noapte', acc: null, calm: (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches), ...JSON.parse(localStorage.getItem(K) || '{}')} } catch { return {id: 'noapte', acc: null, calm: false} } }

export function useTheme(user) {
  const [th, setT] = useState(read), [img, setI] = useState(() => { try { return localStorage.getItem(K + '.img') } catch { return null } })
  const t = THEMES.find(x => x.id === th.id) || (th.id === 'custom' ? {...THEMES[0], id: 'custom', bg: THEMES[0].bg} : THEMES[0])
  useEffect(() => {
    const r = document.documentElement.style
    ;[['--tx', t.tx], ['--mu', t.mu], ['--card', t.card], ['--bd', t.bd], ['--gbtn', t.gbtn], ['--inp', t.inp], ['--sheet', t.sheet], ['--ac', th.acc || t.acc]].forEach(([k, v]) => r.setProperty(k, v))
    document.documentElement.classList.toggle('calm', !!th.calm)
    document.documentElement.style.colorScheme = t.light ? 'light' : 'dark'
  }, [th, t])
  const tm = useRef(null)
  const save = n => { if (mode === 'cloud' && sb) sb.auth.updateUser({data: {prefs: {id: n.id === 'custom' ? 'noapte' : n.id, acc: n.acc, calm: !!n.calm, stage: n.stage || 'studio', ts: n.ts}}}) }
  const setTh = p => setT(c => { const n = {...c, ...p, ts: Date.now()}; try { localStorage.setItem(K, JSON.stringify(n)) } catch {} clearTimeout(tm.current); tm.current = setTimeout(() => save(n), 900); return n })
  const rp = user && user.user_metadata && user.user_metadata.prefs
  useEffect(() => {
    if (!rp) return
    setT(c => { if ((rp.ts || 0) <= (c.ts || 0)) return c; const n = {...c, ...rp, id: rp.id === 'custom' ? c.id : rp.id}; try { localStorage.setItem(K, JSON.stringify(n)) } catch {} return n })
  }, [rp && rp.ts])
  const setImg = v => { setI(v); try { localStorage.setItem(K + '.img', v) } catch {} }
  return {th, setTh, img, setImg, t}
}

export async function fileToBg(file) {
  const i = await new Promise((res, rej) => { const x = new Image(); x.onload = () => res(x); x.onerror = rej; x.src = URL.createObjectURL(file) })
  const k = Math.min(1, 1000 / Math.max(i.width, i.height)), c = document.createElement('canvas')
  c.width = i.width * k; c.height = i.height * k; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', .72)
}
