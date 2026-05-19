/**
 * BillGen Shared Navigation
 * Include this script in every page and call: BillGenNav.init({ activePage: 'home' })
 * activePage values: 'home' | 'tools' | 'features' | 'report' | 'pricing' | 'templates'
 */
window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : '';
(function (w) {
  'use strict'

  var TOOLS = [
    { id: 'invoice', label: 'Invoice Generator', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: '#3b82f6' },
    { id: 'general', label: 'General Bill', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', color: '#64748b' },
    { id: 'fuel', label: 'Fuel Bill', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#f97316' },
    { id: 'electric', label: 'Electric Bill', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: '#eab308' },
    { id: 'restaurant', label: 'Restaurant Bill', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: '#ef4444' },
    { id: 'salary', label: 'Driver Salary', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: '#10b981' },
    { id: 'helper', label: 'Daily Helper Bill', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: '#eab308' },
    { id: 'rent', label: 'Rent Receipt', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', color: '#6366f1' },
    { id: 'lta', label: 'LTA Receipt', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8', color: '#0ea5e9' },
    { id: 'medical', label: 'Medical Bill', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: '#f43f5e' },
    { id: 'internet', label: 'Internet Bill', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', color: '#06b6d4' },
    { id: 'cab', label: 'Cab Travel', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#8b5cf6' },
  ];

  function toolIcon(tool) {
    return '<svg width="16" height="16" fill="none" stroke="' + tool.color + '" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="' + tool.icon + '"/></svg>';
  }

  function buildDesktopDropdown() {
    return TOOLS.map(function (t) {
      return '<button onclick="BillGenNav.openTool(\'' + t.id + '\')" class="bgnav-dropdown-item">' +
        toolIcon(t) + '<span>' + t.label + '</span></button>';
    }).join('');
  }

  function buildMobileToolsGrid() {
    return TOOLS.map(function (t) {
      return '<button onclick="BillGenNav.openTool(\'' + t.id + '\')" class="bgnav-mob-tool">' +
        toolIcon(t) + '<span>' + t.label + '</span></button>';
    }).join('');
  }

  function navLink(href, label, active) {
    var cls = active ? 'bgnav-link bgnav-link-active' : 'bgnav-link';
    return '<a href="' + href + '" class="' + cls + '">' + label +
      '<span class="bgnav-underline"></span></a>';
  }

  function buildNav(opts) {
    var p = opts.activePage || '';
    var toolsActive = p === 'tools' || p === 'templates';

    return [
      '<style>',
      '.bgnav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,0.85);',
      'backdrop-filter:blur(12px);border-bottom:1px solid #e2e8f0;padding:0 24px;',
      'display:flex;align-items:center;justify-content:space-between;height:56px;',
      'animation:bgNavFade 0.4s ease-out;}',
      '@keyframes bgNavFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}',
      '.bgnav-logo{display:flex;align-items:center;cursor:pointer;white-space:nowrap;text-decoration:none;}',
      '.bgnav-logo img{height:48px;width:auto;object-fit:contain;display:block;}',
      '.bgnav-center{display:flex;align-items:center;gap:32px;flex:1;justify-content:center;}',
      '.bgnav-link{position:relative;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.18em;',
      'color:#64748b;text-decoration:none;transition:color 0.2s;white-space:nowrap;}',
      '.bgnav-link:hover,.bgnav-link-active{color:#2563eb;}',
      '.bgnav-underline{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);',
      'height:2px;width:0;background:#2563eb;transition:width 0.25s;}',
      '.bgnav-link:hover .bgnav-underline,.bgnav-link-active .bgnav-underline{width:100%;}',

      /* Tools dropdown trigger */
      '.bgnav-tools-wrap{position:relative;display:inline-flex;}',
      '.bgnav-tools-btn{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:800;',
      'text-transform:uppercase;letter-spacing:0.18em;color:#64748b;cursor:pointer;',
      'background:none;border:none;padding:0;transition:color 0.2s;white-space:nowrap;}',
      toolsActive ? '.bgnav-tools-btn{color:#2563eb;}' : '',
      '.bgnav-tools-btn:hover{color:#2563eb;}',
      '.bgnav-tools-btn svg{transition:transform 0.2s;}',
      '.bgnav-tools-btn.is-open svg{transform:rotate(180deg);}',

      /* Dropdown panel */
      '.bgnav-dropdown{position:absolute;left:50%;transform:translateX(-50%);',
      'top:100%;padding-top:8px;z-index:300;pointer-events:none;}',
      '.bgnav-dropdown-inner{background:#fff;border:1px solid #e2e8f0;',
      'border-radius:20px;box-shadow:0 20px 60px -10px rgba(0,0,0,0.18);',
      'padding:8px;width:280px;',
      'opacity:0;visibility:hidden;transform:translateY(8px);',
      'transition:opacity 0.2s,visibility 0.2s,transform 0.2s;pointer-events:none;}',
      '.bgnav-dropdown-inner.is-open{',
      'opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto;}',
      '.bgnav-dropdown-item{width:100%;display:flex;align-items:center;gap:10px;',
      'padding:10px 14px;border-radius:12px;border:none;background:transparent;',
      'cursor:pointer;transition:background 0.15s;text-align:left;}',
      '.bgnav-dropdown-item:hover{background:#f0f7ff;}',
      '.bgnav-dropdown-item span{font-size:11px;font-weight:700;text-transform:uppercase;',
      'letter-spacing:0.05em;color:#1e293b;}',

      /* Right side */
      '.bgnav-right{display:flex;align-items:center;gap:12px;}',
      '.bgnav-signin{background:#2563eb;color:#fff;padding:7px 18px;border-radius:10px;',
      'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;',
      'text-decoration:none;transition:background 0.2s,transform 0.1s;white-space:nowrap;}',
      '.bgnav-signin:hover{background:#1d4ed8;transform:translateY(-1px);}',
      '.bgnav-user{display:flex;align-items:center;gap:8px;}',
      '.bgnav-user-dot{width:8px;height:8px;border-radius:50%;background:#10b981;',
      'animation:pulse 2s infinite;}',
      '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}',
      '.bgnav-username{font-size:10px;font-weight:800;text-transform:uppercase;',
      'letter-spacing:0.1em;color:#475569;cursor:pointer;transition:color 0.2s;text-decoration:none;}',
      '.bgnav-username:hover{color:#2563eb;}',
      '.bgnav-credits{font-size:10px;font-weight:800;padding:3px 10px;border-radius:999px;',
      'background:#ecfeff;color:#155e75;border:1px solid #67e8f9;white-space:nowrap;}',
      '.bgnav-credits.bgnav-credits-low{background:#fff7ed;color:#9a3412;border-color:#fdba74;}',
      '.bgnav-logout{background:#f1f5f9;color:#64748b;border:none;padding:7px 14px;',
      'border-radius:10px;font-size:10px;font-weight:800;text-transform:uppercase;',
      'letter-spacing:0.1em;cursor:pointer;transition:all 0.2s;}',
      '.bgnav-logout:hover{background:#fee2e2;color:#dc2626;}',

      /* Hamburger */
      '.bgnav-hamburger{display:none;background:none;border:none;cursor:pointer;',
      'color:#475569;padding:6px;border-radius:8px;transition:background 0.2s;}',
      '.bgnav-hamburger:hover{background:#f1f5f9;}',

      /* Mobile menu */
      '.bgnav-mobile-menu{display:none;position:fixed;top:56px;left:0;right:0;',
      'background:#fff;border-bottom:1px solid #e2e8f0;z-index:199;',
      'padding:16px;max-height:calc(100vh - 56px);overflow-y:auto;',
      'box-shadow:0 8px 32px rgba(0,0,0,0.1);}',
      '.bgnav-mobile-menu.is-open{display:block;}',
      '.bgnav-mob-links{display:flex;flex-direction:column;gap:2px;margin-bottom:16px;}',
      '.bgnav-mob-link{padding:12px 16px;border-radius:12px;font-size:11px;',
      'font-weight:800;text-transform:uppercase;letter-spacing:0.15em;',
      'color:#475569;text-decoration:none;transition:all 0.15s;display:block;}',
      '.bgnav-mob-link:hover,.bgnav-mob-link.active{background:#eff6ff;color:#2563eb;}',
      '.bgnav-mob-tools-toggle{width:100%;display:flex;align-items:center;',
      'justify-content:space-between;padding:12px 16px;border-radius:12px;',
      'font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;',
      'color:#475569;background:none;border:none;cursor:pointer;transition:all 0.15s;}',
      '.bgnav-mob-tools-toggle:hover,.bgnav-mob-tools-toggle.active{background:#eff6ff;color:#2563eb;}',
      '.bgnav-mob-tools-toggle-arrow{transition:transform 0.2s;}',
      '.bgnav-mob-tools-grid{display:none;grid-template-columns:1fr 1fr;gap:6px;',
      'padding:8px 0 4px;}',
      '.bgnav-mob-tools-grid.is-open{display:grid;}',
      '.bgnav-mob-tool{display:flex;flex-direction:column;align-items:center;gap:4px;',
      'padding:10px 8px;border-radius:12px;border:1px solid #e2e8f0;',
      'background:#f8fafc;cursor:pointer;transition:all 0.15s;font-size:10px;',
      'font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#475569;',
      'text-align:center;}',
      '.bgnav-mob-tool:hover{border-color:#93c5fd;background:#eff6ff;color:#2563eb;}',
      '.bgnav-mob-divider{border:none;border-top:1px solid #e2e8f0;margin:12px 0;}',
      '.bgnav-mob-auth{display:flex;gap:8px;}',
      '.bgnav-mob-signin{flex:1;text-align:center;padding:12px;border-radius:12px;',
      'background:#2563eb;color:#fff;font-size:11px;font-weight:800;',
      'text-transform:uppercase;letter-spacing:0.1em;text-decoration:none;}',

      /* Responsive */
      '@media(max-width:768px){',
      '.bgnav-center,.bgnav-right .bgnav-signin,.bgnav-right .bgnav-user{display:none!important;}',
      '.bgnav-hamburger{display:flex;align-items:center;justify-content:center;}',
      '}',
      '</style>',

      '<nav class="bgnav" id="bgnav-root">',
      '  <a href="/" class="bgnav-logo" title="eBillGenerator.com - Smart billing and receipt generation" aria-label="eBillGenerator home"><img src="/billgen-watermark.png" alt="eBillGenerator" /></a>',

      '  <div class="bgnav-center">',
      '    ' + navLink('/', 'Home', p === 'home'),
      '    <div class="bgnav-tools-wrap" id="bgnav-tools-wrap">',
      '      <button class="bgnav-tools-btn' + (toolsActive ? ' is-active' : '') + '" id="bgnav-tools-btn">',
      '        Tools',
      '        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>',
      '      </button>',
      '      <div class="bgnav-dropdown" id="bgnav-desktop-dropdown">',
      '        <div class="bgnav-dropdown-inner" id="bgnav-dropdown-inner">',
      buildDesktopDropdown(),
      '        </div>',
      '      </div>',
      '    </div>',
      '    ' + navLink('/features', 'Features', p === 'features'),
      '    ' + navLink('/report', 'Report', p === 'report'),
      '    ' + navLink('/pricing', 'Pricing', p === 'pricing'),
      '  </div>',

      '  <div class="bgnav-right">',
      '    <a href="/log_in" class="bgnav-signin" id="bgnav-signin">Sign In</a>',
      '    <div class="bgnav-user" id="bgnav-user" style="display:none">',
      '      <div class="bgnav-user-dot"></div>',
      '      <a href="/profile" class="bgnav-username" id="bgnav-username"></a>',
      '      <span class="bgnav-credits" id="bgnav-credits">0 Credits</span>',
      '      <button class="bgnav-logout" onclick="BillGenNav.logout()">Logout</button>',
      '    </div>',
      '    <button class="bgnav-hamburger" id="bgnav-ham" onclick="BillGenNav.toggleMobile()" aria-label="Menu">',
      '      <svg id="bgnav-ham-open" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>',
      '      <svg id="bgnav-ham-close" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="display:none"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
      '    </button>',
      '  </div>',
      '</nav>',

      /* Mobile Menu */
      '<div class="bgnav-mobile-menu" id="bgnav-mobile-menu">',
      '  <div class="bgnav-mob-links">',
      '    <a href="/" class="bgnav-mob-link' + (p === 'home' ? ' active' : '') + '">🏠 Home</a>',
      '    <button class="bgnav-mob-tools-toggle' + (toolsActive ? ' active' : '') + '" id="bgnav-mob-tools-toggle" onclick="BillGenNav.toggleMobileTools()">',
      '      🔧 Tools',
      '      <svg class="bgnav-mob-tools-toggle-arrow" id="bgnav-mob-tools-arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>',
      '    </button>',
      '    <div class="bgnav-mob-tools-grid" id="bgnav-mob-tools-grid">',
      buildMobileToolsGrid(),
      '    </div>',
      '    <a href="/features" class="bgnav-mob-link' + (p === 'features' ? ' active' : '') + '">⭐ Features</a>',
      '    <a href="/report" class="bgnav-mob-link' + (p === 'report' ? ' active' : '') + '">📊 Report</a>',
      '    <a href="/pricing" class="bgnav-mob-link' + (p === 'pricing' ? ' active' : '') + '">💰 Pricing</a>',
      '  </div>',
      '  <hr class="bgnav-mob-divider">',
      '  <div class="bgnav-mob-auth" id="bgnav-mob-auth">',
      '    <a href="/log_in" class="bgnav-mob-signin">Sign In</a>',
      '  </div>',
      '</div>',
    ].join('');
  }

  var BillGenNav = {
    _mobileOpen: false,
    _toolsOpen: false,
    _mobileToolsOpen: false,
    _hoverTimeout: null,
    _authSyncBound: false,

    init: function (opts) {
      opts = opts || {};
      var container = document.getElementById('bgnav-placeholder');
      if (!container) {
        container = document.createElement('div');
        container.id = 'bgnav-placeholder';
        document.body.insertBefore(container, document.body.firstChild);
      }
      container.innerHTML = buildNav(opts);
      this._checkAuth();
      this._attachOutsideClick();
      this._attachHoverHandlers();
      this._bindAuthSync();
    },

    _bindAuthSync: function () {
      if (this._authSyncBound) return;
      this._authSyncBound = true;
      var self = this;

      w.addEventListener('focus', function () {
        self._checkAuth();
      });

      w.addEventListener('storage', function (ev) {
        if (!ev || ev.key === 'billgen_user') {
          self._checkAuth();
        }
      });
    },

    openTool: function (billId) {
      if (w.BillGenUI && w.BillGenUI.showLoader) w.BillGenUI.showLoader('Loading...');
      window.location.href = '/templates?bill=' + encodeURIComponent(billId);
    },

    _openDropdown: function () {
      this._toolsOpen = true;
      var dd = document.getElementById('bgnav-dropdown-inner');
      var btn = document.getElementById('bgnav-tools-btn');
      if (dd) dd.classList.add('is-open');
      if (btn) btn.classList.add('is-open');
    },

    _closeDropdown: function () {
      this._toolsOpen = false;
      var dd = document.getElementById('bgnav-dropdown-inner');
      var btn = document.getElementById('bgnav-tools-btn');
      if (dd) dd.classList.remove('is-open');
      if (btn) btn.classList.remove('is-open');
    },

    _attachHoverHandlers: function () {
      var self = this;
      var btn = document.getElementById('bgnav-tools-btn');
      var dropdownInner = document.getElementById('bgnav-dropdown-inner');

      if (btn) {
        btn.addEventListener('mouseenter', function () {
          clearTimeout(self._hoverTimeout);
          self._openDropdown();
        });
        btn.addEventListener('mouseleave', function () {
          self._hoverTimeout = setTimeout(function () {
            if (!self._toolsOpen) return; // Already closed
            self._closeDropdown();
          }, 200);
        });

        // Also handle click
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          clearTimeout(self._hoverTimeout);
          if (self._toolsOpen) {
            self._closeDropdown();
          } else {
            self._openDropdown();
          }
        });
      }

      if (dropdownInner) {
        dropdownInner.addEventListener('mouseenter', function () {
          clearTimeout(self._hoverTimeout);
          self._openDropdown();
        });
        dropdownInner.addEventListener('mouseleave', function () {
          self._hoverTimeout = setTimeout(function () {
            self._closeDropdown();
          }, 200);
        });
      }
    },

    toggleMobile: function () {
      this._mobileOpen = !this._mobileOpen;
      var menu = document.getElementById('bgnav-mobile-menu');
      var hamOpen = document.getElementById('bgnav-ham-open');
      var hamClose = document.getElementById('bgnav-ham-close');
      if (menu) menu.classList.toggle('is-open', this._mobileOpen);
      if (hamOpen) hamOpen.style.display = this._mobileOpen ? 'none' : 'block';
      if (hamClose) hamClose.style.display = this._mobileOpen ? 'block' : 'none';
    },

    toggleMobileTools: function () {
      this._mobileToolsOpen = !this._mobileToolsOpen;
      var grid = document.getElementById('bgnav-mob-tools-grid');
      var arrow = document.getElementById('bgnav-mob-tools-arrow');
      if (grid) grid.classList.toggle('is-open', this._mobileToolsOpen);
      if (arrow) arrow.style.transform = this._mobileToolsOpen ? 'rotate(180deg)' : '';
    },

    showProfile: async function () {
      if (w.BillGenUI && w.BillGenUI.showLoader) w.BillGenUI.showLoader('Loading profile...');
      var modal = document.getElementById('user-profile-modal');
      if (!modal) {
        if (w.BillGenUI && w.BillGenUI.hideLoader) w.BillGenUI.hideLoader();
        return;
      }
      modal.style.display = 'flex';

      var content = document.getElementById('profile-modal-content');
      content.innerHTML = '<div class="profile-loading">Loading...</div>';

      try {
        var user = JSON.parse(localStorage.getItem('billgen_user') || 'null');
        if (!user) return;

        // Fetch user's download history
        var downloadsRes = await fetch('/api/downloads/' + user.id);
        var downloadsData = await downloadsRes.json();
        var downloads = downloadsData.downloads || [];

        // Calculate premium days left
        var userPlan = (user.plan || 'free').toLowerCase();
        var isPremium = userPlan !== 'free';
        var daysLeft = 0;
        if (isPremium && user.plan_purchased_at) {
          var purchaseDate = new Date(user.plan_purchased_at);
          var expiryDate = new Date(purchaseDate);
          expiryDate.setDate(expiryDate.getDate() + 365); // 1 year
          var today = new Date();
          daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) daysLeft = 0;
        }

        var html = [
          '<div class="profile-section">',
          '  <div class="profile-info-grid">',
          '    <div class="profile-info-item">',
          '      <div class="profile-info-label">Full Name</div>',
          '      <div class="profile-info-value">' + (user.first_name || '') + ' ' + (user.last_name || '') + '</div>',
          '    </div>',
          '    <div class="profile-info-item">',
          '      <div class="profile-info-label">Email</div>',
          '      <div class="profile-info-value">' + (user.email || '') + '</div>',
          '    </div>',
          '    <div class="profile-info-item">',
          '      <div class="profile-info-label">Plan</div>',
          '      <div class="profile-info-value" style="text-transform:uppercase;color:' + (isPremium ? '#f59e0b' : '#64748b') + '">' + (user.plan || 'free') + '</div>',
          '    </div>',
          '    <div class="profile-info-item">',
          '      <div class="profile-info-label">Total Downloads</div>',
          '      <div class="profile-info-value">' + downloads.length + '</div>',
          '    </div>',
          '  </div>',
          '</div>',
        ];

        if (isPremium) {
          html.push(
            '<div class="profile-section">',
            '  <div class="profile-premium-card">',
            '    <div class="profile-premium-title">✨ Premium Membership</div>',
            '    <div class="profile-premium-days">' + daysLeft + '</div>',
            '    <div class="profile-premium-label">Days Remaining</div>',
            '  </div>',
            '</div>'
          );
        }

        html.push(
          '<div class="profile-section">',
          '  <div class="profile-section-title">📥 Download History</div>'
        );

        if (downloads.length === 0) {
          html.push('<div class="profile-empty">No downloads yet</div>');
        } else {
          downloads.slice(-10).reverse().forEach(function (d) {
            var date = new Date(d.downloaded_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            });
            html.push(
              '<div class="profile-history-item">',
              '  <div class="profile-history-info">',
              '    <div class="profile-history-type">' + (d.bill_type || 'Bill') + '</div>',
              '    <div class="profile-history-name">' + (d.filename || 'Unnamed') + '</div>',
              '    <div class="profile-history-date">' + date + '</div>',
              '  </div>',
              '  <div class="profile-history-format">' + (d.format || 'pdf').toUpperCase() + '</div>',
              '</div>'
            );
          });
        }

        html.push('</div>');
        content.innerHTML = html.join('');

      } catch (err) {
        content.innerHTML = '<div class="profile-empty">Failed to load profile data</div>';
      } finally {
        if (w.BillGenUI && w.BillGenUI.hideLoader) w.BillGenUI.hideLoader();
      }
    },

    closeProfile: function () {
      var modal = document.getElementById('user-profile-modal');
      if (modal) modal.style.display = 'none';
    },

    logout: async function () {
      if (w.BillGenUI && w.BillGenUI.showLoader) w.BillGenUI.showLoader('Logging out...');
      try {
        var user = JSON.parse(localStorage.getItem('billgen_user') || 'null');
        if (user && user.id) {
          await fetch('/api/auth/logout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
        }
      } catch (e) { }
      localStorage.removeItem('billgen_user');
      location.reload();
    },

    _checkAuth: async function () {
      try {
        var user = JSON.parse(localStorage.getItem('billgen_user') || 'null');
        if (!user) return;

        if (user.id) {
          try {
            var entitlementRes = await fetch('/api/users/' + encodeURIComponent(user.id) + '/entitlement');
            if (entitlementRes.ok) {
              var entitlement = await entitlementRes.json();
              user.plan = (entitlement.planId || user.plan || 'free').toLowerCase();
              user.credits = Number.isFinite(Number(entitlement.creditsRemaining))
                ? Math.max(0, Math.floor(Number(entitlement.creditsRemaining)))
                : (Number(user.credits) || 0);
              user.monthly_credit_limit = Number.isFinite(Number(entitlement.monthlyCreditLimit))
                ? Math.max(0, Math.floor(Number(entitlement.monthlyCreditLimit)))
                : (Number(user.monthly_credit_limit) || 0);
              user.team_seats = Number.isFinite(Number(entitlement.teamSeats))
                ? Math.max(1, Math.floor(Number(entitlement.teamSeats)))
                : (Number(user.team_seats) || 1);
              localStorage.setItem('billgen_user', JSON.stringify(user));
            }
          } catch (entErr) { }
        }

        var name = (user.first_name ? (user.first_name + ' ' + (user.last_name || '')).trim() : null)
          || user.name || user.username || user.email || 'User';
        var credits = Number.isFinite(Number(user.credits)) ? Math.max(0, Math.floor(Number(user.credits))) : 0;
        var monthlyLimit = Number.isFinite(Number(user.monthly_credit_limit)) ? Math.max(0, Math.floor(Number(user.monthly_credit_limit))) : 0;
        // Desktop
        var signin = document.getElementById('bgnav-signin');
        var userEl = document.getElementById('bgnav-user');
        var usernameEl = document.getElementById('bgnav-username');
        var creditsEl = document.getElementById('bgnav-credits');
        if (signin) signin.style.display = 'none';
        if (userEl) userEl.style.display = 'flex';
        if (usernameEl) usernameEl.textContent = name;
        if (creditsEl) {
          creditsEl.textContent = credits + ' Credits';
          creditsEl.classList.toggle('bgnav-credits-low', credits <= 5);
        }
        // Mobile
        var mobAuth = document.getElementById('bgnav-mob-auth');
        if (mobAuth) {
          var plan = (user.plan || 'free').toLowerCase();
          var isPro = plan === 'premium' || plan === 'pro' || plan === 'business';
          var mobilePlanText = isPro ? ('✨ ' + plan.toUpperCase()) : 'Free';
          var mobileCreditText = credits + ' Credits' + (monthlyLimit > 0 ? (' / ' + monthlyLimit) : '');
          mobAuth.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;flex:1;padding:10px 14px;' +
            'background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">' +
            '<div style="width:8px;height:8px;border-radius:50%;background:#10b981;animation:pulse 2s infinite;flex-shrink:0"></div>' +
            '<span style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.08em;">' + name + '</span>' +
            '<span style="margin-left:auto;font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:' +
            (isPro ? '#fef9c3' : '#dbeafe') + ';color:' + (isPro ? '#92400e' : '#1d4ed8') + ';">' +
            mobilePlanText + '</span>' +
            '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:#ecfeff;color:#155e75;border:1px solid #67e8f9;">' +
            mobileCreditText + '</span>' +
            '</div>' +
            '<button onclick="BillGenNav.logout()" style="padding:10px 16px;border-radius:12px;' +
            'background:#fee2e2;color:#dc2626;border:none;font-size:11px;font-weight:800;' +
            'text-transform:uppercase;cursor:pointer;">Logout</button>';
        }
      } catch (e) { }
    },

    _attachOutsideClick: function () {
      document.addEventListener('click', function (e) {
        var wrap = document.getElementById('bgnav-tools-wrap');
        if (wrap && !wrap.contains(e.target)) {
          var dd = document.getElementById('bgnav-dropdown-inner');
          var btn = document.getElementById('bgnav-tools-btn');
          if (dd) dd.classList.remove('is-open');
          if (btn) btn.classList.remove('is-open');
          BillGenNav._toolsOpen = false;
        }
        var menu = document.getElementById('bgnav-mobile-menu');
        var ham = document.getElementById('bgnav-ham');
        if (BillGenNav._mobileOpen && menu && ham
          && !menu.contains(e.target) && !ham.contains(e.target)) {
          BillGenNav.toggleMobile();
        }
      });
    }
  };

  w.BillGenNav = BillGenNav;
})(window);
