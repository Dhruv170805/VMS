'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '@/utils/config';

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
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      if (data) setConfig(data);
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
