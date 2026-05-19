(function (w, d) {
  'use strict';

  if (!w || !d) return;
  if (w.BillGenUI && w.BillGenUI.__glassReady) return;

  var STYLE_ID = 'billgen-glass-ui-style';
  var TOAST_HOST_ID = 'billgen-glass-toast-host';
  var LOADER_ID = 'billgen-glass-loader';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureStyles() {
    if (d.getElementById(STYLE_ID)) return;
    var style = d.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.bgui-toast-host{position:fixed;top:16px;right:16px;z-index:12000;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:min(90vw,380px);}',
      '.bgui-toast{pointer-events:auto;position:relative;overflow:hidden;border-radius:14px;padding:12px 42px 12px 12px;display:flex;gap:10px;align-items:flex-start;',
      'background:rgba(255,255,255,0.75);border:1px solid rgba(255,255,255,0.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);',
      'box-shadow:0 14px 30px -16px rgba(2,6,23,0.4);color:#0f172a;opacity:0;transform:translateY(-8px) scale(0.98);transition:opacity .2s ease,transform .2s ease;}',
      '.bgui-toast.is-open{opacity:1;transform:translateY(0) scale(1);}',
      '.bgui-toast.is-closing{opacity:0;transform:translateY(-6px) scale(0.98);}',
      '.bgui-toast::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,rgba(255,255,255,0.0) 0%,rgba(255,255,255,0.35) 45%,rgba(255,255,255,0.0) 100%);transform:translateX(-120%);animation:bguiToastShine 2.4s ease infinite;}',
      '.bgui-toast-icon{width:26px;height:26px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;}',
      '.bgui-toast-title{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;line-height:1.2;margin:0 0 4px 0;}',
      '.bgui-toast-message{font-size:13px;line-height:1.35;margin:0;white-space:pre-line;}',
      '.bgui-toast-close{position:absolute;top:7px;right:8px;border:none;background:transparent;color:#334155;cursor:pointer;font-size:18px;line-height:1;padding:2px 4px;border-radius:8px;}',
      '.bgui-toast-close:hover{background:rgba(15,23,42,0.06);}',
      '.bgui-toast-info .bgui-toast-icon{background:#dbeafe;color:#1d4ed8;}',
      '.bgui-toast-success .bgui-toast-icon{background:#dcfce7;color:#166534;}',
      '.bgui-toast-warning .bgui-toast-icon{background:#fef3c7;color:#92400e;}',
      '.bgui-toast-error .bgui-toast-icon{background:#fee2e2;color:#991b1b;}',
      '.bgui-loader-overlay{position:fixed;inset:0;z-index:13000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(255,255,255,0.4);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}',
      '.bgui-loader-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;background:transparent;border:none;box-shadow:none;}',
      /* Bouncing cube */
      '.bgui-cube-wrap{width:48px;height:48px;position:relative;margin:0 auto;}',
      '.bgui-cube-wrap::before{content:"";width:48px;height:5px;background:rgba(37,99,235,0.15);border-radius:50%;position:absolute;top:60px;left:0;animation:bguiCubeShadow 0.5s linear infinite;}',
      '.bgui-cube-wrap::after{content:"";width:100%;height:100%;background:linear-gradient(135deg,#60a5fa,#2563eb);position:absolute;top:0;left:0;border-radius:4px;animation:bguiCubeBounce 0.5s linear infinite;box-shadow:0 8px 16px rgba(37,99,235,0.25);}',
      '@keyframes bguiCubeBounce{15%{border-bottom-right-radius:3px;}25%{transform:translateY(9px) rotate(22.5deg);}50%{transform:translateY(18px) scale(1,.9) rotate(45deg);border-bottom-right-radius:40px;}75%{transform:translateY(9px) rotate(67.5deg);}100%{transform:translateY(0) rotate(90deg);}}',
      '@keyframes bguiCubeShadow{0%,100%{transform:scale(1,1);}50%{transform:scale(1.2,1);}}',
      '.bgui-loader-text{margin:0;font-size:14px;font-weight:700;color:#1e293b;letter-spacing:.02em;text-align:center;}',
      '@keyframes bguiSpin{to{transform:rotate(360deg);}}',
      '@keyframes bguiToastShine{100%{transform:translateX(130%);}}',
      '@media (max-width:640px){.bgui-toast-host{left:12px;right:12px;top:12px;max-width:none;}.bgui-toast{padding-right:36px;}}'
    ].join('');
    d.head.appendChild(style);
  }

  function ensureToastHost() {
    ensureStyles();
    var host = d.getElementById(TOAST_HOST_ID);
    if (host) return host;
    host = d.createElement('div');
    host.id = TOAST_HOST_ID;
    host.className = 'bgui-toast-host';
    d.body.appendChild(host);
    return host;
  }

  function normalizeType(type) {
    var value = String(type || 'info').toLowerCase();
    if (value !== 'success' && value !== 'warning' && value !== 'error') return 'info';
    return value;
  }

  function iconForType(type) {
    if (type === 'success') return 'OK';
    if (type === 'warning') return '!';
    if (type === 'error') return 'X';
    return 'i';
  }

  function notify(message, options) {
    var opts = options || {};
    var text = String(message || '').trim();
    if (!text) return null;

    var type = normalizeType(opts.type);
    var title = String(opts.title || (type === 'success' ? 'Success' : (type === 'warning' ? 'Notice' : (type === 'error' ? 'Error' : 'Info'))));
    var duration = Number(opts.duration);
    if (!Number.isFinite(duration) || duration < 1000) duration = 3800;

    var host = ensureToastHost();
    var toast = d.createElement('div');
    toast.className = 'bgui-toast bgui-toast-' + type;
    toast.innerHTML = [
      '<div class="bgui-toast-icon">', escapeHtml(iconForType(type)), '</div>',
      '<div style="min-width:0">',
      '<p class="bgui-toast-title">', escapeHtml(title), '</p>',
      '<p class="bgui-toast-message">', escapeHtml(text), '</p>',
      '</div>',
      '<button class="bgui-toast-close" aria-label="Close notification" title="Close">',
      '&times;',
      '</button>'
    ].join('');

    host.appendChild(toast);
    w.requestAnimationFrame(function () {
      toast.classList.add('is-open');
    });

    function closeToast() {
      toast.classList.remove('is-open');
      toast.classList.add('is-closing');
      w.setTimeout(function () {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }

    var closeBtn = toast.querySelector('.bgui-toast-close');
    if (closeBtn) closeBtn.addEventListener('click', closeToast);

    w.setTimeout(closeToast, duration);
    return closeToast;
  }

  function showLoader(text) {
    ensureStyles();
    hideLoader();

    var overlay = d.createElement('div');
    overlay.id = LOADER_ID;
    overlay.className = 'bgui-loader-overlay';
    overlay.innerHTML = [
      '<div class="bgui-loader-card" role="status" aria-live="polite">',
      '<div class="bgui-cube-wrap" aria-hidden="true"></div>',
      '<p class="bgui-loader-text">', escapeHtml(text || 'Loading, please wait...'), '</p>',
      '</div>'
    ].join('');

    d.body.appendChild(overlay);
    return LOADER_ID;
  }

  function hideLoader(id) {
    var loaderId = String(id || LOADER_ID);
    var node = d.getElementById(loaderId);
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  var nativeAlert = typeof w.alert === 'function' ? w.alert.bind(w) : null;
  var existing = w.BillGenUI || {};
  w.BillGenUI = Object.assign(existing, {
    __glassReady: true,
    nativeAlert: nativeAlert,
    notify: notify,
    showLoader: showLoader,
    hideLoader: hideLoader,
  });

  if (!w.__billgenGlassAlertWrapped) {
    w.__billgenGlassAlertWrapped = true;
    w.alert = function (message) {
      notify(message, { type: 'warning', title: 'Notice', duration: 4500 });
    };
  }

  // ── Auto page-transition loader ──────────────────────────────
  // Shows the cube loader on every internal link click / form submit
  if (!w.__billgenNavLoaderBound) {
    w.__billgenNavLoaderBound = true;

    // Show on initial page load if not complete
    if (d.readyState !== 'complete') {
      var bodyCheckTimer = w.setInterval(function () {
        if (d.body) {
          w.clearInterval(bodyCheckTimer);
          showLoader('Loading...');
        }
      }, 10);
      w.addEventListener('load', function () {
        w.clearInterval(bodyCheckTimer);
        hideLoader();
      });
    }

    d.addEventListener('click', function (e) {
      var el = e.target.closest('a[href]');
      if (!el) return;
      var href = el.getAttribute('href') || '';
      // Only trigger for same-origin, non-hash, non-js links
      if (
        href.startsWith('#') ||
        href.startsWith('javascript') ||
        href.startsWith('mailto') ||
        href.startsWith('tel') ||
        el.target === '_blank'
      ) return;
      try {
        var url = new URL(href, w.location.href);
        if (url.origin !== w.location.origin) return;
        if (url.pathname === w.location.pathname && url.search === w.location.search) return;
      } catch (err) { return; }
      showLoader('Loading...');
    }, true);

    // Also show on back/forward navigation
    w.addEventListener('pageshow', function (e) {
      hideLoader();
    });

    // Hide loader when page becomes visible (handles forward-cache)
    d.addEventListener('visibilitychange', function () {
      if (d.visibilityState === 'visible') hideLoader();
    });
  }
})(window, document);
