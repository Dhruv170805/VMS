'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import DigitalPass from '@/components/DigitalPass';
import CameraCapture from '@/components/CameraCapture';
import { useConfig } from '@/context/ConfigContext';
import { API_BASE, VISIT_PURPOSES, ID_TYPES, safeJson } from '@/utils/config';

export default function VisitorPage() {
  const { config: sysConfig } = useConfig();
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', company: '', purpose: 'OFFICE', host_id: '',
    id_type: 'AADHAR', id_number: '', photo_base64: '', id_photo_base64: '',
    validity: { 
      from: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0], 
      to: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0] 
    }
  });
  const [isReturning, setIsReturning] = useState(false);
  const [visitorPass, setVisitorPass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE}/employees?activeOnly=true`).then(res => safeJson(res)).then(data => { if (data) setEmployees(data) });
  }, []);

  const checkIdentity = async () => {
    if (!formData.name || !formData.phone) {
      setError("Name and Phone are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/visitor/profile?name=${encodeURIComponent(formData.name)}&phone=${encodeURIComponent(formData.phone)}`);
      const data = await safeJson(res);
      if (data && !data.error) {
        setFormData({ ...formData, ...data });
        setIsReturning(true);
      } else {
        setIsReturning(false);
      }
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.photo_base64 || !formData.id_photo_base64) {
      setError("Both photo and ID capture are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/visitor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data?.error?.[0]?.message || data?.error || 'Registration failed');
      
      const host = employees.find(e => e._id === formData.host_id);
      setVisitorPass({ 
        ...formData, 
        id: data.visitorId, 
        visitor_code: data.visitor_code,
        host_name: host?.name,
        host_dept: host?.department
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (visitorPass) return <DigitalPass pass={visitorPass} onBack={() => router.refresh()} />;

  return (
    <div className="visitor-layout">
      <GlassCard className="wide-glass main-glass" style={{ padding: '4rem' }}>
        <div className="glass-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px' }}>Visitor Registration</h2>
          <p className="text-secondary" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', marginTop: '0.5rem' }}>Welcome to {sysConfig.companyName}</p>
        </div>

        {step === 1 ? (
          <div className="identity-check-glass" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div className="step-indicator" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ background: 'var(--apple-blue)', color: 'white', padding: '6px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>STEP 1 OF 2</span>
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Verify Identity</h3>
            <p className="text-secondary" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>Returning visitors are automatically detected via phone number.</p>
            <div className="apple-input-group-vertical">
              <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ fontSize: '1.1rem', padding: '1.2rem' }} />
              <input type="text" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ fontSize: '1.1rem', padding: '1.2rem' }} />
            </div>
            {error && <p className="error-text" style={{ textAlign: 'center', marginTop: '1.5rem' }}>{error}</p>}
            <div className="form-actions-glass" style={{ marginTop: '2.5rem' }}>
              <button onClick={checkIdentity} disabled={loading} className="apple-btn-primary full-width" style={{ padding: '1.2rem' }}>
                {loading ? 'Verifying...' : 'Continue to Registration'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="advanced-form-glass">
            {isReturning && (
              <div className="apple-alert-info" style={{ marginBottom: '3rem', background: 'rgba(52, 199, 89, 0.1)', borderColor: 'rgba(52, 199, 89, 0.2)', color: '#248a3d' }}>
                ✨ <strong>Welcome back!</strong> Your profile has been automatically loaded.
              </div>
            )}
            
            <div className="step-indicator" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <span style={{ background: 'var(--apple-blue)', color: 'white', padding: '6px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>STEP 2 OF 2</span>
            </div>
            
            <div className="glass-form-grid" style={{ display: 'grid', gridTemplateColumns: isReturning ? '1fr' : '1fr 1.2fr', gap: '4rem' }}>
              <div className="form-section-glass">
                <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Visit Details</h4>
                <div className="apple-input-group-vertical">
                  <label className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>PURPOSE OF VISIT</label>
                  <select value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} style={{ padding: '1.2rem' }}>
                    {VISIT_PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <label className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '1rem' }}>HOSt / DEPARTMENT</label>
                  <select required value={formData.host_id} onChange={e => setFormData({...formData, host_id: e.target.value})} style={{ padding: '1.2rem' }}>
                    <option value="">Select your host...</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} — {emp.department}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!isReturning && (
                <div className="form-section-glass">
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Personal Details</h4>
                  <div className="apple-input-group-vertical">
                    <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input type="text" placeholder="Company / Organization" required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
                      <select value={formData.id_type} onChange={e => setFormData({...formData, id_type: e.target.value})}>
                        {ID_TYPES.map(id => <option key={id.value} value={id.value}>{id.label}</option>)}
                      </select>
                      <input type="text" placeholder="ID Number" required value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {!isReturning && (
                <div className="photo-section-glass" style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                  <div className="capture-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="capture-box-glass" style={{ background: 'rgba(0,0,0,0.02)', padding: '2rem', borderRadius: '30px', textAlign: 'center' }}>
                      <h5 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--apple-text-muted)' }}>LIVE VISITOR PHOTO</h5>
                      <CameraCapture onCapture={(img) => setFormData({...formData, photo_base64: img})} />
                      {formData.photo_base64 && <img src={formData.photo_base64} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '20px', marginTop: '1.5rem' }} />}
                    </div>
                    <div className="capture-box-glass" style={{ background: 'rgba(0,0,0,0.02)', padding: '2rem', borderRadius: '30px', textAlign: 'center' }}>
                      <h5 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--apple-text-muted)' }}>ID DOCUMENT SCAN</h5>
                      <CameraCapture onCapture={(img) => setFormData({...formData, id_photo_base64: img})} />
                      {formData.id_photo_base64 && <img src={formData.id_photo_base64} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '20px', marginTop: '1.5rem' }} />}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions-glass" style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem' }}>
              <button type="button" className="apple-btn-secondary" onClick={() => setStep(1)} style={{ padding: '1.2rem 3rem' }}>Go Back</button>
              <button type="submit" className="apple-btn-primary flex-1" disabled={loading} style={{ padding: '1.2rem' }}>
                {loading ? 'Processing...' : 'Complete Registration & Issue Pass'}
              </button>
            </div>
            {error && <p className="error-text" style={{ textAlign: 'center', marginTop: '2rem' }}>{error}</p>}
          </form>
        )}
      </GlassCard>
    </div>
  );
}
