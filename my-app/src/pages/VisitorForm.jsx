import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import DigitalPass from '../components/DigitalPass';
import CameraCapture from '../components/CameraCapture';
import { API_BASE, VISIT_PURPOSES, ID_TYPES } from '../utils/config';

function VisitorForm() {
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', company: '', purpose: 'OFFICE', host_id: '',
    id_type: 'AADHAR', id_number: '', photo_base64: '', id_photo_base64: '',
    validity: { from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }
  });
  const [isReturning, setIsReturning] = useState(false);
  const [visitorPass, setVisitorPass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/employees?activeOnly=true`).then(res => res.json()).then(setEmployees);
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
      const data = await res.json();
      if (data) {
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.[0]?.message || data.error || 'Registration failed');
      
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

  if (visitorPass) return <DigitalPass pass={visitorPass} onBack={() => window.location.reload()} />;

  return (
    <div className="visitor-layout fade-in">
      <GlassCard className="wide-glass main-glass">
        <div className="glass-header">
          <h2>Visitor Registration</h2>
        </div>

        {step === 1 ? (
          <div className="identity-check-glass">
            <div className="step-indicator">Step 1 of 2</div>
            <h3>Verify Identity</h3>
            <p className="text-secondary">Returning visitors are automatically detected</p>
            <div className="apple-input-group-vertical">
              <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div className="form-actions-glass">
              <button onClick={checkIdentity} disabled={loading} className="apple-btn-primary full-width">
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="advanced-form-glass">
            {isReturning && <div className="apple-banner-success">✨ Welcome back! Your identity has been verified.</div>}
            <div className="step-indicator">Step 2 of 2</div>
            
            <div className="glass-form-grid">
              <div className="form-section-glass">
                <h4>Visit Details</h4>
                <div className="apple-input-group-vertical">
                  <select value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}>
                    {VISIT_PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <select required value={formData.host_id} onChange={e => setFormData({...formData, host_id: e.target.value})}>
                    <option value="">Who would you like to meet?</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
              </div>

              {!isReturning && (
                <>
                  <div className="form-section-glass">
                    <h4>Personal Details</h4>
                    <div className="apple-input-group-vertical">
                      <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      <input type="text" placeholder="Company / Organization" required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                      <select value={formData.id_type} onChange={e => setFormData({...formData, id_type: e.target.value})}>
                        {ID_TYPES.map(id => <option key={id.value} value={id.value}>{id.label}</option>)}
                      </select>
                      <input type="text" placeholder="ID Card Number" required value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
                    </div>
                  </div>

                  <div className="photo-section-glass full-span">
                    <div className="capture-container">
                      <div className="capture-box-glass">
                        <h5>Visitor Photo</h5>
                        <CameraCapture onCapture={(img) => setFormData({...formData, photo_base64: img})} />
                        {formData.photo_base64 && <img src={formData.photo_base64} className="preview-img-glass" />}
                      </div>
                      <div className="capture-box-glass">
                        <h5>ID Document Scan</h5>
                        <CameraCapture onCapture={(img) => setFormData({...formData, id_photo_base64: img})} />
                        {formData.id_photo_base64 && <img src={formData.id_photo_base64} className="preview-img-glass" />}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="form-actions-glass">
              <button type="button" className="apple-btn-secondary" onClick={() => setStep(1)}>Back to Step 1</button>
              <button type="submit" className="apple-btn-primary flex-1" disabled={loading}>
                {loading ? 'Registering...' : 'Register Visit & Generate Pass'}
              </button>
            </div>
            {error && <p className="error-text">{error}</p>}
          </form>
        )}
      </GlassCard>
    </div>
  );
}

export default VisitorForm;
