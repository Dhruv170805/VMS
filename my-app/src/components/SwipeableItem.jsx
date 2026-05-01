import React, { useState } from 'react';
import { haptic } from '../utils/hooks';

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

export default SwipeableItem;
