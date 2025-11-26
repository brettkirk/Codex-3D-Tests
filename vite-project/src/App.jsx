import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'globe.gl'
import './App.css'

const STYLE_PRESETS = {
  minimal: {
    label: 'Minimalist',
    texture: '/earth-dark.jpg',
    accent: ['#4ade80', '#22d3ee'],
    atmosphere: '#67e8f9',
    glow: 'rgba(76, 210, 168, 0.35)',
  },
  satellite: {
    label: 'Satellite night',
    texture: '/earth-night.jpg',
    accent: ['#34d399', '#a855f7'],
    atmosphere: '#a78bfa',
    glow: 'rgba(91, 151, 255, 0.38)',
  },
  vintage: {
    label: 'Vintage atlas',
    texture: '/earth-vintage.jpg',
    accent: ['#fbbf24', '#f59e0b'],
    atmosphere: '#facc15',
    glow: 'rgba(199, 156, 88, 0.42)',
  },
}

const CITY_CENTERS = [
  { name: 'Tokyo', lat: 35.6895, lng: 139.6917 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: 'Dhaka', lat: 23.8103, lng: 90.4125 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Chongqing', lat: 29.4316, lng: 106.9123 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Manila', lat: 14.5995, lng: 120.9842 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { name: 'Tianjin', lat: 39.3434, lng: 117.3616 },
  { name: 'Kinshasa', lat: -4.4419, lng: 15.2663 },
  { name: 'Guangzhou', lat: 23.1291, lng: 113.2644 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Shenzhen', lat: 22.5431, lng: 114.0579 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Bogotá', lat: 4.711, lng: -74.0721 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Lima', lat: -12.0464, lng: -77.0428 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Seoul', lat: 37.5665, lng: 126.978 },
  { name: 'Nagoya', lat: 35.1815, lng: 136.9066 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tehran', lat: 35.6892, lng: 51.389 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Chengdu', lat: 30.5728, lng: 104.0668 },
  { name: 'Nanjing', lat: 32.0603, lng: 118.7969 },
  { name: 'Wuhan', lat: 30.5928, lng: 114.3055 },
  { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297 },
  { name: 'Luanda', lat: -8.839, lng: 13.2894 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Kuala Lumpur', lat: 3.139, lng: 101.6869 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Dongguan', lat: 23.0207, lng: 113.7518 },
  { name: 'Hangzhou', lat: 30.2741, lng: 120.1551 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { name: 'Shenyang', lat: 41.8057, lng: 123.4315 },
  { name: 'Baghdad', lat: 33.3152, lng: 44.3661 },
]

const toRadians = (deg) => (deg * Math.PI) / 180

function projectToScreen({ lat, lng }, rotationDeg, radius, cx, cy) {
  const rot = toRadians(rotationDeg)
  const cosRot = Math.cos(rot)
  const sinRot = Math.sin(rot)

  const latR = toRadians(lat)
  const lngR = toRadians(lng)

  const x = Math.cos(latR) * Math.sin(lngR)
  const y = Math.sin(latR)
  const z = Math.cos(latR) * Math.cos(lngR)

  const xRot = x * cosRot - z * sinRot
  const zRot = x * sinRot + z * cosRot

  if (zRot < 0) return null

  return {
    x: cx + radius * xRot,
    y: cy - radius * y,
    depth: zRot,
  }
}

function drawHex(ctx, x, y, size, color, glow) {
  const sides = 6
  ctx.beginPath()
  for (let i = 0; i < sides; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.shadowColor = glow
  ctx.shadowBlur = size * 1.4
  ctx.fill()
  ctx.shadowBlur = 0
}

function createCityHexes() {
  return CITY_CENTERS.map((city) => {
    const clusters = Array.from({ length: 20 }, () => Math.random())
    const magnitude = clusters.reduce((sum, n) => sum + n, 0) / clusters.length
    const spread = 0.8 + Math.random() * 0.9
    return {
      ...city,
      magnitude,
      spread,
    }
  })
}

function App() {
  const globeMountRef = useRef(null)
  const overlayRef = useRef(null)
  const globeInstanceRef = useRef(null)
  const animationRef = useRef(null)
  const rotationRef = useRef(220)
  const [style, setStyle] = useState('minimal')
  const [ready, setReady] = useState(false)

  const cityHexes = useMemo(() => createCityHexes(), [])

  useEffect(() => {
    setReady(false)
    const mount = globeMountRef.current
    const overlay = overlayRef.current
    if (!mount || !overlay) return undefined

    const globe = Globe({ animateIn: true })(mount)
    globeInstanceRef.current = globe

    const syncSize = () => {
      const { clientWidth, clientHeight } = mount
      globe.width(clientWidth)
      globe.height(clientHeight)
      overlay.width = clientWidth
      overlay.height = clientHeight
    }

    syncSize()
    window.addEventListener('resize', syncSize)

    const run = () => {
      rotationRef.current = (rotationRef.current + 0.22) % 360
      globe.pointOfView({ lng: rotationRef.current })
      drawHexLayer(rotationRef.current)
      animationRef.current = requestAnimationFrame(run)
    }

    const drawHexLayer = (rotationDeg) => {
      const ctx = overlay.getContext('2d')
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      const radius = Math.min(overlay.width, overlay.height) * 0.42
      const cx = overlay.width / 2
      const cy = overlay.height / 2
      const palette = STYLE_PRESETS[style]

      const maxMagnitude = Math.max(...cityHexes.map((c) => c.magnitude))

      cityHexes.forEach((city) => {
        const projected = projectToScreen(city, rotationDeg, radius, cx, cy)
        if (!projected) return
        const normalized = city.magnitude / maxMagnitude
        const size = 10 + normalized * 24
        const altitude = 0.6 + normalized * 0.9

        const gradient = ctx.createLinearGradient(projected.x, projected.y - size * altitude, projected.x, projected.y + size)
        gradient.addColorStop(0, palette.accent[1])
        gradient.addColorStop(1, palette.accent[0])

        drawHex(ctx, projected.x, projected.y - size * 0.25, size, gradient, palette.glow)

        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.font = '600 12px Inter, system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(city.name, projected.x, projected.y - size * altitude - 6)
      })
    }

    globe
      .backgroundColor('transparent')
      .globeImageUrl(STYLE_PRESETS[style].texture)
      .bumpImageUrl(null)
      .cloudsImageUrl(null)
      .cloudsOpacity(0)
      .showAtmosphere(true)
      .atmosphereColor(STYLE_PRESETS[style].atmosphere)
      .atmosphereAltitude(0.12)
      .pointOfView({ lng: rotationRef.current })

    const readyTimeout = setTimeout(() => setReady(true), 600)
    animationRef.current = requestAnimationFrame(run)

    return () => {
      cancelAnimationFrame(animationRef.current)
      clearTimeout(readyTimeout)
      window.removeEventListener('resize', syncSize)
      globe.destroy()
    }
  }, [cityHexes, style])

  useEffect(() => {
    const globe = globeInstanceRef.current
    if (!globe) return
    const preset = STYLE_PRESETS[style]
    globe.globeImageUrl(preset.texture)
    globe.atmosphereColor(preset.atmosphere)
  }, [style])

  return (
    <div className="page">
      <div className="hero">
        <div>
          <p className="eyebrow">Hex bins on a living planet</p>
          <h1>City intensity globe</h1>
          <p className="lede">
            Fifty of the world&apos;s largest cities drive the random data powering this hexagonal layer.
            Watch the clusters glide as the globe spins edge-to-edge.
          </p>
          <div className="controls">
            <label htmlFor="style">Globe texture</label>
            <div className="select">
              <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} disabled={!ready}>
                {Object.entries(STYLE_PRESETS).map(([value, preset]) => (
                  <option key={value} value={value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <span className="hint">Minimal uses earth-dark, Satellite pulls earth-night, Vintage leans on earth-vintage.</span>
            </div>
          </div>
        </div>
        <div className="legend">
          <div className="legend-row">
            <span className="chip" />
            <div>
              <strong>Hex bins</strong>
              <p>Aggregated random magnitudes per city rendered as glowing prisms.</p>
            </div>
          </div>
          <div className="legend-row">
            <span className="chip soft" />
            <div>
              <strong>Rotation</strong>
              <p>Driven by the same point-of-view updates as the texture background.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="globe-area">
        <div className="globe-shell" ref={globeMountRef}>
          <canvas ref={overlayRef} className="hex-overlay" />
          {!ready && <div className="loading">Preparing globe visuals…</div>}
        </div>
      </div>
    </div>
  )
}

export default App
