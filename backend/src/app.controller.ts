import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ===== TỔNG QUAN =====
  @Get('tong-quan')
  layTongQuan() {
    return this.appService.layTongQuan();
  }

  // ===== ĐỘI BÓNG =====
  @Get('doi-bong')
  layDanhSachDoi() {
    return this.appService.layDanhSachDoi();
  }

  @Get('doi-bong/:id')
  layDoiBong(@Param('id') id: string) {
    return this.appService.layDoiBong(id);
  }

  // ===== CẦU THỦ =====
  @Get('cau-thu')
  layDanhSachCauThu() {
    return this.appService.layDanhSachCauThu();
  }

  @Get('cau-thu/top-ghi-ban')
  layTopGhiBan() {
    return this.appService.layTopGhiBan();
  }


  // ===== TRẬN ĐẤU =====
  @Get('tran-dau')
  layDanhSachTranDau() {
    return this.appService.layDanhSachTranDau();
  }

  @Get('tran-dau/live')
  layTranDauLive() {
    return this.appService.layTranDauLive();
  }

  @Get('tran-dau/:id')
  layChiTietTranDau(@Param('id') id: string) {
    return this.appService.layChiTietTranDau(id);
  }

  // ===== BẢNG XẾP HẠNG =====
  @Get('bang-xep-hang')
  layBangXepHang() {
    return this.appService.layBangXepHang();
  }

}
