import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { parseProduct } from '../../../lib/validate';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY category ASC, name ASC');
    return NextResponse.json({ products: rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const product = parseProduct(body);

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)',
      [product.name, product.description, product.price, product.category, product.image]
    );

    return NextResponse.json({ product: { id: result.insertId, ...product } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}