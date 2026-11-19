import {createClient} from '@supabase/supabase-js'
import {local} from './localdb'

const u = import.meta.env.VITE_SUPABASE_URL, k = import.meta.env.VITE_SUPABASE_ANON_KEY
export const configOk = /^https?:\/\/\S+$/.test(u || '') && !!k

// 'local' = gratuit, pe dispozitiv · 'cloud' = Pro, cont + cloud · null = prima deschidere (alegere)
const detect = () => {
  try {
    const m = localStorage.getItem('tgarage.mode')
    if (m === 'local' || m === 'cloud') return m
    if (Object.keys(localStorage).some(x => /^sb-.+-auth-token$/.test(x))) return 'cloud'
  } catch {}
  return null
}
export const mode = detect()
export const setMode = m => { try { localStorage.setItem('tgarage.mode', m) } catch {} }
export const switchMode = m => { setMode(m); window.location.reload() }
export const supabase = mode === 'local' ? local : (configOk ? createClient(u, k) : null)
