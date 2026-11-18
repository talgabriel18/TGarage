import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {OrbitControls, useGLTF} from '@react-three/drei'
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

function Stage({kind}) {
  const flat = [-Math.PI / 2, 0, 0]
  if (kind === 'garaj') return <group>
    <mesh rotation={flat}><planeGeometry args={[14, 14]}/><meshStandardMaterial color="#1b1f2a" roughness={.35} metalness={.4}/></mesh>
    <mesh position={[0, 2.2, -4.5]}><planeGeometry args={[14, 5]}/><meshStandardMaterial color="#232838" roughness={.9}/></mesh>
    <mesh position={[-5.5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[14, 5]}/><meshStandardMaterial color="#1e2230" roughness={.9}/></mesh>
    <mesh position={[0, .9, -4.48]}><boxGeometry args={[14, .08, .02]}/><meshBasicMaterial color="#ff8a3d"/></mesh>
    {[-2.5, 0, 2.5].map(x => <group key={x}><mesh position={[x, 4.4, -2]}><boxGeometry args={[1.6, .06, .3]}/><meshBasicMaterial color="#fff6d8"/></mesh><pointLight position={[x, 4, -2]} intensity={.5} distance={9} color="#fff1cf"/></group>)}
  </group>
  if (kind === 'neon') return <group>
    <gridHelper args={[14, 28, '#38bdf8', '#1e3a5f']} position={[0, .002, 0]}/>
    <mesh rotation={flat} position={[0, .01, 0]}><ringGeometry args={[2.5, 2.6, 64]}/><meshBasicMaterial color="#38bdf8"/></mesh>
  </group>
  return <group>
    <mesh rotation={flat} position={[0, .005, 0]}><circleGeometry args={[3.2, 64]}/><meshStandardMaterial color="#232a3b" roughness={.25} metalness={.6}/></mesh>
    <mesh rotation={flat} position={[0, .01, 0]}><ringGeometry args={[2.5, 2.56, 64]}/><meshBasicMaterial color="#ffffff" transparent opacity={.3}/></mesh>
  </group>
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
    <Stage kind={stage}/>
    {parts.map(p => <Hot key={p.id} p={p} onPick={onPick}/>)}
    <OrbitControls ref={controls} autoRotate={!focus} autoRotateSpeed={.7} enablePan={false} minDistance={2.5} maxDistance={11} maxPolarAngle={Math.PI / 2.05}/>
    <Rig focus={focus} controls={controls}/>
  </Canvas>
}
