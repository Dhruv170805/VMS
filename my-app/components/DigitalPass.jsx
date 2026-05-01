'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { API_BASE } from '../utils/config';
import { useConfig } from '@/context/ConfigContext';

function DigitalPass({ pass, onBack }) {
  const { config } = useConfig();
  const [currentPass, setCurrentPass] = useState(pass);
  const [polling, setPolling] = useState(pass.status === 'PENDING');

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/visitor/track/${currentPass.visitor_code}`);
        const data = await res.json();
        if (res.ok) {
          setCurrentPass({
            ...data.visitor,
            token: data.token,
            host_name: data.visitor.host_id?.name,
            host_dept: data.visitor.host_id?.department
          });
          if (data.visitor.status !== 'PENDING') setPolling(false);
        }
      } catch (err) { console.error(err); }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, currentPass.visitor_code]);

  const handlePrint = () => window.print();

  return (
    <div className="pass-layout">
      <motion.div 
        className="pass-container-apple"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="vms-card-studio no-print-shadow">
          <div className="card-top">
            <div className="logo-studio">{config.appName}</div>
            <div className="status-badge-glass">{currentPass.status}</div>
          </div>
          
          <div className="card-main">
            <div className="v-identity">
              <div className="v-photo-studio"><img src={currentPass.photo_base64} /></div>
              <div className="v-qr-studio">
                {currentPass.token ? (
                  <QRCodeCanvas value={currentPass.token} size={120} level="H" bgColor="transparent" fgColor="#1d1d1f" />
                ) : (
                  <div className="qr-status-text">{currentPass.status}</div>
                )}
              </div>
            </div>

            <div className="v-info-studio">
              <h2 className="v-name-text">{currentPass.name}</h2>
              <div className="v-code-badge">{currentPass.visitor_code}</div>
              
              <div className="info-grid-studio">
                <div className="info-item"><span>Purpose</span><p>{currentPass.purpose}</p></div>
                <div className="info-item"><span>Company</span><p>{currentPass.company || 'N/A'}</p></div>
                <div className="info-item"><span>Visiting</span><p>{currentPass.host_name}</p></div>
                <div className="info-item"><span>Dept</span><p>{currentPass.host_dept}</p></div>
              </div>

              <div className="validity-studio">
                <div className="v-label">VALIDITY PERIOD</div>
                <div className="v-time">{new Date(currentPass.validity.from).toLocaleDateString()} — {new Date(currentPass.validity.to).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="card-bottom">
            <span>ISSUED BY {config.companyName.toUpperCase()} {config.appName}</span>
          </div>
        </div>

        <div className="pass-controls no-print">
          {['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'].includes(currentPass.status) && (
            <button onClick={handlePrint} className="apple-btn-primary">Print Identity Pass</button>
          )}
          <button onClick={onBack} className="apple-btn-secondary">Dismiss</button>
        </div>

        {currentPass.status === 'PENDING' && (
          <div className="apple-alert-info">🕒 Awaiting verification from <strong>{currentPass.host_name}</strong>. Please stay on this page.</div>
        )}
      </motion.div>
    </div>
  );
}

export default DigitalPass;
