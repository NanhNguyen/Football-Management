// ============================================================
// THIÊN KHÔI FOOTBALL LEAGUE — DỮ LIỆU MẪU (MOCK DATA)
// Tất cả nội dung được Việt hóa hoàn toàn.
// ============================================================

export interface DoiBong {
  id: string;
  ten: string;
  vietTat: string;
  mauSac: string;
  logo: string;
  truongPhong: string;
  soThanhVien: number;
}

export interface CauThu {
  id: string;
  ten: string;
  doiId: string;
  viTri: string;
  soAo: number;
  banThang: number;
  giaoDich: number;
  the: number;
}

export interface TranDau {
  id: string;
  doiNhaId: string;
  doiKhachId: string;
  tyDoiNha: number;
  tyDoiKhach: number;
  giaoDichDoiNha: number;
  giaoDichDoiKhach: number;
  trangThai: 'LIVE' | 'SAP_DIEN_RA' | 'KET_THUC';
  vong: string;
  ngay: string;
  gio: string;
  phut: number;
  suKien: SuKien[];
}

export interface SuKien {
  id: string;
  loai: 'BAN_THANG' | 'GIAO_DICH' | 'THE_VANG' | 'THE_DO';
  phut: number;
  cauThuId: string;
  doiId: string;
  moTa: string;
  giaTriGiaoDich?: number;
}

export interface BangXepHang {
  hang: number;
  doiId: string;
  soTran: number;
  thang: number;
  hoa: number;
  thua: number;
  banThang: number;
  banThua: number;
  hieuSo: number;
  diem: number;
  giaoDich: number;
}

export interface ThongKeTongQuan {
  tongSoDoi: number;
  giaoDichHomNay: number;
  tranDangLive: number;
  doiDanDau: string;
  countdownVongKeTiep: string;
  tongGiaoDichTuan: number;
  tyLeThang: number;
}

// ===== ĐỘI BÓNG =====
export const danhSachDoi: DoiBong[] = [
  { id: 'doi-1', ten: 'TK Warriors', vietTat: 'TKW', mauSac: '#D71920', logo: '⚔️', truongPhong: 'Trần Văn Hùng', soThanhVien: 15 },
  { id: 'doi-2', ten: 'Sale FC', vietTat: 'SFC', mauSac: '#1E40AF', logo: '🦅', truongPhong: 'Nguyễn Thị Lan', soThanhVien: 14 },
  { id: 'doi-3', ten: 'Titans KD05', vietTat: 'T05', mauSac: '#059669', logo: '🛡️', truongPhong: 'Phạm Đức Mạnh', soThanhVien: 13 },
  { id: 'doi-4', ten: 'Phoenix KD03', vietTat: 'P03', mauSac: '#D97706', logo: '🔥', truongPhong: 'Lê Minh Tuấn', soThanhVien: 14 },
  { id: 'doi-5', ten: 'Eagles KD07', vietTat: 'E07', mauSac: '#7C3AED', logo: '🦅', truongPhong: 'Hoàng Văn Nam', soThanhVien: 15 },
  { id: 'doi-6', ten: 'Sharks KD02', vietTat: 'S02', mauSac: '#0891B2', logo: '🦈', truongPhong: 'Vũ Thị Hương', soThanhVien: 13 },
  { id: 'doi-7', ten: 'Lions KD08', vietTat: 'L08', mauSac: '#BE185D', logo: '🦁', truongPhong: 'Đỗ Quang Hải', soThanhVien: 14 },
  { id: 'doi-8', ten: 'Storm KD01', vietTat: 'ST1', mauSac: '#4338CA', logo: '⛈️', truongPhong: 'Bùi Thành Long', soThanhVien: 15 },
];

// ===== CẦU THỦ =====
export const danhSachCauThu: CauThu[] = [
  { id: 'ct-1', ten: 'Nguyễn Văn A', doiId: 'doi-1', viTri: 'Tiền đạo', soAo: 9, banThang: 8, giaoDich: 12, the: 1 },
  { id: 'ct-2', ten: 'Trần Minh B', doiId: 'doi-1', viTri: 'Tiền vệ', soAo: 10, banThang: 5, giaoDich: 8, the: 0 },
  { id: 'ct-3', ten: 'Lê Hoàng C', doiId: 'doi-1', viTri: 'Hậu vệ', soAo: 4, banThang: 1, giaoDich: 3, the: 2 },
  { id: 'ct-4', ten: 'Phạm Đức D', doiId: 'doi-2', viTri: 'Tiền đạo', soAo: 7, banThang: 7, giaoDich: 10, the: 1 },
  { id: 'ct-5', ten: 'Hoàng Văn E', doiId: 'doi-2', viTri: 'Tiền vệ', soAo: 8, banThang: 4, giaoDich: 9, the: 0 },
  { id: 'ct-6', ten: 'Vũ Thị F', doiId: 'doi-3', viTri: 'Tiền đạo', soAo: 11, banThang: 6, giaoDich: 11, the: 0 },
  { id: 'ct-7', ten: 'Đỗ Quang G', doiId: 'doi-3', viTri: 'Thủ môn', soAo: 1, banThang: 0, giaoDich: 2, the: 0 },
  { id: 'ct-8', ten: 'Bùi Thành H', doiId: 'doi-4', viTri: 'Tiền đạo', soAo: 9, banThang: 9, giaoDich: 14, the: 2 },
  { id: 'ct-9', ten: 'Ngô Văn I', doiId: 'doi-5', viTri: 'Tiền vệ', soAo: 6, banThang: 3, giaoDich: 7, the: 1 },
  { id: 'ct-10', ten: 'Đinh Văn K', doiId: 'doi-6', viTri: 'Hậu vệ', soAo: 3, banThang: 2, giaoDich: 5, the: 3 },
  { id: 'ct-11', ten: 'Hồ Thiên Khôi', doiId: 'doi-1', viTri: 'Tiền đạo', soAo: 17, banThang: 10, giaoDich: 15, the: 0 },
  { id: 'ct-12', ten: 'Phan Văn L', doiId: 'doi-7', viTri: 'Tiền đạo', soAo: 9, banThang: 5, giaoDich: 6, the: 1 },
];

// ===== SỰ KIỆN =====
const suKienTran1: SuKien[] = [
  { id: 'sk-1', loai: 'BAN_THANG', phut: 12, cauThuId: 'ct-1', doiId: 'doi-1', moTa: 'Sút xa góc hẹp' },
  { id: 'sk-2', loai: 'GIAO_DICH', phut: 25, cauThuId: 'ct-11', doiId: 'doi-1', moTa: 'Chốt căn hộ A102 thành công', giaTriGiaoDich: 2500000000 },
  { id: 'sk-3', loai: 'THE_VANG', phut: 32, cauThuId: 'ct-4', doiId: 'doi-2', moTa: 'Lỗi chiến thuật' },
  { id: 'sk-4', loai: 'BAN_THANG', phut: 41, cauThuId: 'ct-4', doiId: 'doi-2', moTa: 'Đánh đầu từ quả phạt góc' },
  { id: 'sk-5', loai: 'GIAO_DICH', phut: 55, cauThuId: 'ct-2', doiId: 'doi-1', moTa: 'Chốt giao dịch VIP căn Penthouse', giaTriGiaoDich: 8000000000 },
  { id: 'sk-6', loai: 'BAN_THANG', phut: 68, cauThuId: 'ct-11', doiId: 'doi-1', moTa: 'Phá bẫy việt vị ghi bàn' },
];

const suKienTran2: SuKien[] = [
  { id: 'sk-7', loai: 'BAN_THANG', phut: 8, cauThuId: 'ct-6', doiId: 'doi-3', moTa: 'Solo qua 2 hậu vệ' },
  { id: 'sk-8', loai: 'GIAO_DICH', phut: 18, cauThuId: 'ct-8', doiId: 'doi-4', moTa: 'Chốt căn shophouse B205', giaTriGiaoDich: 5000000000 },
  { id: 'sk-9', loai: 'BAN_THANG', phut: 35, cauThuId: 'ct-8', doiId: 'doi-4', moTa: 'Volley từ ngoài vòng cấm' },
  { id: 'sk-10', loai: 'THE_VANG', phut: 60, cauThuId: 'ct-6', doiId: 'doi-3', moTa: 'Phản ứng với trọng tài' },
];

// ===== TRẬN ĐẤU =====
export const danhSachTranDau: TranDau[] = [
  {
    id: 'tran-1',
    doiNhaId: 'doi-1', doiKhachId: 'doi-2',
    tyDoiNha: 3, tyDoiKhach: 1,
    giaoDichDoiNha: 5, giaoDichDoiKhach: 2,
    trangThai: 'LIVE', vong: 'Vòng 5',
    ngay: '2024-12-15', gio: '14:00',
    phut: 72, suKien: suKienTran1,
  },
  {
    id: 'tran-2',
    doiNhaId: 'doi-3', doiKhachId: 'doi-4',
    tyDoiNha: 1, tyDoiKhach: 2,
    giaoDichDoiNha: 3, giaoDichDoiKhach: 4,
    trangThai: 'LIVE', vong: 'Vòng 5',
    ngay: '2024-12-15', gio: '14:00',
    phut: 65, suKien: suKienTran2,
  },
  {
    id: 'tran-3',
    doiNhaId: 'doi-5', doiKhachId: 'doi-6',
    tyDoiNha: 0, tyDoiKhach: 0,
    giaoDichDoiNha: 0, giaoDichDoiKhach: 0,
    trangThai: 'SAP_DIEN_RA', vong: 'Vòng 5',
    ngay: '2024-12-16', gio: '10:00',
    phut: 0, suKien: [],
  },
  {
    id: 'tran-4',
    doiNhaId: 'doi-7', doiKhachId: 'doi-8',
    tyDoiNha: 0, tyDoiKhach: 0,
    giaoDichDoiNha: 0, giaoDichDoiKhach: 0,
    trangThai: 'SAP_DIEN_RA', vong: 'Vòng 5',
    ngay: '2024-12-16', gio: '15:00',
    phut: 0, suKien: [],
  },
  {
    id: 'tran-5',
    doiNhaId: 'doi-1', doiKhachId: 'doi-3',
    tyDoiNha: 2, tyDoiKhach: 2,
    giaoDichDoiNha: 4, giaoDichDoiKhach: 3,
    trangThai: 'KET_THUC', vong: 'Vòng 4',
    ngay: '2024-12-08', gio: '14:00',
    phut: 90, suKien: [],
  },
  {
    id: 'tran-6',
    doiNhaId: 'doi-4', doiKhachId: 'doi-2',
    tyDoiNha: 3, tyDoiKhach: 1,
    giaoDichDoiNha: 6, giaoDichDoiKhach: 2,
    trangThai: 'KET_THUC', vong: 'Vòng 4',
    ngay: '2024-12-08', gio: '10:00',
    phut: 90, suKien: [],
  },
];

// ===== BẢNG XẾP HẠNG =====
export const bangXepHang: BangXepHang[] = [
  { hang: 1, doiId: 'doi-1', soTran: 5, thang: 4, hoa: 1, thua: 0, banThang: 14, banThua: 5, hieuSo: 9, diem: 13, giaoDich: 45 },
  { hang: 2, doiId: 'doi-4', soTran: 5, thang: 3, hoa: 1, thua: 1, banThang: 12, banThua: 7, hieuSo: 5, diem: 10, giaoDich: 38 },
  { hang: 3, doiId: 'doi-3', soTran: 5, thang: 3, hoa: 0, thua: 2, banThang: 10, banThua: 8, hieuSo: 2, diem: 9, giaoDich: 32 },
  { hang: 4, doiId: 'doi-2', soTran: 5, thang: 2, hoa: 2, thua: 1, banThang: 9, banThua: 6, hieuSo: 3, diem: 8, giaoDich: 28 },
  { hang: 5, doiId: 'doi-5', soTran: 4, thang: 2, hoa: 1, thua: 1, banThang: 7, banThua: 5, hieuSo: 2, diem: 7, giaoDich: 22 },
  { hang: 6, doiId: 'doi-7', soTran: 4, thang: 2, hoa: 0, thua: 2, banThang: 6, banThua: 8, hieuSo: -2, diem: 6, giaoDich: 18 },
  { hang: 7, doiId: 'doi-6', soTran: 4, thang: 1, hoa: 1, thua: 2, banThang: 5, banThua: 7, hieuSo: -2, diem: 4, giaoDich: 15 },
  { hang: 8, doiId: 'doi-8', soTran: 4, thang: 0, hoa: 0, thua: 4, banThang: 2, banThua: 12, hieuSo: -10, diem: 0, giaoDich: 8 },
];

// ===== THỐNG KÊ TỔNG QUAN =====
export const thongKeTongQuan: ThongKeTongQuan = {
  tongSoDoi: 8,
  giaoDichHomNay: 45,
  tranDangLive: 2,
  doiDanDau: 'TK Warriors',
  countdownVongKeTiep: '02:45:10',
  tongGiaoDichTuan: 187,
  tyLeThang: 78.5,
};
