import {wheelSpec} from '../data'

// Ce se vede în interior când caroseria e (aproape) transparentă: punți, șasiu, motor sau baterie
export default function Internals({body, powertrain, xray}) {
  if (xray < .05) return null
  const o = Math.min(1, xray * 1.3), w = wheelSpec(body), ev = powertrain === 'Electric', hyb = powertrain === 'Hibrid' || powertrain === 'PHEV'
  const len = w.f - w.r, mid = (w.f + w.r) / 2, y = w.y
  const M = (c, p) => <meshStandardMaterial color={c} metalness={.55} roughness={.45} transparent opacity={o} {...p}/>
  return <group renderOrder={6}>
    {[w.f, w.r].map((x, i) => <group key={'ax' + i} position={[x, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.035, .035, w.z * 2, 14]}/>{M('#aab2bf', {metalness: .9, roughness: .3})}</mesh>
      <mesh><sphereGeometry args={[.1, 18, 14]}/>{M('#7b8492')}</mesh></group>)}
    {[.36, -.36].map(z => <mesh key={'lo' + z} position={[mid, y + .06, z]}><boxGeometry args={[len + 1.1, .07, .09]}/>{M('#58606d')}</mesh>)}
    {[w.f - .25, w.r + .25].map((x, i) => <mesh key={'tv' + i} position={[x, y + .06, 0]}><boxGeometry args={[.07, .06, .8]}/>{M('#58606d')}</mesh>)}
    {[[w.f, 1], [w.f, -1], [w.r, 1], [w.r, -1]].map(([x, k], i) => <mesh key={'sh' + i} position={[x, y + .3, k * (w.z - .12)]}><cylinderGeometry args={[.035, .035, .5, 10]}/>{M('#d4af37', {metalness: .8, roughness: .35})}</mesh>)}
    {ev ? <>
      <mesh position={[mid, y - .02, 0]}><boxGeometry args={[len - .3, .14, .98]}/>{M('#1b3558', {metalness: .35, roughness: .5})}</mesh>
      {[.3, 0, -.3].map(z => <mesh key={'bs' + z} position={[mid, y + .06, z]}><boxGeometry args={[len - .36, .012, .018]}/><meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} transparent opacity={o}/></mesh>)}
      <mesh position={[w.r, y, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.14, .14, .36, 24]}/>{M('#c27a3a', {metalness: .8, roughness: .35})}</mesh>
      <mesh position={[w.r + .35, y + .12, 0]}><boxGeometry args={[.3, .13, .32]}/>{M('#e5e7eb')}</mesh></> : <>
      <mesh position={[w.f - .05, y + .3, 0]}><boxGeometry args={[.62, .42, .55]}/>{M('#5a6270')}</mesh>
      {[-.19, -.065, .065, .19].map(z => <mesh key={'cy' + z} position={[w.f - .05, y + .58, z]}><cylinderGeometry args={[.05, .05, .14, 12]}/>{M('#8a93a1', {metalness: .8})}</mesh>)}
      <mesh position={[w.f - .55, y + .22, 0]}><boxGeometry args={[.5, .3, .36]}/>{M('#4b5361')}</mesh>
      <mesh position={[w.f + .45, y + .3, 0]}><boxGeometry args={[.05, .38, .7]}/>{M('#3a3f48')}</mesh>
      <mesh position={[mid - .1, y - .08, -.25]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.03, .03, len + .9, 10]}/>{M('#7a8290', {metalness: .8})}</mesh>
      <mesh position={[w.r - .35, y - .02, -.25]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.09, .09, .5, 16]}/>{M('#6b7280', {metalness: .85})}</mesh>
      <mesh position={[w.r + .35, y + .05, 0]}><boxGeometry args={[.7, .2, .85]}/>{M('#374151')}</mesh>
      {powertrain === 'GPL' && <mesh position={[w.r + .3, y + .14, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.17, .17, .8, 20]}/>{M('#cbd5e1', {metalness: .6})}</mesh>}</>}
    {hyb && <mesh position={[w.r + .2, y + .02, 0]}><boxGeometry args={[powertrain === 'PHEV' ? 1 : .6, .12, .7]}/>{M('#1b3558', {metalness: .35})}</mesh>}
  </group>
}
