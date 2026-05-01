'use client';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

function CameraCapture({ onCapture, existingImage = null }) {
  const webcamRef = useRef(null);
  const [isCamera, setIsCamera] = useState(false);
  const [capturedImg, setCapturedImg] = useState(existingImage);
  
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
      setCapturedImg(compressed);
      onCapture(compressed);
    };
    
    setIsCamera(false);
  }, [webcamRef, onCapture]);

  const retake = () => {
    setCapturedImg(null);
    onCapture(null);
    setIsCamera(true);
  };

  if (capturedImg) {
    return (
      <div className="camera-comp-glass captured-state">
        <img src={capturedImg} alt="Captured" style={{ width: '100%', borderRadius: '20px', marginBottom: '1rem' }} />
        <button type="button" onClick={retake} className="apple-btn-secondary full-width">Retake Photo</button>
      </div>
    );
  }

  return (
    <div className="camera-comp-glass">
      {isCamera ? (
        <div className="webcam-overlay" style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', marginBottom: '1rem' }}>
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" screenshotQuality={0.7} videoConstraints={{ width: 320 }} width="100%" style={{ borderRadius: '20px' }} />
          <button type="button" onClick={capture} className="apple-btn-primary" style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '20px' }}>Capture</button>
        </div>
      ) : (
        <button type="button" onClick={() => setIsCamera(true)} className="apple-btn-primary full-width" style={{ marginBottom: '1rem' }}>Use Camera</button>
      )}
      <label className="file-upload-glass" style={{ display: 'block', textAlign: 'center', background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '15px', cursor: 'pointer' }}>
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
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
              const compressed = canvas.toDataURL('image/jpeg', 0.7);
              setCapturedImg(compressed);
              onCapture(compressed);
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        }} />
        <span style={{ fontWeight: '600', color: 'var(--apple-text)' }}>Upload Image</span>
      </label>
    </div>
  );
}

export default CameraCapture;
