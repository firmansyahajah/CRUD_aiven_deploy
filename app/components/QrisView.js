'use client';

import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '../../lib/format';

export default function QrisView({ payload, error, loading, storeName, amount }) {
  if (loading) return <p className="muted py-10 text-center">Memuat...</p>;

  if (!payload) {
    return (
      <div className="alert" role="alert">
        <p>{error || 'Gagal memuat QR Code.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-center">
        <p className="font-medium">{storeName || 'Toko'}</p>
        <p className="num text-2xl font-semibold">{formatRupiah(amount)}</p>
      </div>
      
      {error && <p className="text-xs text-[var(--danger)] text-center">{error}</p>}

      <div className="rounded-md border border-[var(--line)] bg-white p-4">
        <QRCodeSVG value={payload} size={240} level="M" />
      </div>
      <p className="muted text-center text-sm">Minta pembeli memindai QR ini.</p>
    </div>
  );
}