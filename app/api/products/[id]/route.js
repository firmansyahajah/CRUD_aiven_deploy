import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { parseProduct, parseId } from '../../../../lib/validate';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const id = parseId(params.id);
    const body = await request.json();
    const product = parseProduct(body);

    const [result] = await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image = ? WHERE id = ?',
      [product.name, product.description, product.price, product.category, product.image, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ product: { id, ...product } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseId(params.id);
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}