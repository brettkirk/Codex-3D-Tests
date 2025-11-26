import { useEffect, useRef, useState } from 'react'
import Globe from 'globe.gl'
import './App.css'

const STYLES = [
  { value: 'modern', label: 'Modern minimal' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'vintage', label: 'Vintage' },
]

const DEFAULT_STYLE = STYLES[0].value

const CONTINENT_SHAPES = [
  [
    [0.08, 0.32],
    [0.14, 0.24],
    [0.22, 0.2],
    [0.32, 0.16],
    [0.34, 0.24],
    [0.3, 0.28],
    [0.26, 0.32],
    [0.2, 0.42],
    [0.14, 0.4],
  ],
  [
    [0.22, 0.46],
    [0.28, 0.46],
    [0.38, 0.6],
    [0.32, 0.82],
    [0.24, 0.9],
    [0.2, 0.78],
  ],
  [
    [0.36, 0.22],
    [0.46, 0.18],
    [0.54, 0.18],
    [0.64, 0.2],
    [0.66, 0.28],
    [0.6, 0.32],
    [0.52, 0.3],
    [0.44, 0.28],
  ],
  [
    [0.42, 0.32],
    [0.52, 0.32],
    [0.64, 0.4],
    [0.58, 0.56],
    [0.5, 0.62],
    [0.44, 0.52],
    [0.4, 0.42],
  ],
  [
    [0.68, 0.26],
    [0.78, 0.3],
    [0.86, 0.36],
    [0.88, 0.46],
    [0.82, 0.52],
    [0.72, 0.48],
    [0.66, 0.36],
  ],
  [
    [0.72, 0.58],
    [0.82, 0.62],
    [0.9, 0.72],
    [0.88, 0.8],
    [0.78, 0.78],
    [0.7, 0.68],
  ],
  [
    [0.82, 0.86],
    [0.88, 0.9],
    [0.94, 0.96],
    [0.9, 0.98],
    [0.82, 0.94],
  ],
]

function drawPolygon(ctx, points, { fill, stroke, jitter = 0 }) {
  const { width, height } = ctx.canvas
  ctx.beginPath()
  points.forEach(([x, y], index) => {
    const px = x * width + (Math.random() - 0.5) * jitter
    const py = y * height + (Math.random() - 0.5) * jitter
    if (index === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.stroke()
  }
}

function addNoise(ctx, density, alpha = 0.14) {
  const { width, height } = ctx.canvas
  const count = Math.floor(width * height * density)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < count; i += 1) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
  }
  ctx.restore()
}

function drawGraticules(ctx, color) {
  const { width, height } = ctx.canvas
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  for (let lon = 0; lon <= 360; lon += 30) {
    const x = (lon / 360) * width
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let lat = 0; lat <= 180; lat += 30) {
    const y = (lat / 180) * height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.restore()
}

function createTextureSet(style) {
  const size = 1920
  const mapCanvas = document.createElement('canvas')
  mapCanvas.width = size
  mapCanvas.height = size / 2
  const mapCtx = mapCanvas.getContext('2d')

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = size
  bumpCanvas.height = size / 2
  const bumpCtx = bumpCanvas.getContext('2d')

  const cloudCanvas = document.createElement('canvas')
  cloudCanvas.width = size
  cloudCanvas.height = size / 2
  const cloudCtx = cloudCanvas.getContext('2d')

  const palettes = {
    modern: {
      ocean: ['#071829', '#0b2641'],
      land: ['#22c55e', '#15803d'],
      shore: 'rgba(255,255,255,0.35)',
      grid: 'rgba(255,255,255,0.2)',
      hazeTop: 'rgba(255,255,255,0.14)',
      hazeBottom: 'rgba(0,0,0,0.18)',
    },
    satellite: {
      ocean: ['#0a325c', '#051932'],
      land: ['#2f855a', '#1f5133'],
      shore: 'rgba(204, 188, 146, 0.55)',
      grid: 'rgba(255,255,255,0.12)',
      hazeTop: 'rgba(255,255,255,0.1)',
      hazeBottom: 'rgba(0,0,0,0.2)',
    },
    vintage: {
      ocean: ['#c3ad84', '#9c855a'],
      land: ['#7a5a38', '#5a4228'],
      shore: 'rgba(255, 237, 209, 0.45)',
      grid: 'rgba(66, 46, 32, 0.35)',
      hazeTop: 'rgba(255,255,255,0.12)',
      hazeBottom: 'rgba(60,43,30,0.2)',
    },
  }

  const palette = palettes[style]

  const ocean = mapCtx.createLinearGradient(0, 0, 0, mapCanvas.height)
  ocean.addColorStop(0, palette.ocean[0])
  ocean.addColorStop(1, palette.ocean[1])
  mapCtx.fillStyle = ocean
  mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height)

  const bumpOcean = bumpCtx.createLinearGradient(0, 0, 0, bumpCanvas.height)
  bumpOcean.addColorStop(0, '#2a2a2a')
  bumpOcean.addColorStop(1, '#000000')
  bumpCtx.fillStyle = bumpOcean
  bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height)

  CONTINENT_SHAPES.forEach((points) => {
    const landGradient = mapCtx.createLinearGradient(0, 0, mapCanvas.width, mapCanvas.height)
    landGradient.addColorStop(0, palette.land[0])
    landGradient.addColorStop(1, palette.land[1])
    drawPolygon(mapCtx, points, {
      fill: landGradient,
      stroke: { color: palette.shore, width: 3 },
      jitter: style === 'modern' ? 3 : 1.5,
    })

    drawPolygon(bumpCtx, points, {
      fill: '#888888',
      stroke: { color: 'rgba(0,0,0,0.25)', width: 2 },
      jitter: 2,
    })
  })

  drawGraticules(mapCtx, palette.grid)

  mapCtx.save()
  const haze = mapCtx.createLinearGradient(0, 0, 0, mapCanvas.height)
  haze.addColorStop(0, palette.hazeTop)
  haze.addColorStop(0.5, 'rgba(255,255,255,0)')
  haze.addColorStop(1, palette.hazeBottom)
  mapCtx.fillStyle = haze
  mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height)
  mapCtx.restore()

  addNoise(mapCtx, 0.00004, 0.2)
  addNoise(bumpCtx, 0.000025, 0.4)

  cloudCtx.strokeStyle = 'rgba(255,255,255,0.22)'
  cloudCtx.lineWidth = 14
  cloudCtx.filter = 'blur(1px)'
  for (let i = 0; i < 5; i += 1) {
    const y = (cloudCanvas.height / 6) * (i + 1)
    cloudCtx.beginPath()
    cloudCtx.moveTo(-50, y + Math.sin(i * 1.6) * 8)
    cloudCtx.bezierCurveTo(
      cloudCanvas.width * 0.22,
      y + 10,
      cloudCanvas.width * 0.55,
      y - 12,
      cloudCanvas.width + 50,
      y + 6,
    )
    cloudCtx.stroke()
  }

  return {
    map: mapCanvas.toDataURL('image/png'),
    bump: bumpCanvas.toDataURL('image/png'),
    clouds: cloudCanvas.toDataURL('image/png'),
  }
}

function App() {
  const globeMountRef = useRef(null)
  const globeInstanceRef = useRef(null)
  const textureCache = useRef({})
  const [style, setStyle] = useState(DEFAULT_STYLE)
  const [ready, setReady] = useState(false)

  const getTextures = (currentStyle) => {
    if (!textureCache.current[currentStyle]) {
      textureCache.current[currentStyle] = createTextureSet(currentStyle)
    }
    return textureCache.current[currentStyle]
  }

  useEffect(() => {
    const mount = globeMountRef.current
    if (!mount) return

    const globe = Globe({ animateIn: true })(mount)
    globeInstanceRef.current = globe

    const { map, bump, clouds } = getTextures(DEFAULT_STYLE)

    globe
      .backgroundColor('transparent')
      .globeImageUrl(map)
      .bumpImageUrl(bump)
      .cloudsImageUrl(clouds)
      .cloudsOpacity(0.2)
      .cloudsSpeed(0.006)
      .showAtmosphere(true)
      .atmosphereColor('#9bb8ff')
      .atmosphereAltitude(0.18)
      .pointOfView({ lng: -20 })

    const controls = globe.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.24

    const handleResize = () => {
      const { clientWidth, clientHeight } = mount
      globe.width(clientWidth * 1.08)
      globe.height(clientHeight * 1.08)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    globe.onGlobeReady(() => setReady(true))
    const readyTimeout = setTimeout(() => setReady(true), 800)

    return () => {
      clearTimeout(readyTimeout)
      window.removeEventListener('resize', handleResize)
      globe.destroy()
      globeInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const globe = globeInstanceRef.current
    if (!globe) return
    const { map, bump, clouds } = getTextures(style)
    globe.globeImageUrl(map)
    globe.bumpImageUrl(bump)
    globe.cloudsImageUrl(clouds)
  }, [style])

  return (
    <div className="page">
      <header>
        <h1>Earth spotlight</h1>
        <p>Rotating textures, clouds, and a halo to keep the planet front and center.</p>
      </header>
      <div className="content">
        <div className="panel">
          <label htmlFor="style">Map style</label>
          <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} disabled={!ready}>
            {STYLES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ul className="legend">
            <li><span className="swatch modern" />Modern keeps crisp lines and emerald landmasses.</li>
            <li><span className="swatch satellite" />Satellite leans into lush greens and moody oceans.</li>
            <li><span className="swatch vintage" />Vintage warms the palette with parchment seas.</li>
          </ul>
        </div>
        <div className="globe" ref={globeMountRef}>
          {!ready && <div className="loading">Preparing globe visuals…</div>}
        </div>
      </div>
    </div>
  )
}

export default App
