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
      const res = await fetch(`${API_BASE}/config`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await safeJson(res);
      if (data && !data.error) setConfig(data);
    } catch (err) { console.error('Failed to load config:', err); }
  };

  useEffect(() => { fetchConfig(); }, []);

  return (
    <ConfigContext.Provider value={{ config, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
