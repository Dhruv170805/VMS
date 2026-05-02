'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { API_BASE, safeJson } from '../utils/config';
import { useConfig } from '@/context/ConfigContext';

function DigitalPass({ pass, onBack }) {
  const { config, refreshConfig } = useConfig();
  const [currentPass, setCurrentPass] = useState(pass);
  const [polling, setPolling] = useState(pass.status === 'PENDING');
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calcTime = () => {
      const exp = new Date(currentPass.validity.to);
      exp.setHours(23, 59, 59);
      const diff = exp - new Date();
      
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hours}h ${mins}m remaining`);
    };

    calcTime();
    const t = setInterval(calcTime, 60000);
    return () => clearInterval(t);
  }, [currentPass.validity.to]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        refreshConfig();
        const res = await fetch(`${API_BASE}/visitor/track/${currentPass.visitor_code}`);
        if (res.ok) {
          const data = await safeJson(res);
          if (data && data.visitor) {
            setCurrentPass({
              ...data.visitor,
              token: data.token,
              host_name: data.visitor.host_id?.name,
              host_dept: data.visitor.host_id?.department
            });
            if (data.visitor.status !== 'PENDING') setPolling(false);
          }
        }
      } catch (err) { console.error(err); }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, currentPass.visitor_code, refreshConfig]);

  const handlePrint = () => window.print();

  return (
    <div className="pass-layout">
      <motion.div 
        className="pass-wrapper"
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="pass-card glass-card">
          
          {/* HEADER */}
          <div className="pass-header">
            <div className="brand">
              <div className="logo">{config.appName.charAt(0)}</div>
              <div>
                <div className="title">{config.appName}</div>
                <div className="subtitle">VISITOR MANAGEMENT SYSTEM</div>
              </div>
            </div>
            <div className="badge">DIGITAL PASS</div>
          </div>

          {/* BODY */}
          <div className="pass-body">

            {/* LEFT - PHOTO & ID */}
            <div className="left">
              <div className="photo-box">
                <img src={currentPass.photo_base64} alt={currentPass.name} />
              </div>
              <div className="pass-id">
                <span>PASS ID</span>
                <strong>{currentPass.visitor_code}</strong>
              </div>
            </div>

            {/* CENTER - DETAILS */}
            <div className="center">
              <h2>{currentPass.name}</h2>
              <p className="company">{currentPass.company || 'Private Visitor'}</p>

              <div className={`status-badge-glass ${currentPass.status}`} style={{ margin: '15px 0' }}>
                {currentPass.status === 'GATE_IN' || currentPass.status === 'MEET_IN' ? '● ' : ''}
                {currentPass.status}
              </div>

              <div className="grid">
                <div>
                  <span>PURPOSE</span>
                  <p>{currentPass.purpose}</p>
                </div>
                <div>
                  <span>HOST</span>
                  <p>{currentPass.host_name}</p>
                </div>
                <div>
                  <span>DEPARTMENT</span>
                  <p>{currentPass.host_dept}</p>
                </div>
                <div>
                  <span>PHONE</span>
                  <p>{currentPass.phone}</p>
                </div>
                <div>
                  <span>ID TYPE</span>
                  <p>{currentPass.id_type}</p>
                </div>
                <div>
                  <span>ID NUMBER</span>
                  <p>{currentPass.id_number.replace(/.(?=.{4})/g, 'X')}</p>
                </div>
              </div>

              <div className="valid">
                <div>
                  <span>VALID UNTIL</span>
                  <p>{new Date(currentPass.validity.to).toLocaleDateString()} • 23:59 PM</p>
                </div>
                <div className="time-remaining">
                  {timeLeft}
                </div>
              </div>
            </div>

            {/* RIGHT - QR CODE */}
            <div className="right">
              <p className="scan">SCAN TO ENTER</p>
              <div className="qr-box">
                {currentPass.token ? (
                  <QRCodeCanvas value={currentPass.token} size={140} level="H" bgColor="#ffffff" fgColor="#1d1d1f" />
                ) : (
                  <div style={{ width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#86868b', textAlign: 'center', fontWeight: 800 }}>
                    {currentPass.status === 'PENDING' ? 'AWAITING APPROVAL' : 'SECURE TOKEN'}
                  </div>
                )}
              </div>
              <div className="jwt">
                {currentPass.token ? (
                  <><span style={{ fontSize: '1rem' }}>🔒</span> JWT Signed</>
                ) : (
                  <span style={{ color: 'var(--apple-orange)' }}>Pending Sign</span>
                )}
              </div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="pass-footer">
            <div>
              ISSUED BY {config.companyName.toUpperCase()}  
              <br />
              <span className="vid">VID: {currentPass.id || currentPass._id}</span>
            </div>

            <div className="time">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} ✔
            </div>
          </div>

        </div>
      </motion.div>

      <div className="pass-controls no-print" style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', width: '100%', maxWidth: '900px', padding: '0 40px' }}>
        {['APPROVED', 'GATE_IN', 'MEET_IN', 'MEET_OVER'].includes(currentPass.status) && (
          <button onClick={handlePrint} className="apple-btn-primary flex-1">Print Pass</button>
        )}
        <button onClick={onBack} className="apple-btn-secondary flex-1">Dismiss</button>
      </div>

      {currentPass.status === 'PENDING' && (
        <div className="apple-alert-info no-print" style={{ width: '100%', maxWidth: '900px', margin: '2rem 40px 0 40px', textAlign: 'center' }}>
          ⏳ Awaiting verification from <strong>{currentPass.host_name}</strong>. This page will update automatically once approved.
        </div>
      )}
    </div>
  );
}

export default DigitalPass;
