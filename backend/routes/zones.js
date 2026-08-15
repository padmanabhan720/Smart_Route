const express = require('express');
const router = express.Router();
const zoneData = require('../../mobile/src/data/schoolZones.json');

/**
 * Zone "active" logic: school beacon schedules are almost never available
 * live via API - they run on fixed time windows set by the local DOT/
 * school district. This endpoint evaluates those fixed windows against
 * the current time/day, which is the realistic version of "is the
 * flashing beacon on right now" that you can actually ship.
 *
 * To go live in a real city you must populate schoolZones.json with real
 * coordinates + hours, typically sourced from your city/county DOT open
 * data portal or manually from school district transportation offices.
 */
function isZoneActiveNow(zone, now = new Date()) {
  const day = now.getDay(); // 0=Sun..6=Sat
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

// GET /api/zones/active - all zones currently active, with computed flag
router.get('/active', (req, res) => {
  const now = new Date();
  const zones = zoneData.map((zone) => ({
    ...zone,
    active: isZoneActiveNow(zone, now),
  }));
  res.json({ zones, evaluatedAt: now.toISOString() });
});

// GET /api/zones - raw zone list (for map rendering regardless of active state)
router.get('/', (req, res) => {
  res.json({ zones: zoneData });
});

module.exports = router;
