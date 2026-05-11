const API_BASE = 'http://localhost:3001/api';

async function fetcher<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${endpoint}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API lỗi: ${res.status}`);
  return res.json();
}

export async function layTongQuan() {
  return fetcher<any>('tong-quan');
}

export async function layDanhSachDoi() {
  return fetcher<any[]>('doi-bong');
}

export async function layBangXepHang() {
  return fetcher<any[]>('bang-xep-hang');
}

export async function layDanhSachTranDau() {
  return fetcher<any[]>('tran-dau');
}

export async function layTranDauLive() {
  return fetcher<any[]>('tran-dau/live');
}

export async function layChiTietTranDau(id: string) {
  return fetcher<any>(`tran-dau/${id}`);
}

export async function layTopGhiBan() {
  return fetcher<any[]>('cau-thu/top-ghi-ban');
}

export async function layTopGiaoDich() {
  return fetcher<any[]>('cau-thu/top-giao-dich');
}

export async function themGiaoDich(data: {
  tranDauId: string;
  doiId: string;
  soGiaoDich: number;
  moTa?: string;
}) {
  const res = await fetch(`${API_BASE}/giao-dich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
