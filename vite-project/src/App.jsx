import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const MAP_ENDPOINTS = {
  world: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
  states: 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
}

const TRIPS = [
  {
    tripName: 'Atlantic Sprint',
    color: '#60a5fa',
    countries: ['United States of America', 'United Kingdom', 'France', 'Netherlands'],
    itinerary: [
      {
        airportFrom: 'JFK',
        airportTo: 'LHR',
        fromLat: 40.6413,
        fromLon: -73.7781,
        lat: 51.47,
        lon: -0.4543,
        date: '2024-05-12T14:00:00Z',
        duration: 420,
        type: 'flight',
      },
      {
        airportFrom: 'LHR',
        airportTo: 'CDG',
        fromLat: 51.47,
        fromLon: -0.4543,
        lat: 49.0097,
        lon: 2.5479,
        date: '2024-05-15T09:00:00Z',
        duration: 80,
        type: 'train',
      },
      {
        airportFrom: 'CDG',
        airportTo: 'AMS',
        fromLat: 49.0097,
        fromLon: 2.5479,
        lat: 52.3105,
        lon: 4.7683,
        date: '2024-05-18T08:30:00Z',
        duration: 65,
        type: 'flight',
      },
      {
        airportFrom: 'AMS',
        airportTo: 'JFK',
        fromLat: 52.3105,
        fromLon: 4.7683,
        lat: 40.6413,
        lon: -73.7781,
        date: '2024-05-20T15:00:00Z',
        duration: 510,
        type: 'flight',
      },
    ],
  },
  {
    tripName: 'Pacific Arcs',
    color: '#f59e0b',
    countries: ['United States of America', 'Japan', 'Australia', 'Singapore'],
    itinerary: [
      {
        airportFrom: 'SFO',
        airportTo: 'HND',
        fromLat: 37.6213,
        fromLon: -122.379,
        lat: 35.5494,
        lon: 139.7798,
        date: '2025-02-02T17:30:00Z',
        duration: 660,
        type: 'flight',
      },
      {
        airportFrom: 'HND',
        airportTo: 'SYD',
        fromLat: 35.5494,
        fromLon: 139.7798,
        lat: -33.8688,
        lon: 151.2093,
        date: '2025-02-08T04:00:00Z',
        duration: 580,
        type: 'flight',
      },
      {
        airportFrom: 'SYD',
        airportTo: 'SIN',
        fromLat: -33.8688,
        fromLon: 151.2093,
        lat: 1.3644,
        lon: 103.9915,
        date: '2025-02-14T07:00:00Z',
        duration: 480,
        type: 'flight',
      },
      {
        airportFrom: 'SIN',
        airportTo: 'SFO',
        fromLat: 1.3644,
        fromLon: 103.9915,
        lat: 37.6213,
        lon: -122.379,
        date: '2025-02-20T19:00:00Z',
        duration: 940,
        type: 'flight',
      },
    ],
  },
  {
    tripName: 'Overland Expedition',
    color: '#22c55e',
    countries: ['United States of America', 'Canada'],
    itinerary: [
      {
        airportFrom: 'DEN',
        airportTo: 'GLA',
        fromLat: 39.8561,
        fromLon: -104.6737,
        lat: 45.4215,
        lon: -75.6972,
        date: '2023-09-01T12:00:00Z',
        duration: 60,
        type: 'car',
      },
      {
        airportFrom: 'GLA',
        airportTo: 'YVR',
        fromLat: 45.4215,
        fromLon: -75.6972,
        lat: 49.2827,
        lon: -123.1207,
        date: '2023-09-05T14:00:00Z',
        duration: 300,
        type: 'train',
      },
      {
        airportFrom: 'YVR',
        airportTo: 'DEN',
        fromLat: 49.2827,
        fromLon: -123.1207,
        lat: 39.8561,
        lon: -104.6737,
        date: '2023-09-10T09:00:00Z',
        duration: 180,
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

const buildSegments = (trips) => {
  const segments = []
  trips.forEach((trip) => {
    let cursor = null
    trip.itinerary.forEach((leg) => {
      const start = cursor || { lat: leg.fromLat ?? leg.lat, lon: leg.fromLon ?? leg.lon }
      const end = { lat: leg.lat, lon: leg.lon }
      segments.push({
        ...leg,
        tripName: trip.tripName,
        color: trip.color,
        start,
        end,
        date: new Date(leg.date),
      })
      cursor = end
    })
  })
  return segments.sort((a, b) => a.date.getTime() - b.date.getTime())
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
    register(segment.end.lat, segment.end.lon, segment.airportTo, segment.tripName, segment.color, segment.date)
  })

  return Array.from(visitMap.values())
}

function App() {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [libs, setLibs] = useState(null)
  const [geographies, setGeographies] = useState(null)
  const [status, setStatus] = useState('booting')
  const [selectedTrip, setSelectedTrip] = useState('all')
  const [sliderValue, setSliderValue] = useState(100)
  const [hoveredRegion, setHoveredRegion] = useState(null)

  const segments = useMemo(() => buildSegments(TRIPS), [])
  const visits = useMemo(() => buildVisitCounts(segments), [segments])

  const timeExtent = useMemo(() => {
    if (!segments.length) return null
    return [segments[0].date, segments[segments.length - 1].date]
  }, [segments])

  const currentDate = useMemo(() => {
    if (!timeExtent) return null
    const [min, max] = timeExtent
    const range = max.getTime() - min.getTime()
    const next = min.getTime() + (range * sliderValue) / 100
    return new Date(next)
  }, [sliderValue, timeExtent])

  const visitedCountries = useMemo(() => {
    const map = new Map()
    TRIPS.forEach((trip) => {
      trip.countries.forEach((country) => map.set(country, trip.color))
    })
    return map
  }, [])

  const filteredSegments = useMemo(
    () =>
      segments.filter(
        (segment) =>
          (!currentDate || segment.date.getTime() <= currentDate.getTime()) &&
          (selectedTrip === 'all' || segment.tripName === selectedTrip),
      ),
    [segments, selectedTrip, currentDate],
  )

  const filteredVisits = useMemo(
    () =>
      visits
        .filter((visit) => !currentDate || visit.lastDate.getTime() <= currentDate.getTime())
        .filter((visit) =>
          selectedTrip === 'all'
            ? true
            : visit.trips.has(selectedTrip),
        ),
    [currentDate, visits, selectedTrip],
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

    const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: 'Sphere' })
    const path = d3.geoPath(projection)
    const graticule = d3.geoGraticule10()

    svg
      .append('path')
      .attr('class', 'map-outline')
      .attr('d', path({ type: 'Sphere' }))

    svg
      .append('path')
      .attr('class', 'graticule')
      .attr('d', path(graticule))

    svg
      .append('g')
      .attr('class', 'countries')
      .selectAll('path')
      .data(geographies.countries.features)
      .join('path')
      .attr('d', path)
      .attr('fill', (d) => visitedCountries.get(d.properties?.name) || 'rgba(255,255,255,0.04)')
      .attr('stroke', 'rgba(255,255,255,0.18)')
      .attr('stroke-width', 0.35)
      .on('mouseenter', (_, feature) =>
        setHoveredRegion({ type: 'Country', name: feature.properties?.name ?? 'Unknown' }),
      )
      .on('mouseleave', () => setHoveredRegion(null))

    svg
      .append('path')
      .attr('class', 'country-borders')
      .attr('d', path(geographies.countryMesh))

    svg
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

    svg
      .append('path')
      .attr('class', 'state-borders')
      .attr('d', path(geographies.stateMesh))

    svg
      .append('g')
      .attr('class', 'routes')
      .selectAll('path')
      .data(filteredSegments)
      .join('path')
      .attr('d', (segment) =>
        path({ type: 'LineString', coordinates: [[segment.start.lon, segment.start.lat], [segment.end.lon, segment.end.lat]] }),
      )
      .attr('class', (segment) => `route route-${segment.type}`)
      .attr('stroke', (segment) => segment.color)
      .attr('stroke-dasharray', (segment) => TRANSPORT_STYLES[segment.type]?.strokeDasharray || '0')
      .append('title')
      .text(
        (segment) =>
          `${segment.tripName}: ${segment.airportFrom} → ${segment.airportTo}\n${formatDate(segment.date)} · ${TRANSPORT_STYLES[segment.type]?.label || segment.type}`,
      )

    svg
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
  }, [libs, geographies, currentDate, filteredSegments, filteredVisits, visitedCountries])

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
            <span className="value">{filteredSegments.length}</span>
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
