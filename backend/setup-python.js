const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const aiModulePath = path.join(__dirname, 'ai_module');
const venvPath = path.join(aiModulePath, 'venv');
const isWin = process.platform === 'win32';

console.log('--- Bắt đầu cài đặt môi trường Python ---');

try {
  // 1. Tạo venv
  const pythonCmd = isWin ? 'python' : 'python3';
  console.log(`Đang tạo virtual environment với lệnh: ${pythonCmd} -m venv venv`);
  try {
    execSync(`${pythonCmd} -m venv venv`, { cwd: aiModulePath, stdio: 'inherit' });
  } catch (e) {
    console.log('Thử lại với lệnh python thay vì python3...');
    execSync(`python -m venv venv`, { cwd: aiModulePath, stdio: 'inherit' });
  }

  // 2. Cài đặt thư viện
  const pipCmd = isWin ? path.join('venv', 'Scripts', 'pip') : path.join('venv', 'bin', 'pip');
  console.log(`Đang cài đặt requirements với lệnh: ${pipCmd} install -r requirements.txt`);
  execSync(`${pipCmd} install -r requirements.txt`, { cwd: aiModulePath, stdio: 'inherit' });

  console.log('--- Cài đặt môi trường Python thành công! ---');
} catch (error) {
  console.error('Lỗi khi cài đặt môi trường Python:', error.message);
  // Không văng lỗi (crash) quá trình npm install nếu thất bại, để tránh tạch build
}
