export function parseId(id) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('ID tidak valid.');
  }
  return parsed;
}

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

  return { 
    name, 
    description, 
    price, 
    category, 
    image 
  };
}