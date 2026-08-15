# MapNav — Initial Codebase

Scope (v0.2): **live-traffic-aware routing with multiple options, and
school/hospital zone timing** — the app surfaces trade-offs, the driver
picks. No "best route" is auto-selected, and no crowdsourced police
reports (dropped — that's Waze's feature, not a differentiator, and not
worth rebuilding).

## What's real vs. what needs sourcing

- **Live traffic (congestion/speed)**: real and available now via Mapbox's
  `driving-traffic` profile (Google's Directions API has an equivalent).
  This is genuinely different from "live traffic *signal* color," which
  isn't publicly available in most cities — we don't attempt that here.
- **Multiple route options**: real, via Mapbox's `alternatives=true`.
  Each option returns distance, live-traffic-adjusted duration, and which
  active school/hospital zones it crosses.
- **School zone beacon timing**: schedule-based (fixed time windows), not
  sensor-based — because that's what's actually available. You need to
  populate `schoolZones.json` with real coordinates/hours for your target
  city, typically from the city/county DOT or school district
  transportation office.

## Structure

```
mapnav/
├── backend/          # Express API
│   ├── server.js
│   └── routes/
│       ├── route.js  # multi-option, traffic-aware directions
│       └── zones.js  # school/hospital zone schedule evaluation
└── mobile/            # Expo React Native app
    ├── App.js
    └── src/
        ├── screens/MapScreen.js         # map + route rendering
        ├── components/RouteOptionsPanel.js  # the picker UI
        ├── services/                    # routing + api client
        └── data/schoolZones.json
```

## Setup

### Backend
```bash
cd backend
cp .env.example .env      # fill in MAPBOX_TOKEN
npm install
npm run dev
```
No database required — routing is stateless (calls Mapbox live each time).

### Mobile
```bash
cd mobile
npm install
npx expo start
```
Update `API_BASE_URL` in `mobile/src/services/api.js` to point at your
backend (LAN IP for physical-device testing, or your deployed URL). The
Mapbox token stays server-side only — never put it in the mobile app.

## How route selection works

`GET /api/route` returns an `options` array, each with:
- `distanceMeters`, `durationSeconds` (live-traffic-adjusted)
- `activeZonesOnRoute` (school/hospital zones currently in their active window)
- `label`: `fastest`, `shortest`, or `fastest_and_shortest` when they're the same route

The mobile app renders every option as a card (`RouteOptionsPanel`) and
draws every route on the map — selected route highlighted, others dimmed.
The user taps to switch. Nothing auto-picks "the best" route for them.

## Deploying to the stores

**Backend**: any Node host (Render, Railway, Fly.io, etc.) — publicly reachable.

**iOS**: Apple Developer account ($99/yr) → `eas build --platform ios` →
submit via App Store Connect (justify location permission usage).

**Android**: Google Play Developer account ($25 one-time) →
`eas build --platform android` → signed AAB → Play Console → submit.

[EAS Build](https://docs.expo.dev/build/introduction/) handles signing for
both without local Xcode/Android Studio setup.

## Realistic next steps, in order

1. Populate `schoolZones.json` with real data for one launch city (don't
   try to cover the whole country for v1)
2. Add destination search/geocoding — `planRoute(dest)` currently expects
   a lat/lng you supply directly
3. Add route caching/debouncing if you expect frequent re-routing (Mapbox
   traffic-aware requests aren't free at volume)
4. Consider whether the "fewest active zones" trade-off needs its own
   explicit sort/badge beyond fastest/shortest — that's your actual
   differentiator, so make it visible, not buried

## On strategy

This is scoped to compete on one specific, real gap (route trade-offs
that account for school-zone timing) rather than rebuilding Waze/Google
Maps wholesale. Live traffic and route alternatives already exist in both
of those apps — the differentiator here is combining them with zone
timing so the choice is informed, not just fastest-vs-shortest in a
vacuum.
