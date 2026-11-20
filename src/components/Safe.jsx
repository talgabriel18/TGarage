import React from 'react'

export default class Safe extends React.Component {
  state = {e: false}
  static getDerivedStateFromError() { return {e: true} }
  render() { return this.state.e ? <div className="card"><small className="mu">Harta nu s-a putut încărca. Reîncarcă aplicația și încearcă din nou.</small></div> : this.props.children }
}
