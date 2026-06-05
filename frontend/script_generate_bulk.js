const XLSX = require('xlsx');
const fs = require('fs');

console.log("Generating large Excel file for Bulk Import testing...");

const wb = XLSX.utils.book_new();

// 32 Teams
const teamsData = [['Tên Đội Bóng*', 'Mã Bảng Đấu', 'HLV', 'Số Điện Thoại']];
for (let i = 1; i <= 32; i++) {
  const group = String.fromCharCode(65 + Math.floor((i - 1) / 4)); // A, B, C, D...
  teamsData.push([`Team ${i}`, group, `HLV ${i}`, `091234${i.toString().padStart(4, '0')}`]);
}
const wsTeams = XLSX.utils.aoa_to_sheet(teamsData);
XLSX.utils.book_append_sheet(wb, wsTeams, 'Đội Bóng');

// 800 Players (25 per team)
const playersData = [['Tên Đội Bóng*', 'Tên Cầu Thủ*', 'Số Áo*', 'Vị Trí', 'Năm Sinh']];
const positions = ['Tiền đạo', 'Tiền vệ', 'Hậu vệ', 'Thủ môn'];
for (let i = 1; i <= 32; i++) {
  for (let p = 1; p <= 25; p++) {
    playersData.push([
      `Team ${i}`, 
      `Player ${i}-${p}`, 
      `${p}`, 
      positions[p % 4], 
      `${2000 - Math.floor(Math.random() * 10)}`
    ]);
  }
}
const wsPlayers = XLSX.utils.aoa_to_sheet(playersData);
XLSX.utils.book_append_sheet(wb, wsPlayers, 'Cầu Thủ');

XLSX.writeFile(wb, 'Test_Bulk_Import_Large.xlsx');
console.log("Generated 'Test_Bulk_Import_Large.xlsx' successfully with 32 Teams and 800 Players.");
