'use client';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';

function CameraCapture({ onCapture, onOCR = null, existingImage = null }) {
  const webcamRef = useRef(null);
  const [isCamera, setIsCamera] = useState(false);
  const [capturedImg, setCapturedImg] = useState(existingImage);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processImage = (imageSrc) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 600; // slightly wider for better OCR
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImg(compressed);
      onCapture(compressed);

      // OCR Processing
      if (onOCR) {
        setIsProcessing(true);
        try {
          const { data: { text } } = await Tesseract.recognize(compressed, 'eng');
          onOCR(text);
        } catch (err) {
          console.error('OCR Error:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    };
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) processImage(imageSrc);
    setIsCamera(false);
  }, [webcamRef, onCapture, onOCR]);

  const retake = () => {
    setCapturedImg(null);
    onCapture(null);
    setIsCamera(true);
  };

  if (capturedImg) {
    return (
      <div className="camera-comp-glass captured-state">
        <div style={{ position: 'relative' }}>
          <img src={capturedImg} alt="Captured" style={{ width: '100%', borderRadius: '20px', marginBottom: '1rem', opacity: isProcessing ? 0.6 : 1 }} />
          {isProcessing && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: '80%', height: '20px' }}></div>
            </div>
          )}
        </div>
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
            processImage(reader.result);
          };
          reader.readAsDataURL(file);
        }} />
        <span style={{ fontWeight: '600', color: 'var(--apple-text)' }}>Upload Image</span>
      </label>
    </div>
  );
}

export default CameraCapture;
