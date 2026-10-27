import { NextResponse } from 'next/server';

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const badRequest = (error, extra = {}) => NextResponse.json({ error, ...extra }, { status: 400 });
export const notFound = (error = 'Data tidak ditemukan.') => NextResponse.json({ error }, { status: 404 });

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const UNREACHABLE = new Set([
  'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET',
  'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR',
]);

// Detail error hanya ke log server, klien cukup pesan umum.
export function serverError(err, context) {
  console.log(`[${context}]`, err);
  if (UNREACHABLE.has(err?.code)) {
    return NextResponse.json({ error: 'Database tidak dapat dihubungi. Coba lagi sebentar.' }, { status: 503 });
  }
  return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
}
