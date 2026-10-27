'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Dialog from './Dialog';
import { useStore } from '../hooks/useStore';
import { formatRupiah } from '../../lib/format';

export default function Cart({ onPay, embedded = false }) {
  const { cartLines, total, count, changeQty, removeFromCart, clearCart } = useStore();

  return (
    <section aria-label="Pesanan" className={embedded ? '' : 'panel'}>
      <div className={`flex items-center justify-between py-1 pl-4 pr-2 ${embedded ? 'justify-end' : 'border-b border-[var(--line)]'}`}>
        {!embedded && <h2 className="font-semibold">Pesanan</h2>}
        {count > 0 && (
          <button type="button" className="btn border-transparent bg-transparent text-sm" onClick={clearCart}>
            Kosongkan
          </button>
        )}
      </div>

      {cartLines.length === 0 ? (
        <p className="muted px-4 py-10 text-center text-sm">Belum ada pesanan. Pilih menu untuk menambahkan.</p>
      ) : (
        <ul className="rows max-h-[50vh] overflow-y-auto">
          {cartLines.map(({ product, qty, subtotal }) => (
            <li key={product.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="muted num text-sm">{formatRupiah(product.price)}</p>
                </div>
                <p className="num font-semibold">{formatRupiah(subtotal)}</p>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center">
                  <button type="button" className="icon-btn" aria-label={`Kurangi ${product.name}`} onClick={() => changeQty(product.id, -1)}>
                    <Minus size={18} />
                  </button>
                  <span className="num w-8 text-center font-medium" aria-live="polite">{qty}</span>
                  <button type="button" className="icon-btn" aria-label={`Tambah ${product.name}`} onClick={() => changeQty(product.id, 1)}>
                    <Plus size={18} />
                  </button>
                </div>
                <button type="button" className="icon-btn text-[var(--danger)]" aria-label={`Hapus ${product.name}`} onClick={() => removeFromCart(product.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-[var(--line)] p-4">
        <div className="flex items-baseline justify-between">
          <span className="muted">Total</span>
          <span className="num text-xl font-semibold">{formatRupiah(total)}</span>
        </div>
        <button type="button" className="btn btn-primary w-full" disabled={count === 0} onClick={onPay}>
          Bayar
        </button>
      </div>
    </section>
  );
}

// Layar kecil: bar di bawah yang membuka keranjang sebagai bottom sheet.
export function CartBar({ onPay }) {
  const { count, total } = useStore();
  const [open, setOpen] = useState(false);
  if (count === 0 && !open) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--surface)] p-3 lg:hidden">
        <button type="button" className="btn btn-primary w-full justify-between" onClick={() => setOpen(true)}>
          <span className="flex items-center gap-2">
            <ShoppingBag size={18} aria-hidden="true" /> {count} item
          </span>
          <span className="num">{formatRupiah(total)}</span>
        </button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Pesanan">
        <Cart
          embedded
          onPay={() => {
            setOpen(false);
            onPay();
          }}
        />
      </Dialog>
    </>
  );
}
