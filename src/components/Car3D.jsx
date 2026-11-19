import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {OrbitControls, useGLTF, useTexture} from '@react-three/drei'
import * as THREE from 'three'
import React, {Suspense, useEffect, useMemo, useRef, useState} from 'react'
import {BODY, ROT} from '../data'

class Boundary extends React.Component {
  state = {e: false}
  static getDerivedStateFromError() { return {e: true} }
  render() { return this.state.e ? this.props.fallback : this.props.children }
}

function Procedural({body, color, xray}) {
  const [pts, gl] = BODY[body] || BODY.Sedan
  const mk = (p, o) => { const s = new THREE.Shape(); p.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); return new THREE.ExtrudeGeometry(s, o) }
  const bodyG = useMemo(() => { const g = mk(pts, {depth: 1.5, bevelEnabled: true, bevelSize: .1, bevelThickness: .1, bevelSegments: 4}); g.translate(0, .12, -.75); return g }, [body])
  const glassG = useMemo(() => { const g = mk(gl, {depth: 1.76, bevelEnabled: false}); g.translate(0, .12, -.88); return g }, [body])
  return <group>
    <mesh geometry={bodyG}><meshStandardMaterial color={color} metalness={.8} roughness={.3} transparent opacity={1 - xray * .8}/></mesh>
    <mesh geometry={glassG}><meshStandardMaterial color="#0a0f18" metalness={.9} roughness={.1}/></mesh>
    {[[1.15, .82], [1.15, -.82], [-1.15, .82], [-1.15, -.82]].map(([x, z], i) => <group key={i} position={[x, .38, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh><cylinderGeometry args={[.38, .38, .28, 28]}/><meshStandardMaterial color="#0d0d0f"/></mesh>
      <mesh><cylinderGeometry args={[.24, .24, .3, 16]}/><meshStandardMaterial color="#c9ced8" metalness={1} roughness={.25}/></mesh></group>)}
  </group>
}

const SKIP = /glass|window|tire|tyre|rubber|wheel|light|chrome|interior|black|plastic|lamp|rim/i
const mats = m => Array.isArray(m.material) ? m.material : [m.material]

function Glb({url, body, color, xray}) {
  const {scene} = useGLTF(url)
  const obj = useMemo(() => {
    const o = scene.clone(true), b = new THREE.Box3().setFromObject(o)
    o.scale.setScalar(3.6 / (Math.max(b.max.x - b.min.x, b.max.z - b.min.z) || 1))
    b.setFromObject(o); const c = b.getCenter(new THREE.Vector3()); o.position.set(-c.x, -b.min.y, -c.z)
    o.traverse(m => { if (m.isMesh && m.material) {
      const cl = mats(m).map(x => { const y = x.clone(); y.userData.paint = !SKIP.test(y.name) && y.color && (y.color.r + y.color.g + y.color.b) > .25; return y })
      m.material = Array.isArray(m.material) ? cl : cl[0] } })
    return o }, [scene])
  useEffect(() => obj.traverse(m => { if (!m.isMesh) return
    mats(m).forEach(x => { if (x.userData.paint) x.color.set(color); x.transparent = true; x.opacity = 1 - xray * .8; x.needsUpdate = true }) }), [obj, color, xray])
  return <group rotation={[0, ROT[body] || 0, 0]}><primitive object={obj}/></group>
}

function Hot({p, onPick}) {
  const r = useRef(), w = useRef()
  useFrame(({clock}) => {
    const t = clock.elapsedTime
    r.current.scale.setScalar(1 + .35 * Math.sin(t * 3 + p.pos[0] * 2))
    const k = (t * .8 + p.pos[0]) % 1
    w.current.scale.setScalar(1 + k * 2.2); w.current.material.opacity = .5 * (1 - k)
  })
  return <group position={p.pos}>
    <mesh ref={r} onClick={e => { e.stopPropagation(); onPick(p) }}><sphereGeometry args={[.14, 16, 16]}/><meshBasicMaterial color={p.col}/></mesh>
    <mesh ref={w} raycast={() => null}><sphereGeometry args={[.14, 12, 12]}/><meshBasicMaterial color={p.col} transparent opacity={.5} depthWrite={false}/></mesh>
  </group>
}

const Bx = ({p, s, c = '#888', r, m = 0, ro = .6, e}) => <mesh position={p} rotation={r}><boxGeometry args={s}/><meshStandardMaterial color={c} metalness={m} roughness={ro} emissive={e || '#000000'} emissiveIntensity={e ? 1 : 0}/></mesh>
const Wrench = ({p, a = 0, l = .8}) => <group position={p} rotation={[0, 0, a]}>
  <Bx p={[0, 0, 0]} s={[l, .07, .025]} c="#b8c0cc" m={.9} ro={.3}/>
  {[-1, 1].map(k => <mesh key={k} position={[k * l / 2, 0, 0]}><torusGeometry args={[.07, .03, 8, 16]}/><meshStandardMaterial color="#b8c0cc" metalness={.9} roughness={.3}/></mesh>)}</group>
const Hammer = ({p, a = 0}) => <group position={p} rotation={[0, 0, a]}><Bx p={[0, 0, 0]} s={[.07, .7, .03]} c="#8b5a2b"/><Bx p={[0, .32, 0]} s={[.3, .12, .06]} c="#444b57" m={.8} ro={.4}/></group>

function Dust() {
  const ref = useRef(), pos = useMemo(() => Float32Array.from({length: 180}, (_, i) => i % 3 === 1 ? Math.random() * 4 : (Math.random() - .5) * 8), [])
  useFrame(() => { const a = ref.current.geometry.attributes.position; for (let i = 0; i < 60; i++) { a.array[i * 3 + 1] += .002; if (a.array[i * 3 + 1] > 4) a.array[i * 3 + 1] = 0 } a.needsUpdate = true })
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" count={60} array={pos} itemSize={3}/></bufferGeometry><pointsMaterial size={.045} color="#fff6d8" transparent opacity={.5} depthWrite={false}/></points>
}

function Clock({p}) {
  const h = useRef(), m = useRef()
  useFrame(() => { const d = new Date(); m.current.rotation.z = -(d.getMinutes() + d.getSeconds() / 60) / 60 * Math.PI * 2; h.current.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2 })
  return <group position={p}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.34, .34, .05, 32]}/><meshStandardMaterial color="#e5e7eb"/></mesh>
    <group position={[0, 0, .04]}><group ref={h}><mesh position={[0, .08, 0]}><boxGeometry args={[.03, .17, .01]}/><meshBasicMaterial color="#111111"/></mesh></group><group ref={m}><mesh position={[0, .12, .01]}><boxGeometry args={[.02, .25, .01]}/><meshBasicMaterial color="#111111"/></mesh></group></group>
  </group>
}

function GarageScene() {
  const logo = useTexture('/logo.png'), flat = [-Math.PI / 2, 0, 0], hr = new Date().getHours(), sky = hr < 6 || hr >= 20 ? '#0b1530' : hr < 8 || hr >= 18 ? '#f59e6b' : '#8ec5ff'
  return <group>
    <mesh rotation={flat}><planeGeometry args={[14, 14]}/><meshStandardMaterial color="#2a2d34" roughness={.5} metalness={.25}/></mesh>
    <Bx p={[0, .01, 1.9]} s={[5.4, .01, .08]} c="#facc15"/><Bx p={[0, .01, -1.9]} s={[5.4, .01, .08]} c="#facc15"/><Bx p={[2.7, .01, 0]} s={[.08, .01, 3.8]} c="#facc15"/><Bx p={[-2.7, .01, 0]} s={[.08, .01, 3.8]} c="#facc15"/>
    <mesh position={[0, 2.2, -4.5]}><planeGeometry args={[14, 5]}/><meshStandardMaterial color="#303646" roughness={.95}/></mesh>
    <mesh position={[-5.5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[14, 5]}/><meshStandardMaterial color="#262b39" roughness={.95}/></mesh>
    <Bx p={[0, .5, -4.47]} s={[14, 1, .04]} c="#1d2230"/><Bx p={[0, 1.02, -4.46]} s={[14, .06, .05]} c="#ff8a3d"/>
    <Bx p={[-.6, 2.3, -4.46]} s={[4.4, 2, .04]} c="#5b4a3a" ro={.9}/>
    {[[-2.3, .1], [-1.7, -.1], [-1.1, .15], [-.5, -.15], [.1, .1], [.7, -.1]].map(([x, a], i) => <Wrench key={i} p={[x, 2.85, -4.42]} a={Math.PI / 2 + a} l={.75 + (i % 3) * .1}/>)}
    {[-2.2, -1.4, -.6, .2, 1].map((x, i) => <Hammer key={i} p={[x, 1.85, -4.42]} a={i % 2 ? .08 : -.08}/>)}
    <Bx p={[2.7, 3.2, -4.46]} s={[1.5, 1.3, .05]} c="#ffffff"/>
    <mesh position={[2.7, 3.2, -4.43]}><planeGeometry args={[1.35, 1.15]}/><meshBasicMaterial map={logo} toneMapped={false}/></mesh>
    <Bx p={[3.2, .95, -4]} s={[2.2, .1, .9]} c="#7a5b3a"/>
    {[[2.2, -3.7], [4.2, -3.7], [2.2, -4.3], [4.2, -4.3]].map(([x, z], i) => <Bx key={i} p={[x, .45, z]} s={[.08, .9, .08]} c="#2b303c"/>)}
    <Bx p={[3.2, .3, -4]} s={[2, .06, .8]} c="#2b303c"/><Bx p={[3.9, 1.18, -4.1]} s={[.6, .36, .38]} c="#c8102e" ro={.4}/><Bx p={[3, 1.08, -3.85]} s={[.22, .16, .2]} c="#4b5563" m={.8}/>
    <mesh position={[2.5, 1.15, -4]}><cylinderGeometry args={[.1, .12, .3, 16]}/><meshStandardMaterial color="#d9a400"/></mesh>
    <Bx p={[-3.6, .55, -3.7]} s={[1.1, 1.1, .6]} c="#c8102e" ro={.35}/><Bx p={[-3.6, 1.13, -3.7]} s={[1.14, .05, .64]} c="#374151" m={.6}/>
    {[.2, .45, .7, .95].map((y, i) => <group key={i}><Bx p={[-3.6, y, -3.39]} s={[.98, .02, .02]} c="#111111"/><Bx p={[-3.6, y + .08, -3.38]} s={[.3, .03, .03]} c="#d1d5db" m={1} ro={.2}/></group>)}
    {[.14, .42, .7].map((y, i) => <mesh key={i} position={[-4.6, y, -1.6]} rotation={flat}><torusGeometry args={[.34, .14, 12, 24]}/><meshStandardMaterial color="#15171c" roughness={.9}/></mesh>)}
    {[[4.6, -2.6, '#1d4ed8'], [4.1, -3.2, '#b91c1c']].map(([x, z, c], i) => <group key={i}><mesh position={[x, .5, z]}><cylinderGeometry args={[.32, .32, 1, 20]}/><meshStandardMaterial color={c} metalness={.5} roughness={.5}/></mesh>
      {[.25, .75].map(y => <mesh key={y} position={[x, y, z]} rotation={flat}><torusGeometry args={[.325, .015, 6, 20]}/><meshStandardMaterial color="#222222"/></mesh>)}</group>)}
    {Array.from({length: 14}, (_, i) => <Bx key={i} p={[-5.46, .2 + i * .33, 1]} s={[.05, .3, 4.6]} c={i % 2 ? '#9aa0ab' : '#8d939e'} m={.6} ro={.5}/>)}
    {[-2.5, 0, 2.5].map(x => <group key={x}><Bx p={[x, 4.4, -2]} s={[1.6, .06, .3]} c="#fff6d8" e="#fff6d8"/><pointLight position={[x, 4, -2]} intensity={.55} distance={9} color="#fff1cf"/></group>)}
    <Dust/><Clock p={[.9, 3.5, -4.42]}/>
    <Bx p={[-4.3, 3, -4.46]} s={[1.6, 1.3, .06]} c="#111827"/>
    <mesh position={[-4.3, 3, -4.42]}><planeGeometry args={[1.4, 1.1]}/><meshBasicMaterial color={sky}/></mesh>
    <pointLight position={[-4.3, 3, -3.6]} color={sky} intensity={.35} distance={7}/>
    <mesh rotation={flat} position={[1.8, .011, 2.4]}><circleGeometry args={[.5, 24]}/><meshBasicMaterial color="#000000" transparent opacity={.25}/></mesh>
    {[[3.4, 1.2], [3.9, 1.5]].map(([x, z], i) => <mesh key={i} position={[x, .3, z]}><coneGeometry args={[.18, .6, 4]}/><meshStandardMaterial color="#c8102e" roughness={.5}/></mesh>)}
  </group>
}

function Stage({kind}) {
  const flat = [-Math.PI / 2, 0, 0]
  if (kind === 'garaj') return <GarageScene/>
  if (kind === 'neon') return <group>
    <gridHelper args={[14, 28, '#38bdf8', '#1e3a5f']} position={[0, .002, 0]}/>
    <mesh rotation={flat} position={[0, .01, 0]}><ringGeometry args={[2.5, 2.6, 64]}/><meshBasicMaterial color="#38bdf8"/></mesh>
  </group>
  return <group>
    <mesh rotation={flat} position={[0, .005, 0]}><circleGeometry args={[3.2, 64]}/><meshStandardMaterial color="#232a3b" roughness={.25} metalness={.6}/></mesh>
    <mesh rotation={flat} position={[0, .01, 0]}><ringGeometry args={[2.5, 2.56, 64]}/><meshBasicMaterial color="#ffffff" transparent opacity={.3}/></mesh>
  </group>
}

function Shadow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62)
    g.addColorStop(0, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .014, 0]}><planeGeometry args={[4.6, 2.6]}/><meshBasicMaterial map={tex} transparent depthWrite={false}/></mesh>
}

function Rig({focus, controls}) {
  const {camera} = useThree(), frames = useRef(0)
  useEffect(() => { frames.current = 100 }, [focus])
  useFrame(() => {
    if (frames.current-- <= 0 || !controls.current) return
    const t = new THREE.Vector3(...(focus || [0, .7, 0])), d = focus ? 3 : 7
    controls.current.target.lerp(t, .08)
    camera.position.lerp(new THREE.Vector3(t.x + d * .55, t.y + d * .4 + .3, t.z + d * .75), .06)
    controls.current.update()
  })
  return null
}

export default function Car3D({car, parts, xray, focus, onPick, stage}) {
  const controls = useRef(), [url, setUrl] = useState(null)
  const color = car.color || '#35507a'
  useEffect(() => {
    const u = car.model_url || `/models/${car.body.toLowerCase()}.glb`; let ok = true; setUrl(null)
    fetch(u, {method: 'HEAD'}).then(r => { if (ok && r.ok && !(r.headers.get('content-type') || '').includes('text/html')) setUrl(u) }).catch(() => {})
    return () => { ok = false }
  }, [car.id, car.body, car.model_url])
  const proc = <Procedural body={car.body} color={color} xray={xray}/>
  return <Canvas camera={{position: [4, 3, 5.5], fov: 45}} dpr={[1, 2]}>
    <ambientLight intensity={.8}/><directionalLight position={[3, 5, 4]} intensity={1.1}/>
    <Suspense fallback={null}>{url ? <Boundary key={url} fallback={proc}><Glb url={url} body={car.body} color={color} xray={xray}/></Boundary> : proc}</Suspense>
    <Suspense fallback={null}><Stage kind={stage}/></Suspense>
    <Shadow/>
    {parts.map(p => <Hot key={p.id} p={p} onPick={onPick}/>)}
    <OrbitControls ref={controls} autoRotate={!focus} autoRotateSpeed={.7} enablePan={false} minDistance={2.5} maxDistance={11} maxPolarAngle={Math.PI / 2.05}/>
    <Rig focus={focus} controls={controls}/>
  </Canvas>
}
