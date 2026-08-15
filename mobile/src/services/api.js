// Point this at your deployed backend. Use your machine's LAN IP for
// local dev on a physical device (localhost won't resolve from the phone).
export const API_BASE_URL = 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default request;
