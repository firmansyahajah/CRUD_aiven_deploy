'use client';

import { useMemo, useState } from 'react';
import { ImageOff, Pencil, Plus, Search } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatRupiah } from '../../lib/format';

export function MenuImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#e8e4d9] text-[var(--muted)]">
        <ImageOff size={28} aria-label="Tidak ada foto" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
  );
}

export default function MenuGrid({ onAdd, onEdit }) {
  const { products, productsLoading, productsError, loadProducts, seedProducts, addToCart, cart, notify } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [seeding, setSeeding] = useState(false);

  const categories = useMemo(() => ['Semua', ...new Set(products.map((p) => p.category))], [products]);
  const activeCategory = categories.includes(category) ? category : 'Semua';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => (activeCategory === 'Semua' || p.category === activeCategory) && (!q || p.name.toLowerCase().includes(q))
    );
  }, [products, query, activeCategory]);

  async function seed() {
    setSeeding(true);
    try {
      await seedProducts();
      notify('8 menu contoh ditambahkan.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <section aria-label="Menu" className="min-w-0">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
          <input
            type="search"
            className="input pl-10"
            placeholder="Cari menu"
            aria-label="Cari menu"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className="btn" onClick={onAdd}>
          <Plus size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Tambah menu</span>
          <span className="sr-only sm:hidden">Tambah menu</span>
        </button>
      </div>

      {categories.length > 2 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={c === activeCategory} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {productsLoading && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            <p className="sr-only">Memuat...</p>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-48" />
            ))}
          </div>
        ) : productsError ? (
          <div className="panel p-6 text-center">
            <p className="font-medium">Menu gagal dimuat</p>
            <p className="muted mt-1 text-sm">{productsError}</p>
            <button type="button" className="btn btn-primary mt-4" onClick={loadProducts}>
              Coba lagi
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="panel p-6 text-center">
            <p className="font-medium">Belum ada menu</p>
            <p className="muted mt-1 text-sm">Tambah menu sendiri, atau mulai dari 8 menu contoh.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" className="btn btn-primary" onClick={onAdd}>Tambah menu</button>
              <button type="button" className="btn" onClick={seed} disabled={seeding}>
                {seeding ? 'Memuat...' : 'Isi menu contoh'}
              </button>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <p className="muted py-10 text-center">Tidak ada menu yang cocok.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <li key={p.id} className="panel relative overflow-hidden">
                <button type="button" className="block w-full text-left hover:bg-[#f6f3ea]" onClick={() => addToCart(p)}>
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <MenuImage src={p.image} alt="" />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5">{p.name}</p>
                    <p className="num mt-1 font-semibold">{formatRupiah(p.price)}</p>
                  </div>
                </button>
                {cart[p.id] > 0 && (
                  <span className="num absolute left-2 top-2 rounded bg-[var(--accent)] px-2 py-0.5 text-sm font-semibold text-white">
                    {cart[p.id]}
                  </span>
                )}
                <button
                  type="button"
                  className="icon-btn absolute right-1 top-1 bg-[var(--surface)]/90"
                  aria-label={`Ubah ${p.name}`}
                  onClick={() => onEdit(p)}
                >
                  <Pencil size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
