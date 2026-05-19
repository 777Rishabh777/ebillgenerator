import React, { useRef, useEffect, useState } from 'react';

/**
 * PreviewScaler wraps a bill canvas and scales it to fit the available width.
 * Finds the actual bill template element and scales it centered in the preview area.
 *
 * @param {React.ReactNode} children - the canvas element to scale
 */
export default function PreviewScaler({ children }) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const measure = () => {
      if (!wrapperRef.current || !contentRef.current) return;

      // Find the actual bill element inside the content wrapper
      // Same logic as DownloadModal: check if first child has explicit width
      const refDiv = contentRef.current.firstElementChild;
      let billElement = refDiv;

      if (refDiv) {
        const refStyle = refDiv.getAttribute('style') || '';
        const hasExplicitWidth = refStyle.match(/width\s*:\s*\d+px/);
        const isBillCanvas = refDiv.classList?.contains('bill-canvas') || refDiv.hasAttribute('data-template');

        if (!hasExplicitWidth && !isBillCanvas) {
          // refDiv is a wrapper, actual bill is its first child
          billElement = refDiv.firstElementChild || refDiv;
        }
      }

      if (!billElement) return;

      const billWidth = billElement.offsetWidth;
      const billHeight = billElement.offsetHeight;
      const available = wrapperRef.current.clientWidth - 32; // 16px padding each side

      if (billWidth > 0 && available > 0) {
        const s = Math.min(1, available / billWidth);
        setScale(parseFloat(s.toFixed(4)));
      }
    };

    const timer = setTimeout(measure, 150);
    const timer2 = setTimeout(measure, 500); // second pass after images load

    const ro = new ResizeObserver(measure);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [children]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        overflow: 'auto',
        borderRadius: '12px',
        position: 'relative',
        background: '#f1f5f9',
        border: '1px solid #cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        minHeight: '200px',
      }}
    >
      <div
        ref={contentRef}
        style={{
          transformOrigin: 'top center',
          transform: `scale(${scale})`,
          display: 'inline-block',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
