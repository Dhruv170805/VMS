'use client';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

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

export default CameraCapture;
