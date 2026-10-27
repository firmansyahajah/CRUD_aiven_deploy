import pool from '../../../lib/db';
import { json, badRequest, readJson, serverError } from '../../../lib/http';
import { todayWIB } from '../../../lib/format';

export const dynamic = 'force-dynamic';

function dayRange(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const start = new Date(`${date}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime())) return null;
  return [start, new Date(start.getTime() + 24 * 60 * 60 * 1000)];
}

export async function GET(request) {
  const date = new URL(request.url).searchParams.get('date') || todayWIB();
  const range = dayRange(date);
  if (!range) return badRequest('Tanggal tidak valid. Gunakan format YYYY-MM-DD.');

  try {
    const [rows] = await pool.query(
      `SELECT id, created_at, total, method, cash_received, change_amount
       FROM transactions WHERE created_at >= ? AND created_at < ?
       ORDER BY created_at DESC, id DESC`,
      range
    );
    const byId = new Map(rows.map((r) => [r.id, { ...r, items: [] }]));
    if (rows.length > 0) {
      const [items] = await pool.query(
        'SELECT transaction_id, name, price, qty FROM transaction_items WHERE transaction_id IN (?) ORDER BY id',
        [rows.map((r) => r.id)]
      );
      for (const it of items) {
        byId.get(it.transaction_id)?.items.push({ name: it.name, price: it.price, qty: it.qty });
      }
    }
    return json({ date, transactions: [...byId.values()] });
  } catch (err) {
    return serverError(err, 'GET /api/transactions');
  }
}

function normalizeItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100) return null;
  const merged = new Map();
  for (const it of raw) {
    const id = Number(it?.product_id);
    const qty = Number(it?.qty);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty <= 0 || qty > 999) return null;
    merged.set(id, (merged.get(id) || 0) + qty);
  }
  return [...merged].map(([product_id, qty]) => ({ product_id, qty }));
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest('Data tidak valid.');
  const { method } = body;
  if (method !== 'cash' && method !== 'qris') return badRequest('Metode pembayaran tidak valid.');
  const items = normalizeItems(body.items);
  if (!items) return badRequest('Keranjang kosong atau tidak valid.');

  try {
    const [products] = await pool.query('SELECT id, name, price FROM products WHERE id IN (?)', [
      items.map((i) => i.product_id),
    ]);
    const byId = new Map(products.map((p) => [p.id, p]));
    const missing = items.filter((i) => !byId.has(i.product_id)).map((i) => i.product_id);
    if (missing.length > 0) {
      return json({ error: 'Sebagian menu sudah tidak tersedia.', code: 'PRODUCT_MISSING', ids: missing }, 409);
    }

    const lines = items.map((i) => {
      const p = byId.get(i.product_id);
      return { product_id: p.id, name: p.name, price: Math.round(Number(p.price)), qty: i.qty };
    });
    if (lines.some((l) => l.price <= 0)) return badRequest('Ada menu dengan harga tidak valid.');

    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    if (body.expected_total !== undefined && Number(body.expected_total) !== total) {
      return json({ error: 'Harga menu berubah. Periksa pesanan lalu coba lagi.', code: 'TOTAL_MISMATCH' }, 409);
    }

    let cashReceived = null;
    let change = null;
    if (method === 'cash') {
      cashReceived = Number(body.cash_received);
      if (!Number.isInteger(cashReceived) || cashReceived < total || cashReceived > 1_000_000_000) {
        return badRequest('Uang diterima kurang dari total.');
      }
      change = cashReceived - total;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        'INSERT INTO transactions (created_at, total, method, cash_received, change_amount) VALUES (UTC_TIMESTAMP(), ?, ?, ?, ?)',
        [total, method, cashReceived, change]
      );
      await conn.query('INSERT INTO transaction_items (transaction_id, product_id, name, price, qty) VALUES ?', [
        lines.map((l) => [result.insertId, l.product_id, l.name, l.price, l.qty]),
      ]);
      await conn.commit();
      return json(
        {
          transaction: {
            id: result.insertId,
            created_at: new Date().toISOString(),
            total,
            method,
            cash_received: cashReceived,
            change_amount: change,
            items: lines.map(({ name, price, qty }) => ({ name, price, qty })),
          },
        },
        201
      );
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return serverError(err, 'POST /api/transactions');
  }
}
