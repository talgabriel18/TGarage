import React from 'react'
import {createRoot} from 'react-dom/client'
import {configOk, mode} from './lib/supabase'
import Chooser from './tabs/Chooser'
import {installDiag} from './lib/diag'
import './index.css'
installDiag()

class EB extends React.Component {
  state = {e: null}
  static getDerivedStateFromError(e) { return {e} }
  render() {
    return this.state.e ? <main><div className="card"><h2>Ceva nu a mers</h2><p className="mu">{String(this.state.e.message || this.state.e)}</p><button className="w" onClick={() => location.reload()}>Reîncarcă</button></div></main> : this.props.children
  }
}
const root = createRoot(document.getElementById('root'))
if (!mode) root.render(<Chooser/>)
else if (mode === 'cloud' && !configOk) root.render(<main><div className="card"><h2>Configurare lipsă</h2><p>Variabilele <b>VITE_SUPABASE_URL</b> (adresa <i>https://…supabase.co</i>) și <b>VITE_SUPABASE_ANON_KEY</b> nu sunt setate corect. Verifică-le în Vercel (Settings → Environment Variables), apoi fă Redeploy.</p></div></main>)
else import('./App').then(m => root.render(<EB><m.default/></EB>))
