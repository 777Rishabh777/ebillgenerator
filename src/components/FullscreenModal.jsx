import React, { useEffect } from 'react';
import Watermark from './Watermark';

export default function FullscreenModal({ isOpen, onClose, children, showWatermark = true }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fullscreen-modal-overlay" onClick={onClose}>
      <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="fullscreen-close-btn" onClick={onClose}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="fullscreen-canvas-wrapper" style={{ position: 'relative' }}>
          {children}
          <Watermark show={showWatermark} />
        </div>
      </div>
    </div>
  );
}
