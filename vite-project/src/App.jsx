import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const MAP_ENDPOINTS = {
  // Use the higher-resolution 50m dataset so microstates like Singapore and territories like French Guiana render correctly.
  world: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json',
  states: 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
}

const PLAY_DURATION_MS = 16000

const TRIPS = [
  {
    tripName: 'Wine on the Rhine 2021',
    color: '#2A9D8F', // placeholder — you can pick a color you like
    countries: ['United States of America', 'France', 'Luxembourg', 'Germany', 'Switzerland'],
    itinerary: [
      // 1) Flight SEA -> DFW
      {
        airportFrom: 'Seattle–Tacoma International Airport (SEA)',
        airportTo: 'Dallas/Fort Worth International Airport (DFW)',
        latFrom: 47.443546,
        lonFrom: -122.301659,
        latTo: 32.89748,
        lonTo: -97.040443,
        date: '2021-11-14T15:30:00Z', // 8:30 AM PST
        duration: 230, // 3h 50m
        type: 'flight',
      },

      // 2) Layover DFW
      {
        airportFrom: 'Dallas/Fort Worth International Airport (DFW)',
        airportTo: 'Dallas/Fort Worth International Airport (DFW)',
        latFrom: 32.89748,
        lonFrom: -97.040443,
        latTo: 32.89748,
        lonTo: -97.040443,
        date: '2021-11-14T19:20:00Z', // 2:20 PM CST / 14 Nov
        duration: 170, // 2h 50m
        type: 'layover',
      },

      // 3) Flight DFW -> CDG (Paris)
      {
        airportFrom: 'Dallas/Fort Worth International Airport (DFW)',
        airportTo: 'Paris Charles de Gaulle Airport (CDG)',
        latFrom: 32.89748,
        lonFrom: -97.040443,
        latTo: 49.00969,
        lonTo: 2.547924,
        date: '2021-11-14T23:20:00Z', // 5:10 PM CST
        duration: 545, // 9h 05m
        type: 'flight',
      },

      // 4) Stay in Paris — hotel check-in
      {
        airportFrom: 'citizenM Paris Champs-Élysées (Paris, France)',
        airportTo: 'citizenM Paris Champs-Élysées (Paris, France)',
        latFrom: 48.8708,
        lonFrom: 2.309,
        latTo: 48.8708,
        lonTo: 2.309,
        date: '2021-11-15T14:00:00Z', // 15 Nov 2:00 PM CET
        duration: 1260, // until 16 Nov 11:00 AM CET
        type: 'stay',
      },

      // 5) Train Paris -> Luxembourg
      {
        airportFrom: 'Paris (depart train station)',
        airportTo: 'Luxembourg (arrive)',
        latFrom: 48.8566,
        lonFrom: 2.3522,
        latTo: 49.6116,
        lonTo: 6.1319,
        date: '2021-11-16T07:13:00Z', // 8:13 AM CET
        duration: 139, // 2h 19m
        type: 'train',
      },

      // 6) Embark river cruise in Luxembourg — start
      {
        airportFrom: 'Luxembourg, Luxembourg (cruise start)',
        airportTo: 'Luxembourg, Luxembourg (cruise start)',
        latFrom: 49.6116,
        lonFrom: 6.1319,
        latTo: 49.6116,
        lonTo: 6.1319,
        date: '2021-11-16T14:00:00Z',
        duration: 168, // until next day entry at 2021-11-17 00:00Z (approx)
        type: 'cruise',
      },

      // 7) Cruise → Schweich / Bernkastel (Day 2)
      {
        airportFrom: 'Cruise (Luxembourg)',
        airportTo: 'Schweich / Bernkastel, Germany',
        latFrom: 49.6116,
        lonFrom: 6.1319,
        latTo: 49.9167,
        lonTo: 6.8333,
        date: '2021-11-17T00:00:00Z',
        duration: 86400 / 60, // placeholder: 1 day (in minutes)
        type: 'cruise',
      },

      // 8) Cruise → Cochem / Lahnstein (Day 3)
      {
        airportFrom: 'Schweich / Bernkastel, Germany',
        airportTo: 'Cochem / Lahnstein, Germany',
        latFrom: 49.9167,
        lonFrom: 6.8333,
        latTo: 50.1446,
        lonTo: 7.1691,
        date: '2021-11-18T00:00:00Z',
        duration: 1440, // 1 day
        type: 'cruise',
      },

      // 9) Cruise → Rüdesheim (Day 4)
      {
        airportFrom: 'Cochem / Lahnstein, Germany',
        airportTo: 'Rüdesheim am Rhein, Germany',
        latFrom: 50.1446,
        lonFrom: 7.1691,
        latTo: 49.9706,
        lonTo: 7.7937,
        date: '2021-11-19T00:00:00Z',
        duration: 1440,
        type: 'cruise',
      },

      // 10) Cruise → Ludwigshafen (Day 5)
      {
        airportFrom: 'Rüdesheim, Germany',
        airportTo: 'Ludwigshafen, Germany',
        latFrom: 49.9706,
        lonFrom: 7.7937,
        latTo: 49.4824,
        lonTo: 8.466,
        date: '2021-11-20T00:00:00Z',
        duration: 1440,
        type: 'cruise',
      },

      // 11) Cruise → Strasbourg, France (Day 6)
      {
        airportFrom: 'Ludwigshafen, Germany',
        airportTo: 'Strasbourg, France',
        latFrom: 49.4824,
        lonFrom: 8.466,
        latTo: 48.5734,
        lonTo: 7.7521,
        date: '2021-11-21T00:00:00Z',
        duration: 1440,
        type: 'cruise',
      },

      // 12) Cruise → Breisach / Basel (Day 7)
      {
        airportFrom: 'Strasbourg, France',
        airportTo: 'Basel / Breisach region (Rhine)',
        latFrom: 48.5734,
        lonFrom: 7.7521,
        latTo: 47.5596,
        lonTo: 7.5886,
        date: '2021-11-22T00:00:00Z',
        duration: 1440,
        type: 'cruise',
      },

      // 13) Disembark in Basel (Switzerland) — cruise end
      {
        airportFrom: 'Basel, Switzerland (cruise disembarkation)',
        airportTo: 'Basel, Switzerland (port/rail)',
        latFrom: 47.5596,
        lonFrom: 7.5886,
        latTo: 47.5596,
        lonTo: 7.5886,
        date: '2021-11-23T09:00:00Z',
        duration: 120, // until train to Lausanne
        type: 'cruise',
      },

      // 14) Train Basel -> Lausanne (Switzerland)
      {
        airportFrom: 'Basel, Switzerland (rail)',
        airportTo: 'Lausanne, Switzerland (rail)',
        latFrom: 47.5596,
        lonFrom: 7.5886,
        latTo: 46.5197,
        lonTo: 6.6323,
        date: '2021-11-23T11:00:00Z',
        duration: 140, // 2h 20m
        type: 'train',
      },

      // 15) Stay in Lausanne + wine-tasting Gruyère etc. — until train to Geneva
      {
        airportFrom: 'Lausanne, Switzerland',
        airportTo: 'Lausanne, Switzerland',
        latFrom: 46.5197,
        lonFrom: 6.6323,
        latTo: 46.5197,
        lonTo: 6.6323,
        date: '2021-11-23T13:00:00Z', // after arrival
        duration: 3060, // until next train 11/26 (approx 2.125 days)
        type: 'stay',
      },

      // 16) Train Lausanne -> Geneva
      {
        airportFrom: 'Lausanne, Switzerland (rail)',
        airportTo: 'Geneva, Switzerland (rail)',
        latFrom: 46.5197,
        lonFrom: 6.6323,
        latTo: 46.2044,
        lonTo: 6.1432,
        date: '2021-11-26T05:30:00Z', // arbitrary early-morning start
        duration: 45, // 45 m
        type: 'train',
      },

      // 17) Stay in Geneva — hotel
      {
        airportFrom: 'citizenM Geneva Centre (Geneva, Switzerland)',
        airportTo: 'citizenM Geneva Centre (Geneva, Switzerland)',
        latFrom: 46.2044,
        lonFrom: 6.1432,
        latTo: 46.2044,
        lonTo: 6.1432,
        date: '2021-11-26T14:00:00Z', // 2:00 PM local
        duration: 1065, // until 27 Nov 7:30 AM local
        type: 'stay',
      },

      // 18) Flight GVA -> FRA (Geneva -> Frankfurt)
      {
        airportFrom: 'Geneva Airport (GVA)',
        airportTo: 'Frankfurt Airport (FRA)',
        latFrom: 46.2381,
        lonFrom: 6.1089,
        latTo: 50.0379,
        lonTo: 8.5622,
        date: '2021-11-27T09:55:00Z', // 10:55 AM CET
        duration: 65, // 1h 05m
        type: 'flight',
      },

      // 19) Layover FRA
      {
        airportFrom: 'Frankfurt Airport (FRA)',
        airportTo: 'Frankfurt Airport (FRA)',
        latFrom: 50.0379,
        lonFrom: 8.5622,
        latTo: 50.0379,
        lonTo: 8.5622,
        date: '2021-11-27T11:05:00Z',
        duration: 110, // 1h 50m
        type: 'layover',
      },

      // 20) Flight FRA -> SEA
      {
        airportFrom: 'Frankfurt Airport (FRA)',
        airportTo: 'Seattle–Tacoma International Airport (SEA)',
        latFrom: 50.0379,
        lonFrom: 8.5622,
        latTo: 47.443546,
        lonTo: -122.301659,
        date: '2021-11-27T13:55:00Z',
        duration: 660, // 11h 00m
        type: 'flight',
      },
    ],
  },
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
      }
    ]
  },
  {
    tripName: "Round the world in 18 days 2026",
    color: "#E53E3E", // placeholder, can change later
    countries: ['United States of America', 'Spain', 'Portugal', 'Turkey', 'Vietnam', 'Singapore', 'Taiwan'],
    itinerary: [
      // 1) Flight SEA -> ORD
      {
        airportFrom: "Seattle–Tacoma International Airport (SEA)",
        airportTo: "Chicago O'Hare International Airport (ORD)",
        latFrom: 47.443546,
        lonFrom: -122.301659,
        latTo: 41.978611,
        lonTo: -87.904724,
        date: "2026-04-01T18:45:00Z",
        duration: 248, // 4h 08m
        type: "flight"
      },

      // 2) Layover ORD
      {
        airportFrom: "Chicago O'Hare International Airport (ORD)",
        airportTo: "Chicago O'Hare International Airport (ORD)",
        latFrom: 41.978611,
        lonFrom: -87.904724,
        latTo: 41.978611,
        lonTo: -87.904724,
        date: "2026-04-01T22:53:00Z",
        duration: 267, // until 22:20 local (ORD>MAD dep)
        type: "layover"
      },

      // 3) Flight ORD -> MAD
      {
        airportFrom: "Chicago O'Hare International Airport (ORD)",
        airportTo: "Adolfo Suárez Madrid–Barajas Airport (MAD)",
        latFrom: 41.978611,
        lonFrom: -87.904724,
        latTo: 40.4839,
        lonTo: -3.5680,
        date: "2026-04-02T03:20:00Z",
        duration: 485, // 10h 05m
        type: "flight"
      },

      // 4) Layover MAD
      {
        airportFrom: "Adolfo Suárez Madrid–Barajas Airport (MAD)",
        airportTo: "Adolfo Suárez Madrid–Barajas Airport (MAD)",
        latFrom: 40.4839,
        lonFrom: -3.5680,
        latTo: 40.4839,
        lonTo: -3.5680,
        date: "2026-04-02T11:25:00Z",
        duration: 135, // until 15:40 local
        type: "layover"
      },

      // 5) Flight MAD -> OPO (Porto)
      {
        airportFrom: "Adolfo Suárez Madrid–Barajas Airport (MAD)",
        airportTo: "Francisco Sá Carneiro Airport (OPO)",
        latFrom: 40.4839,
        lonFrom: -3.5680,
        latTo: 41.2422,
        lonTo: -8.6755,
        date: "2026-04-02T13:40:00Z",
        duration: 800, // 13h 20m, arrives ~04:00 local next day
        type: "flight"
      },

      // 6) Porto hotel stay (arrival early morning -> embarkation)
      {
        airportFrom: "Porto (city hotel)",
        airportTo: "Porto (city hotel)",
        latFrom: 41.1496,
        lonFrom: -8.61099,
        latTo: 41.1496,
        lonTo: -8.61099,
        date: "2026-04-03T03:00:00Z", // ~04:00 local 4/3
        duration: 480, // until 12:00 local (embarkation)
        type: "stay"
      },

      // 7) Embarkation in Porto -> cruise begins (Porto -> Régua leg)
      {
        airportFrom: "Porto, Portugal (Douro cruise embarkation)",
        airportTo: "Régua, Portugal",
        latFrom: 41.1496,
        lonFrom: -8.61099,
        latTo: 41.1649,
        lonTo: -7.7870,
        date: "2026-04-03T11:00:00Z", // 12:00 local
        duration: 1260, // to next morning in Régua
        type: "cruise"
      },

      // 8) Régua day (Régua -> Vega de Terrón leg overnight)
      {
        airportFrom: "Régua, Portugal",
        airportTo: "Vega de Terrón, Spain",
        latFrom: 41.1649,
        lonFrom: -7.7870,
        latTo: 41.0280,
        lonTo: -6.9310,
        date: "2026-04-04T08:00:00Z", // ~09:00 local
        duration: 1440, // 1 day to next entry
        type: "cruise"
      },

      // 9) Vega de Terrón (port day, then move/continue)
      {
        airportFrom: "Vega de Terrón, Spain",
        airportTo: "Vega de Terrón, Spain",
        latFrom: 41.0280,
        lonFrom: -6.9310,
        latTo: 41.0280,
        lonTo: -6.9310,
        date: "2026-04-05T08:00:00Z",
        duration: 1440, // until 4/6 09:00 local
        type: "cruise"
      },

      // 10) Vega de Terrón second day
      {
        airportFrom: "Vega de Terrón, Spain",
        airportTo: "Pinhão, Portugal",
        latFrom: 41.0280,
        lonFrom: -6.9310,
        latTo: 41.187492,
        lonTo: -7.532848,
        date: "2026-04-06T08:00:00Z",
        duration: 1440,
        type: "cruise"
      },

      // 11) Pinhão day
      {
        airportFrom: "Pinhão, Portugal",
        airportTo: "Régua, Portugal",
        latFrom: 41.187492,
        lonFrom: -7.532848,
        latTo: 41.1649,
        lonTo: -7.7870,
        date: "2026-04-07T08:00:00Z",
        duration: 1440,
        type: "cruise"
      },

      // 12) Régua again
      {
        airportFrom: "Régua, Portugal",
        airportTo: "Régua, Portugal",
        latFrom: 41.1649,
        lonFrom: -7.7870,
        latTo: 41.1649,
        lonTo: -7.7870,
        date: "2026-04-08T08:00:00Z",
        duration: 1440,
        type: "cruise"
      },

      // 13) Régua (last full day before Porto)
      {
        airportFrom: "Régua, Portugal",
        airportTo: "Porto, Portugal",
        latFrom: 41.1649,
        lonFrom: -7.7870,
        latTo: 41.1496,
        lonTo: -8.61099,
        date: "2026-04-09T08:00:00Z",
        duration: 1440,
        type: "cruise"
      },

      // 14) Disembarkation in Porto (morning -> later flight)
      {
        airportFrom: "Porto, Portugal (disembarkation)",
        airportTo: "Porto, Portugal (city/port)",
        latFrom: 41.1496,
        lonFrom: -8.61099,
        latTo: 41.1496,
        lonTo: -8.61099,
        date: "2026-04-10T08:00:00Z", // ~09:00 local
        duration: 460, // until 16:40 local flight departure
        type: "cruise"
      },

      // 15) Flight OPO -> IST
      {
        airportFrom: "Francisco Sá Carneiro Airport (OPO)",
        airportTo: "Istanbul Airport (IST)",
        latFrom: 41.2422,
        lonFrom: -8.6755,
        latTo: 41.276901,
        lonTo: 28.729324,
        date: "2026-04-10T15:40:00Z",
        duration: 280, // 4h 40m
        type: "flight"
      },

      // 16) Layover IST
      {
        airportFrom: "Istanbul Airport (IST)",
        airportTo: "Istanbul Airport (IST)",
        latFrom: 41.276901,
        lonFrom: 28.729324,
        latTo: 41.276901,
        lonTo: 28.729324,
        date: "2026-04-10T20:20:00Z",
        duration: 150, // to 01:50 local
        type: "layover"
      },

      // 17) Flight IST -> SGN
      {
        airportFrom: "Istanbul Airport (IST)",
        airportTo: "Tan Son Nhat International Airport (SGN)",
        latFrom: 41.276901,
        lonFrom: 28.729324,
        latTo: 10.818889,
        lonTo: 106.651944,
        date: "2026-04-10T22:50:00Z",
        duration: 620, // 10h 20m
        type: "flight"
      },

      // 18) Layover SGN
      {
        airportFrom: "Tan Son Nhat International Airport (SGN)",
        airportTo: "Tan Son Nhat International Airport (SGN)",
        latFrom: 10.818889,
        lonFrom: 106.651944,
        latTo: 10.818889,
        lonTo: 106.651944,
        date: "2026-04-11T09:10:00Z",
        duration: 275, // to 20:45 local
        type: "layover"
      },

      // 19) Flight SGN -> DAD
      {
        airportFrom: "Tan Son Nhat International Airport (SGN)",
        airportTo: "Da Nang International Airport (DAD)",
        latFrom: 10.818889,
        lonFrom: 106.651944,
        latTo: 16.0439,
        lonTo: 108.1990,
        date: "2026-04-11T13:45:00Z",
        duration: 85, // 1h 25m
        type: "flight"
      },

      // 20) Pullman Danang stay
      {
        airportFrom: "Pullman Danang Beach Resort (Da Nang)",
        airportTo: "Pullman Danang Beach Resort (Da Nang)",
        latFrom: 16.040022,
        lonFrom: 108.249353,
        latTo: 16.040022,
        lonTo: 108.249353,
        date: "2026-04-11T15:10:00Z", // shortly after landing/check-in
        duration: 6585, // until DAD>SIN departure 4/16
        type: "stay"
      },

      // 21) Flight DAD -> SIN
      {
        airportFrom: "Da Nang International Airport (DAD)",
        airportTo: "Singapore Changi Airport (SIN)",
        latFrom: 16.0439,
        lonFrom: 108.1990,
        latTo: 1.359167,
        lonTo: 103.989441,
        date: "2026-04-16T04:55:00Z",
        duration: 180, // 3h
        type: "flight"
      },

      // 22) Carlton City Hotel Singapore stay
      {
        airportFrom: "Carlton City Hotel Singapore",
        airportTo: "Carlton City Hotel Singapore",
        latFrom: 1.27597,
        lonFrom: 103.84371,
        latTo: 1.27597,
        lonTo: 103.84371,
        date: "2026-04-16T07:55:00Z", // arrival/check-in
        duration: 2750, // until SIN>TPE departure 4/18
        type: "stay"
      },

      // 23) Flight SIN -> TPE
      {
        airportFrom: "Singapore Changi Airport (SIN)",
        airportTo: "Taiwan Taoyuan International Airport (TPE)",
        latFrom: 1.359167,
        lonFrom: 103.989441,
        latTo: 25.0725,
        lonTo: 121.2210,
        date: "2026-04-18T05:45:00Z",
        duration: 290, // 4h 50m
        type: "flight"
      },

      // 24) Layover TPE
      {
        airportFrom: "Taiwan Taoyuan International Airport (TPE)",
        airportTo: "Taiwan Taoyuan International Airport (TPE)",
        latFrom: 25.0725,
        lonFrom: 121.2210,
        latTo: 25.0725,
        lonTo: 121.2210,
        date: "2026-04-18T10:35:00Z",
        duration: 295, // to 23:30 local
        type: "layover"
      },

      // 25) Flight TPE -> SEA
      {
        airportFrom: "Taiwan Taoyuan International Airport (TPE)",
        airportTo: "Seattle–Tacoma International Airport (SEA)",
        latFrom: 25.0725,
        lonFrom: 121.2210,
        latTo: 47.443546,
        lonTo: -122.301659,
        date: "2026-04-18T15:30:00Z",
        duration: 660, // 11h
        type: "flight"
      }
    ]
  },
  {
    tripName: "Stan and Taylor's Wedding",
    color: '#D97706', // placeholder
    countries: ['United States of America'],
    itinerary: [
      // 1) Flight SEA -> BZN
      {
        airportFrom: 'Seattle–Tacoma International Airport (SEA)',
        airportTo: 'Bozeman Yellowstone International Airport (BZN)',
        latFrom: 47.443546,
        lonFrom: -122.301659,
        latTo: 45.7769,
        lonTo: -111.1530,
        date: '2022-07-29T14:13:00Z', // 7:13 AM PDT
        duration: 165, // 2h 45m
        type: 'flight'
      },

      // 2) Drive BZN -> Lewistown (3 hours)
      {
        airportFrom: 'Bozeman Yellowstone International Airport (BZN)',
        airportTo: 'Lewistown, Montana',
        latFrom: 45.7769,
        lonFrom: -111.1530,
        latTo: 47.0622,
        lonTo: -109.4282,
        date: '2022-07-29T17:30:00Z', // late morning/early afternoon after arrival
        duration: 180, // 3 hours
        type: 'car'
      },

      // 3) Stay in Lewistown, MT (hotel / house stay)
      {
        airportFrom: 'Lewistown, Montana',
        airportTo: 'Lewistown, Montana',
        latFrom: 47.0622,
        lonFrom: -109.4282,
        latTo: 47.0622,
        lonTo: -109.4282,
        date: '2022-07-29T21:00:00Z', // 3:00 PM MDT
        duration: 4050, // from afternoon 7/29 → departure late morning 8/1
        type: 'stay'
      },

      // 4) Drive Lewistown -> BZN (3 hours)
      {
        airportFrom: 'Lewistown, Montana',
        airportTo: 'Bozeman Yellowstone International Airport (BZN)',
        latFrom: 47.0622,
        lonFrom: -109.4282,
        latTo: 45.7769,
        lonTo: -111.1530,
        date: '2022-08-01T16:30:00Z', // morning departure to catch afternoon flight
        duration: 180, // 3 hours
        type: 'car'
      },

      // 5) Flight BZN -> SEA
      {
        airportFrom: 'Bozeman Yellowstone International Airport (BZN)',
        airportTo: 'Seattle–Tacoma International Airport (SEA)',
        latFrom: 45.7769,
        lonFrom: -111.1530,
        latTo: 47.443546,
        lonTo: -122.301659,
        date: '2022-08-01T20:20:00Z', // 2:20 PM MDT
        duration: 130, // 2h 10m
        type: 'flight'
      }
    ]
  },
  {
    tripName: 'Justin Trip',
    color: '#10B981', // placeholder
    countries: ['United States of America'],
    itinerary: [
      // 1) Flight SEA -> SMF
      {
        airportFrom: 'Seattle–Tacoma International Airport (SEA)',
        airportTo: 'Sacramento International Airport (SMF)',
        latFrom: 47.443546,
        lonFrom: -122.301659,
        latTo: 38.6951,
        lonTo: -121.5908,
        date: '2025-10-30T14:45:00Z', // 7:45 AM PDT
        duration: 120,
        type: 'flight'
      },

      // 2) Stay in Folsom, CA (Oct 30 → Oct 31)
      {
        airportFrom: 'Folsom, California',
        airportTo: 'Folsom, California',
        latFrom: 38.677959,
        lonFrom: -121.176056,
        latTo: 38.677959,
        lonTo: -121.176056,
        date: '2025-10-30T22:00:00Z', // 3 PM PDT check-in
        duration: 1200, // until 11 AM 10/31
        type: 'stay'
      },

      // 3) Drive Folsom → Walnut Creek (Nov 1, 10 AM → 12 PM)
      {
        airportFrom: 'Folsom, California',
        airportTo: 'Walnut Creek, California',
        latFrom: 38.677959,
        lonFrom: -121.176056,
        latTo: 37.9101,
        lonTo: -122.0652,
        date: '2025-11-01T17:00:00Z', // 10 AM PDT
        duration: 120, // 2 hr
        type: 'car'
      },

      // 4) Drive Walnut Creek → Paso Robles (1 PM → 5:30 PM)
      {
        airportFrom: 'Walnut Creek, California',
        airportTo: 'Paso Robles, California',
        latFrom: 37.9101,
        lonFrom: -122.0652,
        latTo: 35.6266,
        lonTo: -120.6910,
        date: '2025-11-01T20:00:00Z', // 1 PM PDT
        duration: 270, // 4 hr 30 min
        type: 'car'
      },

      // 5) Stay in Paso Robles (Nov 1 → Nov 2)
      {
        airportFrom: 'Paso Robles, California',
        airportTo: 'Paso Robles, California',
        latFrom: 35.6266,
        lonFrom: -120.6910,
        latTo: 35.6266,
        lonTo: -120.6910,
        date: '2025-11-01T22:00:00Z', // ~3 PM local (after drive)
        duration: 1455, // until ~5 PM 11/2 (departure)
        type: 'stay'
      },

      // 6) Drive Paso Robles → Folsom (Nov 2, ~5 PM → ~11 PM)
      {
        airportFrom: 'Paso Robles, California',
        airportTo: 'Folsom, California',
        latFrom: 35.6266,
        lonFrom: -120.6910,
        latTo: 38.677959,
        lonTo: -121.176056,
        date: '2025-11-02T00:00:00Z', // 5 PM PDT
        duration: 360, // 6 hr
        type: 'car'
      },

      // 7) Flight SMF -> SEA (Nov 3, 5 PM, 2-hour flight)
      {
        airportFrom: 'Sacramento International Airport (SMF)',
        airportTo: 'Seattle–Tacoma International Airport (SEA)',
        latFrom: 38.6951,
        lonFrom: -121.5908,
        latTo: 47.443546,
        lonTo: -122.301659,
        date: '2025-11-04T01:00:00Z', // 5 PM PDT
        duration: 120,
        type: 'flight'
      }
    ]
  },
  {
    tripName: 'New Years in Vegas',
    color: '#F43F5E', // placeholder
    countries: ['United States of America'],
    itinerary: [
      // 1) Flight SEA -> SMF (Dec 23)
      {
        airportFrom: 'Seattle–Tacoma International Airport (SEA)',
        airportTo: 'Sacramento International Airport (SMF)',
        latFrom: 47.443546,
        lonFrom: -122.301659,
        latTo: 38.6951,
        lonTo: -121.5908,
        date: '2024-12-23T22:00:00Z', // 2 PM PST
        duration: 120,
        type: 'flight'
      },

      // 2) Stay in Folsom (Dec 23–26)
      {
        airportFrom: 'Folsom, California',
        airportTo: 'Folsom, California',
        latFrom: 38.677959,
        lonFrom: -121.176056,
        latTo: 38.677959,
        lonTo: -121.176056,
        date: '2024-12-23T23:00:00Z', // ~3 PM check-in after flight/drive
        duration: 4260, // until 11 AM 12/26
        type: 'stay'
      },

      // 3) Flight SMF -> SAN (Dec 26)
      {
        airportFrom: 'Sacramento International Airport (SMF)',
        airportTo: 'San Diego International Airport (SAN)',
        latFrom: 38.6951,
        lonFrom: -121.5908,
        latTo: 32.7338,
        lonTo: -117.1933,
        date: '2024-12-26T18:45:00Z', // 10:45 AM PST
        duration: 90, // 1h 30m
        type: 'flight'
      },

      // 4) Flight SAN -> LAS (same day)
      {
        airportFrom: 'San Diego International Airport (SAN)',
        airportTo: 'Harry Reid International Airport (LAS)',
        latFrom: 32.7338,
        lonFrom: -117.1933,
        latTo: 36.086,
        lonTo: -115.1537,
        date: '2024-12-26T21:05:00Z', // 1:05 PM PST
        duration: 85, // 1h 25m
        type: 'flight'
      },

      // 5) Stay at Vdara (Dec 26–29)
      {
        airportFrom: 'Vdara Hotel & Spa (Las Vegas Strip)',
        airportTo: 'Vdara Hotel & Spa (Las Vegas Strip)',
        latFrom: 36.1095,
        lonFrom: -115.1761,
        latTo: 36.1095,
        lonTo: -115.1761,
        date: '2024-12-26T23:00:00Z', // check-in ~3 PM local
        duration: 4320, // until 11 AM 12/29
        type: 'stay'
      },

      // 6) Flight LAS -> SEA (Dec 29)
      {
        airportFrom: 'Harry Reid International Airport (LAS)',
        airportTo: 'Seattle–Tacoma International Airport (SEA)',
        latFrom: 36.086,
        lonFrom: -115.1537,
        latTo: 47.443546,
        lonTo: -122.301659,
        date: '2024-12-29T23:00:00Z', // 3 PM PST
        duration: 170, // 2h 50m
        type: 'flight'
      }
    ]
  },
  {
    tripName: 'Six in Spokane',
    color: '#3B82F6', // placeholder
    countries: ['United States of America'],
    itinerary: [
      // 1) Drive Seattle -> Spokane (Jan 26)
      {
        airportFrom: 'Seattle, Washington',
        airportTo: 'Spokane, Washington',
        latFrom: 47.6062,
        lonFrom: -122.3321,
        latTo: 47.6588,
        lonTo: -117.426,
        date: '2024-01-26T19:00:00Z', // 11 AM PST
        duration: 380, // 6h 20m (arrived 5:20 PM)
        type: 'car'
      },

      // 2) Hotel stay at Oxford Suites (Jan 26–27)
      {
        airportFrom: 'Oxford Suites Spokane (Riverside area)',
        airportTo: 'Oxford Suites Spokane (Riverside area)',
        latFrom: 47.6581,
        lonFrom: -117.4106,
        latTo: 47.6581,
        lonTo: -117.4106,
        date: '2024-01-26T23:00:00Z', // 3 PM check-in (arrival was later, but overlap rule: start at arrival)
        duration: 660, // until 12 PM departure next day (1/27)
        type: 'stay'
      },

      // 3) Drive Spokane -> Coeur d'Alene (Jan 27)
      {
        airportFrom: 'Spokane, Washington',
        airportTo: "Coeur d'Alene, Idaho",
        latFrom: 47.6588,
        lonFrom: -117.426,
        latTo: 47.6777,
        lonTo: -116.7805,
        date: '2024-01-27T20:00:00Z', // 12 PM PST
        duration: 80, // 1h 20m (approx)
        type: 'car'
      },

      // 4) Stay / hang out in Coeur d'Alene for 6 hours
      {
        airportFrom: "Coeur d'Alene, Idaho",
        airportTo: "Coeur d'Alene, Idaho",
        latFrom: 47.6777,
        lonFrom: -116.7805,
        latTo: 47.6777,
        lonTo: -116.7805,
        date: '2024-01-27T21:20:00Z', // arrival + few minutes
        duration: 360, // 6 hours
        type: 'stay'
      },

      // 5) Drive Coeur d'Alene -> Spokane at 7 PM
      {
        airportFrom: "Coeur d'Alene, Idaho",
        airportTo: 'Spokane, Washington',
        latFrom: 47.6777,
        lonFrom: -116.7805,
        latTo: 47.6588,
        lonTo: -117.426,
        date: '2024-01-28T03:00:00Z', // 7 PM PST
        duration: 60, // 1 hour
        type: 'car'
      },

      // 6) Second hotel night in Spokane (Jan 27–28)
      {
        airportFrom: 'Oxford Suites Spokane (Riverside area)',
        airportTo: 'Oxford Suites Spokane (Riverside area)',
        latFrom: 47.6581,
        lonFrom: -117.4106,
        latTo: 47.6581,
        lonTo: -117.4106,
        date: '2024-01-28T04:00:00Z', // after return ~8 PM PST
        duration: 930, // until departure at 8:45 PM next day
        type: 'stay'
      },

      // 7) Drive Spokane -> Seattle (Jan 28, 8:45 PM, 6 hr drive)
      {
        airportFrom: 'Spokane, Washington',
        airportTo: 'Seattle, Washington',
        latFrom: 47.6588,
        lonFrom: -117.426,
        latTo: 47.6062,
        lonTo: -122.3321,
        date: '2024-01-29T04:45:00Z', // 8:45 PM PST
        duration: 360, // 6 hours
        type: 'car'
      }
    ]
  },
  {
    tripName: "Blake and Han's 10th Anniversary",
    color: '#9333EA', // placeholder
    countries: ['United States of America'],
    itinerary: [
      // 1) Drive Issaquah → Eugene (Aug 6, 6 PM → 12:21 AM)
      {
        airportFrom: 'Issaquah, Washington',
        airportTo: 'Eugene, Oregon',
        latFrom: 47.5301,
        lonFrom: -122.0326,
        latTo: 44.0521,
        lonTo: -123.0868,
        date: '2025-08-07T01:00:00Z', // 6 PM PDT (Aug 6)
        duration: 381, // 6h 21m
        type: 'car',
      },

      // 2) Stay in Eugene at Best Western (overnight)
      {
        airportFrom: 'Best Western (Eugene, Oregon)',
        airportTo: 'Best Western (Eugene, Oregon)',
        latFrom: 44.0521,
        lonFrom: -123.0868,
        latTo: 44.0521,
        lonTo: -123.0868,
        date: '2025-08-07T07:21:00Z', // 12:21 AM arrival = stay start
        duration: 348, // until 6 AM departure (Aug 7)
        type: 'stay',
      },

      // 3) Drive Eugene → Folsom (Aug 7, 6 AM → ~5:30 PM)
      {
        airportFrom: 'Eugene, Oregon',
        airportTo: 'Folsom, California',
        latFrom: 44.0521,
        lonFrom: -123.0868,
        latTo: 38.677959,
        lonTo: -121.176056,
        date: '2025-08-07T13:00:00Z', // 6 AM PDT
        duration: 690, // 11h 30m
        type: 'car',
      },

      // 4) Stay in Folsom (Aug 7 → Aug 10)
      {
        airportFrom: 'Folsom, California',
        airportTo: 'Folsom, California',
        latFrom: 38.677959,
        lonFrom: -121.176056,
        latTo: 38.677959,
        lonTo: -121.176056,
        date: '2025-08-07T22:00:00Z', // 3 PM check-in
        duration: 4530, // until 11 AM Aug 10
        type: 'stay',
      },

      // 5) Drive Folsom → Seattle (Aug 10 11 AM → Aug 11 4 AM)
      {
        airportFrom: 'Folsom, California',
        airportTo: 'Seattle, Washington',
        latFrom: 38.677959,
        lonFrom: -121.176056,
        latTo: 47.6062,
        lonTo: -122.3321,
        date: '2025-08-10T18:00:00Z', // 11 AM PDT
        duration: 1020, // 17 hours
        type: 'car',
      },
    ],
  },
  {
    tripName: 'Pokemon and Colorado',
    color: '#0EA5E9', // placeholder
    countries: ['United States of America', 'Canada'],
    itinerary: [
      // 1) Drive Seattle → Vancouver BC (Sept 26, 9:30 AM → ~3:00 PM)
      {
        airportFrom: 'Seattle, Washington',
        airportTo: 'Vancouver, British Columbia',
        latFrom: 47.6062,
        lonFrom: -122.3321,
        latTo: 49.2827,
        lonTo: -123.1207,
        date: '2025-09-26T16:30:00Z', // 9:30 AM PDT
        duration: 330, // 5h 30m
        type: 'car',
      },

      // 2) Stay at Hilton Vancouver Metrotown (Sept 26–27)
      {
        airportFrom: 'Hilton Vancouver Metrotown (Burnaby, BC)',
        airportTo: 'Hilton Vancouver Metrotown (Burnaby, BC)',
        latFrom: 49.2263,
        lonFrom: -123.0046,
        latTo: 49.2263,
        lonTo: -123.0046,
        date: '2025-09-26T22:00:00Z', // ~3 PM check-in
        duration: 1440, // until 3:30 PM departure next day
        type: 'stay',
      },

      // 3) Drive Vancouver → Seattle (Sept 27, 3:30 PM → 9:00 PM)
      {
        airportFrom: 'Vancouver, British Columbia',
        airportTo: 'Seattle, Washington',
        latFrom: 49.2827,
        lonFrom: -123.1207,
        latTo: 47.6062,
        lonTo: -122.3321,
        date: '2025-09-27T22:30:00Z', // 3:30 PM PDT
        duration: 330, // 5h 30m
        type: 'car',
      },

      // 4) Flight SEA → DEN (Sept 28, 7 AM, 3 hr flight)
      {
        airportFrom: 'Seattle–Tacoma International Airport (SEA)',
        airportTo: 'Denver International Airport (DEN)',
        latFrom: 47.443546,
        lonFrom: -122.301659,
        latTo: 39.8561,
        lonTo: -104.6737,
        date: '2025-09-28T14:00:00Z', // 7 AM PDT
        duration: 180, // 3 hours
        type: 'flight',
      },

      // 5) Stay in Denver at your sister’s house (Sept 28)
      {
        airportFrom: 'Denver, Colorado',
        airportTo: 'Denver, Colorado',
        latFrom: 39.7392,
        lonFrom: -104.9903,
        latTo: 39.7392,
        lonTo: -104.9903,
        date: '2025-09-28T16:00:00Z', // after arrival
        duration: 1320, // through the night until 2 PM next day (29th)
        type: 'stay',
      },

      // 6) Drive Denver → Colorado Springs (Sept 29, 2 PM → 3 PM)
      {
        airportFrom: 'Denver, Colorado',
        airportTo: 'Colorado Springs, Colorado',
        latFrom: 39.7392,
        lonFrom: -104.9903,
        latTo: 38.8339,
        lonTo: -104.8214,
        date: '2025-09-29T20:00:00Z', // 2 PM MDT
        duration: 60,
        type: 'car',
      },

      // 7) Cave tour in Colorado Springs (3:15 PM → 4:00 PM)
      {
        airportFrom: 'Colorado Springs, Colorado (cave tour)',
        airportTo: 'Colorado Springs, Colorado (cave tour)',
        latFrom: 38.8339,
        lonFrom: -104.8214,
        latTo: 38.8339,
        lonTo: -104.8214,
        date: '2025-09-29T21:15:00Z', // 3:15 PM
        duration: 45,
        type: 'stay',
      },

      // 8) Drive Colorado Springs → Denver (4 PM → 5:30 PM)
      {
        airportFrom: 'Colorado Springs, Colorado',
        airportTo: 'Denver, Colorado',
        latFrom: 38.8339,
        lonFrom: -104.8214,
        latTo: 39.7392,
        lonTo: -104.9903,
        date: '2025-09-29T22:00:00Z', // 4 PM MDT
        duration: 90,
        type: 'car',
      },

      // 9) Stay in Denver (Sept 29 → Sept 30 flight)
      {
        airportFrom: 'Denver, Colorado',
        airportTo: 'Denver, Colorado',
        latFrom: 39.7392,
        lonFrom: -104.9903,
        latTo: 39.7392,
        lonTo: -104.9903,
        date: '2025-09-29T23:30:00Z', // ~5:30 PM
        duration: 1080, // until 6:30 PM flight next day
        type: 'stay',
      },

      // 10) Flight DEN → SEA (Sept 30, 6:30 PM, 3 hr flight)
      {
        airportFrom: 'Denver International Airport (DEN)',
        airportTo: 'Seattle–Tacoma International Airport (SEA)',
        latFrom: 39.8561,
        lonFrom: -104.6737,
        latTo: 47.443546,
        lonTo: -122.301659,
        date: '2025-10-01T00:30:00Z', // 6:30 PM MDT
        duration: 180,
        type: 'flight',
      },
    ],
  }
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

const computeTimeExtent = (segmentList) => {
  if (!segmentList?.length) return null

  return segmentList.reduce(
    ([min, max], segment) => {
      const start = segment.date
      const end = segment.endDate ?? segment.date

      const nextMin = start < min ? start : min
      const nextMax = end > max ? end : max

      return [nextMin, nextMax]
    },
    [segmentList[0].date, segmentList[0].endDate ?? segmentList[0].date],
  )
}

const getTripStartDate = (trip) =>
  trip.itinerary.reduce((earliest, leg) => {
    const date = new Date(leg.date)
    return date < earliest ? date : earliest
  }, new Date(trip.itinerary[0]?.date))

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
    const entry = visitMap.get(key)

    if (!entry) {
      visitMap.set(key, {
        lat,
        lon,
        label,
        trips: new Set([tripName]),
        color,
        visits: 1,
        firstDate: date,
        lastDate: date,
      })
      return
    }

    const isEarlier = date < entry.firstDate

    entry.visits += 1
    entry.trips.add(tripName)
    entry.firstDate = isEarlier ? date : entry.firstDate
    entry.lastDate = date > entry.lastDate ? date : entry.lastDate

    if ((isEarlier || !entry.color) && color) {
      entry.color = color
    }

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

const isTerritory = (feature) => {
  const type = feature.properties?.type?.toLowerCase()
  if (type === 'dependency' || type === 'territory') return true

  const status = feature.properties?.status?.toLowerCase()
  return status === 'dependency' || status === 'territory'
}

const normalizeCountryName = (name) => {
  if (!name) return 'Unknown'

  const normalized = name.toLowerCase().replace(/\./g, '').trim()

  if (normalized === 'fr guiana' || normalized === 'french guiana' || normalized === 'french guinea') {
    return 'French Guinea'
  }

  return name
}

function App() {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const zoomBehaviorRef = useRef(null)
  const lastTransformRef = useRef(null)
  const [libs, setLibs] = useState(null)
  const [geographies, setGeographies] = useState(null)
  const [status, setStatus] = useState('booting')
  const [selectedTrip, setSelectedTrip] = useState('all')
  const [sliderValue, setSliderValue] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const rafRef = useRef(null)
  const lastTickRef = useRef(null)

  const sortedTrips = useMemo(
    () => [...TRIPS].sort((a, b) => getTripStartDate(a) - getTripStartDate(b)),
    [],
  )

  const segments = useMemo(() => buildSegments(sortedTrips), [sortedTrips])
  const visits = useMemo(() => buildVisitCounts(segments), [segments])

  const visitsByTrip = useMemo(() => {
    const byTrip = new Map()

    sortedTrips.forEach(({ tripName }) => {
      byTrip.set(
        tripName,
        buildVisitCounts(
          segments.filter((segment) => segment.tripName === tripName),
        ),
      )
    })

    byTrip.set('all', visits)

    return byTrip
  }, [segments, sortedTrips, visits])

  const visitsForSelection = useMemo(
    () => visitsByTrip.get(selectedTrip) ?? visits,
    [selectedTrip, visits, visitsByTrip],
  )

  const selectedSegments = useMemo(
    () =>
      selectedTrip === 'all'
        ? segments
        : segments.filter((segment) => segment.tripName === selectedTrip),
    [segments, selectedTrip],
  )

  const timeExtent = useMemo(
    () => computeTimeExtent(selectedSegments),
    [selectedSegments],
  )

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

    return selectedSegments
      .filter((segment) => now >= segment.date.getTime())
      .map((segment) => {
        if (!segment.durationMs || segment.durationMs <= 0) return { ...segment, progress: 1 }
        const elapsed = now - segment.date.getTime()
        const progress = Math.min(1, Math.max(0, elapsed / segment.durationMs))
        return { ...segment, progress }
      })
  }, [currentDate, selectedSegments])

  const filteredVisits = useMemo(
    () =>
      visitsForSelection
        .filter((visit) => !currentDate || visit.firstDate.getTime() <= currentDate.getTime())
        .filter((visit) => (selectedTrip === 'all' ? true : visit.trips.has(selectedTrip))),
    [currentDate, selectedTrip, visitsForSelection],
  )

  const countryVisits = useMemo(() => {
    if (!libs || !geographies) return new Map()

    const byCountry = new Map()
    const visitsByDate = [...filteredVisits].sort((a, b) => a.firstDate.getTime() - b.firstDate.getTime())

    geographies.countries.features.forEach((country) => {
      const name = normalizeCountryName(country.properties?.name ?? country.id)

      visitsByDate.forEach((visit) => {
        if (!Number.isFinite(visit.lat) || !Number.isFinite(visit.lon)) return
        if (!libs.d3.geoContains(country, [visit.lon, visit.lat])) return

        const existing = byCountry.get(name)
        if (!existing || visit.firstDate < existing.firstVisited) {
          byCountry.set(name, { color: visit.color, firstVisited: visit.firstDate })
        }
      })
    })

    return byCountry
  }, [filteredVisits, geographies, libs])

  const stateVisits = useMemo(() => {
    if (!libs || !geographies) return new Map()

    const byState = new Map()

    const visitsByDate = [...filteredVisits].sort((a, b) => a.firstDate.getTime() - b.firstDate.getTime())

    geographies.states.features.forEach((state) => {
      const name = state.properties?.name ?? state.id
      visitsByDate.forEach((visit) => {
        if (!Number.isFinite(visit.lat) || !Number.isFinite(visit.lon)) return
        if (!libs.d3.geoContains(state, [visit.lon, visit.lat])) return

        const existing = byState.get(name)
        if (!existing || visit.firstDate < existing.firstVisited) {
          byState.set(name, { color: visit.color, firstVisited: visit.firstDate })
        }
      })
    })

    return byState
  }, [filteredVisits, geographies, libs])

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

    const existingTransform = lastTransformRef.current ?? d3.zoomTransform(svg.node())

    svg.attr('viewBox', `0 0 ${width} ${height}`)
    svg.selectAll('*').remove()

    const zoomLayer = svg.append('g').attr('class', 'zoom-layer')
    const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: 'Sphere' })
    const path = d3.geoPath(projection)
    const graticule = d3.geoGraticule10()

    const markerRadius = (visit) => 3 + Math.sqrt(visit.visits) * 3
    const routeWidth = (segment) => {
      if (segment.type === 'train') return 3.5
      if (segment.type === 'car') return 2.8
      return 2.5
    }

    const zoomSizeAdjustment = (k = 1) => Math.pow(k, 0.6)

    let markerSelection = null
    let routeSelection = null

    const zoomBehavior = zoomBehaviorRef.current ?? d3.zoom().scaleExtent([1, 8])
    zoomBehavior.on('zoom', (event) => {
      zoomLayer.attr('transform', event.transform)
      lastTransformRef.current = event.transform

      const zoomFactor = zoomSizeAdjustment(event.transform.k)

      if (routeSelection) {
        routeSelection.attr('stroke-width', (segment) => routeWidth(segment) / zoomFactor)
      }

      if (markerSelection) {
        markerSelection.attr('r', (visit) => markerRadius(visit) / zoomFactor)
      }
    })

    zoomBehaviorRef.current = zoomBehavior

    svg.call(zoomBehavior).call(zoomBehavior.transform, existingTransform)

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
        if (d.properties?.name === 'United States of America') return 'rgba(255,255,255,0.04)'

        const entry = countryVisits.get(normalizeCountryName(d.properties?.name ?? d.id))
        const visited = entry && entry.firstVisited <= currentDate

        if (!visited && isTerritory(d)) return 'rgba(0,0,0,0)'
        if (!visited) return 'rgba(255,255,255,0.04)'

        return withOpacity(entry.color, 0.5)
      })
      .attr('stroke', 'rgba(255,255,255,0.18)')
      .attr('stroke-width', 0.35)
      .on('mouseenter', (_, feature) =>
        setHoveredRegion({ type: 'Country', name: normalizeCountryName(feature.properties?.name ?? 'Unknown') }),
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
      .attr('fill', (feature) => {
        const name = feature.properties?.name ?? feature.id
        const entry = stateVisits.get(name)
        if (!entry || entry.firstVisited > currentDate) return 'rgba(255,255,255,0.02)'
        return withOpacity(entry.color, 0.55)
      })
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

    routeSelection = zoomLayer
      .append('g')
      .attr('class', 'routes')
      .selectAll('path')
      .data(timedSegments)
      .join('path')
      .attr('d', (segment) => {
        const interpolator = libs.d3.geoInterpolate(
          [segment.start.lon, segment.start.lat],
          [segment.end.lon, segment.end.lat],
        )
        const coordinates = [
          [segment.start.lon, segment.start.lat],
          segment.progress >= 1 ? [segment.end.lon, segment.end.lat] : interpolator(segment.progress),
        ]

        return path({ type: 'LineString', coordinates })
      })
      .attr('class', (segment) => `route route-${segment.type}`)
      .attr('stroke', (segment) => segment.color)
      .attr('stroke-width', (segment) => routeWidth(segment) / zoomSizeAdjustment(lastTransformRef.current?.k ?? 1))
      .attr('stroke-dasharray', (segment) => TRANSPORT_STYLES[segment.type]?.strokeDasharray || '0')

    routeSelection
      .append('title')
      .text(
        (segment) =>
          `${segment.tripName}: ${segment.airportFrom} → ${segment.airportTo}\n${formatDate(segment.date)} · ${TRANSPORT_STYLES[segment.type]?.label || segment.type}`,
      )

    markerSelection = zoomLayer
      .append('g')
      .attr('class', 'markers')
      .selectAll('circle')
      .data(filteredVisits)
      .join('circle')
      .attr('cx', (visit) => projection([visit.lon, visit.lat])[0])
      .attr('cy', (visit) => projection([visit.lon, visit.lat])[1])
      .attr('r', (visit) => markerRadius(visit) / zoomSizeAdjustment(lastTransformRef.current?.k ?? 1))
      .attr('fill', (visit) => visit.color)
      .attr('fill-opacity', 0.82)
      .attr('stroke', 'rgba(0,0,0,0.45)')
      .attr('stroke-width', 0.5)

    markerSelection
      .append('title')
      .text((visit) => `${visit.label || 'Stop'} · ${visit.visits} visit(s)\n${Array.from(visit.trips).join(', ')}`)
  }, [libs, geographies, currentDate, timedSegments, filteredVisits, countryVisits, stateVisits])

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
    return `${formatDate(min)} → ${formatDate(max)} · ${selectedSegments.length} segments · ${visitsForSelection.length} stops`
  }, [timeExtent, selectedSegments.length, visitsForSelection.length])

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
              {sortedTrips.map((trip) => (
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
                <p>Countries are softly tinted with the color of the trip they belong to, while U.S. states light up individually as they are visited.</p>
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
