export interface DoiBong {
  id: string;
  ten: string;
  vietTat: string;
  logo: string;
  bang: string; // A, B, C, D
  cauThu?: CauThu[];
}

export interface CauThu {
  id: string;
  ten: string;
  doiId: string;
  soAo: number;
  viTri: string;
  banThang: number;
}

export interface SuKien {
  id: string;
  loai: 'BAN_THANG' | 'THE_VANG' | 'THE_DO' | 'THAY_NGUOI';
  phut: number;
  cauThuId: string;
  doiId: string;
  moTa: string;
}

export interface TranDau {
  id: string;
  doiNhaId: string;
  doiKhachId: string;
  tyDoiNha: number;
  tyDoiKhach: number;
  trangThai: 'DANG_DIEN_RA' | 'SAP_DIEN_RA' | 'KET_THUC';
  vong: string; // Vòng bảng, Vòng 1/8, Tứ kết, Bán kết, Chung kết
  ngay: string;
  gio: string;
  phut?: number;
  suKien: SuKien[];
}

export interface BangXepHangItem {
  doiId: string;
  bang: string;
  soTran: number;
  thang: number;
  hoa: number;
  thua: number;
  banThang: number;
  banThua: number;
  diem: number;
}

// ===== 16 ĐỘI BÓNG (4 BẢNG) =====
export const danhSachDoi: DoiBong[] = [
  // Bảng A
  { 
    id: 'doi-1', ten: 'TK Warriors', vietTat: 'TKW', logo: '⚔️', bang: 'A',
    cauThu: [
      { id: 'ct-1', ten: 'Nguyễn Văn Hùng', soAo: 10, viTri: 'Tiền đạo', doiId: 'doi-1', banThang: 0 },
      { id: 'ct-2', ten: 'Trần Minh Tuấn', soAo: 7, viTri: 'Tiền vệ', doiId: 'doi-1', banThang: 0 },
      { id: 'ct-3', ten: 'Lê Hoàng Anh', soAo: 4, viTri: 'Hậu vệ', doiId: 'doi-1', banThang: 0 },
    ]
  },
  { 
    id: 'doi-2', ten: 'Storm KD01', vietTat: 'ST01', logo: '⛈️', bang: 'A',
    cauThu: [
      { id: 'ct-4', ten: 'Phạm Đức Duy', soAo: 9, viTri: 'Tiền đạo', doiId: 'doi-2', banThang: 0 },
      { id: 'ct-5', ten: 'Vũ Hải Long', soAo: 8, viTri: 'Tiền vệ', doiId: 'doi-2', banThang: 0 },
    ]
  },
  { id: 'doi-3', ten: 'Lions KD08', vietTat: 'LI08', logo: '🦁', bang: 'A' },
  { id: 'doi-4', ten: 'Sharks KD02', vietTat: 'SH02', logo: '🦈', bang: 'A' },
  // Bảng B
  { id: 'doi-5', ten: 'Titans KD05', vietTat: 'TI05', logo: '🛡️', bang: 'B' },
  { id: 'doi-6', ten: 'Phoenix KD03', vietTat: 'PH03', logo: '🔥', bang: 'B' },
  { id: 'doi-7', ten: 'Dragons KD09', vietTat: 'DR09', logo: '🐲', bang: 'B' },
  { id: 'doi-8', ten: 'Wolves KD10', vietTat: 'WO10', logo: '🐺', bang: 'B' },
  // Bảng C
  { id: 'doi-9', ten: 'Sale FC', vietTat: 'SFC', logo: '🦅', bang: 'C' },
  { id: 'doi-10', ten: 'Eagles KD07', vietTat: 'EA07', logo: '🦅', bang: 'C' },
  { id: 'doi-11', ten: 'Tigers KD11', vietTat: 'TI11', logo: '🐯', bang: 'C' },
  { id: 'doi-12', ten: 'Hawks KD12', vietTat: 'HA12', logo: '🦅', bang: 'C' },
  // Bảng D
  { id: 'doi-13', ten: 'Stars KD13', vietTat: 'ST13', logo: '⭐', bang: 'D' },
  { id: 'doi-14', ten: 'Comets KD14', vietTat: 'CO14', logo: '☄️', bang: 'D' },
  { id: 'doi-15', ten: 'Moons KD15', vietTat: 'MO15', logo: '🌙', bang: 'D' },
  { id: 'doi-16', ten: 'Suns KD16', vietTat: 'SU16', logo: '☀️', bang: 'D' },
];

export const danhSachCauThu: CauThu[] = [
  { id: 'ct-1', ten: 'Nguyễn Văn A', doiId: 'doi-1', soAo: 10, viTri: 'Tiền đạo', banThang: 5 },
  { id: 'ct-2', ten: 'Trần Minh B', doiId: 'doi-1', soAo: 7, viTri: 'Tiền vệ', banThang: 3 },
  { id: 'ct-6', ten: 'Hồ Thiên Khôi', doiId: 'doi-6', soAo: 9, viTri: 'Tiền đạo', banThang: 8 },
];

export const danhSachTranDau: TranDau[] = [
  // Bảng A
  { id: 'tran-1', doiNhaId: 'doi-1', doiKhachId: 'doi-2', tyDoiNha: 3, tyDoiKhach: 1, trangThai: 'KET_THUC', vong: 'Vòng bảng', ngay: '2024-12-01', gio: '14:00', suKien: [] },
  { id: 'tran-2', doiNhaId: 'doi-3', doiKhachId: 'doi-4', tyDoiNha: 0, tyDoiKhach: 0, trangThai: 'KET_THUC', vong: 'Vòng bảng', ngay: '2024-12-01', gio: '16:00', suKien: [] },
  // Bảng B
  { id: 'tran-3', doiNhaId: 'doi-5', doiKhachId: 'doi-6', tyDoiNha: 1, tyDoiKhach: 2, trangThai: 'KET_THUC', vong: 'Vòng bảng', ngay: '2024-12-02', gio: '14:00', suKien: [] },
  // Bảng C
  { id: 'tran-4', doiNhaId: 'doi-9', doiKhachId: 'doi-10', tyDoiNha: 2, tyDoiKhach: 2, trangThai: 'KET_THUC', vong: 'Vòng bảng', ngay: '2024-12-03', gio: '14:00', suKien: [] },
  // Trận LIVE
  { id: 'tran-live', doiNhaId: 'doi-1', doiKhachId: 'doi-3', tyDoiNha: 1, tyDoiKhach: 0, trangThai: 'DANG_DIEN_RA', vong: 'Vòng bảng', ngay: '2024-12-10', gio: '15:00', phut: 45, suKien: [] },
];

export const bangXepHang: BangXepHangItem[] = danhSachDoi.map(doi => ({
  doiId: doi.id,
  bang: doi.bang,
  soTran: 3,
  thang: doi.id === 'doi-1' ? 2 : 1,
  hoa: 1,
  thua: 0,
  banThang: 5,
  banThua: 2,
  diem: doi.id === 'doi-1' ? 7 : 4,
}));

export const thongKeTongQuan = {
  tongSoDoi: 16,
  tongSoTran: 32,
  tranDangLive: 1,
  doiDanDau: 'TK Warriors',
  tongBanThang: 84,
};
