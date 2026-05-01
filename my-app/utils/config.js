const getApiBase = () => {
  // Use environment variable if provided, otherwise default to relative /api
  // This allows Next.js rewrites to proxy the request to the BACKEND_URL
  const base = process.env.NEXT_PUBLIC_API_BASE || '/api';
  
  // Ensure it starts with / or http
  let formatted = base;
  if (!base.startsWith('/') && !base.startsWith('http')) {
    formatted = '/' + base;
  }
  
  // Trim trailing slash
  return formatted.endsWith('/') ? formatted.slice(0, -1) : formatted;
};

export const API_BASE = getApiBase();

export const fetchAuth = (url, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
};
export const safeJson = async (res) => {
  try {
    const text = await res.text();
    if (!text || text.trim() === '') return null;

    // Safety: If it starts with 'The' or '<', it's likely a 404/HTML error page
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return { 
        error: "API connection failed.",
        details: `The server returned an invalid response (Status ${res.status}). Ensure the backend is running on port 5001.`
      };
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return { error: "Malformed server response." };
    }
  } catch (err) {
    return { error: "Network error. Check backend connectivity." };
  }
};
export const VISIT_PURPOSES = [
  { value: 'OFFICE', label: 'Office Visit' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OTHER', label: 'Other' }
];

export const ID_TYPES = [
  { value: 'AADHAR', label: 'Aadhar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'ELECTION_CARD', label: 'Voter ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'OTHER', label: 'Other' }
];
