'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE, safeJson } from '@/utils/config';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    appName: 'VMS',
    appSubtitle: 'Smart Visitor System',
    companyName: 'Apple Studio',
    visitorCodePrefix: 'VMS'
  });
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      const url = API_BASE.startsWith('http') ? `${API_BASE}/config` : `${window.location.origin}${API_BASE}/config`;
      
      const res = await fetch(url);
      const data = await safeJson(res);
      
      if (data && !data.error) {
        setConfig(data);
        setError(null);
      } else if (data?.error) {
        setError(data.error);
        console.warn('Config fetch warning:', data.error);
      }
    } catch (err) { 
      setError("Network Connection Error");
      console.error('Failed to connect to VMS API:', err); 
    }
  };

  useEffect(() => { 
    if (typeof window !== 'undefined') {
      fetchConfig(); 
    }
  }, []);

  return (
    <ConfigContext.Provider value={{ config, error, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
