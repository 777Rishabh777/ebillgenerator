
# eBillGenerator

Generate professional e-bills and receipts with customizable templates, previews, and downloads. This repo contains the Vite + React frontend, static pages, and a Node/Express backend for user, billing, and payment-related APIs.

## Features
- Template-based bill creation with preview/export flows
- React + Vite UI with shared assets and static pages
- Express API with JSON or MySQL-backed storage (configurable)
- File-based storage for local development (ignored from Git)

## Tech Stack
- React 19, Vite, Tailwind CSS
- Node.js, Express, MySQL (optional)

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   copy .env.example .env
   ```
   Update the values in `.env` for your setup.
3. Run frontend (Vite):
   ```bash
   npm run dev
   ```
4. Run backend (Express):
   ```bash
   npm run server
   ```

Frontend defaults to `http://localhost:5173` and the API defaults to `http://localhost:3006`.

## Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – build production assets to `dist/`
- `npm run preview` – preview the production build
- `npm run server` – start the Express API

## Data & Security
- Local JSON data lives under `data/` and is **excluded from Git**.
- Do not commit `.env` files or any secrets; only `.env.example` is tracked.

## Deployment Notes
Build the frontend with `npm run build` and serve the `dist/` directory. Run the Node server separately if API endpoints are required.
