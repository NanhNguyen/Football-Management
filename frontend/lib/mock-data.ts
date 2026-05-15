export interface CauThu {
  id: string;
  ten: string;
  doiId: string;
  soAo: number;
  viTri: string;
  banThang: number;
}

export interface DoiBong {
  id: string;
  ten: string;
  vietTat: string;
  logo: string;
  bang: string;
  cauThu?: CauThu[];
}

export const danhSachDoi: DoiBong[] = [
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
  { id: 'doi-3', ten: 'Lions KD08', vietTat: 'LI08', logo: '🦁', bang: 'A', cauThu: [] },
  { id: 'doi-4', ten: 'Sharks KD02', vietTat: 'SH02', logo: '🦈', bang: 'A', cauThu: [] },
  { id: 'doi-5', ten: 'Titans KD05', vietTat: 'T05', logo: '🛡️', bang: 'B', cauThu: [] },
  { id: 'doi-6', ten: 'Phoenix KD03', vietTat: 'P03', logo: '🔥', bang: 'B', cauThu: [] },
  { id: 'doi-7', ten: 'Dragons KD09', vietTat: 'D09', logo: '🐲', bang: 'B', cauThu: [] },
  { id: 'doi-8', ten: 'Wolves KD10', vietTat: 'W10', logo: '🐺', bang: 'B', cauThu: [] },
  { id: 'doi-9', ten: 'Sale FC', vietTat: 'SFC', logo: '🦅', bang: 'C', cauThu: [] },
  { id: 'doi-10', ten: 'Eagles KD07', vietTat: 'E07', logo: '🦅', bang: 'C', cauThu: [] },
  { id: 'doi-11', ten: 'Tigers KD11', vietTat: 'T11', logo: '🐯', bang: 'C', cauThu: [] },
  { id: 'doi-12', ten: 'Hawks KD12', vietTat: 'H12', logo: '🦅', bang: 'C', cauThu: [] },
  { id: 'doi-13', ten: 'Stars KD13', vietTat: 'S13', logo: '⭐', bang: 'D', cauThu: [] },
  { id: 'doi-14', ten: 'Comets KD14', vietTat: 'C14', logo: '☄️', bang: 'D', cauThu: [] },
  { id: 'doi-15', ten: 'Moons KD15', vietTat: 'M15', logo: '🌙', bang: 'D', cauThu: [] },
  { id: 'doi-16', ten: 'Suns KD16', vietTat: 'S16', logo: '☀️', bang: 'D', cauThu: [] },
];
