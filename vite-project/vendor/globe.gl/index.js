const defaultControls = () => ({
  autoRotate: false,
  autoRotateSpeed: 0.25,
  enableZoom: false,
})

function setBackgroundImage(target, url) {
  if (!target) return
  if (url) {
    target.style.backgroundImage = `url(${url})`
  } else {
    target.style.backgroundImage = 'none'
  }
}

export default function Globe({ animateIn = true } = {}) {
  return (mountEl) => {
    if (!mountEl) {
      throw new Error('A mount element is required for Globe()')
    }

    const host = mountEl
    const computedPosition = getComputedStyle(host).position
    if (computedPosition === 'static') {
      host.style.position = 'relative'
    }

    const root = document.createElement('div')
    root.className = 'globe-gl-root'
    host.appendChild(root)

    const shell = document.createElement('div')
    shell.className = 'globe-gl-shell'

    const surface = document.createElement('div')
    surface.className = 'globe-gl-surface'

    const bump = document.createElement('div')
    bump.className = 'globe-gl-bump'

    const clouds = document.createElement('div')
    clouds.className = 'globe-gl-clouds'

    const halo = document.createElement('div')
    halo.className = 'globe-gl-halo'

    shell.appendChild(surface)
    shell.appendChild(bump)
    shell.appendChild(clouds)
    root.appendChild(shell)
    root.appendChild(halo)

    let rotation = 0
    let cloudRotation = 0
    let cloudSpeed = 0.16
    let running = true
    let width = host.clientWidth
    let height = host.clientHeight
    let frameId

    const controls = defaultControls()

    const api = {
      backgroundColor(color) {
        root.style.backgroundColor = color || 'transparent'
        return api
      },
      width(value) {
        width = value
        updateSize()
        return api
      },
      height(value) {
        height = value
        updateSize()
        return api
      },
      globeImageUrl(url) {
        setBackgroundImage(surface, url)
        return api
      },
      bumpImageUrl(url) {
        setBackgroundImage(bump, url)
        bump.style.opacity = url ? '0.45' : '0'
        return api
      },
      cloudsImageUrl(url) {
        setBackgroundImage(clouds, url)
        clouds.style.opacity = url ? clouds.style.opacity || '0.18' : '0'
        return api
      },
      cloudsOpacity(value) {
        clouds.style.opacity = value?.toString() ?? '0.18'
        return api
      },
      cloudsSpeed(value) {
        cloudSpeed = value * 100 || cloudSpeed
        return api
      },
      showAtmosphere(flag) {
        halo.style.opacity = flag ? '1' : '0'
        return api
      },
      atmosphereColor(color) {
        halo.style.boxShadow = `0 0 120px 55px ${color || '#86a8ff'} inset`
        halo.style.filter = 'blur(4px)'
        return api
      },
      atmosphereAltitude(value) {
        const scale = 1 + (value || 0)
        halo.style.transform = `scale(${scale})`
        return api
      },
      controls() {
        return controls
      },
      pointOfView({ lng = 0 } = {}) {
        rotation = ((lng % 360) + 360) % 360
        applyRotation()
        return api
      },
      onGlobeReady(cb) {
        if (typeof cb === 'function') {
          if (animateIn) {
            requestAnimationFrame(() => cb(api))
          } else {
            cb(api)
          }
        }
        return api
      },
      pauseAnimation() {
        running = false
        return api
      },
      resumeAnimation() {
        if (!running) {
          running = true
          tick()
        }
        return api
      },
      destroy() {
        running = false
        cancelAnimationFrame(frameId)
        if (host.contains(root)) host.removeChild(root)
      },
    }

    function applyRotation() {
      surface.style.backgroundPosition = `${rotation}% 50%`
      bump.style.backgroundPosition = `${rotation}% 50%`
    }

    function updateSize() {
      const size = Math.max(Math.min(width, height) * 1.05, 200)
      shell.style.width = `${size}px`
      shell.style.height = `${size}px`
      halo.style.width = `${size}px`
      halo.style.height = `${size}px`
    }

    function tick() {
      if (!running) return
      rotation = (rotation + (controls.autoRotate ? controls.autoRotateSpeed : 0)) % 360
      cloudRotation = (cloudRotation + cloudSpeed * 0.01) % 360
      applyRotation()
      clouds.style.backgroundPosition = `${cloudRotation}% 50%`
      frameId = requestAnimationFrame(tick)
    }

    updateSize()
    tick()

    return api
  }
}
