import pool from '../../../lib/db';
import { json, badRequest, readJson, serverError } from '../../../lib/http';
import { parseProduct } from '../../../lib/validate';

export const dynamic = 'force-dynamic';

const toProduct = (r) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  price: Math.round(Number(r.price)),
  image: r.image,
});

async function listProducts(db) {
  const [rows] = await db.query('SELECT id, name, category, price, image FROM products ORDER BY category, name');
  return rows.map(toProduct);
}

export async function GET() {
  try {
    return json({ products: await listProducts(pool) });
  } catch (err) {
    return serverError(err, 'GET /api/products');
  }
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest('Data tidak valid.');

  try {
    // Array = isi menu contoh, hanya boleh kalau tabel masih kosong.
    if (Array.isArray(body)) {
      if (body.length === 0 || body.length > 50) return badRequest('Jumlah menu tidak valid.');
      const parsed = body.map(parseProduct);
      const bad = parsed.find((p) => p.error);
      if (bad) return badRequest(bad.error);

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM products FOR UPDATE');
        if (n > 0) {
          await conn.rollback();
          return json({ error: 'Menu sudah ada.' }, 409);
        }
        const rows = parsed.map(({ value: v }) => [v.name, '', v.category, v.price, v.image]);
        await conn.query('INSERT INTO products (name, description, category, price, image) VALUES ?', [rows]);
        await conn.commit();
        return json({ products: await listProducts(conn) }, 201);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    const { value, error } = parseProduct(body);
    if (error) return badRequest(error);
    const [result] = await pool.query(
      'INSERT INTO products (name, description, category, price, image) VALUES (?, ?, ?, ?, ?)',
      [value.name, '', value.category, value.price, value.image]
    );
    return json({ product: { id: result.insertId, ...value } }, 201);
  } catch (err) {
    return serverError(err, 'POST /api/products');
  }
}
