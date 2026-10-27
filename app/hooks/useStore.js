'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

async function api(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw Object.assign(new Error('Tidak bisa terhubung ke server. Periksa koneksi internet.'), { status: 0 });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(data?.error || 'Terjadi kesalahan. Coba lagi.'), { status: res.status, data });
  }
  return data;
}

const StoreContext = createContext(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore harus dipakai di dalam StoreProvider.');
  return ctx;
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [settings, setSettings] = useState({ store_name: '', qris_static: '' });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  const [cart, setCart] = useState({}); // { [productId]: qty }
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message, type = 'info') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  /* ---------- Menu ---------- */
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await api('/api/products');
      setProducts(data.products);
      const ids = new Set(data.products.map((p) => String(p.id)));
      const gone = Object.keys(cartRef.current).filter((id) => !ids.has(id));
      if (gone.length > 0) {
        setCart((c) => Object.fromEntries(Object.entries(c).filter(([id]) => ids.has(id))));
        notify('Sebagian menu sudah tidak tersedia dan dihapus dari pesanan.', 'error');
      }
    } catch (err) {
      setProductsError(err.message);
    } finally {
      setProductsLoading(false);
    }
  }, [notify]);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const data = await api('/api/settings');
      setSettings(data.settings);
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadSettings();
  }, [loadProducts, loadSettings]);

  const saveProduct = useCallback(async (data, id) => {
    const res = await api(id ? `/api/products/${id}` : '/api/products', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
    setProducts((list) => {
      const next = id ? list.map((p) => (p.id === id ? res.product : p)) : [...list, res.product];
      return next.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    });
    return res.product;
  }, []);

  const deleteProduct = useCallback(
    async (id) => {
      await api(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((list) => list.filter((p) => p.id !== id));
      if (cartRef.current[id]) {
        setCart((c) => {
          const { [id]: _removed, ...rest } = c;
          return rest;
        });
        notify('Menu dihapus dan dikeluarkan dari pesanan.');
      }
    },
    [notify]
  );

  /* ---------- Keranjang ---------- */
  const addToCart = useCallback(
    (product) => {
      if (!(product.price > 0)) {
        notify('Harga menu ini belum valid. Ubah dulu harganya.', 'error');
        return;
      }
      setCart((c) => ({ ...c, [product.id]: Math.min((c[product.id] || 0) + 1, 99) }));
    },
    [notify]
  );

  const changeQty = useCallback((id, delta) => {
    setCart((c) => {
      const next = (c[id] || 0) + delta;
      if (next <= 0) {
        const { [id]: _removed, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: Math.min(next, 99) };
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((c) => {
      const { [id]: _removed, ...rest } = c;
      return rest;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const cartLines = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = byId.get(id);
        return product ? { product, qty, subtotal: product.price * qty } : null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const total = useMemo(() => cartLines.reduce((sum, l) => sum + l.subtotal, 0), [cartLines]);
  const count = useMemo(() => cartLines.reduce((sum, l) => sum + l.qty, 0), [cartLines]);

  /* ---------- Transaksi ---------- */
  const checkout = useCallback(
    async ({ method, cashReceived }) => {
      try {
        const res = await api('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            method,
            expected_total: total,
            cash_received: method === 'cash' ? cashReceived : undefined,
            items: cartLines.map((l) => ({ product_id: l.product.id, qty: l.qty })),
          }),
        });
        setCart({}); // hanya dikosongkan kalau POST berhasil
        return res.transaction;
      } catch (err) {
        if (err.data?.code === 'PRODUCT_MISSING' || err.data?.code === 'TOTAL_MISMATCH') loadProducts();
        throw err;
      }
    },
    [cartLines, total, loadProducts]
  );

  const fetchTransactions = useCallback(async (date) => {
    const data = await api(`/api/transactions?date=${encodeURIComponent(date)}`);
    return data.transactions;
  }, []);

  /* ---------- Pengaturan ---------- */
  const saveSettings = useCallback(async (patch) => {
    const data = await api('/api/settings', { method: 'PUT', body: JSON.stringify(patch) });
    setSettings(data.settings);
    return data.settings;
  }, []);

  const value = {
    products, productsLoading, productsError, loadProducts, saveProduct, deleteProduct,
    cart, cartLines, total, count, addToCart, changeQty, removeFromCart, clearCart,
    checkout, fetchTransactions,
    settings, settingsLoading, settingsError, loadSettings, saveSettings,
    notify,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      {toast && (
        <div role="status" className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.message}
        </div>
      )}
    </StoreContext.Provider>
  );
}