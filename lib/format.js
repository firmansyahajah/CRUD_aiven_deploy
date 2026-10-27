const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const plain = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export const formatRupiah = (n) => rupiah.format(Number(n) || 0).replace(/\u00a0/g, ' ');
export const formatNumber = (n) => plain.format(Number(n) || 0);

// Tanggal "hari ini" menurut Asia/Jakarta, format YYYY-MM-DD.
export function todayWIB() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

const timeFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const stampFmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatTime = (iso) => timeFmt.format(new Date(iso)).replace('.', ':');
export const formatStamp = (iso) => stampFmt.format(new Date(iso));
