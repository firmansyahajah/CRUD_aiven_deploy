'use client';

import { useMemo, useState } from 'react';
import Dialog from './Dialog';
import QrisView from './QrisView';
import { useStore } from '../hooks/useStore';
import { formatNumber, formatRupiah } from '../../lib/format';
import { buildDynamicQris } from '../../lib/qris.mjs';

// 👇 INI ADALAH QRIS DUMMY (PALSU) UNTUK LATIHAN 👇
// Uang tidak akan berpindah ke mana-mana jika ini di-scan.
const STATIC_QRIS = "00020101021126610014ID.CO.QRIS.WWW0215ID12345678901230303UMI51440014ID.CO.QRIS.WWW0215ID123456789012305204581253033605802ID5910KOPI TEST6007JAKARTA61051234563045E9C"; 

export default function PaymentDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Pembayaran">
      {open && <PaymentBody onClose={onClose} />}
    </Dialog>
  );
}

function PaymentBody({ onClose }) {
  const { total, checkout, notify } = useStore();
  const [method, setMethod] = useState('cash');
  const [received, setReceived] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const receivedNum = Number(received || 0);
  const diff = receivedNum - total;

  // Logic QRIS menggunakan file qris.mjs kamu
  const qris = useMemo(() => {
    if (!STATIC_QRIS) {
      return { error: 'String QRIS belum diatur.' };
    }
    
    try {
      // Membuat QRIS dinamis (menyisipkan nominal total belanja)
      return { payload: buildDynamicQris(STATIC_QRIS, total) };
    } catch (err) {
      console.warn("Gagal membuat QRIS dinamis:", err.message);
      // Fallback ke statis biasa
      return { payload: STATIC_QRIS, error: 'Gagal memuat nominal otomatis. Silakan ketik manual.' };
    }
  }, [total]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const tx = await checkout({ method, cashReceived: receivedNum });
      notify(
        tx.method === 'cash'
          ? `Transaksi tersimpan. Kembalian ${formatRupiah(tx.change_amount)}.`
          : 'Transaksi tersimpan.'
      );
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-baseline justify-between">
        <span className="muted">Total</span>
        <span className="num text-2xl font-semibold">{formatRupiah(total)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Metode pembayaran">
        <button type="button" className="chip" aria-pressed={method === 'cash'} onClick={() => setMethod('cash')}>Tunai</button>
        <button type="button" className="chip" aria-pressed={method === 'qris'} onClick={() => setMethod('qris')}>QRIS</button>
      </div>

      {method === 'cash' ? (
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="cash-received">Uang diterima (Rp)</label>
            <input
              id="cash-received"
              className="input num text-lg"
              inputMode="numeric"
              autoFocus
              value={received ? formatNumber(receivedNum) : ''}
              onChange={(e) => setReceived(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className="btn" onClick={() => setReceived(String(total))}>Uang pas</button>
            <button type="button" className="btn num" onClick={() => setReceived('50000')}>50.000</button>
            <button type="button" className="btn num" onClick={() => setReceived('100000')}>100.000</button>
          </div>
          {received !== '' && (
            <p className={`num text-lg font-semibold ${diff < 0 ? 'text-[var(--danger)]' : ''}`} aria-live="polite">
              {diff < 0 ? `Kurang ${formatRupiah(-diff)}` : `Kembalian ${formatRupiah(diff)}`}
            </p>
          )}
        </div>
      ) : (
        <QrisView 
          {...qris} 
          storeName="Kasir Latihan" // Nama toko di-hardcode
          amount={total} 
        />
      )}

      {error && <p className="alert" role="alert">{error}</p>}

      {method === 'cash' ? (
        <button type="button" className="btn btn-primary w-full" disabled={busy || receivedNum < total} onClick={submit}>
          {busy ? 'Menyimpan...' : 'Selesai'}
        </button>
      ) : (
        <button type="button" className="btn btn-primary w-full" disabled={busy || !qris.payload} onClick={submit}>
          {busy ? 'Menyimpan...' : 'Pembayaran diterima'}
        </button>
      )}
    </div>
  );
}