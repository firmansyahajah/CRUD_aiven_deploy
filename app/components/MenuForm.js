'use client';

import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import Dialog from './Dialog';
import { MenuImage } from './MenuGrid';
import { useStore } from '../hooks/useStore';

const MAX_SIDE = 600;
const MAX_BYTES = 300 * 1024;

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Foto tidak bisa dibaca. Coba file lain.'));
    };
    img.src = url;
  });
}

const dataUrlBytes = (dataUrl) => Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

export default function MenuForm({ open, product, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title={product ? 'Ubah menu' : 'Tambah menu'}>
      {open && <FormBody key={product?.id ?? 'baru'} product={product} onClose={onClose} />}
    </Dialog>
  );
}

function FormBody({ product, onClose }) {
  const { products, saveProduct, deleteProduct, notify } = useStore();
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [image, setImage] = useState(product?.image ?? null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = [...new Set(products.map((p) => p.category))];

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.');
      return;
    }
    try {
      const dataUrl = await resizeImage(file);
      if (dataUrlBytes(dataUrl) > MAX_BYTES) {
        setError('Foto masih lebih dari 300 KB setelah diperkecil. Pilih foto lain.');
        return;
      }
      setImage(dataUrl);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const priceNum = Number(price);
    if (!name.trim()) return setError('Nama menu wajib diisi.');
    if (!category.trim()) return setError('Kategori wajib diisi.');
    if (!Number.isInteger(priceNum) || priceNum <= 0) return setError('Harga harus lebih dari 0.');

    setBusy(true);
    setError(null);
    try {
      await saveProduct({ name, category, price: priceNum, image }, product?.id);
      notify(product ? 'Menu diperbarui.' : 'Menu ditambahkan.');
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteProduct(product.id);
      notify('Menu dihapus.');
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md border border-[var(--line)]">
          <MenuImage src={image} alt="Foto menu" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="btn cursor-pointer">
            <ImagePlus size={18} aria-hidden="true" />
            {image ? 'Ganti foto' : 'Pilih foto'}
            <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
          </label>
          {image && (
            <button type="button" className="btn" onClick={() => setImage(null)}>
              Hapus foto
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="menu-name">Nama</label>
        <input id="menu-name" className="input" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="menu-category">Kategori</label>
          <input id="menu-category" className="input" list="menu-categories" value={category} maxLength={60} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="menu-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="field-label" htmlFor="menu-price">Harga (Rp)</label>
          <input id="menu-price" className="input num" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 9))} />
        </div>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="flex flex-wrap justify-between gap-2 pt-1">
        {product ? (
          confirmDelete ? (
            <div className="flex gap-2">
              <button type="button" className="btn" onClick={() => setConfirmDelete(false)} disabled={busy}>Batal</button>
              <button type="button" className="btn btn-solid-danger" onClick={remove} disabled={busy}>Ya, hapus</button>
            </div>
          ) : (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)} disabled={busy}>
              <Trash2 size={18} aria-hidden="true" /> Hapus
            </button>
          )
        ) : <span />}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}
