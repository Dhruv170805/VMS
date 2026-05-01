import { useEffect } from 'react';

export const haptic = (type = 'light') => {
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

export const usePullToRefresh = (onRefresh) => {
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
