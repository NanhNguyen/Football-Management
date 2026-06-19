const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../Test_Bulk_Import_Large.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

const teams = XLSX.utils.sheet_to_json(workbook.Sheets['Đội Bóng']);
console.log('Unique Team Names in Excel:', teams.map(t => t['Tên Đội Bóng*'] || t['Tên đội bóng'] || t['Tên Đội bóng']).slice(0, 40));

const starters = XLSX.utils.sheet_to_json(workbook.Sheets['Cầu Thủ Đá Chính'] || workbook.Sheets['Cầu Thủ'] || []);
console.log('Sample Player in Excel:', starters[0]);
console.log('Unique Team Names in Players Sheet:', Array.from(new Set(starters.map(p => p['Tên Đội Bóng*'] || p['Tên Đội Bóng'] || p['Đội bóng'] || p['Tên đội bóng']))));

console.log('Total Starters in Sheet:', starters.length);
console.log('Total Bench in Sheet:', bench.length);

const usaStarters = starters.filter(p => p['Tên Đội Bóng*']?.trim().toLowerCase() === 'usa');
const usaBench = bench.filter(p => p['Tên Đội Bóng*']?.trim().toLowerCase() === 'usa');

console.log('\n--- USA Starters in Excel ---');
usaStarters.forEach(p => console.log(`[${p['Số Áo*']}] ${p['Tên Cầu Thủ*']} - ${p['Vị Trí']}`));

console.log('\n--- USA Bench in Excel ---');
usaBench.forEach(p => console.log(`[${p['Số Áo*']}] ${p['Tên Cầu Thủ*']} - ${p['Vị Trí']}`));
