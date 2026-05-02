const BASE = process.env.NEXT_PUBLIC_API || "http://localhost:5000";

export const API = {
  getStats: () => fetch(`${BASE}/stats`).then(r => r.json()),
};
