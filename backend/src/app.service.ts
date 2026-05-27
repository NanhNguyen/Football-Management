import { Injectable } from '@nestjs/common';
import {
  danhSachDoi,
  danhSachCauThu,
  danhSachTranDau,
  bangXepHang,
  thongKeTongQuan,
  DoiBong,
  TranDau,
} from './data/mock-data';

@Injectable()
export class AppService {
  // ===== TỔNG QUAN =====
  layTongQuan() {
    return {
      ...thongKeTongQuan,
      tranLive: this.layTranDauLive(),
      top3Doi: this.layBangXepHang().slice(0, 3).map((bxh) => ({
        ...bxh,
        doi: danhSachDoi.find((d) => d.id === bxh.doiId),
      })),
    };
  }

  // ===== ĐỘI BÓNG =====
  layDanhSachDoi(): DoiBong[] {
    return danhSachDoi;
  }

  layDoiBong(id: string) {
    const doi = danhSachDoi.find((d) => d.id === id);
    if (!doi) return { error: 'Không tìm thấy đội bóng' };
    const cauThu = danhSachCauThu.filter((ct) => ct.doiId === id);
    const xepHang = bangXepHang.find((bxh) => bxh.doiId === id);
    return { doi, cauThu, xepHang };
  }

  // ===== CẦU THỦ =====
  layDanhSachCauThu() {
    return danhSachCauThu.map((ct) => ({
      ...ct,
      doi: danhSachDoi.find((d) => d.id === ct.doiId),
    }));
  }

  layTopGhiBan() {
    return [...danhSachCauThu]
      .sort((a, b) => b.banThang - a.banThang)
      .slice(0, 5)
      .map((ct) => ({
        ...ct,
        doi: danhSachDoi.find((d) => d.id === ct.doiId),
      }));
  }


  // ===== TRẬN ĐẤU =====
  private enrichTranDau(tran: TranDau) {
    return {
      ...tran,
      doiNha: danhSachDoi.find((d) => d.id === tran.doiNhaId),
      doiKhach: danhSachDoi.find((d) => d.id === tran.doiKhachId),
      suKien: tran.suKien.map((sk) => ({
        ...sk,
        cauThu: danhSachCauThu.find((ct) => ct.id === sk.cauThuId),
        doi: danhSachDoi.find((d) => d.id === sk.doiId),
      })),
    };
  }

  layDanhSachTranDau() {
    return danhSachTranDau.map((t) => this.enrichTranDau(t));
  }

  layTranDauLive() {
    return danhSachTranDau
      .filter((t) => t.trangThai === 'DANG_DIEN_RA')
      .map((t) => this.enrichTranDau(t));
  }

  layChiTietTranDau(id: string) {
    const tran = danhSachTranDau.find((t) => t.id === id);
    if (!tran) return { error: 'Không tìm thấy trận đấu' };
    return this.enrichTranDau(tran);
  }

  layDanhSachCauThuTrongTran(id: string) {
    const tran = danhSachTranDau.find((t) => t.id === id);
    if (!tran) return { error: 'Không tìm thấy trận đấu' };
    
    const doiNha = danhSachDoi.find((d) => d.id === tran.doiNhaId);
    const doiKhach = danhSachDoi.find((d) => d.id === tran.doiKhachId);
    
    const parseRoster = (team: any) => {
      if (!team) return { starting_lineup: [], substitutes: [] };
      const teamPlayers = team.cauThu || [];
      
      const starting_lineup = teamPlayers.filter((p: any) => !p.viTri?.startsWith('Dự bị'));
      const substitutes = teamPlayers.filter((p: any) => p.viTri?.startsWith('Dự bị'));
      
      return { starting_lineup, substitutes };
    };

    return {
      tranId: id,
      doiNha: parseRoster(doiNha),
      doiKhach: parseRoster(doiKhach)
    };
  }

  // ===== BẢNG XẾP HẠNG =====
  layBangXepHang() {
    return bangXepHang.map((bxh) => ({
      ...bxh,
      doi: danhSachDoi.find((d) => d.id === bxh.doiId),
    }));
  }

  // ===== PUBLIC API =====
  layChiTietDoiBongPublic(id: string) {
    const doi = danhSachDoi.find((d) => d.id === id);
    if (!doi) return { error: 'Không tìm thấy đội bóng' };

    const cauThu = danhSachCauThu.filter((ct) => ct.doiId === id);
    const thongKe = bangXepHang.find((bxh) => bxh.doiId === id);

    // Lịch sử thi đấu của đội
    const lichSuTranDau = danhSachTranDau.filter((t) => t.doiNhaId === id || t.doiKhachId === id);

    // Phong độ: Lấy 5 trận gần nhất đã kết thúc
    const cacTranDaKetThuc = lichSuTranDau
      .filter((t) => t.trangThai === 'KET_THUC')
      .sort((a, b) => new Date(b.ngay).getTime() - new Date(a.ngay).getTime())
      .slice(0, 5);

    const phongDo = cacTranDaKetThuc.map((t) => {
      const isHome = t.doiNhaId === id;
      const myScore = isHome ? t.tyDoiNha : t.tyDoiKhach;
      const opponentScore = isHome ? t.tyDoiKhach : t.tyDoiNha;
      
      if (myScore > opponentScore) return 'W';
      if (myScore < opponentScore) return 'L';
      return 'D';
    });

    // Trận đấu tiếp theo
    const tranDauSapToi = lichSuTranDau
      .filter((t) => t.trangThai === 'SAP_DIEN_RA' || t.trangThai === 'DANG_DIEN_RA')
      .sort((a, b) => new Date(a.ngay).getTime() - new Date(b.ngay).getTime())[0];

    return {
      doi,
      thongKe,
      phongDo: phongDo.reverse(), // Để trận cũ nhất trước, mới nhất sau
      cauThu,
      tranDauSapToi: tranDauSapToi ? this.enrichTranDau(tranDauSapToi) : null,
      lichSuTranDau: lichSuTranDau.map(t => this.enrichTranDau(t)).sort((a, b) => new Date(b.ngay).getTime() - new Date(a.ngay).getTime()),
    };
  }

}
