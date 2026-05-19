import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

const SKIP_PREFIXES = ['/@', '/src/', '/node_modules/', '/assets/', '/api/'];

function applyCleanHtmlUrlHandling(req, res, next) {
  if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
    next();
    return;
  }

  const [pathname, query = ''] = req.url.split('?');
  if (!pathname || pathname === '/') {
    next();
    return;
  }

  for (const prefix of SKIP_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      next();
      return;
    }
  }

  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  if (!trimmed) {
    next();
    return;
  }

  if (pathname.endsWith('.html')) {
    const cleanName = trimmed.slice(0, -5);
    const fileName = cleanName ? `${cleanName}.html` : 'index.html';
    if (!fs.existsSync(resolve(__dirname, fileName))) {
      next();
      return;
    }

    const cleanPath = !cleanName || cleanName === 'index' ? '/' : `/${cleanName}`;
    const queryPart = query ? `?${query}` : '';
    res.statusCode = 301;
    res.setHeader('Location', `${cleanPath}${queryPart}`);
    res.end();
    return;
  }

  if (trimmed.includes('.')) {
    next();
    return;
  }

  const candidate = `${trimmed}.html`;
  if (fs.existsSync(resolve(__dirname, candidate))) {
    req.url = `/${candidate}${query ? `?${query}` : ''}`;
  }

  next();
}

function cleanHtmlUrls() {
  return {
    name: 'clean-html-urls',
    configureServer(server) {
      server.middlewares.use(applyCleanHtmlUrlHandling);
    },
    configurePreviewServer(server) {
      server.middlewares.use(applyCleanHtmlUrlHandling);
    },
  };
}

export default defineConfig({
  plugins: [
    cleanHtmlUrls(),
    tailwindcss(),
    react(),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3006',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        about: resolve(__dirname, 'about.html'),
        admin: resolve(__dirname, 'admin.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        features: resolve(__dirname, 'features.html'),
        google_callback: resolve(__dirname, 'google-callback.html'),
        index: resolve(__dirname, 'index.html'),
        log_in: resolve(__dirname, 'log_in.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        privacypolicy: resolve(__dirname, 'privacypolicy.html'),
        profile: resolve(__dirname, 'profile.html'),
        refundpolicy: resolve(__dirname, 'refundpolicy.html'),
        report: resolve(__dirname, 'report.html'),
        sign_in: resolve(__dirname, 'sign_in.html'),
        templates: resolve(__dirname, 'templates.html'),
        termsofuse: resolve(__dirname, 'termsofuse.html')
      },
    },
  },
});
