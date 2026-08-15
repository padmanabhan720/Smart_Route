import request from './api';

// Fetches multiple traffic-aware route options between two points.
// Does NOT pick a "best" one - returns all options with distance/time/
// zone data so the UI can let the driver choose the trade-off.
export async function getRouteOptions(origin, destination) {
  const params = new URLSearchParams({
    originLat: origin.latitude,
    originLng: origin.longitude,
    destLat: destination.latitude,
    destLng: destination.longitude,
  });

  const data = await request(`/route?${params.toString()}`);

  return data.options.map((opt) => ({
    ...opt,
    coordinates: opt.geometry.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    })),
  }));
}

export function formatDistance(meters) {
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

export function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
}
