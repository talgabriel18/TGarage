import React from 'react'
import {createRoot} from 'react-dom/client'
import {configOk} from './lib/supabase'
import './index.css'

class EB extends React.Component {
  state = {e: null}
  static getDerivedStateFromError(e) { return {e} }
  render() {
    return this.state.e ? <main><div className="card"><h2>Ceva nu a mers</h2><p className="mu">{String(this.state.e.message || this.state.e)}</p><button className="w" onClick={() => location.reload()}>Reîncarcă</button></div></main> : this.props.children
  }
}
const root = createRoot(document.getElementById('root'))
if (!configOk) root.render(<main><div className="card"><h2>Configurare lipsă</h2><p>Variabilele <b>VITE_SUPABASE_URL</b> (adresa <i>https://…supabase.co</i>) și <b>VITE_SUPABASE_ANON_KEY</b> nu sunt setate corect. Verifică-le în Netlify, apoi fă „Clear cache and deploy site”.</p></div></main>)
else import('./App').then(m => root.render(<EB><m.default/></EB>))
