import pool from '../../../lib/db';
import { json, badRequest, readJson, serverError } from '../../../lib/http';
import { isValidQris } from '../../../lib/qris.mjs';

export const dynamic = 'force-dynamic';

async function readSettings() {
  const [rows] = await pool.query('SELECT `key`, `value` FROM settings WHERE `key` IN (?, ?)', [
    'store_name',
    'qris_static',
  ]);
  const out = { store_name: '', qris_static: '' };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function GET() {
  try {
    return json({ settings: await readSettings() });
  } catch (err) {
    return serverError(err, 'GET /api/settings');
  }
}

export async function PUT(request) {
  const body = await readJson(request);
  if (!body) return badRequest('Data tidak valid.');

  const updates = [];
  if (body.store_name !== undefined) {
    const name = String(body.store_name).trim();
    if (name.length > 100) return badRequest('Nama toko maksimal 100 karakter.');
    updates.push(['store_name', name]);
  }
  if (body.qris_static !== undefined) {
    const qris = String(body.qris_static).trim();
    if (qris && !isValidQris(qris)) {
      return badRequest('String QRIS tidak valid. Periksa apakah tertempel utuh (CRC tidak cocok).');
    }
    updates.push(['qris_static', qris]);
  }
  if (updates.length === 0) return badRequest('Tidak ada data yang diubah.');

  try {
    for (const [key, value] of updates) {
      await pool.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, value]
      );
    }
    return json({ settings: await readSettings() });
  } catch (err) {
    return serverError(err, 'PUT /api/settings');
  }
}
