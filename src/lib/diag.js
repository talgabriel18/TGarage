import {APP, VERSION, SUPPORT_EMAIL} from '../brand'
import {mode} from './supabase'

const K = 'tgarage.errs'
const read = () => { try { return JSON.parse(sessionStorage.getItem(K) || '[]') } catch { return [] } }
// Păstrează local ultimele 5 erori (nu se trimit nicăieri decât dacă tu trimiți emailul de feedback)
export function installDiag() {
  const push = m => { try { const a = read(); a.push(`${new Date().toISOString()} ${String(m).slice(0, 200)}`); sessionStorage.setItem(K, JSON.stringify(a.slice(-5))) } catch {} }
  window.addEventListener('error', e => push(e.message))
  window.addEventListener('unhandledrejection', e => push((e.reason && e.reason.message) || e.reason))
}
export function mailto(subject, extra = '', to = SUPPORT_EMAIL) {
  const body = [extra, '', '--- Informații tehnice (poți șterge ce nu vrei să trimiți) ---', `Aplicație: ${APP} ${VERSION}`, `Mod: ${mode === 'local' ? 'gratuit (local)' : 'Pro (cloud)'}`, `Dispozitiv: ${navigator.userAgent}`, `Ultimele erori: ${read().join(' | ') || 'niciuna'}`].join('\n')
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
