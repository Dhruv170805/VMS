import React, { useState, useRef } from 'react';

const GlassCard = ({ children, className = '', ...props }) => {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    window.requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const tiltX = (y / rect.height - 0.5) * 5;
      const tiltY = (x / rect.width - 0.5) * -5;

      setStyle({
        '--mouse-x': `${x}px`,
        '--mouse-y': `${y}px`,
        '--tilt-x': `${tiltX}deg`,
        '--tilt-y': `${tiltY}deg`,
        '--active-tilt': '1',
      });
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      '--tilt-x': '0deg',
      '--tilt-y': '0deg',
      '--active-tilt': '0',
    });
  };

  return (
    <div 
      ref={cardRef}
      className={`glass-card ${className}`} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, ...props.style }}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
