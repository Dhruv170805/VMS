const getApiBase = () => {
  // Use environment variable if provided, otherwise default to relative /api
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
    if (!text) return null;
    
    const looksLikeJson = (text.trim().startsWith('{') || text.trim().startsWith('['));
    
    if (!looksLikeJson) {
      const isHtml = text.includes('<!DOCTYPE html>') || text.includes('<html');
      return { 
        error: isHtml ? `API connection failed (${res.status}).` : "Invalid response.",
        details: isHtml ? "The server returned an HTML error page. Check if the backend is running and the BACKEND_URL is correct." : text.slice(0, 50)
      };
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: "Malformed JSON response from server." };
    }
  } catch (err) {
    console.error("SafeJson Network Error:", err);
    return { error: "Cannot reach API server. Ensure backend is running and accessible (check local IP if on mobile)." };
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
