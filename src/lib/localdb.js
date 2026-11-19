// Mod gratuit: același API folosit de aplicație (subset supabase-js), dar datele stau pe dispozitiv.
// Tabelele în localStorage, pozele în IndexedDB.
const TABLES = ['vehicles', 'vehicle_parts', 'maintenance_logs', 'fuel_logs', 'documents', 'prices', 'expenses']
const CHILD = ['vehicle_parts', 'maintenance_logs', 'fuel_logs', 'documents', 'expenses']
const K = 'tgarage.local.'
const today = () => new Date().toISOString().slice(0, 10)
const uuid = () => (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16) })
const load = t => { try { return JSON.parse(localStorage.getItem(K + t) || '[]') } catch { return [] } }
const cache = Object.fromEntries(TABLES.map(t => [t, load(t)]))
const persist = t => { try { localStorage.setItem(K + t, JSON.stringify(cache[t])) } catch (e) { console.error('Salvare locală eșuată', e) } }
const DEF = {
  vehicles: () => ({odometer: 0, body: 'Sedan', color: '#35507a', monthly_km: 1200, style: 1}),
  vehicle_parts: () => ({last_odo: 0, last_date: today()}),
  maintenance_logs: () => ({date: today(), part_cost: 0, labor_cost: 0}),
  fuel_logs: () => ({date: today(), full_tank: true}),
  documents: () => ({}), expenses: () => ({date: today()}), prices: () => ({updated_at: new Date().toISOString()}),
}
const mk = (t, r) => ({...DEF[t](), id: uuid(), user_id: 'local', created_at: new Date().toISOString(), ...r})
const clone = x => JSON.parse(JSON.stringify(x))

class Q {
  constructor(t) { this.t = t; this.op = 'select'; this.f = []; this.ord = null; this.one = false; this.sel = false }
  select() { this.sel = true; return this }
  order(c) { this.ord = c; return this }
  single() { this.one = true; return this }
  insert(r) { this.op = 'insert'; this.p = r; return this }
  update(p) { this.op = 'update'; this.p = p; return this }
  upsert(r, o) { this.op = 'upsert'; this.p = r; this.oc = o && o.onConflict; return this }
  delete() { this.op = 'delete'; return this }
  eq(c, v) { this.f.push(r => r[c] === v); return this }
  neq(c, v) { this.f.push(r => r[c] !== v); return this }
  not(c, o, v) { if (o === 'is') this.f.push(r => v === null ? r[c] != null : r[c] !== v); return this }
  then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej) }
  run() {
    const t = this.t, m = r => this.f.every(f => f(r))
    if (!cache[t]) return {data: null, error: {message: 'Tabel necunoscut: ' + t}}
    let out
    if (this.op === 'select') out = cache[t].filter(m)
    else if (this.op === 'insert') { out = [].concat(this.p).map(r => mk(t, r)); cache[t].push(...out); persist(t) }
    else if (this.op === 'update') { out = cache[t].filter(m); out.forEach(r => Object.assign(r, this.p)); persist(t) }
    else if (this.op === 'upsert') {
      out = []
      const cols = (this.oc || 'id').split(',').filter(c => c !== 'user_id')
      ;[].concat(this.p).forEach(r => {
        const ex = cache[t].find(x => cols.every(c => x[c] === r[c]))
        if (ex) { Object.assign(ex, r, {user_id: 'local'}); out.push(ex) } else { const n = mk(t, r); cache[t].push(n); out.push(n) }
      })
      persist(t)
    } else if (this.op === 'delete') {
      out = cache[t].filter(m); cache[t] = cache[t].filter(r => !m(r)); persist(t)
      if (t === 'vehicles') { const ids = out.map(v => v.id); CHILD.forEach(c => { cache[c] = cache[c].filter(r => !ids.includes(r.vehicle_id)); persist(c) }) }
    }
    out = clone(out)
    if (this.ord) out.sort((a, b) => String(a[this.ord] ?? '').localeCompare(String(b[this.ord] ?? '')))
    if (this.one) return out.length ? {data: out[0], error: null} : {data: null, error: {message: 'Nu s-a găsit rândul'}}
    return {data: (this.op === 'select' || this.sel) ? out : null, error: null}
  }
}

const PK = 'tgarage.local.profile'
let meta = (() => { try { return JSON.parse(localStorage.getItem(PK) || '{}') } catch { return {} } })()
const listeners = new Set()
const session = () => ({user: {id: 'local', email: '', user_metadata: {...meta}}})
const auth = {
  getSession: async () => ({data: {session: session()}}),
  getUser: async () => ({data: {user: session().user}}),
  onAuthStateChange: cb => { listeners.add(cb); return {data: {subscription: {unsubscribe: () => listeners.delete(cb)}}} },
  updateUser: async ({data}) => {
    meta = {...meta, ...(data || {})}; Object.keys(meta).forEach(k => { if (meta[k] == null) delete meta[k] })
    try { localStorage.setItem(PK, JSON.stringify(meta)) } catch {}
    listeners.forEach(cb => cb('USER_UPDATED', session()))
    return {data: {user: session().user}, error: null}
  },
  signOut: async () => ({error: null}),
  mfa: {
    getAuthenticatorAssuranceLevel: async () => ({data: {currentLevel: 'aal1', nextLevel: 'aal1'}}),
    listFactors: async () => ({data: {all: [], totp: []}}),
  },
}

const idb = () => new Promise((res, rej) => { const r = indexedDB.open('tgarage-local', 1); r.onupgradeneeded = () => r.result.createObjectStore('blobs'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
const bt = async (mode, fn) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('blobs', mode), r = fn(t.objectStore('blobs')); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error) }) }
const storage = {from: () => ({
  upload: async (path, blob) => { try { await bt('readwrite', s => s.put(blob, path)); return {data: {path}, error: null} } catch (e) { return {data: null, error: {message: String(e)}} } },
  createSignedUrl: async path => { try { const b = await bt('readonly', s => s.get(path)); return {data: b ? {signedUrl: URL.createObjectURL(b)} : null, error: null} } catch (e) { return {data: null, error: {message: String(e)}} } },
  list: async prefix => { try { const keys = await bt('readonly', s => s.getAllKeys()); return {data: (keys || []).filter(k => String(k).startsWith(prefix + '/')).map(k => ({name: String(k).slice(prefix.length + 1)})), error: null} } catch (e) { return {data: [], error: {message: String(e)}} } },
  remove: async paths => { try { await bt('readwrite', s => { paths.forEach(p => s.delete(p)); return null }) } catch {} return {data: paths, error: null} },
})}

export const local = {from: t => new Q(t), auth, storage}
