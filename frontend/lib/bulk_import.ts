import * as XLSX from 'xlsx';
import { supabase } from './supabase';

export interface ImportProgress {
  step: 'reading' | 'validating' | 'importing_teams' | 'importing_players' | 'done' | 'error';
  percent: number;
  message: string;
}

export const generateBulkImportTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Đội bóng
  const teamsData = [
    ['Tên Đội Bóng*', 'Mã Bảng Đấu', 'HLV'],
    ['FC Hà Nội', 'A', 'Chu Đình Nghiêm'],
    ['Hoàng Anh Gia Lai', 'B', 'Kiatisuk']
  ];
  const wsTeams = XLSX.utils.aoa_to_sheet(teamsData);
  // Enhance column width
  wsTeams['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsTeams, 'Đội Bóng');

  // Sheet 2: Cầu thủ đá chính
  const startersData = [
    ['Tên Đội Bóng*', 'Tên Cầu Thủ*', 'Số Áo*', 'Vị Trí'],
    ['FC Hà Nội', 'Nguyễn Văn Quyết', '10', 'Tiền đạo'],
    ['Hoàng Anh Gia Lai', 'Nguyễn Công Phượng', '10', 'Tiền đạo']
  ];
  const wsStarters = XLSX.utils.aoa_to_sheet(startersData);
  wsStarters['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsStarters, 'Cầu Thủ Đá Chính');

  // Sheet 3: Cầu thủ dự bị
  const benchData = [
    ['Tên Đội Bóng*', 'Tên Cầu Thủ*', 'Số Áo*', 'Vị Trí'],
    ['FC Hà Nội', 'Đỗ Hùng Dũng', '88', 'Tiền vệ'],
    ['Hoàng Anh Gia Lai', 'Lương Xuân Trường', '6', 'Tiền vệ']
  ];
  const wsBench = XLSX.utils.aoa_to_sheet(benchData);
  wsBench['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsBench, 'Cầu Thủ Dự Bị');

  XLSX.writeFile(wb, 'Template_Nhap_Du_Lieu_Tong_Hop.xlsx');
};

export const processBulkImport = async (
  file: File,
  giaiDauId: string,
  onProgress: (progress: ImportProgress) => void
) => {
  try {
    onProgress({ step: 'reading', percent: 10, message: 'Đang đọc file Excel...' });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (!workbook.SheetNames.includes('Đội Bóng')) {
      throw new Error('File Excel không đúng định dạng. Cần có sheet Đội Bóng.');
    }

    const rawTeams = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Đội Bóng']);
    
    // Support both the old combined 'Cầu Thủ' sheet and the new separated sheets
    const rawStarters = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Cầu Thủ Đá Chính'] || workbook.Sheets['Cầu Thủ'] || []);
    const rawBench = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Cầu Thủ Dự Bị'] || []);
    
    const rawPlayers = [
      ...rawStarters.map(p => ({ ...p, isStarter: true })),
      ...rawBench.map(p => ({ ...p, isStarter: false }))
    ];

    onProgress({ step: 'validating', percent: 30, message: 'Đang kiểm tra tính hợp lệ dữ liệu...' });

    // Validate Cross Data
    const teamNames = new Set<string>();
    const teamsToInsert: any[] = [];
    const teamMap: Record<string, any> = {};

    for (let i = 0; i < rawTeams.length; i++) {
      const row = rawTeams[i];
      const tenDoi = row['Tên Đội Bóng*']?.trim();
      if (!tenDoi) continue;

      if (teamNames.has(tenDoi)) {
        throw new Error(`Tên đội bóng "${tenDoi}" bị trùng lặp trong sheet Đội Bóng.`);
      }
      teamNames.add(tenDoi);

      const teamId = `doi-${Date.now()}-${i}`;
      teamsToInsert.push({
        id: teamId,
        ten: tenDoi,
        viet_tat: tenDoi.substring(0, 3).toUpperCase(),
        bang: row['Mã Bảng Đấu']?.trim() || 'A',
        giai_dau_id: giaiDauId,
      });
      teamMap[tenDoi] = teamId;
    }

    if (teamsToInsert.length === 0) {
      throw new Error('Không tìm thấy dữ liệu Đội bóng hợp lệ.');
    }

    const playersToInsert: any[] = [];
    for (let i = 0; i < rawPlayers.length; i++) {
      const row = rawPlayers[i];
      const tenDoi = row['Tên Đội Bóng*']?.trim();
      const tenCauThu = row['Tên Cầu Thủ*']?.trim();
      const soAo = row['Số Áo*'];
      
      if (!tenDoi || !tenCauThu || soAo === undefined) continue;

      const teamId = teamMap[tenDoi];
      if (!teamId) {
        throw new Error(`Cầu thủ "${tenCauThu}" thuộc đội "${tenDoi}" nhưng đội này không tồn tại trong sheet Đội Bóng.`);
      }

      const rawViTri = row['Vị Trí']?.trim() || 'Cầu thủ';
      const viTriFinal = row.isStarter ? rawViTri : `Dự bị - ${rawViTri}`;

      playersToInsert.push({
        id: `ct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        doi_id: teamId,
        ten: tenCauThu,
        so_ao: Number(soAo), 
        vi_tri: viTriFinal,
        ban_thang: 0
      });
    }

    onProgress({ step: 'importing_teams', percent: 50, message: `Đang lưu ${teamsToInsert.length} Đội Bóng...` });

    // Batch Insert Teams
    // Supabase REST API has a max payload limit. Usually chunks of 1000 are safe.
    const chunkSize = 1000;
    
    for (let i = 0; i < teamsToInsert.length; i += chunkSize) {
      const chunk = teamsToInsert.slice(i, i + chunkSize);
      const { error: teamErr } = await supabase.from('doi_bong').insert(chunk);
      if (teamErr) throw new Error(`Lỗi lưu đội bóng: ${teamErr.message}`);
    }

    onProgress({ step: 'importing_players', percent: 80, message: `Đang lưu ${playersToInsert.length} Cầu Thủ...` });

    // Batch Insert Players
    for (let i = 0; i < playersToInsert.length; i += chunkSize) {
      const chunk = playersToInsert.slice(i, i + chunkSize);
      const { error: playerErr } = await supabase.from('cau_thu').insert(chunk);
      if (playerErr) throw new Error(`Lỗi lưu cầu thủ: ${playerErr.message}`);
    }

    onProgress({ step: 'done', percent: 100, message: 'Hoàn tất quá trình nhập dữ liệu!' });
    
  } catch (error: any) {
    onProgress({ step: 'error', percent: 0, message: error.message || 'Lỗi không xác định.' });
    throw error;
  }
};
