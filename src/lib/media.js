import {useEffect, useState} from 'react'
import {supabase as sb} from './supabase'
export async function upload(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file) })
  const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas')
  c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .8))
  const {data: {user}} = await sb.auth.getUser(), path = `${user.id}/${Date.now()}.jpg`
  const {error} = await sb.storage.from('media').upload(path, blob, {contentType: 'image/jpeg'})
  if (error) throw error
  return path
}
export async function signed(path) {
  if (!path) return null
  const {data} = await sb.storage.from('media').createSignedUrl(path, 3600)
  return data?.signedUrl || null
}
export const openFile = async p => { const u = await signed(p); if (u) window.open(u, '_blank') }
export function useUrl(path) {
  const [u, setU] = useState(null)
  useEffect(() => { let ok = true; signed(path).then(x => ok && setU(x)); return () => { ok = false } }, [path])
  return u
}
