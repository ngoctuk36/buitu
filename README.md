## Tạo project mới
npm init -y 

## Tải express pq dùng cho postgresSQL
npm install express pg cors dotenv

# DATABASE
## Xem các trường của bảng name
/d name 

# CÁC THƯ VIỆN CẦN CÀI 
## Cài thư viện hash 
npm install bcrypt
## Thư viện để lấy dữ liệu từ .env
npm install dotenv
## Cài nextjs
npm install next react react-dom
## Cài tailwind
Lên trang tailwind.com (trang chủ tailwind)
Ở file globals.css import vô 

# Kết nối với Neon (web postgres cloud)
import pool from './db.js';

# File .env 
Chứa DB_URL 

# Đăng lên github
## Tạo file gitignore trong đó ghi:
node_modules
.env
.next
dist
build

git add .
git commit -m "Nội dung bất kì"
## Nếu muốn đổi branch
git branch -M + tên muốn đổi

## Tạo repo trên github
git remote add origin + link repo 
git push -u origin main (hoặc khác main nếu đưa vô tên khác)

