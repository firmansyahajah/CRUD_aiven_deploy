// Fungsi murni untuk QRIS. Ditulis sebagai .mjs agar bisa dites langsung dengan `node --test`.

export function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function parseTlv(str) {
  const fields = [];
  let i = 0;
  while (i < str.length) {
    const tag = str.slice(i, i + 2);
    const lenStr = str.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) {
      throw new Error('Format QRIS tidak valid.');
    }
    const len = Number(lenStr);
    const end = i + 4 + len;
    if (end > str.length) throw new Error('Format QRIS tidak valid.');
    fields.push({ tag, len, value: str.slice(i + 4, end), start: i, end });
    i = end;
  }
  return fields;
}

export function isValidQris(input) {
  try {
    if (typeof input !== 'string') return false;
    const s = input.trim();
    const fields = parseTlv(s);
    if (fields.length < 4 || fields[0].tag !== '00') return false;
    const last = fields[fields.length - 1];
    if (last.tag !== '63' || last.len !== 4) return false;
    return crc16(s.slice(0, last.start) + '6304') === last.value.toUpperCase();
  } catch {
    return false;
  }
}

const encode = (tag, value) => tag + String(value.length).padStart(2, '0') + value;

export function buildDynamicQris(staticQris, amount) {
  if (!Number.isInteger(amount) || amount <= 0 || amount > 9_999_999_999_999) {
    throw new Error('Nominal harus bilangan bulat lebih dari 0.');
  }
  const s = String(staticQris ?? '').trim();
  if (!isValidQris(s)) throw new Error('String QRIS statis tidak valid.');

  const fields = parseTlv(s).filter((f) => f.tag !== '63');
  if (!fields.some((f) => f.tag === '58')) throw new Error('String QRIS tidak punya tag 58 (kode negara).');

  let out = '';
  for (const f of fields) {
    if (f.tag === '54') continue; // buang nominal lama kalau ada
    if (f.tag === '58') out += encode('54', String(amount));
    out += f.tag === '01' ? encode('01', '12') : s.slice(f.start, f.end);
  }
  out += '6304';
  return out + crc16(out);
}
