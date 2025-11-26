import { useEffect, useRef, useState } from 'react'
import './App.css'

const STYLES = [
  { value: 'modern', label: 'Modern minimal' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'vintage', label: 'Vintage' },
]

function createTexture(THREE, style) {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size / 2
  const ctx = canvas.getContext('2d')

  const drawContinents = (color, alpha = 1, jitter = 0) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    const blobs = 6
    for (let i = 0; i < blobs; i += 1) {
      const x = Math.random() * size
      const y = Math.random() * canvas.height
      const w = 140 + Math.random() * 260
      const h = 80 + Math.random() * 180
      ctx.beginPath()
      ctx.ellipse(x + Math.random() * jitter, y + Math.random() * jitter, w, h, Math.random(), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (style === 'modern') {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, size, canvas.height)

    ctx.fillStyle = '#1e293b'
    for (let i = 0; i < 10; i += 1) {
      ctx.fillRect((i / 10) * size, 0, 2, canvas.height)
    }
    drawContinents('#22c55e', 1, 30)
    drawContinents('#16a34a', 0.6, 40)

    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    for (let lat = 0; lat <= 180; lat += 30) {
      const y = (lat / 180) * canvas.height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y)
      ctx.stroke()
    }
  } else if (style === 'satellite') {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#0b3b8c')
    gradient.addColorStop(1, '#071f4d')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, canvas.height)

    drawContinents('#1f5133', 1, 60)
    drawContinents('#2f855a', 0.7, 70)
    drawContinents('#c6b08e', 0.3, 80)

    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    for (let i = 0; i < 2000; i += 1) {
      const x = Math.random() * size
      const y = Math.random() * canvas.height
      ctx.fillRect(x, y, 1, 1)
    }
  } else {
    ctx.fillStyle = '#d8c6a3'
    ctx.fillRect(0, 0, size, canvas.height)

    ctx.strokeStyle = '#9c855a'
    ctx.lineWidth = 2
    for (let lat = 0; lat <= 180; lat += 20) {
      const y = (lat / 180) * canvas.height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y)
      ctx.stroke()
    }
    for (let lng = 0; lng <= 360; lng += 20) {
      const x = (lng / 360) * size
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    drawContinents('#b68b60', 0.9, 50)
    drawContinents('#8f6b43', 0.6, 60)

    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(size * 0.25, canvas.height * 0.35, 80, 0, Math.PI * 2)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function App() {
  const mountRef = useRef(null)
  const globeRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const threeRef = useRef(null)
  const frameRef = useRef(null)
  const [style, setStyle] = useState('modern')
  const [threeReady, setThreeReady] = useState(false)

  useEffect(() => {
    let isMounted = true
    let cleanupFn

    const init = async () => {
      const THREE = await import('https://esm.sh/three@0.169.0')
      if (!isMounted || !mountRef.current) return

      threeRef.current = THREE

      const scene = new THREE.Scene()
      scene.background = null
      sceneRef.current = scene

      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
      camera.position.set(0, 0, 5)
      cameraRef.current = camera

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      mountRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      const sphereGeo = new THREE.SphereGeometry(2, 96, 96)
      const texture = createTexture(THREE, style)
      const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0.15 })
      const globe = new THREE.Mesh(sphereGeo, material)
      globeRef.current = globe
      scene.add(globe)

      const glowMaterial = new THREE.MeshBasicMaterial({ color: '#8eb3ff', transparent: true, opacity: 0.12, side: THREE.BackSide })
      const glow = new THREE.Mesh(new THREE.SphereGeometry(2.05, 96, 96), glowMaterial)
      scene.add(glow)

      const ambient = new THREE.AmbientLight('#cbd5e1', 0.8)
      const directional = new THREE.DirectionalLight('#ffffff', 1.1)
      directional.position.set(3, 4, 5)
      scene.add(ambient)
      scene.add(directional)

      const animate = () => {
        frameRef.current = requestAnimationFrame(animate)
        globe.rotation.y += 0.0025
        globe.rotation.x = Math.sin(Date.now() * 0.0001) * 0.1
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        if (!mountRef.current) return
        const { clientWidth, clientHeight } = mountRef.current
        renderer.setSize(clientWidth, clientHeight)
        camera.aspect = clientWidth / clientHeight
        camera.updateProjectionMatrix()
      }
      window.addEventListener('resize', onResize)
      onResize()

      setThreeReady(true)

      cleanupFn = () => {
        window.removeEventListener('resize', onResize)
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        if (globeRef.current) {
          globeRef.current.geometry.dispose()
          globeRef.current.material.map?.dispose()
          globeRef.current.material.dispose()
        }
        rendererRef.current?.dispose()
        if (rendererRef.current?.domElement && mountRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement)
        }
      }
    }

    init()

    return () => {
      isMounted = false
      if (typeof cleanupFn === 'function') cleanupFn()
    }
  }, [])

  useEffect(() => {
    if (!threeRef.current || !globeRef.current) return
    const THREE = threeRef.current
    const newTexture = createTexture(THREE, style)
    const globe = globeRef.current
    if (globe.material.map) globe.material.map.dispose()
    globe.material.map = newTexture
    globe.material.needsUpdate = true
  }, [style])

  return (
    <div className="page">
      <header>
        <h1>Interactive Three.js Globe</h1>
        <p>Rotate the planet and switch between minimalist, satellite, and vintage moods.</p>
      </header>
      <div className="content">
        <div className="panel">
          <label htmlFor="style">Map style</label>
          <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} disabled={!threeReady}>
            {STYLES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ul className="legend">
            <li><span className="swatch modern" />Modern uses crisp grid lines and soft greens.</li>
            <li><span className="swatch satellite" />Satellite leans into lush greens with depth.</li>
            <li><span className="swatch vintage" />Vintage brings parchment tones and meridians.</li>
          </ul>
        </div>
        <div className="globe" ref={mountRef}>
          {!threeReady && <div className="loading">Loading Three.js…</div>}
        </div>
      </div>
    </div>
  )
}

export default App
