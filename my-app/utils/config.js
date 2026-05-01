const getApiBase = () => {
  // Use environment variable if provided, otherwise default to relative /api
  let base = process.env.NEXT_PUBLIC_API_BASE || '/api';
  
  if (!base.startsWith('/') && !base.startsWith('http')) {
    base = '/' + base;
  }
  
  // Trim trailing slash
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

export const API_BASE = getApiBase();

export const fetchAuth = (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
};

export const safeJson = async (res) => {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse JSON response:", err);
    return { error: "Invalid server response. Ensure API is running." };
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
