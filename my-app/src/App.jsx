import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import Webcam from 'react-webcam';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5001/api';

const fetchAuth = (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
};

// --- Haptic Engine ---
const haptic = (type = 'light') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    const patterns = {
      light: 10,
      medium: 30,
      heavy: [20, 10, 20],
      success: [10, 20, 10],
      error: [50, 20, 50]
    };
    window.navigator.vibrate(patterns[type] || patterns.light);
  }
};

// --- Shared Components ---

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  if (!token || (role && userRole !== role)) return <Navigate to="/login" />;
  return children;
};

const GlassCard = ({ children, className = '', ...props }) => (
  <div className={`glass-card ${className}`} {...props}>
    {children}
  </div>
);

const SwipeableItem = ({ children, onSwipeLeft, onSwipeRight, threshold = 100 }) => {
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  const handleStart = (e) => setStartX(e.touches[0].clientX);
  const handleMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (Math.abs(diff) < 150) setOffsetX(diff);
  };
  const handleEnd = () => {
    if (offsetX > threshold && onSwipeRight) {
      haptic('success');
      onSwipeRight();
    } else if (offsetX < -threshold && onSwipeLeft) {
      haptic('error');
      onSwipeLeft();
    }
    setOffsetX(0);
  };

  return (
    <div 
      className="swipeable-wrapper"
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{ transform: `translateX(${offsetX}px)`, transition: offsetX === 0 ? 'transform 0.3s ease' : 'none' }}
    >
      {children}
      {offsetX > 50 && <div className="swipe-indicator right">Approve</div>}
      {offsetX < -50 && <div className="swipe-indicator left">Reject</div>}
    </div>
  );
};

const usePullToRefresh = (onRefresh) => {
  useEffect(() => {
    let startY = 0;
    const handleStart = (e) => startY = e.touches[0].clientY;
    const handleEnd = (e) => {
      const endY = e.changedTouches[0].clientY;
      if (endY - startY > 150 && window.scrollY === 0) {
        haptic('medium');
        onRefresh();
      }
    };
    window.addEventListener('touchstart', handleStart);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [onRefresh]);
};

// --- Page Components ---

function Home() {
  const [mode, setMode] = useState('visitor'); // 'visitor', 'staff'
  const [trackCode, setTrackCode] = useState('');
  const [visitorPass, setVisitorPass] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Login state for staff mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    haptic('light');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/visitor/track/${trackCode}`);
      const data = await res.json();
      if (!res.ok) {
        haptic('error');
        throw new Error(data.error);
      }
      haptic('success');
      setVisitorPass({
        ...data.visitor,
        token: data.token,
        host_name: data.visitor.host_id?.name,
        host_dept: data.visitor.host_id?.department
      });
    } catch (err) { setError(err.message); }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    haptic('light');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        haptic('error');
        throw new Error(data.error);
      }
      haptic('success');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('userId', data.userId);
      if (data.employeeId) localStorage.setItem('employeeId', data.employeeId);
      navigate(data.role === 'ADMIN' ? '/admin' : data.role === 'GUARD' ? '/guard' : '/host');
    } catch (err) { setError(err.message); }
  };

  if (visitorPass) return <DigitalPass pass={visitorPass} onBack={() => { haptic('light'); setVisitorPass(null); }} />;

  const registerUrl = `${window.location.origin}/visitor`;
  
  return (
    <div className="home-layout fade-in">
      <GlassCard className="home-card main-glass single-card-view">
        <div className="home-hero">
          <h1 className="main-logo-text">VMS</h1>
          <p className="subtitle">Smart Visitor System</p>
        </div>
        <div className="segmented-control-container">
          <div className="segmented-control">
            <button className={mode === 'visitor' ? 'active' : ''} onClick={() => { haptic('light'); setMode('visitor'); }}>Reception</button>
            <button className={mode === 'staff' ? 'active' : ''} onClick={() => { haptic('light'); setMode('staff'); }}>Staff Portal</button>
            <div className={`control-indicator ${mode}`}></div>
          </div>
        </div>


        {mode === 'visitor' ? (
          <>
            <div className="welcome-section">
              <h2>Reception</h2>
              <p className="text-secondary">Scan to Register</p>
              <div className="qr-box-glass">
                <QRCodeCanvas value={registerUrl} size={130} level="H" includeMargin={false} bgColor="transparent" fgColor="#1d1d1f" />
              </div>
              <Link to="/visitor" className="apple-btn-primary">Register Manually</Link>
            </div>
            
            <div className="divider-glass"><span>OR</span></div>

            <div className="track-section">
              <h3>Track My Pass</h3>
              <form onSubmit={handleTrack} className="track-form-glass">
                <div className="apple-input-group-vertical">
                  <input 
                    type="text" 
                    placeholder="VMS-20240501-XXXX" 
                    value={trackCode} 
                    onChange={e => setTrackCode(e.target.value.toUpperCase())} 
                    required 
                  />
                </div>
                <button type="submit" className="apple-btn-secondary full-width">View Pass</button>
              </form>
            </div>
          </>
        ) : (
          <div className="staff-login-view fade-in">
            <h2>Staff Access</h2>
            <p className="text-secondary">Secure Portal Login</p>
            <form onSubmit={handleStaffLogin}>
              <div className="apple-input-group-vertical">
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="apple-btn-primary full-width">Sign In</button>
            </form>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
      </GlassCard>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      localStorage.setItem('userId', data.userId);
      
      if (data.role === 'ADMIN') navigate('/admin');
      else if (data.role === 'GUARD') navigate('/guard');
      else navigate('/host');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="login-layout fade-in">
      <GlassCard className="login-card main-glass">
        <div className="login-header">
          <div className="logo-small">VMS</div>
          <h2>Staff Sign In</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div className="apple-input-group">
            <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="apple-btn-primary full-width">Sign In</button>
        </form>
        {error && <p className="error-text">{error}</p>}
        <Link to="/" className="back-link-glass">← Back to Reception</Link>
      </GlassCard>
    </div>
  );
}

// --- Configuration Constants ---
const VISIT_PURPOSES = [
  { value: 'OFFICE', label: 'Office Visit' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OTHER', label: 'Other' }
];

const ID_TYPES = [
  { value: 'AADHAR', label: 'Aadhar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'ELECTION_CARD', label: 'Voter ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'OTHER', label: 'Other' }
];

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

function CameraCapture({ onCapture }) {
  const webcamRef = useRef(null);
  const [isCamera, setIsCamera] = useState(false);
  
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    
    // Bug 5 fix: Compress/Resize image using canvas
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; // Limit size to save DB space
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
      onCapture(compressed);
    };
    
    setIsCamera(false);
  }, [webcamRef, onCapture]);

  return (
    <div className="camera-comp-glass">
      {isCamera ? (
        <div className="webcam-overlay">
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" screenshotQuality={0.7} videoConstraints={{ width: 320 }} width={320} />
          <button type="button" onClick={capture} className="apple-btn-capture">Capture</button>
        </div>
      ) : (
        <button type="button" onClick={() => setIsCamera(true)} className="apple-btn-camera">Use Camera</button>
      )}
      <label className="file-upload-glass">
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 400;
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              onCapture(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        }} />
        <span>Upload Image</span>
      </label>
    </div>
  );
}

function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [activeVisits, setActiveVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [vRes, eRes, logRes, allTodayRes, blRes] = await Promise.all([
        fetchAuth(`${API_BASE}/visitor/pending`),
        fetch(`${API_BASE}/employees`), // public
        fetchAuth(`${API_BASE}/logs`),
        fetchAuth(`${API_BASE}/dashboard/stats/detailed`),
        fetchAuth(`${API_BASE}/blacklist`)
      ]);
      setPending(await vRes.json());
      setEmployees(await eRes.json());
      setLogs(await logRes.json());
      const allToday = await allTodayRes.json();
      setAllHistory(allToday);
      setBlacklist(await blRes.json());
      setActiveVisits(allToday.filter(v => ['GATE_IN', 'MEET_IN', 'MEET_OVER', 'APPROVED'].includes(v.status)));
    } catch (err) { console.error(err); }
  };

  usePullToRefresh(fetchData);

  useEffect(() => { 
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    haptic('light');
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('success'); else haptic('error');
    fetchData();
  };

  const toggleEmployee = async (id) => {
    haptic('light');
    await fetchAuth(`${API_BASE}/employees/${id}/toggle`, { method: 'PATCH' });
    haptic('medium');
    fetchData();
  };

  const addToBlacklist = async (value, type) => {
    const reason = window.prompt("Reason for blacklisting?");
    if (reason === null) return;
    haptic('heavy');
    await fetchAuth(`${API_BASE}/blacklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, type, reason })
    });
    fetchData();
  };

  return (
    <div className="admin-layout fade-in">
      <nav className="admin-side-nav">
        <h1 className="nav-logo">VMS</h1>
        <div className="nav-group">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => { haptic('light'); setTab('dashboard'); }}>Dashboard</button>
          <button className={tab === 'pending' ? 'active' : ''} onClick={() => { haptic('light'); setTab('pending'); }}>Pending ({pending.length})</button>
          <button className={tab === 'active' ? 'active' : ''} onClick={() => { haptic('light'); setTab('active'); }}>Live Tracking</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => { haptic('light'); setTab('history'); }}>History</button>
          <button className={tab === 'employees' ? 'active' : ''} onClick={() => { haptic('light'); setTab('employees'); }}>Staff</button>
          <button className={tab === 'blacklist' ? 'active' : ''} onClick={() => { haptic('light'); setTab('blacklist'); }}>Blacklist</button>
          <button className={tab === 'logs' ? 'active' : ''} onClick={() => { haptic('light'); setTab('logs'); }}>Audit Logs</button>
        </div>
        <button className="logout-btn-glass" onClick={() => { haptic('medium'); localStorage.clear(); navigate('/login'); }}>Sign Out</button>
      </nav>

      <main className="admin-main">
        {tab === 'dashboard' && <Dashboard />}

        {tab === 'pending' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Access Requests</h3>
            <div className="table-container">
              <table className="apple-table">
                <thead><tr><th>Visitor</th><th>Photo</th><th>Host</th><th>Actions</th></tr></thead>
                <tbody>
                  {pending.map(v => (
                    <tr key={v._id}>
                      <td colSpan="4" style={{ padding: 0 }}>
                        <SwipeableItem 
                          onSwipeRight={() => updateStatus(v._id, 'APPROVED')}
                          onSwipeLeft={() => updateStatus(v._id, 'REJECTED')}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', width: '100%', padding: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '24px' }}>
                            <div className="name-cell"><strong>{v.name}</strong><small>{v.company}</small></div>
                            <div><img src={v.photo_base64} className="table-thumb" /></div>
                            <div>{v.host_id?.name}</div>
                            <div className="action-btns">
                              <button className="apple-badge success" onClick={() => updateStatus(v._id, 'APPROVED')}>Approve</button>
                              <button className="apple-badge danger" onClick={() => updateStatus(v._id, 'REJECTED')}>Reject</button>
                              <button className="apple-badge secondary" onClick={() => addToBlacklist(v.email, 'EMAIL')}>Ban</button>
                            </div>
                          </div>
                        </SwipeableItem>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {tab === 'active' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Live Premises Tracking</h3>
            <div className="table-container">
              <table className="apple-table">
                <thead><tr><th>Visitor</th><th>Code</th><th>Status</th><th>Override</th></tr></thead>
                <tbody>
                  {activeVisits.map(v => (
                    <tr key={v._id}>
                      <td><strong>{v.name}</strong></td>
                      <td><code>{v.visitor_code}</code></td>
                      <td><span className={`apple-badge-status ${v.status}`}>{v.status}</span></td>
                      <td>
                        <select className="apple-select" value={v.status} onChange={(e) => updateStatus(v._id, e.target.value)}>
                          <option value="APPROVED">Approved</option>
                          <option value="GATE_IN">Gate In</option>
                          <option value="MEET_IN">Meet In</option>
                          <option value="MEET_OVER">Meet Over</option>
                          <option value="GATE_OUT">Gate Out</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {tab === 'history' && (
          <GlassCard className="main-glass">
            <h3 className="card-title">Global History</h3>
            <div className="table-container">
              <table className="apple-table">
                <thead><tr><th>Time</th><th>Visitor</th><th>Host</th><th>Status</th></tr></thead>
                <tbody>
                  {allHistory.map(v => (
                    <tr key={v._id}>
                      <td>{new Date(v.created_at).toLocaleTimeString()}</td>
                      <td><strong>{v.name}</strong><br/><small>{v.phone}</small></td>
                      <td>{v.host_id?.name}</td>
                      <td><span className={`apple-badge-status ${v.status}`}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {tab === 'employees' && (
          <div className="employees-view">
            <GlassCard className="main-glass margin-bottom">
              <h3>Upload Staff Directory</h3>
              <div className="upload-box-glass">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="apple-file" />
                <button onClick={async () => {
                  const fd = new FormData(); fd.append('file', file);
                  await fetchAuth(`${API_BASE}/employees/upload`, { method: 'POST', body: fd });
                  fetchData();
                }} className="apple-btn-primary">Update Database</button>
              </div>
            </GlassCard>
            <GlassCard className="main-glass">
              <h3>Current Directory</h3>
              <table className="apple-table">
                <thead><tr><th>Name</th><th>Department</th><th>Visibility</th><th>Action</th></tr></thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e._id}>
                      <td><strong>{e.name}</strong></td>
                      <td>{e.department}</td>
                      <td><span className={`apple-badge ${e.isActive ? 'success' : 'secondary'}`}>{e.isActive ? 'Active' : 'Hidden'}</span></td>
                      <td><button className="apple-btn-sm" onClick={() => toggleEmployee(e._id)}>{e.isActive ? 'Hide' : 'Show'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {tab === 'blacklist' && (
          <GlassCard className="main-glass">
            <h3>Banned Individuals</h3>
            <table className="apple-table">
              <thead><tr><th>Identifier</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {blacklist.map(b => (
                  <tr key={b._id}>
                    <td>{b.value}</td>
                    <td>{b.type}</td>
                    <td>{b.reason}</td>
                    <td><button className="apple-badge danger" onClick={async () => { await fetchAuth(`${API_BASE}/blacklist/${b._id}`, { method: 'DELETE' }); fetchData(); }}>Unban</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}

        {tab === 'logs' && (
          <GlassCard className="main-glass">
            <h3>System Audit</h3>
            <table className="apple-table">
              <thead><tr><th>Time</th><th>Subject</th><th>Action</th><th>Actor</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id}>
                    <td>{new Date(l.timestamp).toLocaleString()}</td>
                    <td>{l.visitor_id?.name || 'System'}</td>
                    <td>{l.event}</td>
                    <td>{l.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </main>
    </div>
  );
}

function GuardPanel() {
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await fetchAuth(`${API_BASE}/dashboard/stats`);
      setStats(await res.json());
    } catch (err) { console.error(err); }
  };

  usePullToRefresh(fetchStats);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGate = async (action) => {
    haptic('light');
    const payload = input.startsWith('VMS-') ? { visitorCode: input } : { token: input };
    const res = await fetchAuth(`${API_BASE}/gate/${action}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (res.ok) haptic('success'); else haptic('error');
    setMsg({ text: d.message || d.error, type: res.ok ? 'success' : 'error' });
    if (res.ok) {
      setInput('');
      fetchStats();
    }
  };

  return (
    <div className="guard-layout fade-in">
      <div className="guard-header-glass">
        <h1 className="logo-text">Security Console</h1>
        <button className="logout-btn-glass" onClick={() => { haptic('medium'); localStorage.clear(); navigate('/login'); }}>Sign Out</button>
      </div>
      {stats && (
        <div className="guard-stats-row">
          <GlassCard className="guard-stat in">
            <span className="label">Current In</span>
            <strong className="value">{stats.GATE_IN + stats.MEET_IN + stats.MEET_OVER}</strong>
          </GlassCard>
          <GlassCard className="guard-stat out">
            <span className="label">Total Out</span>
            <strong className="value">{stats.GATE_OUT}</strong>
          </GlassCard>
          <GlassCard className="guard-stat today">
            <span className="label">Total Visits</span>
            <strong className="value">{stats.TOTAL}</strong>
          </GlassCard>
        </div>
      )}

      <GlassCard className="gate-control-glass main-glass">
        <h3>Gate Access</h3>
        <p className="text-secondary">Scan visitor QR or enter code manually</p>
        <div className="guard-input-group">
          <input 
            type="text" 
            placeholder="AWAITING INPUT..." 
            value={input} 
            onChange={e => setInput(e.target.value.toUpperCase())} 
            className="big-gate-input"
          />
          <div className="gate-actions">
            <button onClick={() => handleGate('checkin')} className="apple-btn-success flex-1">ENTRY (IN)</button>
            <button onClick={() => handleGate('checkout')} className="apple-btn-danger flex-1">EXIT (OUT)</button>
          </div>
        </div>
        {msg && <div className={`apple-alert ${msg.type}`}>{msg.text}</div>}
      </GlassCard>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { fetchAuth(`${API_BASE}/dashboard/stats`).then(r => r.json()).then(setStats); }, []);
  if (!stats) return null;

  const data = [
    { name: 'Pending', value: stats.PENDING, color: '#f59e0b' },
    { name: 'Approved', value: stats.APPROVED, color: '#3b82f6' },
    { name: 'On Premises', value: stats.GATE_IN + stats.MEET_IN + stats.MEET_OVER, color: '#10b981' },
    { name: 'Completed', value: stats.GATE_OUT, color: '#64748b' }
  ];

  return (
    <div className="dashboard-view fade-in">
      <div className="dash-row">
        <GlassCard className="dash-chart-card main-glass">
          <h3>Visit Status Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {data.map(d => <div key={d.name} className="legend-item"><span style={{background: d.color}}></span>{d.name}: {d.value}</div>)}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="dash-chart-card main-glass">
          <h3>Activity Trend (Today)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="dash-stats-grid">
        <GlassCard className="mini-glass"><span>Rejected</span><strong>{stats.REJECTED}</strong></GlassCard>
        <GlassCard className="mini-glass"><span>Host Meetings</span><strong>{stats.MEET_IN}</strong></GlassCard>
        <GlassCard className="mini-glass highlight"><span>Total Traffic</span><strong>{stats.TOTAL}</strong></GlassCard>
      </div>
    </div>
  );
}

function DigitalPass({ pass, onBack }) {
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
    <div className="pass-layout fade-in">
      <div className="pass-container-apple">
        <div className="vms-card-studio no-print-shadow">
          <div className="card-top">
            <div className="logo-studio">VMS</div>
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
            <span>ISSUED BY APPLE STUDIO VMS</span>
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
      </div>
    </div>
  );
}

function HostDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const navigate = useNavigate();
  // Bug 7 Fix: Use employeeId instead of userId
  const hostId = localStorage.getItem('employeeId') || localStorage.getItem('userId');
  const name = localStorage.getItem('name');

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/visitor/host/${hostId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setVisitors(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  usePullToRefresh(fetchData);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, status) => {
    haptic('light');
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('success'); else haptic('error');
    fetchData();
  };

  const updateStatus = async (id, status) => {
    haptic('light');
    const res = await fetchAuth(`${API_BASE}/visitor/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) haptic('medium'); else haptic('error');
    fetchData();
  };

  if (loading) return null;

  const pending = visitors.filter(v => v.status === 'PENDING');
  const active = visitors.filter(v => ['GATE_IN', 'MEET_IN', 'MEET_OVER', 'APPROVED'].includes(v.status));
  const history = visitors.filter(v => ['GATE_OUT', 'REJECTED'].includes(v.status));

  return (
    <div className="host-layout fade-in">
      <header className="host-header-glass">
        <div className="user-welcome">
          <span>Welcome,</span>
          <h2>{name}</h2>
        </div>
        <button className="logout-btn-glass" onClick={() => { haptic('medium'); localStorage.clear(); navigate('/login'); }}>Sign Out</button>
      </header>

      <div className="host-content">
        <div className="host-tabs-glass">
          <button className={tab === 'pending' ? 'active' : ''} onClick={() => { haptic('light'); setTab('pending'); }}>Inbox ({pending.length})</button>
          <button className={tab === 'active' ? 'active' : ''} onClick={() => { haptic('light'); setTab('active'); }}>Active Meetings</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => { haptic('light'); setTab('history'); }}>Past Visits</button>
        </div>

        <GlassCard className="main-glass">
          {tab === 'pending' && (
            <div className="host-view">
              <h3>Visitor Requests</h3>
              {pending.length === 0 ? <p className="empty-text">No pending requests.</p> : (
                <div className="apple-list">
                  {pending.map(v => (
                    <SwipeableItem 
                      key={v._id}
                      onSwipeRight={() => handleAction(v._id, 'APPROVED')}
                      onSwipeLeft={() => handleAction(v._id, 'REJECTED')}
                    >
                      <div className="apple-list-item">
                        <img src={v.photo_base64} className="list-avatar" />
                        <div className="item-info"><strong>{v.name}</strong><small>{v.company} • {v.purpose}</small></div>
                        <div className="item-actions">
                          <button className="apple-btn-sm success" onClick={() => handleAction(v._id, 'APPROVED')}>Allow</button>
                          <button className="apple-btn-sm danger" onClick={() => handleAction(v._id, 'REJECTED')}>Deny</button>
                        </div>
                      </div>
                    </SwipeableItem>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'active' && (
            <div className="host-view">
              <h3>Live Status</h3>
              <div className="apple-list">
                {active.map(v => (
                  <div key={v._id} className="apple-list-item">
                    <div className="item-info"><strong>{v.name}</strong><span className={`apple-badge-status ${v.status}`}>{v.status}</span></div>
                    <div className="item-actions">
                      {v.status === 'GATE_IN' && <button className="apple-btn-sm primary" onClick={() => updateStatus(v._id, 'MEET_IN')}>Meeting Started</button>}
                      {v.status === 'MEET_IN' && <button className="apple-btn-sm primary" onClick={() => updateStatus(v._id, 'MEET_OVER')}>Meeting Over</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="host-view">
              <h3>History</h3>
              <div className="apple-list">
                {history.map(v => (
                  <div key={v._id} className="apple-list-item dimmed">
                    <div className="item-info"><strong>{v.name}</strong><small>{new Date(v.created_at).toLocaleDateString()}</small></div>
                    <span className={`apple-badge-status ${v.status}`}>{v.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// --- App Root ---

function App() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.querySelectorAll(".glass-card, .glass").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--x", `${x}px`);
        el.style.setProperty("--y", `${y}px`);

        // 3D Tilt Effect
        const tiltX = (y / rect.height - 0.5) * 5; // Max 5 degrees
        const tiltY = (x / rect.width - 0.5) * -5; // Max 5 degrees
        el.style.setProperty("--tilt-x", `${tiltX}deg`);
        el.style.setProperty("--tilt-y", `${tiltY}deg`);
        el.style.setProperty("--active-tilt", "1");
      });
    };

    const handleMouseLeave = () => {
      document.querySelectorAll(".glass-card, .glass").forEach((el) => {
        el.style.setProperty("--tilt-x", `0deg`);
        el.style.setProperty("--tilt-y", `0deg`);
        el.style.setProperty("--active-tilt", "0");
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/visitor" element={<VisitorForm />} />
            <Route path="/host" element={<ProtectedRoute role="EMPLOYEE"><HostDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminPanel /></ProtectedRoute>} />
            <Route path="/guard" element={<ProtectedRoute role="GUARD"><GuardPanel /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
