'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { isValidQris } from '../../lib/qris.mjs';

export default function Settings() {
  const { settings, settingsLoading, settingsError, loadSettings, saveSettings, notify } = useStore();
  const [storeName, setStoreName] = useState('');
  const [qris, setQris] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStoreName(settings.store_name);
    setQris(settings.qris_static);
  }, [settings]);

  async function submit(e) {
    e.preventDefault();
    const cleaned = qris.replace(/\s+/g, '');
    if (cleaned && !isValidQris(cleaned)) {
      setError('String QRIS tidak valid. Periksa apakah tertempel utuh (CRC tidak cocok).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveSettings({ store_name: storeName, qris_static: cleaned });
      notify('Pengaturan disimpan.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (settingsLoading) return <p className="muted py-10 text-center">Memuat...</p>;

  if (settingsError) {
    return (
      <div className="mx-auto mt-6 max-w-xl px-4">
        <div className="panel p-6 text-center">
          <p className="font-medium">Pengaturan gagal dimuat</p>
          <p className="muted mt-1 text-sm">{settingsError}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={loadSettings}>Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-5 px-4 py-4">
      <div>
        <label className="field-label" htmlFor="store-name">Nama toko</label>
        <input id="store-name" className="input" maxLength={100} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        <p className="muted mt-1 text-sm">Tampil di bagian atas dan di atas QR saat pembayaran QRIS.</p>
      </div>

      <div>
        <label className="field-label" htmlFor="qris-static">String QRIS statis</label>
        <textarea
          id="qris-static"
          className="input font-mono text-xs"
          rows={6}
          spellCheck={false}
          autoComplete="off"
          value={qris}
          onChange={(e) => setQris(e.target.value)}
          placeholder="00020101021126..."
        />
        <p className="muted mt-1 text-sm">
          Pindai QRIS toko dengan pembaca QR biasa, lalu tempel teks hasilnya di sini. Diawali 000201 dan diakhiri 4 karakter CRC.
          Kosongkan untuk menghapus.
        </p>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  );
}
