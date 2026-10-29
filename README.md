# NHAN VIP MD5 API — Render

API wrapper dùng thuật toán trong `algorithm.mjs`, lấy lịch sử từ API nguồn và trả JSON dạng `/api`.

## Triển khai
1. Tạo GitHub repository mới và upload đủ 4 file: `algorithm.mjs`, `server.mjs`, `package.json`, `render.yaml`.
2. Trên Render chọn **New + → Web Service**, kết nối repository.
3. Build command: `npm install`; Start command: `npm start`.
4. Bản này đã đặt sẵn URL nguồn trong `server.mjs`, nên không cần tạo biến `UPSTREAM_URL`. Nếu token hết hạn, hãy sửa URL trong `server.mjs` bằng token mới. Vì URL có token, hãy để repository ở chế độ private.
5. Sau khi deploy, mở `https://TEN-DICH-VU.onrender.com/api`.

## Lưu ý
- Không thể sửa trực tiếp API của `wtxmd52.tele68.com`; đây là dịch vụ API riêng của bạn, làm nhiệm vụ đọc nguồn và trả JSON mới.
- Token `at` có thể hết hạn; nếu nguồn trả 401/403 thì cập nhật `UPSTREAM_URL`.
- Nếu API nguồn chặn request từ server hoặc đổi cấu trúc JSON, endpoint sẽ trả lỗi `502` kèm `detail`.
- `do_tin_cay` là điểm thuật toán, không phải tỷ lệ thắng đã được chứng minh. Dự đoán Tài/Xỉu không đảm bảo kết quả.
