const express = require('express');
const router = express.Router();
const zoneData = require('../../mobile/src/data/schoolZones.json');

/**
 * Returns multiple route options between two points, each tagged with
 * distance, live-traffic-aware duration, and how many active school/
 * hospital zones it passes through - so the frontend can let the user
 * pick the trade-off themselves instead of picking "best" for them.
 *
 * Live traffic here means real congestion/speed data (Mapbox's
 * driving-traffic profile), which is genuinely available - this is
 * different from live traffic-SIGNAL-color data, which generally isn't
 * (see README for that distinction).
 */

function isZoneActiveNow(zone, now = new Date()) {
  const day = now.getDay();
  if (!zone.activeDays.includes(day)) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return zone.windows.some(([startHHMM, endHHMM]) => {
    const [sh, sm] = startHHMM.split(':').map(Number);
    const [eh, em] = endHHMM.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return nowMinutes >= start && nowMinutes <= end;
  });
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function zonesOnRoute(coordinates, activeZones, bufferMeters = 250) {
  return activeZones.filter((zone) =>
    coordinates.some(
      (pt) =>
        haversineMeters({ lat: pt[1], lng: pt[0] }, { lat: zone.latitude, lng: zone.longitude }) <=
        zone.radiusMeters + bufferMeters
    )
  );
}

router.get('/', async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: 'originLat, originLng, destLat, destLng required' });
    }

    const token = process.env.MAPBOX_TOKEN;
    if (!token) return res.status(500).json({ error: 'MAPBOX_TOKEN not configured on server' });

    // driving-traffic profile = live congestion-adjusted durations.
    // alternatives=true asks Mapbox for more than one geometrically distinct route.
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
      `${originLng},${originLat};${destLng},${destLat}` +
      `?geometries=geojson&overview=full&alternatives=true&annotations=congestion&access_token=${token}`;

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Directions API error' });
    }

    const now = new Date();
    const activeZones = zoneData.filter((z) => isZoneActiveNow(z, now));

    const options = (data.routes || []).map((route, idx) => {
      const zonesHit = zonesOnRoute(route.geometry.coordinates, activeZones);
      return {
        id: `route_${idx}`,
        distanceMeters: route.distance,
        durationSeconds: route.duration, // already traffic-adjusted by driving-traffic profile
        activeZonesOnRoute: zonesHit,
        geometry: route.geometry,
      };
    });

    // Convenience labels: cheapest-in-time and cheapest-in-distance,
    // so the UI can badge them without re-deriving it.
    if (options.length > 0) {
      const fastest = options.reduce((a, b) => (a.durationSeconds <= b.durationSeconds ? a : b));
      const shortest = options.reduce((a, b) => (a.distanceMeters <= b.distanceMeters ? a : b));
      fastest.label = fastest.id === shortest.id ? 'fastest_and_shortest' : 'fastest';
      if (shortest.id !== fastest.id) shortest.label = 'shortest';
    }

    res.json({ options, evaluatedAt: now.toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
