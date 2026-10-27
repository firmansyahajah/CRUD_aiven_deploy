'use client';

import { useMemo, useState } from 'react';
import Dialog from './Dialog';
import QrisView from './QrisView';
import { useStore } from '../hooks/useStore';
import { formatNumber, formatRupiah } from '../../lib/format';
import { buildDynamicQris } from '../../lib/qris.mjs'; // Menggunakan file .mjs kamu

// 👇 PASTE STRING QRIS ASLI KAMU DI SINI (Ganti tulisan di dalam kutip) 👇
const STATIC_QRIS = "00020101021126...PASTE_DI_SINI...6304ABCD"; 

export default function PaymentDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Pembayaran">
      {open && <PaymentBody onClose={onClose} />}
    </Dialog>
  );
}

function PaymentBody({ onClose }) {
  const { total, checkout, settings, notify } = useStore();
  const [method, setMethod] = useState('cash');
  const [received, setReceived] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const receivedNum = Number(received || 0);
  const diff = receivedNum - total;

  // Logic QRIS menggunakan file qris.mjs kamu
  const qris = useMemo(() => {
    if (!STATIC_QRIS || STATIC_QRIS.includes("PASTE_DI_SINI")) {
      return { error: 'String QRIS belum di-hardcode. Buka file PaymentDialog.js dan paste string QRIS asli.' };
    }
    
    try {
      // Coba buat QRIS dinamis (menyisipkan nominal total belanja)
      return { payload: buildDynamicQris(STATIC_QRIS, total) };
    } catch (err) {
      // Jika gagal (misal karena format QRIS salah), fallback ke QRIS statis biasa
      console.warn("Gagal membuat QRIS dinamis:", err.message);
      return { payload: STATIC_QRIS, error: 'Nominal otomatis gagal dimuat. Pembeli harus mengetik nominal manual.' };
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
          storeName={settings?.store_name || 'Toko Kasir'} 
          amount={total} 
        />
      )}

      {error && <p className="alert" role="alert">{error}</p>}

      {method === 'cash' ? (
        <button type="button" className="btn btn-primary w-full" disabled={busy || receivedNum < total} onClick={submit}>
          {busy ? 'Menyimpan...' : 'Selesai'}
        </button>
      ) : (
        <button type="button" className="btn btn-primary w-full" disabled={busy || (!qris.payload && !qris.error)} onClick={submit}>
          {busy ? 'Menyimpan...' : 'Pembayaran diterima'}
        </button>
      )}
    </div>
  );
}