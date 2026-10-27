'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatRupiah, formatStamp, formatTime, todayWIB } from '../../lib/format';

const itemsText = (items) => items.map((i) => `${i.qty}x ${i.name}`).join(', ');
const csvText = (s) => `"${String(s).replace(/"/g, '""')}"`;

function exportCsv(transactions, date) {
  const header = ['Waktu', 'Metode', 'Item', 'Total', 'Diterima', 'Kembalian'];
  const rows = transactions.map((t) => [
    csvText(formatStamp(t.created_at)),
    t.method === 'cash' ? 'Tunai' : 'QRIS',
    csvText(itemsText(t.items)),
    t.total,
    t.cash_received ?? '',
    t.change_amount ?? '',
  ]);
  const csv = '\uFEFF' + [header, ...rows].map((r) => r.join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `riwayat-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function History() {
  const { fetchTransactions } = useStore();
  const [date, setDate] = useState(todayWIB);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTransactions(await fetchTransactions(date));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, date]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const s = { count: transactions.length, revenue: 0, cash: 0, cashCount: 0, qris: 0, qrisCount: 0 };
    for (const t of transactions) {
      s.revenue += t.total;
      if (t.method === 'cash') { s.cash += t.total; s.cashCount++; }
      else { s.qris += t.total; s.qrisCount++; }
    }
    return s;
  }, [transactions]);

  const stats = [
    { label: 'Transaksi', value: summary.count },
    { label: 'Omzet', value: formatRupiah(summary.revenue) },
    { label: `Tunai (${summary.cashCount})`, value: formatRupiah(summary.cash) },
    { label: `QRIS (${summary.qrisCount})`, value: formatRupiah(summary.qris) },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="field-label" htmlFor="history-date">Tanggal</label>
          <input id="history-date" type="date" className="input num w-auto" value={date} max={todayWIB()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <button type="button" className="btn" disabled={loading || transactions.length === 0} onClick={() => exportCsv(transactions, date)}>
          <Download size={18} aria-hidden="true" /> Ekspor CSV
        </button>
      </div>

      <dl className="panel grid grid-cols-2 gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[var(--surface)] p-4">
            <dt className="muted text-sm">{s.label}</dt>
            <dd className="num mt-1 text-lg font-semibold">{loading ? '–' : s.value}</dd>
          </div>
        ))}
      </dl>

      {loading ? (
        <p className="muted py-10 text-center">Memuat...</p>
      ) : error ? (
        <div className="panel p-6 text-center">
          <p className="font-medium">Riwayat gagal dimuat</p>
          <p className="muted mt-1 text-sm">{error}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={load}>Coba lagi</button>
        </div>
      ) : transactions.length === 0 ? (
        <p className="muted panel py-10 text-center">Belum ada transaksi pada tanggal ini.</p>
      ) : (
        <ul className="panel rows">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="muted num text-sm">{formatTime(t.created_at)} · #{t.id}</p>
                <p className="mt-0.5">{itemsText(t.items)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="num font-semibold">{formatRupiah(t.total)}</p>
                <p className="muted num text-sm">
                  {t.method === 'cash'
                    ? `Tunai, diterima ${formatRupiah(t.cash_received)}, kembali ${formatRupiah(t.change_amount)}`
                    : 'QRIS'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
