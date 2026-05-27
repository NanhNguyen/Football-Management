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

}
