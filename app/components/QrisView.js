'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '../../lib/format';

// Tampilan saja. Payload dihitung di PaymentDialog lewat buildDynamicQris.
export default function QrisView({ payload, error, loading, storeName, amount }) {
  if (loading) return <p className="muted py-10 text-center">Memuat...</p>;

  if (error) {
    return (
      <div className="alert" role="alert">
        <p>{error}</p>
        <Link href="/pengaturan" className="mt-1 inline-block font-medium underline">
          Buka Pengaturan
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-center">
        <p className="font-medium">{storeName || 'Toko'}</p>
        <p className="num text-2xl font-semibold">{formatRupiah(amount)}</p>
      </div>
      <div className="rounded-md border border-[var(--line)] bg-white p-4">
        <QRCodeSVG value={payload} size={240} level="M" />
      </div>
      <p className="muted text-center text-sm">Minta pembeli memindai QR ini, lalu pastikan notifikasi pembayaran sudah masuk.</p>
    </div>
  );
}
