import {createClient} from '@supabase/supabase-js'
const u = import.meta.env.VITE_SUPABASE_URL, k = import.meta.env.VITE_SUPABASE_ANON_KEY
export const configOk = /^https?:\/\/\S+$/.test(u || '') && !!k
export const supabase = configOk ? createClient(u, k) : null
