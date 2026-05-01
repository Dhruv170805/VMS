import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import VisitorForm from './pages/VisitorForm';
import HostDashboard from './pages/HostDashboard';
import AdminPanel from './pages/AdminPanel';
import GuardPanel from './pages/GuardPanel';

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
