'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function ClientWrapper({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.querySelectorAll(".glass-card, .glass").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--mouse-x", `${x}px`);
        el.style.setProperty("--mouse-y", `${y}px`);

        const tiltX = (y / rect.height - 0.5) * 5;
        const tiltY = (x / rect.width - 0.5) * -5;
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
    <div className="app-container">
      <main className="app-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', height: '100%' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
