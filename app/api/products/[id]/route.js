import pool from '../../../../lib/db';
import { json, badRequest, notFound, readJson, serverError } from '../../../../lib/http';
import { parseId, parseProduct } from '../../../../lib/validate';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const id = parseId((await params).id);
  if (!id) return badRequest('ID tidak valid.');
  const body = await readJson(request);
  if (!body) return badRequest('Data tidak valid.');
  const { value, error } = parseProduct(body);
  if (error) return badRequest(error);

  try {
    const [result] = await pool.query(
      'UPDATE products SET name = ?, category = ?, price = ?, image = ? WHERE id = ?',
      [value.name, value.category, value.price, value.image, id]
    );
    if (result.affectedRows === 0) return notFound('Menu tidak ditemukan.');
    return json({ product: { id, ...value } });
  } catch (err) {
    return serverError(err, 'PUT /api/products/[id]');
  }
}

export async function DELETE(_request, { params }) {
  const id = parseId((await params).id);
  if (!id) return badRequest('ID tidak valid.');
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return notFound('Menu tidak ditemukan.');
    return json({ ok: true });
  } catch (err) {
    return serverError(err, 'DELETE /api/products/[id]');
  }
}
