import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const MAP_ENDPOINTS = {
  world: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
  states: 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
}

const PLAY_DURATION_MS = 16000

const TRIPS = [
  {
    tripName: 'Europe Trip 2023',
    color: '#4F46E5',
    countries: ['United States of America', 'United Kingdom', 'France', 'Spain', 'Ireland'],
    itinerary: [
      {
        airportFrom: 'Seattle-Tacoma International Airport (SEA)',
        airportTo: 'London Heathrow Airport (LHR)',
        latFrom: 47.443546,
        lonFrom: -122.301659,
        latTo: 51.47002,
        lonTo: -0.454295,
        date: '2023-03-19T02:35:00Z', // 18 Mar 2023, 7:35 PM PDT
        duration: 555, // 9h 15m
        type: 'flight',
      },
      {
        airportFrom: 'citizenM Tower of London (London)',
        airportTo: 'citizenM Tower of London (London)',
        latFrom: 51.50853,
        lonFrom: -0.076132,
        latTo: 51.50853,
        lonTo: -0.076132,
        date: '2023-03-19T15:00:00Z', // 19 Mar 2023, 15:00 GMT
        duration: 3984, // until 22 Mar 2023, 09:24 GMT (train departure)
        type: 'stay',
      },
      {
        airportFrom: 'St Pancras International Station (London)',
        airportTo: 'Gare du Nord (Paris)',
        latFrom: 51.531891,
        lonFrom: -0.126851,
        latTo: 48.880948,
        lonTo: 2.355314,
        date: '2023-03-22T09:24:00Z', // 22 Mar 2023, 09:24 GMT
        duration: 153, // 2h 33m
        type: 'train',
      },
      {
        airportFrom: 'citizenM Paris Gare de Lyon (Paris)',
        airportTo: 'citizenM Paris Gare de Lyon (Paris)',
        latFrom: 48.844806,
        lonFrom: 2.373479,
        latTo: 48.844806,
        lonTo: 2.373479,
        date: '2023-03-22T14:00:00Z', // 22 Mar 2023, 15:00 CET
        duration: 1006, // until 23 Mar 2023, 07:46 CET (train departure)
        type: 'stay',
      },
      {
        airportFrom: 'Gare de Lyon (Paris)',
        airportTo: 'Lyon-Part-Dieu Station (Lyon)',
        latFrom: 48.844806,
        lonFrom: 2.373479,
        latTo: 45.76056,
        lonTo: 4.85944,
        date: '2023-03-23T06:46:00Z', // 23 Mar 2023, 07:46 CET
        duration: 149, // 2h 29m
        type: 'train',
      },
      {
        airportFrom: 'Lyon, France',
        airportTo: 'Vienne, France',
        latFrom: 45.764043,
        lonFrom: 4.835659,
        latTo: 45.525587,
        lonTo: 4.874339,
        date: '2023-03-25T08:00:00Z', // 25 Mar 2023, ~09:00 CET
        duration: 2820, // until 27 Mar 2023, 09:00 CEST
        type: 'cruise',
      },
      {
        airportFrom: 'Vienne, France',
        airportTo: 'Avignon, France',
        latFrom: 45.525587,
        lonFrom: 4.874339,
        latTo: 43.949317,
        lonTo: 4.805528,
        date: '2023-03-27T07:00:00Z', // 27 Mar 2023, ~09:00 CEST
        duration: 2220, // until 28 Mar 2023, 22:00 CEST
        type: 'cruise',
      },
      {
        airportFrom: 'Avignon, France',
        airportTo: 'Arles, France',
        latFrom: 43.949317,
        lonFrom: 4.805528,
        latTo: 43.676701,
        lonTo: 4.6278,
        date: '2023-03-28T20:00:00Z', // 28 Mar 2023, 22:00 CEST (overnight sail)
        duration: 1970, // until 30 Mar 2023, 06:50 CEST
        type: 'cruise',
      },
      {
        airportFrom: "Gare d'Arles (Arles)",
        airportTo: 'Marseille Provence Airport (MRS)',
        latFrom: 43.68472,
        lonFrom: 4.63194,
        latTo: 43.439272,
        lonTo: 5.221424,
        date: '2023-03-30T04:50:00Z', // 30 Mar 2023, 06:50 CEST
        duration: 164, // until MRS–CDG departure at 09:34 CEST
        type: 'train',
      },
      {
        airportFrom: 'Marseille Provence Airport (MRS)',
        airportTo: 'Paris Charles de Gaulle Airport (CDG)',
        latFrom: 43.439272,
        lonFrom: 5.221424,
        latTo: 49.0128,
        lonTo: 2.55,
        date: '2023-03-30T07:34:00Z', // 30 Mar 2023, 09:34 CEST
        duration: 166, // until 12:20 CEST
        type: 'flight',
      },
      {
        airportFrom: 'Paris Charles de Gaulle Airport (CDG)',
        airportTo: 'Paris Charles de Gaulle Airport (CDG)',
        latFrom: 49.0128,
        lonFrom: 2.55,
        latTo: 49.0128,
        lonTo: 2.55,
        date: '2023-03-30T10:20:00Z', // 30 Mar 2023, 12:20 CEST
        duration: 44, // layover until 13:04 CEST
        type: 'layover',
      },
      {
        airportFrom: 'Paris Charles de Gaulle Airport (CDG)',
        airportTo: 'Josep Tarradellas Barcelona-El Prat Airport (BCN)',
        latFrom: 49.0128,
        lonFrom: 2.55,
        latTo: 41.2971,
        lonTo: 2.07846,
        date: '2023-03-30T11:04:00Z', // 30 Mar 2023, 13:04 CEST
        duration: 108, // until 14:52 CEST
        type: 'flight',
      },
      {
        airportFrom: 'Renaissance Barcelona Hotel (Barcelona)',
        airportTo: 'Renaissance Barcelona Hotel (Barcelona)',
        latFrom: 41.392789,
        lonFrom: 2.167398,
        latTo: 41.392789,
        lonTo: 2.167398,
        date: '2023-03-30T13:00:00Z', // 30 Mar 2023, 15:00 CEST
        duration: 4080, // until 2 Apr 2023, 11:00 CEST
        type: 'stay',
      },
      {
        airportFrom: 'Josep Tarradellas Barcelona-El Prat Airport (BCN)',
        airportTo: 'Dublin Airport (DUB)',
        latFrom: 41.2971,
        lonFrom: 2.07846,
        latTo: 53.4287,
        lonTo: -6.2621,
        date: '2023-04-02T09:24:00Z', // 2 Apr 2023, 11:24 CEST
        duration: 236, // until 14:20 IST
        type: 'flight',
      },
      {
        airportFrom: 'Dublin Airport (DUB)',
        airportTo: 'Dublin Airport (DUB)',
        latFrom: 53.4287,
        lonFrom: -6.2621,
        latTo: 53.4287,
        lonTo: -6.2621,
        date: '2023-04-02T13:20:00Z', // 2 Apr 2023, 14:20 IST
        duration: 30, // layover until 14:50 IST
        type: 'layover',
      },
      {
        airportFrom: 'Dublin Airport (DUB)',
        airportTo: 'Seattle-Tacoma International Airport (SEA)',
        latFrom: 53.4287,
        lonFrom: -6.2621,
        latTo: 47.443546,
        lonTo: -122.301659,
        date: '2023-04-02T13:50:00Z', // 2 Apr 2023, 14:50 IST
        duration: 610, // until ~5:00 PM PDT (3 Apr 00:00Z)
        type: 'flight',
      },
    ],
  },
]

const TRANSPORT_STYLES = {
  flight: { label: 'Flight', strokeDasharray: '3 2' },
  cruise: { label: 'Cruise', strokeDasharray: '0' },
  train: { label: 'Train', strokeDasharray: '6 3' },
  car: { label: 'Car', strokeDasharray: '2 2' },
  layover: { label: 'Layover', strokeDasharray: '1 4' },
  stay: { label: 'Stay', strokeDasharray: '0' },
}

const formatDate = (date) =>
  date
    .toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .replace(/,/, '')

const MINUTE_MS = 60 * 1000

const buildSegments = (trips) => {
  const segments = []
  trips.forEach((trip) => {
    let cursor = null
    trip.itinerary.forEach((leg) => {
      const start = {
        lat: leg.latFrom ?? cursor?.lat ?? leg.latTo,
        lon: leg.lonFrom ?? cursor?.lon ?? leg.lonTo,
      }
      const end = { lat: leg.latTo ?? start.lat, lon: leg.lonTo ?? start.lon }
      const date = new Date(leg.date)
      const durationMs = Math.max(0, (leg.duration ?? 0) * MINUTE_MS)
      const endDate = new Date(date.getTime() + durationMs)
      segments.push({
        ...leg,
        tripName: trip.tripName,
        color: trip.color,
        start,
        end,
        date,
        endDate,
        durationMs,
      })
      cursor = end
    })
  })
  return segments.sort((a, b) => a.date.getTime() - b.date.getTime())
}

const withOpacity = (hexColor, alpha = 0.5) => {
  if (!hexColor?.startsWith('#') || (hexColor.length !== 7 && hexColor.length !== 4)) return hexColor

  const expandHex = (color) => (color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color)
  const color = expandHex(hexColor)
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const buildVisitCounts = (segments) => {
  const visitMap = new Map()
  const register = (lat, lon, label, tripName, color, date) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`
    const entry = visitMap.get(key) || {
      lat,
      lon,
      label,
      trips: new Set(),
      color,
      visits: 0,
      lastDate: date,
    }
    entry.visits += 1
    entry.trips.add(tripName)
    entry.color = color || entry.color
    entry.lastDate = date > entry.lastDate ? date : entry.lastDate
    visitMap.set(key, entry)
  }

  segments.forEach((segment) => {
    register(segment.start.lat, segment.start.lon, segment.airportFrom, segment.tripName, segment.color, segment.date)
    register(
      segment.end.lat,
      segment.end.lon,
      segment.airportTo,
      segment.tripName,
      segment.color,
      segment.endDate ?? segment.date,
    )
  })

  return Array.from(visitMap.values())
}

const buildCountryTimeline = (trips) => {
  const tripStartDates = new Map()

  trips.forEach((trip) => {
    const start = new Date(
      trip.itinerary.reduce((min, leg) => {
        const legDate = new Date(leg.date)
        return legDate.getTime() < min ? legDate.getTime() : min
      }, new Date(trip.itinerary[0].date).getTime()),
    )
    tripStartDates.set(trip.tripName, start)
  })

  const countryMap = new Map()

  trips.forEach((trip) => {
    const firstVisited = tripStartDates.get(trip.tripName)
    trip.countries.forEach((country) => {
      const existing = countryMap.get(country)
      if (!existing || firstVisited < existing.firstVisited) {
        countryMap.set(country, { color: trip.color, firstVisited, tripName: trip.tripName })
      }
    })
  })

  return countryMap
}

function App() {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [libs, setLibs] = useState(null)
  const [geographies, setGeographies] = useState(null)
  const [status, setStatus] = useState('booting')
  const [selectedTrip, setSelectedTrip] = useState('all')
  const [sliderValue, setSliderValue] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const rafRef = useRef(null)
  const lastTickRef = useRef(null)

  const segments = useMemo(() => buildSegments(TRIPS), [])
  const visits = useMemo(() => buildVisitCounts(segments), [segments])
  const countryTimeline = useMemo(() => buildCountryTimeline(TRIPS), [])

  const timeExtent = useMemo(() => {
    if (!segments.length) return null
    const start = segments[0].date
    const end = segments.reduce((latest, segment) => {
      if (!segment.endDate) return latest
      return segment.endDate > latest ? segment.endDate : latest
    }, segments[segments.length - 1].endDate ?? segments[segments.length - 1].date)
    return [start, end]
  }, [segments])

  const currentDate = useMemo(() => {
    if (!timeExtent) return null
    const [min, max] = timeExtent
    const range = max.getTime() - min.getTime()
    const next = min.getTime() + (range * sliderValue) / 100
    return new Date(next)
  }, [sliderValue, timeExtent])

  const timedSegments = useMemo(() => {
    if (!currentDate) return []
    const now = currentDate.getTime()

    return segments
      .filter((segment) => now >= segment.date.getTime())
      .filter((segment) => selectedTrip === 'all' || segment.tripName === selectedTrip)
      .map((segment) => {
        if (!segment.durationMs || segment.durationMs <= 0) return { ...segment, progress: 1 }
        const elapsed = now - segment.date.getTime()
        const progress = Math.min(1, Math.max(0, elapsed / segment.durationMs))
        return { ...segment, progress }
      })
  }, [currentDate, segments, selectedTrip])

  const filteredVisits = useMemo(
    () =>
      visits
        .filter((visit) => !currentDate || visit.lastDate.getTime() <= currentDate.getTime())
        .filter((visit) => (selectedTrip === 'all' ? true : visit.trips.has(selectedTrip))),
    [currentDate, selectedTrip, visits],
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setStatus('loading')
      const [d3, topojson] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/d3@7/+esm'),
        import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm'),
      ])

      const [worldRaw, statesRaw] = await Promise.all([
        fetch(MAP_ENDPOINTS.world).then((r) => r.json()),
        fetch(MAP_ENDPOINTS.states).then((r) => r.json()),
      ])

      if (cancelled) return

      const countries = topojson.feature(worldRaw, worldRaw.objects.countries)
      const countryMesh = topojson.mesh(worldRaw, worldRaw.objects.countries, (a, b) => a !== b)
      const states = topojson.feature(statesRaw, statesRaw.objects.states)
      const stateMesh = topojson.mesh(statesRaw, statesRaw.objects.states, (a, b) => a !== b)

      setLibs({ d3, topojson })
      setGeographies({ countries, countryMesh, states, stateMesh })
      setStatus('ready')
    }

    load().catch(() => {
      if (!cancelled) setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!libs || !geographies || !currentDate) return

    const { d3 } = libs
    const container = containerRef.current
    const svg = d3.select(svgRef.current)

    const width = container.clientWidth
    const height = Math.max(520, Math.round(width * 0.55))

    svg.attr('viewBox', `0 0 ${width} ${height}`)
    svg.selectAll('*').remove()

    const zoomLayer = svg.append('g').attr('class', 'zoom-layer')
    const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: 'Sphere' })
    const path = d3.geoPath(projection)
    const graticule = d3.geoGraticule10()

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform)
      })

    svg.call(zoomBehavior)

    zoomLayer
      .append('path')
      .attr('class', 'map-outline')
      .attr('d', path({ type: 'Sphere' }))

    zoomLayer
      .append('path')
      .attr('class', 'graticule')
      .attr('d', path(graticule))

    zoomLayer
      .append('g')
      .attr('class', 'countries')
      .selectAll('path')
      .data(geographies.countries.features)
      .join('path')
      .attr('d', path)
      .attr('fill', (d) => {
        const entry = countryTimeline.get(d.properties?.name)
        if (!entry || entry.firstVisited > currentDate) return 'rgba(255,255,255,0.04)'
        return withOpacity(entry.color, 0.5)
      })
      .attr('stroke', 'rgba(255,255,255,0.18)')
      .attr('stroke-width', 0.35)
      .on('mouseenter', (_, feature) =>
        setHoveredRegion({ type: 'Country', name: feature.properties?.name ?? 'Unknown' }),
      )
      .on('mouseleave', () => setHoveredRegion(null))

    zoomLayer
      .append('path')
      .attr('class', 'country-borders')
      .attr('d', path(geographies.countryMesh))

    zoomLayer
      .append('g')
      .attr('class', 'states')
      .selectAll('path')
      .data(geographies.states.features)
      .join('path')
      .attr('d', path)
      .attr('fill', 'transparent')
      .attr('stroke', 'rgba(255,255,255,0.22)')
      .attr('stroke-width', 0.3)
      .on('mouseenter', (_, feature) =>
        setHoveredRegion({ type: 'State/Province', name: feature.properties?.name ?? feature.id }),
      )
      .on('mouseleave', () => setHoveredRegion(null))

    zoomLayer
      .append('path')
      .attr('class', 'state-borders')
      .attr('d', path(geographies.stateMesh))

    zoomLayer
      .append('g')
      .attr('class', 'routes')
      .selectAll('path')
      .data(timedSegments)
      .join('path')
      .attr('d', (segment) => {
        const coordinates = [
          [segment.start.lon, segment.start.lat],
          segment.progress >= 1
            ? [segment.end.lon, segment.end.lat]
            : libs.d3
                .geoInterpolate([segment.start.lon, segment.start.lat], [segment.end.lon, segment.end.lat])
                (segment.progress),
        ]

        return path({ type: 'LineString', coordinates })
      })
      .attr('class', (segment) => `route route-${segment.type}`)
      .attr('stroke', (segment) => segment.color)
      .attr('stroke-dasharray', (segment) => TRANSPORT_STYLES[segment.type]?.strokeDasharray || '0')
      .append('title')
      .text(
        (segment) =>
          `${segment.tripName}: ${segment.airportFrom} → ${segment.airportTo}\n${formatDate(segment.date)} · ${TRANSPORT_STYLES[segment.type]?.label || segment.type}`,
      )

    zoomLayer
      .append('g')
      .attr('class', 'markers')
      .selectAll('circle')
      .data(filteredVisits)
      .join('circle')
      .attr('transform', (visit) => {
        const [x, y] = projection([visit.lon, visit.lat])
        return `translate(${x}, ${y})`
      })
      .attr('r', (visit) => 3 + Math.sqrt(visit.visits) * 3)
      .attr('fill', (visit) => visit.color)
      .attr('fill-opacity', 0.82)
      .attr('stroke', 'rgba(0,0,0,0.45)')
      .attr('stroke-width', 0.5)
      .append('title')
      .text((visit) => `${visit.label || 'Stop'} · ${visit.visits} visit(s)\n${Array.from(visit.trips).join(', ')}`)
  }, [libs, geographies, currentDate, timedSegments, filteredVisits, countryTimeline])

  useEffect(() => {
    if (!isPlaying || !timeExtent) return () => {}

    const step = (timestamp) => {
      if (lastTickRef.current == null) lastTickRef.current = timestamp
      const elapsed = timestamp - lastTickRef.current
      lastTickRef.current = timestamp

      setSliderValue((previous) => {
        const next = previous + (elapsed / PLAY_DURATION_MS) * 100
        if (next >= 100) {
          setIsPlaying(false)
          return 100
        }
        return next
      })

      if (isPlaying) rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTickRef.current = null
    }
  }, [isPlaying, timeExtent])

  useEffect(() => {
    if (!isPlaying) return
    if (sliderValue >= 100) setIsPlaying(false)
  }, [isPlaying, sliderValue])

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }

    if (sliderValue >= 100) {
      setSliderValue(0)
    }
    setIsPlaying(true)
  }

  const heroSummary = useMemo(() => {
    if (!timeExtent) return ''
    const [min, max] = timeExtent
    return `${formatDate(min)} → ${formatDate(max)} · ${segments.length} segments · ${visits.length} stops`
  }, [timeExtent, segments.length, visits.length])

  const sliderLabel = currentDate ? formatDate(currentDate) : 'Loading map…'

  return (
    <div className="page">
      <header className="hero">
        <div className="copy">
          <p className="eyebrow">D3-driven world map</p>
          <h1>Interactive travel canvas</h1>
          <p className="lede">
            A 2D view that replaces the globe with an SVG map. It is designed to house future time sliders, animated
            connections, scalable visit markers, and per-trip highlighting for both countries and states.
          </p>
          <p className="summary">{heroSummary}</p>

          <div className="controls">
            <label className="control-label" htmlFor="trip">
              Focus trip
            </label>
            <select id="trip" value={selectedTrip} onChange={(event) => setSelectedTrip(event.target.value)}>
              <option value="all">All trips</option>
              {TRIPS.map((trip) => (
                <option key={trip.tripName} value={trip.tripName}>
                  {trip.tripName}
                </option>
              ))}
            </select>

            <label className="control-label" htmlFor="timeline">
              Timeline preview
            </label>
            <div className="slider-row">
              <button type="button" className="play-toggle" onClick={togglePlayback} aria-label="Toggle timeline playback">
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <input
                type="range"
                id="timeline"
                min={0}
                max={100}
                value={sliderValue}
                onChange={(event) => setSliderValue(Number(event.target.value))}
              />
              <span className="slider-label">{sliderLabel}</span>
            </div>
          </div>

          <div className="legend">
            <div className="legend-row">
              <span className="swatch" />
              <div>
                <strong>Highlighted regions</strong>
                <p>Countries are softly tinted with the color of the trip they belong to. States are wired for future zooming.</p>
              </div>
            </div>
            <div className="legend-row">
              <span className="swatch route" />
              <div>
                <strong>Paths and speed</strong>
                <p>Routes animate with differing dash patterns for trains, cars, and flights while respecting their durations.</p>
              </div>
            </div>
            <div className="legend-row">
              <span className="swatch marker" />
              <div>
                <strong>Visit density</strong>
                <p>Markers scale with repeat visits to a location, paving the way for bubble and spike maps later.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="status-panel">
          <div className="panel-row">
            <span className="label">Hovered</span>
            <span className="value">{hoveredRegion ? `${hoveredRegion.type}: ${hoveredRegion.name}` : 'None'}</span>
          </div>
          <div className="panel-row">
            <span className="label">Segments shown</span>
            <span className="value">{timedSegments.length}</span>
          </div>
          <div className="panel-row">
            <span className="label">Markers shown</span>
            <span className="value">{filteredVisits.length}</span>
          </div>
          <div className="panel-row subtle">Remote D3 + TopoJSON imports enable a minimal footprint today and can be replaced with local packages later.</div>
        </div>
      </header>

      <section className="map-shell" ref={containerRef}>
        {status === 'error' && <div className="warning">We could not load the basemap data. Check your connection and reload.</div>}
        <svg ref={svgRef} role="img" aria-label="World map with trip overlays" />
      </section>
    </div>
  )
}

export default App
