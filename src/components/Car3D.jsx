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
  const r = useRef()
  useFrame(({clock}) => r.current.scale.setScalar(1 + .35 * Math.sin(clock.elapsedTime * 3 + p.pos[0] * 2)))
  return <mesh ref={r} position={p.pos} onClick={e => { e.stopPropagation(); onPick(p) }}>
    <sphereGeometry args={[.14, 16, 16]}/><meshBasicMaterial color={p.col}/></mesh>
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

export default function Car3D({car, parts, xray, focus, onPick}) {
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, 0]}><ringGeometry args={[2.5, 2.56, 64]}/><meshBasicMaterial color="#ffffff" transparent opacity={.25}/></mesh>
    {parts.map(p => <Hot key={p.id} p={p} onPick={onPick}/>)}
    <OrbitControls ref={controls} autoRotate={!focus} autoRotateSpeed={.7} enablePan={false} minDistance={2.5} maxDistance={11} maxPolarAngle={Math.PI / 2.05}/>
    <Rig focus={focus} controls={controls}/>
  </Canvas>
}
