import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {OrbitControls, useGLTF, useTexture} from '@react-three/drei'
import * as THREE from 'three'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import React, {Suspense, useEffect, useMemo, useRef, useState} from 'react'
import {BODY, MODEL_CFG} from '../data'

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
      const cl = mats(m).map(x => { const y = x.clone(); y.userData.paint = !y.map && !y.emissiveMap && !SKIP.test(y.name) && y.color && (y.color.r + y.color.g + y.color.b) > .25; y.userData.t0 = y.transparent; y.userData.o0 = y.opacity; if (y.metalness > .35) y.metalness = .2; if (y.map && y.color) y.color.setScalar(1.55); return y })
      m.material = Array.isArray(m.material) ? cl : cl[0] } })
    return o }, [scene])
  useEffect(() => obj.traverse(m => { if (!m.isMesh) return
    mats(m).forEach(x => { if (x.userData.paint) x.color.set(color); const on = xray > .01; x.transparent = on ? true : !!x.userData.t0; x.opacity = on ? x.userData.o0 * (1 - xray * .8) : x.userData.o0; x.depthWrite = !on; x.needsUpdate = true }) }), [obj, color, xray])
  return <group rotation={[0, (MODEL_CFG[body] || {}).rot || 0, 0]}><primitive object={obj}/></group>
}

const BT = {}
const badgeTex = n => BT[n] || (BT[n] = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')
  g.fillStyle = 'rgba(0,0,0,.78)'; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.stroke()
  g.fillStyle = '#ffffff'; g.font = '700 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 32, 34)
  return new THREE.CanvasTexture(c)
})())

function Hot({p, onPick}) {
  const r = useRef(), w = useRef()
  useFrame(({clock}) => {
    const t = clock.elapsedTime
    r.current.scale.setScalar(1 + .3 * Math.sin(t * 3 + p.pos[0] * 2 + p.pos[2]))
    const k = (t * .8 + p.pos[0] + p.pos[2]) % 1
    w.current.scale.setScalar(1 + k * 2.2); w.current.material.opacity = .55 * (1 - k)
  })
  return <group position={p.pos} renderOrder={20}>
    <mesh ref={r} renderOrder={21} onClick={e => { e.stopPropagation(); onPick(p) }}><sphereGeometry args={[p.count > 1 ? .15 : .12, 16, 16]}/><meshBasicMaterial color={p.col} transparent opacity={.95} depthTest={false}/></mesh>
    {p.count > 1 && <sprite position={[0, .26, 0]} scale={[.22, .22, 1]} renderOrder={22} raycast={() => null}><spriteMaterial map={badgeTex(p.count)} transparent depthTest={false}/></sprite>}
    <mesh ref={w} renderOrder={20} raycast={() => null}><sphereGeometry args={[p.count > 1 ? .15 : .12, 12, 12]}/><meshBasicMaterial color={p.ring || p.col} transparent opacity={.5} depthWrite={false} depthTest={false}/></mesh>
  </group>
}

const Bx = ({p, s, c = '#888', r, m = 0, ro = .6, e}) => <mesh position={p} rotation={r}><boxGeometry args={s}/><meshStandardMaterial color={c} metalness={m} roughness={ro} emissive={e || '#000000'} emissiveIntensity={e ? 1 : 0}/></mesh>
const Wrench = ({p, a = 0, l = .8}) => <group position={p} rotation={[0, 0, a]}>
  <Bx p={[0, 0, 0]} s={[l, .07, .025]} c="#b8c0cc" m={.9} ro={.3}/>
  {[-1, 1].map(k => <mesh key={k} position={[k * l / 2, 0, 0]}><torusGeometry args={[.07, .03, 8, 16]}/><meshStandardMaterial color="#b8c0cc" metalness={.9} roughness={.3}/></mesh>)}</group>
const Hammer = ({p, a = 0}) => <group position={p} rotation={[0, 0, a]}><Bx p={[0, 0, 0]} s={[.07, .7, .03]} c="#8b5a2b"/><Bx p={[0, .32, 0]} s={[.3, .12, .06]} c="#444b57" m={.8} ro={.4}/></group>

function Clock({p}) {
  const h = useRef(), m = useRef()
  useFrame(() => { const d = new Date(); m.current.rotation.z = -(d.getMinutes() + d.getSeconds() / 60) / 60 * Math.PI * 2; h.current.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2 })
  return <group position={p}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.34, .34, .05, 32]}/><meshStandardMaterial color="#e5e7eb"/></mesh>
    <group position={[0, 0, .04]}><group ref={h}><mesh position={[0, .08, 0]}><boxGeometry args={[.03, .17, .01]}/><meshBasicMaterial color="#111111"/></mesh></group><group ref={m}><mesh position={[0, .12, .01]}><boxGeometry args={[.02, .25, .01]}/><meshBasicMaterial color="#111111"/></mesh></group></group>
  </group>
}

const mkTex = (draw, rx, ry) => { const c = document.createElement('canvas'); c.width = c.height = 512; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t }

function GarageScene() {
  const logo = useTexture('/logo.png'), flat = [-Math.PI / 2, 0, 0], hr = new Date().getHours(), sky = hr < 6 || hr >= 20 ? '#0b1530' : hr < 8 || hr >= 18 ? '#f59e6b' : '#8ec5ff'
  const floorT = useMemo(() => mkTex(g => { g.fillStyle = '#a3abb8'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2200; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2) } g.strokeStyle = 'rgba(50,58,72,.6)'; g.lineWidth = 4; g.strokeRect(2, 2, 508, 508) }, 3, 2.5), [])
  const woodT = useMemo(() => mkTex(g => { for (let x = 0; x < 512; x += 32) { g.fillStyle = (x / 32) % 2 ? '#7a5238' : '#6a4630'; g.fillRect(x, 0, 29, 512); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x + 29, 0, 3, 512); for (let k = 0; k < 26; k++) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x + Math.random() * 28, 0, 1, 512) } } }, 3.5, 1), [])
  const wallT = useMemo(() => mkTex(g => { g.fillStyle = '#b4bac6'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2600; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2) } g.strokeStyle = 'rgba(70,78,92,.45)'; g.lineWidth = 3; g.strokeRect(1, 1, 510, 510) }, 5, 1), [])
  const brickT = useMemo(() => mkTex(g => { g.fillStyle = '#9aa0ab'; g.fillRect(0, 0, 512, 512); for (let r = 0; r < 16; r++) { const o = r % 2 ? 0 : 32; for (let x = -64 + o; x < 512; x += 64) { g.fillStyle = `hsl(215,8%,${72 + Math.random() * 8}%)`; g.fillRect(x + 2, r * 32 + 2, 60, 28) } } }, 3, 1.4), [])
  const frontT = useMemo(() => mkTex(g => { g.fillStyle = '#c3c8d2'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2600; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)'; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2) } g.strokeStyle = 'rgba(70,78,92,.4)'; g.lineWidth = 3; g.strokeRect(1, 1, 510, 510) }, 4, 1), [])
  return <group>
    <hemisphereLight args={['#dfe7ff', '#3a3f4b', .9]}/>
    <pointLight position={[-2.5, 2.6, -3.5]} intensity={.8} distance={7} color="#ffd9a0"/><pointLight position={[2.5, 2.6, -3.5]} intensity={.8} distance={7} color="#ffd9a0"/>
    <Bx p={[0, 4.35, -4.45]} s={[11, .05, .05]} c="#ffd9a0" e="#ffd9a0"/>
    <mesh rotation={flat}><planeGeometry args={[11, 9]}/><meshStandardMaterial map={floorT} roughness={.35} metalness={.15}/></mesh>
    <Bx p={[0, .01, 1.9]} s={[5.4, .01, .08]} c="#facc15"/><Bx p={[0, .01, -1.9]} s={[5.4, .01, .08]} c="#facc15"/><Bx p={[2.7, .01, 0]} s={[.08, .01, 3.8]} c="#facc15"/><Bx p={[-2.7, .01, 0]} s={[.08, .01, 3.8]} c="#facc15"/>
    <mesh position={[0, 2.35, -4.5]}><planeGeometry args={[11, 4.7]}/><meshStandardMaterial map={woodT} roughness={.7}/></mesh>
    <mesh position={[-5.5, 2.35, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[9, 4.7]}/><meshStandardMaterial map={wallT} roughness={.9}/></mesh>
    <Bx p={[0, .5, -4.47]} s={[11, 1, .04]} c="#343a47"/><Bx p={[0, 1.02, -4.46]} s={[11, .06, .05]} c="#ff8a3d"/>
    <Bx p={[-.6, 2.3, -4.46]} s={[4.4, 2, .04]} c="#2b303c" ro={.7}/>
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
    <Clock p={[.9, 3.5, -4.42]}/>
    <Bx p={[-4.3, 3, -4.46]} s={[1.6, 1.3, .06]} c="#111827"/>
    <mesh position={[-4.3, 3, -4.42]}><planeGeometry args={[1.4, 1.1]}/><meshBasicMaterial color={sky}/></mesh>
    <pointLight position={[-4.3, 3, -3.6]} color={sky} intensity={.35} distance={7}/>
    <mesh position={[5.5, 2.35, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[9, 4.7]}/><meshStandardMaterial map={brickT} roughness={.85}/></mesh>
    <mesh position={[0, 2.35, 4.5]} rotation={[0, Math.PI, 0]}><planeGeometry args={[11, 4.7]}/><meshStandardMaterial map={frontT} roughness={.9}/></mesh>
    <mesh position={[0, 4.7, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[11, 9]}/><meshStandardMaterial color="#cfd3db" roughness={.9}/></mesh>
    {[-2.5, 2.5].map(z => <Bx key={z} p={[0, 4.6, z]} s={[11, .14, .22]} c="#8b919d"/>)}
    <Bx p={[0, .5, 4.47]} s={[11, 1, .04]} c="#343a47"/><Bx p={[0, 1.02, 4.46]} s={[11, .06, .05]} c="#ff8a3d"/><Bx p={[5.47, .5, 0]} s={[.04, 1, 9]} c="#343a47"/><Bx p={[5.46, 1.02, 0]} s={[.05, .06, 9]} c="#ff8a3d"/>
    {[-.7, 1.7].map(z => <Bx key={z} p={[5.2, 1.1, z]} s={[.06, 2.2, .06]} c="#2b303c"/>)}
    {[.5, 1.2, 1.9].map(y => <Bx key={y} p={[5.2, y, .5]} s={[.5, .05, 2.5]} c="#4b5563" m={.6}/>)}
    {[[.5, -.2], [.5, .6], [.5, 1.3], [1.2, -.3], [1.2, .9], [1.9, 0], [1.9, 1.1]].map(([y, z], i) => <Bx key={i} p={[5.2, y + .2, z]} s={[.38, .32, .42]} c={i % 3 === 0 ? '#c8102e' : '#b08a5a'} ro={.8}/>)}
    <Bx p={[2.6, 2.9, 4.46]} s={[1.6, 1.3, .06]} c="#111827"/>
    <mesh position={[2.6, 2.9, 4.42]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.4, 1.1]}/><meshBasicMaterial color={sky}/></mesh>
    <pointLight position={[2.6, 2.9, 3.6]} color={sky} intensity={.3} distance={7}/>
    <mesh position={[-3.6, .75, 4.3]}><cylinderGeometry args={[.1, .1, .5, 16]}/><meshStandardMaterial color="#c8102e" roughness={.4}/></mesh><Bx p={[-3.6, 1.05, 4.3]} s={[.12, .1, .12]} c="#111111"/>
    <pointLight position={[4.3, 2.5, 0]} intensity={.7} distance={7} color="#ffe2b8"/><pointLight position={[0, 2.5, 3.4]} intensity={.7} distance={7} color="#ffe2b8"/>
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

function Env() {
  const {gl, scene} = useThree()
  useEffect(() => {
    let t, p
    try { p = new THREE.PMREMGenerator(gl); t = p.fromScene(new RoomEnvironment(), .04).texture; scene.environment = t; scene.environmentIntensity = .6 } catch {}
    return () => { try { scene.environment = null; if (t) t.dispose(); if (p) p.dispose() } catch {} }
  }, [gl, scene])
  return null
}

function Rig({focus, controls, stage}) {
  const {camera} = useThree(), frames = useRef(0)
  const g = stage === 'garaj'
  useEffect(() => { frames.current = 100; camera.fov = g ? 58 : 45; camera.updateProjectionMatrix() }, [focus, g])
  useFrame(() => {
    if (frames.current-- <= 0 || !controls.current) return
    const t = new THREE.Vector3(...(focus || [0, .7, 0])), d = focus ? 2.6 : g ? 4 : 7
    controls.current.target.lerp(t, .08)
    camera.position.lerp(new THREE.Vector3(t.x + d * .55, t.y + d * .4 + .3, t.z + d * .75), .06)
    controls.current.update()
  })
  return null
}

export default function Car3D({car, parts, xray, focus, onPick, onMiss, stage}) {
  const controls = useRef(), [url, setUrl] = useState(null)
  const color = car.color || '#35507a'
  useEffect(() => {
    const u = car.model_url || `/models/${car.body.toLowerCase()}.glb`; let ok = true; setUrl(null)
    fetch(u, {method: 'HEAD'}).then(r => { if (ok && r.ok && !(r.headers.get('content-type') || '').includes('text/html')) setUrl(u) }).catch(() => {})
    return () => { ok = false }
  }, [car.id, car.body, car.model_url])
  const proc = <Procedural body={car.body} color={color} xray={xray}/>
  return <Canvas camera={{position: stage === 'garaj' ? [2.2, 1.9, 3] : [4, 3, 5.5], fov: stage === 'garaj' ? 58 : 45}} dpr={[1, 2]} onPointerMissed={() => onMiss && onMiss()}>
    <ambientLight intensity={.8}/><directionalLight position={[3, 5, 4]} intensity={1.1}/><Env/>
    <Suspense fallback={null}>{url ? <Boundary key={url} fallback={proc}><Glb url={url} body={car.body} color={color} xray={xray}/></Boundary> : proc}</Suspense>
    <Suspense fallback={null}><Stage kind={stage}/></Suspense>
    {stage !== 'garaj' && <Shadow/>}
    {parts.map(p => <Hot key={p.sid || p.id} p={p} onPick={onPick}/>)}
    <OrbitControls ref={controls} autoRotate={!focus} autoRotateSpeed={.7} enablePan={false} minDistance={2.5} maxDistance={stage === 'garaj' ? 4.4 : 11} maxPolarAngle={Math.PI / 2.05}/>
    <Rig focus={focus} controls={controls} stage={stage}/>
  </Canvas>
}
