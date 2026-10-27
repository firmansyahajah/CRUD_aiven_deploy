// lib/validate.js

export function parseProduct(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    throw new Error('Format data tidak valid.');
  }

  const name = String(body.name || '').trim();
  if (!name) errors.push('Nama produk wajib diisi.');

  const description = String(body.description || '').trim();

  const price = Number(body.price);
  if (isNaN(price) || price < 0) errors.push('Harga harus berupa angka positif.');

  const category = String(body.category || 'Lainnya').trim() || 'Lainnya';

  const image = body.image ? String(body.image) : null;

  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }

  // Mengembalikan data yang sudah bersih dan siap masuk database
  return { 
    name, 
    description, 
    price, 
    category, 
    image 
  };
}