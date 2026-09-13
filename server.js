import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeDocumentState } from './src/data-store.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '12mb' }));

const { Pool } = pg;
const databaseConfigured = Boolean(process.env.DATABASE_URL);
const pool = databaseConfigured ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
}) : null;

async function ensureDatabase() {
  if (!pool) {
    console.warn('DATABASE_URL is not configured. Running in local-only mode without PostgreSQL persistence.');
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

app.get('/api/health', async (_req, res) => {
  if (!pool) {
    return res.json({ ok: true, database: 'not_configured', mode: 'local-only' });
  }

  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, database: 'connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, database: 'error', error: error.message });
  }
});

app.get('/api/docbook', async (_req, res) => {
  if (!pool) {
    const defaultState = normalizeDocumentState({ pages: null, activeId: null });
    return res.json(defaultState);
  }

  try {
    const result = await pool.query('SELECT data FROM app_state WHERE id = $1', ['docbook']);

    if (!result.rows[0]) {
      const defaultState = normalizeDocumentState({ pages: null, activeId: null });
      await pool.query('INSERT INTO app_state (id, data) VALUES ($1, $2)', ['docbook', JSON.stringify(defaultState)]);
      return res.json(defaultState);
    }

    res.json(result.rows[0].data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/docbook', async (req, res) => {
  try {
    if (!hasTrustedOrigin(req)) {
      return res.status(403).json({ error: 'Permintaan tidak dibenarkan.' });
    }
    const state = normalizeDocumentState(req.body || {});

    if (!pool) {
      return res.json(state);
    }

    await pool.query(
      `INSERT INTO app_state (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      ['docbook', JSON.stringify(state)]
    );
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function hasTrustedOrigin(req) {
  const origin = req.get('origin');
  if (!origin) return false;
  try {
    if (req.get('sec-fetch-site') === 'same-origin') return true;
    const originHost = new URL(origin).host;
    const directHost = req.get('host');
    const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
    return originHost === directHost || originHost === forwardedHost;
  } catch {
    return false;
  }
}

function consumeRateLimit(store, key, limit, windowMs) {
  const now = Date.now();
  const recent = (store.get(key) || []).filter((timestamp) => timestamp > now - windowMs);
  if (recent.length >= limit) {
    store.set(key, recent);
    return false;
  }
  recent.push(now);
  store.set(key, recent);
  return true;
}

export function createImgBBUploadRouter({
  env = process.env,
  providerFetch = globalThis.fetch,
  uploadLimit = 30
} = {}) {
  const router = express.Router();
  const uploadAttempts = new Map();
  const activeUploads = new Set();

  router.post('/imgbb-upload', async (req, res) => {
    if (!hasTrustedOrigin(req)) {
      return res.status(403).json({ error: 'Permintaan tidak dibenarkan.' });
    }

    if (!consumeRateLimit(uploadAttempts, req.ip, uploadLimit, 60 * 60 * 1000)) {
      res.set('Retry-After', '3600');
      return res.status(429).json({ error: 'Had upload dicapai. Cuba lagi kemudian.' });
    }

    const uploadKey = req.ip;
    if (activeUploads.has(uploadKey)) {
      return res.status(429).json({ error: 'Satu upload masih berjalan. Tunggu sebentar.' });
    }

    const apiKey = env.IMGBB_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'ImgBB belum dikonfigurasi. Tambah Secret IMGBB_API_KEY dahulu.' });
    }

    const image = typeof req.body?.image === 'string' ? req.body.image : '';
    const match = image.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,([a-zA-Z0-9+/=\s]+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Fail imej tidak sah.' });
    }

    const base64Image = match[2].replace(/\s/g, '');
    const imageSize = Math.ceil((base64Image.length * 3) / 4);
    if (imageSize > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: 'Saiz imej melebihi had 8MB.' });
    }

    activeUploads.add(uploadKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const body = new URLSearchParams({ key: apiKey, image: base64Image });
      const response = await providerFetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body,
        signal: controller.signal
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success || !result.data?.url) {
        console.error('ImgBB upload failed:', response.status, result?.error?.message || 'Unknown provider error');
        return res.status(502).json({ error: 'ImgBB gagal menerima imej. Sila cuba lagi.' });
      }

      return res.json({ url: result.data.url });
    } catch (error) {
      console.error('ImgBB request failed:', error.message);
      return res.status(502).json({
        error: error.name === 'AbortError'
          ? 'Masa menunggu ImgBB tamat. Sila cuba lagi.'
          : 'Tidak dapat menyambung ke ImgBB. Sila cuba lagi.'
      });
    } finally {
      clearTimeout(timeout);
      activeUploads.delete(uploadKey);
    }
  });

  return router;
}

app.use('/api', createImgBBUploadRouter());

app.use(express.static(path.join(__dirname, 'dist')));

export function isSpaRoute(pathname) {
  return typeof pathname === 'string' && !pathname.startsWith('/api');
}

app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

async function start() {
  await ensureDatabase();
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  start();
}
