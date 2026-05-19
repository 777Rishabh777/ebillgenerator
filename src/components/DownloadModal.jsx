import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const API = '';
const FREE_DOWNLOAD_LIMIT = 2;

// ── session helpers ────────────────────────────────────────────
function getSessionUser() {
  try {
    const raw = localStorage.getItem('billgen_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function isUserLoggedIn() {
  const u = getSessionUser();
  return !!(u && (u.id || u.email));
}
function getUserDisplayName() {
  const u = getSessionUser();
  if (!u) return null;
  return (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : null) || u.name || u.username || u.email || 'User';
}
function normalizePlanId(value) {
  return String(value || 'free').trim().toLowerCase() || 'free';
}
function isPaidPlanId(planId) {
  return ['premium', 'pro', 'business', 'enterprise'].includes(normalizePlanId(planId));
}
function getUserCredits(userInput) {
  const user = userInput || getSessionUser();
  const credits = Number(user?.credits);
  if (!Number.isFinite(credits)) return 0;
  return Math.max(0, Math.floor(credits));
}

export default function DownloadModal({
  isOpen,
  onClose,
  canvasRef,
  defaultFilename = 'bill',
  billType = 'bill',
  templateName = '',
  billData = null,  // New prop: form data from template
}) {
  const [filename, setFilename] = useState(defaultFilename);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('png');
  const [downloadCount, setDownloadCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const [entitlement, setEntitlement] = useState({
    planId: 'free',
    monthlyCreditLimit: 0,
    freeCredits: FREE_DOWNLOAD_LIMIT,
    teamSeats: 1,
  });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLimitPrompt, setShowLimitPrompt] = useState(false);
  const inputRef = useRef(null);

  // ── load download count on open ─────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setFilename(defaultFilename);
    setError(null);
    setIsDownloading(false);
    setDownloadFormat('png');
    setShowLoginPrompt(false);
    setShowLimitPrompt(false);

    if (!isUserLoggedIn()) {
      setShowLoginPrompt(true);
      return;
    }

    const user = getSessionUser();
    if (!user?.id) {
      setShowLoginPrompt(true);
      return;
    }

    setLoadingCount(true);
    fetch(`${API}/api/users/${encodeURIComponent(user.id)}/entitlement`)
      .then(async (r) => {
        const payload = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(payload?.error || 'Failed to load entitlement');
        }
        return payload;
      })
      .then((data) => {
        const credits = Number.isFinite(Number(data?.creditsRemaining))
          ? Math.max(0, Math.floor(Number(data.creditsRemaining)))
          : 0;

        setDownloadCount(credits);
        setEntitlement({
          planId: normalizePlanId(data?.planId || user.plan),
          monthlyCreditLimit: Number.isFinite(Number(data?.monthlyCreditLimit)) ? Math.max(0, Math.floor(Number(data.monthlyCreditLimit))) : 0,
          freeCredits: Number.isFinite(Number(data?.freeCredits)) ? Math.max(0, Math.floor(Number(data.freeCredits))) : FREE_DOWNLOAD_LIMIT,
          teamSeats: Number.isFinite(Number(data?.teamSeats)) ? Math.max(1, Math.floor(Number(data.teamSeats))) : 1,
        });

        const mergedUser = {
          ...user,
          plan: normalizePlanId(data?.planId || user.plan),
          plan_cycle: data?.planCycle || user.plan_cycle,
          plan_expires_at: data?.planExpiresAt || user.plan_expires_at,
          credits,
          monthly_credit_limit: Number.isFinite(Number(data?.monthlyCreditLimit)) ? Math.max(0, Math.floor(Number(data.monthlyCreditLimit))) : user.monthly_credit_limit,
          team_seats: Number.isFinite(Number(data?.teamSeats)) ? Math.max(1, Math.floor(Number(data.teamSeats))) : user.team_seats,
        };
        localStorage.setItem('billgen_user', JSON.stringify(mergedUser));

        if (credits <= 0) {
          setShowLimitPrompt(true);
        } else {
          setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 100);
        }
      })
      .catch(() => {
        const fallbackCredits = getUserCredits(user);
        setDownloadCount(fallbackCredits);
        setEntitlement({
          planId: normalizePlanId(user.plan),
          monthlyCreditLimit: Number.isFinite(Number(user.monthly_credit_limit)) ? Math.max(0, Math.floor(Number(user.monthly_credit_limit))) : 0,
          freeCredits: FREE_DOWNLOAD_LIMIT,
          teamSeats: Number.isFinite(Number(user.team_seats)) ? Math.max(1, Math.floor(Number(user.team_seats))) : 1,
        });
        if (fallbackCredits <= 0) {
          setShowLimitPrompt(true);
        } else {
          setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 100);
        }
      })
      .finally(() => setLoadingCount(false));
  }, [isOpen, defaultFilename]);

  // ── actual download logic ───────────────────────────────────
  const handleDownload = async () => {
    if (!canvasRef?.current) { setError('Preview not available. Please try again.'); return; }
    if (!isUserLoggedIn()) { setShowLoginPrompt(true); return; }
    if (showLimitPrompt) return;
    if (downloadCount <= 0) {
      setShowLimitPrompt(true);
      return;
    }

    const liveUser = getSessionUser();
    let effectivePlanId = normalizePlanId(entitlement.planId || liveUser?.plan);
    if (liveUser?.id) {
      try {
        const entitlementResponse = await fetch(`${API}/api/users/${encodeURIComponent(liveUser.id)}/entitlement`);
        const entitlementPayload = await entitlementResponse.json().catch(() => ({}));
        if (entitlementResponse.ok) {
          const freshCredits = Number.isFinite(Number(entitlementPayload?.creditsRemaining))
            ? Math.max(0, Math.floor(Number(entitlementPayload.creditsRemaining)))
            : 0;
          setDownloadCount(freshCredits);
          effectivePlanId = normalizePlanId(entitlementPayload?.planId || liveUser.plan);
          localStorage.setItem('billgen_user', JSON.stringify({
            ...liveUser,
            credits: freshCredits,
            plan: effectivePlanId,
            monthly_credit_limit: Number.isFinite(Number(entitlementPayload?.monthlyCreditLimit))
              ? Math.max(0, Math.floor(Number(entitlementPayload.monthlyCreditLimit)))
              : liveUser.monthly_credit_limit,
            team_seats: Number.isFinite(Number(entitlementPayload?.teamSeats))
              ? Math.max(1, Math.floor(Number(entitlementPayload.teamSeats)))
              : liveUser.team_seats,
          }));

          if (freshCredits <= 0) {
            setShowLimitPrompt(true);
            return;
          }
        }
      } catch {
        // Continue with existing local entitlement if server check fails.
      }
    }

    setIsDownloading(true);
    setError(null);

    let scaledPreviewNode = null;
    let previousTransform = '';
    try {
      const refElement = canvasRef.current;
      if (!refElement) {
        setError('Preview not ready');
        setIsDownloading(false);
        return;
      }

      // ── Find the actual bill element ──
      // Most canvases: <div ref={ref}> → firstChild is the bill template
      // Some canvases: <div ref={ref} className="bill-canvas" style="width:595px"> → ref IS the bill
      let billElement = refElement;

      const refHasExplicitWidth = (refElement.getAttribute('style') || '').match(/width\s*:\s*\d+px/);
      const refIsBillCanvas = refElement.classList?.contains('bill-canvas') ||
        refElement.hasAttribute('data-template');

      if (!refHasExplicitWidth && !refIsBillCanvas) {
        // ref is a plain wrapper — the actual bill is the first child
        billElement = refElement.firstElementChild || refElement;
      }

      if (!billElement || billElement.offsetWidth < 50) {
        setError('Bill area not found. Please try again.');
        setIsDownloading(false);
        return;
      }

      const sanitizedFilename = filename.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '') || defaultFilename;
      const shouldIncludeWatermarkInDownload = !isPaidPlanId(effectivePlanId);

      // ── Temporarily remove preview scaling ──
      scaledPreviewNode = refElement.closest?.('[style*="transform: scale"]');
      previousTransform = scaledPreviewNode?.style?.transform || '';
      if (scaledPreviewNode) scaledPreviewNode.style.transform = 'none';

      // ── If the bill's parent contains a watermark overlay, capture the parent
      //    so the watermark is included in the downloaded file for free users ──
      let captureElement = billElement;
      const parentEl = billElement.parentElement;
      if (shouldIncludeWatermarkInDownload && parentEl && parentEl.querySelector('.watermark-overlay')) {
        captureElement = parentEl;
      }

      if (!shouldIncludeWatermarkInDownload) {
        captureElement.classList.add('billgen-capture-no-watermark');
      }

      // ── Capture the bill at 3x for crisp quality ──
      // Let html2canvas auto-detect the element's full dimensions
      const canvas = await html2canvas(captureElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,  // transparent outside the bill
        logging: false,
      });

      if (!shouldIncludeWatermarkInDownload) {
        captureElement.classList.remove('billgen-capture-no-watermark');
      }

      if (scaledPreviewNode) scaledPreviewNode.style.transform = previousTransform;

      // ── PDF branch ──
      if (downloadFormat === 'pdf') {
        let jsPDFCtor = null;
        try {
          const m = await import('jspdf'); jsPDFCtor = m.jsPDF;
        } catch {
          setError('PDF module not available. Run: npm install jspdf');
          setIsDownloading(false); return;
        }
        const imgData = canvas.toDataURL('image/png', 1.0);

        // The html2canvas canvas is at 3x scale, so real pixel size = canvas.width/3
        const realW = canvas.width / 3;
        const realH = canvas.height / 3;

        // Convert screen pixels to PDF points (72 pt/inch, 96 px/inch screen)
        const PX_TO_PT = 72 / 96;
        const pageW = realW * PX_TO_PT;
        const pageH = realH * PX_TO_PT;

        const pdf = new jsPDFCtor({
          orientation: pageH >= pageW ? 'portrait' : 'landscape',
          unit: 'pt',
          format: [pageW, pageH]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
        pdf.save(`${sanitizedFilename}.pdf`);

        await logDownload(sanitizedFilename, 'pdf');
        setIsDownloading(false);
        onClose();
        return;
      }

      // ── PNG branch ──
      canvas.toBlob(async (blob) => {
        if (!blob) { setError('Failed to generate image. Please try again.'); setIsDownloading(false); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${sanitizedFilename}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        await logDownload(sanitizedFilename, 'png');
        setIsDownloading(false);
        onClose();
      }, 'image/png', 1.0);

    } catch (err) {
      const refElement = canvasRef?.current;
      if (refElement) {
        const billElement = refElement.firstElementChild || refElement;
        billElement.classList?.remove?.('billgen-capture-no-watermark');
        refElement.classList?.remove?.('billgen-capture-no-watermark');
      }
      if (scaledPreviewNode) scaledPreviewNode.style.transform = previousTransform;
      console.error('Download error:', err);
      setError('Download failed. Please try again.');
      setIsDownloading(false);
    }
  };

  async function logDownload(fname, fmt) {
    const user = getSessionUser();
    if (!user) return;
    try {
      const response = await fetch(`${API}/api/downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email || '',
          user_name: getUserDisplayName(),
          bill_type: billType,
          template_name: templateName,
          filename: `${fname}.${fmt}`,
          format: fmt,
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setShowLimitPrompt(true);
        throw new Error(payload?.error || 'Unable to consume download credit');
      }

      const remainingCredits = Number.isFinite(Number(payload?.creditsRemaining))
        ? Math.max(0, Math.floor(Number(payload.creditsRemaining)))
        : 0;
      setDownloadCount(remainingCredits);

      const mergedUser = {
        ...user,
        credits: remainingCredits,
        monthly_credit_limit: Number.isFinite(Number(payload?.monthlyCreditLimit))
          ? Math.max(0, Math.floor(Number(payload.monthlyCreditLimit)))
          : user.monthly_credit_limit,
        team_seats: Number.isFinite(Number(payload?.teamSeats))
          ? Math.max(1, Math.floor(Number(payload.teamSeats)))
          : user.team_seats,
      };
      localStorage.setItem('billgen_user', JSON.stringify(mergedUser));

      // Also save bill data to admin panel if billData provided
      if (billData) {
        const billRecord = {
          invoice_id: billData.invoiceId || billData.invoice_id || `${billType.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}-${Date.now().toString().slice(-6)}`,
          bill_type: billType,
          vendor_name: billData.vendorName || billData.vendor_name || billData.companyName || billData.company_name || billType,
          vendor_address: billData.vendorAddress || billData.vendor_address || billData.address || '',
          vendor_phone: billData.vendorPhone || billData.vendor_phone || billData.phone || '',
          customer_name: billData.customerName || getUserDisplayName(),
          customer_email: user.email || '',
          description: billData.description || billData.itemName || billData.item_name || `${billType} - ${fname}`,
          rate: parseFloat(billData.rate || billData.amount || billData.price || 0) || 0,
          quantity: parseFloat(billData.quantity || billData.qty || 1) || 1,
          total: parseFloat(billData.total || billData.grandTotal || billData.amount || 0) || 0,
          payment_method: billData.paymentMethod || billData.payment_method || 'Cash',
          payment_status: 'Paid',
          bill_date: billData.date || billData.billDate || new Date().toISOString().split('T')[0],
          created_by: getUserDisplayName(),
          form_data: billData.formDataCopy ? JSON.stringify(billData.formDataCopy) : null,
        };

        console.log('Saving bill to admin:', billRecord);

        try {
          const resp = await fetch(`${API}/api/bills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billRecord)
          });
          const result = await resp.json();
          console.log('Bill saved:', result);
        } catch (e) {
          console.error('Bill save failed:', e);
        }
      } else {
        console.log('No billData provided to save');
      }
    } catch (e) {
      console.error('Download log failed:', e);
      setError(e?.message || 'Unable to validate credits for this download.');
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isDownloading && !showLoginPrompt && !showLimitPrompt) handleDownload();
    else if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  const currentUser = getSessionUser();
  const currentPlanId = normalizePlanId(entitlement.planId || currentUser?.plan);
  const isPaidPlan = isPaidPlanId(currentPlanId);
  const isBusinessPlan = currentPlanId === 'business';
  const isProPlan = currentPlanId === 'premium' || currentPlanId === 'pro';
  const currentPlanCycle = String(currentUser?.plan_cycle || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly';
  const refillPlanId = isBusinessPlan ? 'business' : 'premium';
  const refillCheckoutHref = `/checkout?plan=${encodeURIComponent(refillPlanId)}&cycle=${encodeURIComponent(currentPlanCycle)}&topup=1`;
  const remaining = Math.max(0, Number.isFinite(Number(downloadCount)) ? Math.floor(Number(downloadCount)) : 0);
  const freeCreditsLimit = Math.max(0, Number.isFinite(Number(entitlement.freeCredits)) ? Math.floor(Number(entitlement.freeCredits)) : FREE_DOWNLOAD_LIMIT);
  const paidMonthlyLimit = Math.max(0, Number.isFinite(Number(entitlement.monthlyCreditLimit)) ? Math.floor(Number(entitlement.monthlyCreditLimit)) : 0);
  const limitHeading = isBusinessPlan
    ? 'Business Credits Finished'
    : (isProPlan ? 'Pro Credits Finished' : 'Free Credits Finished');
  const limitDescription = isBusinessPlan
    ? `You have used all ${paidMonthlyLimit || 1000} monthly business credits for this account.`
    : (isProPlan
      ? `You have used all ${paidMonthlyLimit || 100} monthly Pro credits.`
      : `You have used all ${freeCreditsLimit} free credits.`);
  const upgradeCtaLabel = isBusinessPlan
    ? 'Buy More Business Credits'
    : (isProPlan ? 'Buy More Pro Credits' : 'Upgrade to Pro');

  return (
    <div className="download-modal-overlay" onClick={onClose}>
      <div className="download-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="download-modal-header">
          <h3 className="download-modal-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download {billType}
          </h3>
          <button className="download-modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="download-modal-content">
          {showLoginPrompt ? (
            /* ── Login Required ── */
            <div className="download-login-prompt">
              <div className="download-login-icon">
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4>Login Required</h4>
              <p>Please log in to download your {billType}. It only takes a moment!</p>
              <div className="download-login-actions">
                <button className="download-btn secondary" onClick={onClose}>Cancel</button>
                <button className="download-btn primary" onClick={() => window.location.href = '/log_in'}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log In
                </button>
              </div>
            </div>
          ) : showLimitPrompt ? (
            /* ── Credit Limit Reached ── */
            <div className="download-login-prompt">
              <div className="download-login-icon" style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#d97706' }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 style={{ color: '#92400e' }}>{limitHeading}</h4>
              <p>
                {limitDescription}{' '}
                {isPaidPlan
                  ? 'Buy more credits now to continue downloading without interruption.'
                  : 'Upgrade to get more credits and keep downloading without interruption.'}
              </p>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>✨ Plan benefits:</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: '#78350f', lineHeight: 1.8 }}>
                  <li>Pro plan: 100 credits per month</li>
                  <li>Business plan: 1000 credits per month</li>
                  <li>Business shared employee access (10 seats)</li>
                  <li>No watermarks on bills</li>
                  <li>All 11 bill templates</li>
                  <li>PNG + PDF formats</li>
                </ul>
              </div>
              <div className="download-login-actions">
                <button className="download-btn secondary" onClick={onClose}>Maybe Later</button>
                <button className="download-btn primary" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
                  onClick={() => {
                    if (isPaidPlan) {
                      window.BillGenUI?.showLoader?.('Opening secure checkout...');
                      window.location.href = refillCheckoutHref;
                      return;
                    }
                    window.location.href = '/pricing';
                  }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                  {upgradeCtaLabel}
                </button>
              </div>
            </div>
          ) : loadingCount ? (
            /* ── Loading ── */
            <div className="download-loading-glass">
              <div className="download-cube-wrap" aria-hidden="true" />
              <p className="download-loading-text">Checking your account credits...</p>
            </div>
          ) : (
            /* ── Download Form ── */
            <>
              {/* User + download count badge */}
              <div className="download-user-info">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Logged in as <strong>{getUserDisplayName()}</strong>
                </span>
                <span className={`dl-badge ${isPaidPlan ? 'dl-badge-pro' : (remaining === 0 ? 'dl-badge-warn' : '')}`}>
                  {isPaidPlan ? `${remaining} credits left` : `${remaining}/${freeCreditsLimit} free credits`}
                </span>
              </div>

              {!isPaidPlan && remaining <= 1 && remaining > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#92400e' }}>
                  ⚠️ Only <strong>{remaining} free credit</strong> remaining. <a href="/pricing" style={{ color: '#d97706', fontWeight: 700 }}>Upgrade to Pro (100/month)</a>
                </div>
              )}

              <label className="download-modal-label">Enter file name</label>
              <div className="download-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter file name..."
                  className="download-modal-input"
                  disabled={isDownloading}
                />
                <span className="download-input-suffix">.{downloadFormat}</span>
              </div>

              <label className="download-modal-label" style={{ marginTop: 12 }}>Download format</label>
              <div className="download-format-toggle">
                <button type="button" className={`download-format-btn ${downloadFormat === 'png' ? 'active' : ''}`} onClick={() => setDownloadFormat('png')} disabled={isDownloading}>
                  🖼 PNG
                </button>
                <button type="button" className={`download-format-btn ${downloadFormat === 'pdf' ? 'active' : ''}`} onClick={() => setDownloadFormat('pdf')} disabled={isDownloading}>
                  📄 PDF
                </button>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 12px', marginTop: 10, fontSize: 11, color: '#0369a1' }}>
                💡 <strong>PNG</strong> = exact template size &amp; look. <strong>PDF</strong> = auto-sized to template (no white borders).
              </div>

              {error && (
                <div className="download-error">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="download-modal-actions">
                <button className="download-btn secondary" onClick={onClose} disabled={isDownloading}>Cancel</button>
                <button className="download-btn primary" onClick={handleDownload} disabled={isDownloading || !filename.trim()}>
                  {isDownloading ? (
                    <><span className="download-spinner" /> Downloading...</>
                  ) : (
                    <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                    </svg> Download</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      <style>{`
        .download-modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 20px;
        }
        .download-modal {
          background: white; border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          width: 100%; max-width: 420px; overflow: hidden;
          animation: modalSlideIn 0.2s ease-out;
        }
        @keyframes modalSlideIn {
          from { opacity:0; transform: scale(0.95) translateY(-10px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        .download-modal-header {
          display:flex; align-items:center; justify-content:space-between;
          padding: 16px 20px; border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);
        }
        .download-modal-title {
          display:flex; align-items:center; gap:10px;
          font-size:16px; font-weight:600; color:white; margin:0;
        }
        .download-modal-close {
          background: rgba(255,255,255,0.2); border:none; border-radius:8px;
          width:32px; height:32px; display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:white; transition:background 0.2s;
        }
        .download-modal-close:hover { background: rgba(255,255,255,0.3); }
        .download-modal-content { padding: 20px; }
        .download-user-info {
          display:flex; align-items:center; gap:8px; padding:10px 12px;
          background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px;
          color:#065f46; font-size:13px; margin-bottom:12px; flex-wrap:wrap;
        }
        .download-user-info svg { color:#10b981; flex-shrink:0; }
        .dl-badge {
          margin-left:auto; padding:2px 10px; border-radius:20px;
          font-size:11px; font-weight:700; background:#dbeafe; color:#1d4ed8;
        }
        .dl-badge-pro  { background:#fef9c3; color:#b45309; }
        .dl-badge-warn { background:#fee2e2; color:#dc2626; }
        .download-modal-label {
          display:block; font-size:13px; font-weight:500; color:#374151; margin-bottom:8px;
        }
        .download-input-wrapper {
          display:flex; align-items:center; border:2px solid #e5e7eb;
          border-radius:10px; overflow:hidden; transition:border-color 0.2s,box-shadow 0.2s;
        }
        .download-input-wrapper:focus-within {
          border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1);
        }
        .download-modal-input {
          flex:1; padding:12px 14px; border:none; font-size:14px; outline:none;
          background:transparent;
        }
        .download-modal-input::placeholder { color:#9ca3af; }
        .download-input-suffix {
          padding:12px 14px; background:#f3f4f6; color:#6b7280;
          font-size:14px; font-weight:500; border-left:1px solid #e5e7eb;
        }
        .download-error {
          display:flex; align-items:center; gap:6px; margin-top:10px;
          padding:10px 12px; background:#fef2f2; border:1px solid #fecaca;
          border-radius:8px; color:#dc2626; font-size:13px;
        }
        .download-format-toggle {
          display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:4px;
        }
        .download-format-btn {
          border:1px solid #cbd5e1; background:#f8fafc; color:#1e293b;
          border-radius:10px; padding:10px 12px; font-size:13px; font-weight:600;
          cursor:pointer; transition:all 0.2s;
        }
        .download-format-btn:hover:not(:disabled) { border-color:#60a5fa; background:#eff6ff; }
        .download-format-btn.active { background:#dbeafe; border-color:#3b82f6; color:#1d4ed8; }
        .download-format-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .download-modal-actions { display:flex; gap:10px; margin-top:20px; }
        .download-btn {
          flex:1; display:flex; align-items:center; justify-content:center;
          gap:8px; padding:12px 16px; border-radius:10px; font-size:14px;
          font-weight:600; cursor:pointer; transition:all 0.2s; border:none;
        }
        .download-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .download-btn.secondary { background:#f3f4f6; color:#374151; }
        .download-btn.secondary:hover:not(:disabled) { background:#e5e7eb; }
        .download-btn.primary { background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%); color:white; }
        .download-btn.primary:hover:not(:disabled) {
          background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);
          transform:translateY(-1px); box-shadow:0 4px 12px rgba(37,99,235,0.3);
        }
        .download-spinner {
          width:16px; height:16px; border:2px solid rgba(255,255,255,0.3);
          border-top-color:white; border-radius:50%; animation:spin 0.8s linear infinite;
          display:inline-block;
        }
        .download-loading-glass {
          text-align:center;
          padding:32px 20px;
          background:transparent;
          border:none;
          box-shadow:none;
        }
        .download-cube-wrap {
          width:48px; height:48px; position:relative; margin:0 auto 18px;
        }
        .download-cube-wrap::before {
          content:''; width:48px; height:5px;
          background:rgba(37,99,235,0.2); border-radius:50%;
          position:absolute; top:60px; left:0;
          animation:dlCubeShadow 0.5s linear infinite;
        }
        .download-cube-wrap::after {
          content:''; width:100%; height:100%;
          background:linear-gradient(135deg,#3b82f6,#2563eb);
          position:absolute; top:0; left:0; border-radius:6px;
          animation:dlCubeBounce 0.5s linear infinite;
          box-shadow:0 0 18px rgba(37,99,235,0.4);
        }
        @keyframes dlCubeBounce {15%{border-bottom-right-radius:3px;}25%{transform:translateY(9px) rotate(22.5deg);}50%{transform:translateY(18px) scale(1,.9) rotate(45deg);border-bottom-right-radius:40px;}75%{transform:translateY(9px) rotate(67.5deg);}100%{transform:translateY(0) rotate(90deg);}}
        @keyframes dlCubeShadow {0%,100%{transform:scale(1,1);}50%{transform:scale(1.2,1);}}
        .download-loading-text {
          margin:0; font-size:13px; font-weight:700; color:#1d4ed8;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes downloadShine { 100% { transform:translateX(130%); } }
        .download-login-prompt { text-align:center; padding:10px 0; }
        .download-login-icon {
          width:80px; height:80px; margin:0 auto 16px;
          background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          color:#3b82f6;
        }
        .download-login-prompt h4 { font-size:18px; font-weight:600; color:#111827; margin:0 0 8px 0; }
        .download-login-prompt p { font-size:14px; color:#6b7280; margin:0 0 20px 0; line-height:1.5; }
        .download-login-actions { display:flex; gap:10px; }
      `}</style>
    </div>
  );
}
