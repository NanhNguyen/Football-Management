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

  layTopGiaoDich() {
    return [...danhSachCauThu]
      .sort((a, b) => b.giaoDich - a.giaoDich)
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
      .filter((t) => t.trangThai === 'LIVE')
      .map((t) => this.enrichTranDau(t));
  }

  layChiTietTranDau(id: string) {
    const tran = danhSachTranDau.find((t) => t.id === id);
    if (!tran) return { error: 'Không tìm thấy trận đấu' };
    return this.enrichTranDau(tran);
  }

  // ===== BẢNG XẾP HẠNG =====
  layBangXepHang() {
    return bangXepHang.map((bxh) => ({
      ...bxh,
      doi: danhSachDoi.find((d) => d.id === bxh.doiId),
    }));
  }

  // ===== GIAO DỊCH (ADMIN) =====
  themGiaoDich(body: { tranDauId: string; doiId: string; soGiaoDich: number; moTa?: string }) {
    const tran = danhSachTranDau.find((t) => t.id === body.tranDauId);
    if (!tran) return { error: 'Không tìm thấy trận đấu' };

    // Auto convert: 1 giao dịch = 2 bàn thắng
    const soBanThang = body.soGiaoDich * 2;

    if (tran.doiNhaId === body.doiId) {
      tran.tyDoiNha += soBanThang;
      tran.giaoDichDoiNha += body.soGiaoDich;
    } else if (tran.doiKhachId === body.doiId) {
      tran.tyDoiKhach += soBanThang;
      tran.giaoDichDoiKhach += body.soGiaoDich;
    }

    return {
      thanhCong: true,
      thongBao: `Đã thêm ${body.soGiaoDich} giao dịch → +${soBanThang} bàn thắng`,
      tranDau: this.enrichTranDau(tran),
    };
  }
}
