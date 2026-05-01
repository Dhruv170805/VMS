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

  const fetchConfig = async () => {
    try {
      // Use absolute URL logic if in dev or based on API_BASE
      const url = API_BASE.startsWith('http') ? `${API_BASE}/config` : `${window.location.origin}${API_BASE}/config`;
      
      const res = await fetch(url);
      const data = await safeJson(res);
      
      if (data && !data.error) {
        setConfig(data);
      } else if (data?.error) {
        console.warn('Config fetch warning:', data.error);
      }
    } catch (err) { 
      console.error('Failed to connect to VMS API:', err); 
    }
  };

  useEffect(() => { 
    if (typeof window !== 'undefined') {
      fetchConfig(); 
    }
  }, []);

  return (
    <ConfigContext.Provider value={{ config, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
