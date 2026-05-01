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
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="vms-card-studio glass">
          <div className="card-top">
            <div className="logo-studio">{config.appName}</div>
            <div className={`status-badge-glass ${currentPass.status}`}>{currentPass.status}</div>
          </div>
          
          <div className="card-main">
            <div className="v-identity">
              <div className="v-photo-studio"><img src={currentPass.photo_base64} /></div>
              <div className="v-qr-studio">
                {currentPass.token ? (
                  <QRCodeCanvas value={currentPass.token} size={110} level="H" bgColor="transparent" fgColor="#1d1d1f" />
                ) : (
                  <div className="qr-status-text" style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textAlign: 'center' }}>
                    {currentPass.status === 'PENDING' ? 'AWAITING APPROVAL' : 'SECURE TOKEN'}
                  </div>
                )}
              </div>
            </div>

            <div className="v-info-studio">
              <h2 className="v-name-text">{currentPass.name}</h2>
              <div className="v-code-badge">{currentPass.visitor_code}</div>
              
              <div className="info-grid-studio">
                <div className="info-item"><span>Purpose</span><p>{currentPass.purpose}</p></div>
                <div className="info-item"><span>Company</span><p>{currentPass.company || 'N/A'}</p></div>
                <div className="info-item"><span>Host</span><p>{currentPass.host_name}</p></div>
                <div className="info-item"><span>Dept</span><p>{currentPass.host_dept}</p></div>
              </div>

              <div className="validity-studio">
                <div className="v-label">IDENTITY VALID UNTIL</div>
                <div className="v-time">{new Date(currentPass.validity.to).toLocaleDateString()} • 23:59 PM</div>
              </div>
            </div>
          </div>

          <div className="card-bottom">
            <span>OFFICIAL DIGITAL IDENTITY PASS • {config.companyName.toUpperCase()}</span>
          </div>
        </div>

        <div className="pass-controls no-print" style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', width: '100%', maxWidth: '480px' }}>
          {['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'].includes(currentPass.status) && (
            <button onClick={handlePrint} className="apple-btn-primary flex-1">Print Pass</button>
          )}
          <button onClick={onBack} className="apple-btn-secondary flex-1">Dismiss</button>
        </div>

        {currentPass.status === 'PENDING' && (
          <div className="apple-alert-info" style={{ width: '100%', maxWidth: '480px' }}>
            <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '0.5rem' }}>⏳</span>
            Awaiting verification from <strong>{currentPass.host_name}</strong>.<br/>
            <small className="text-secondary">This page will update automatically once approved.</small>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default DigitalPass;
