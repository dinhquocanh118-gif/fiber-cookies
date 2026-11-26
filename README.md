# Fiber Cookies

Trang giới thiệu bốn vị bánh quy rau củ Việt và nhận đăng ký dùng thử. Hình ảnh minh họa trích từ đề án Fiber Cookies.

## Vận hành website

- Website công khai: https://dinhquocanh118-gif.github.io/fiber-cookies/
- GitHub Pages xuất bản nhánh **main**, thư mục **/(root)**. HTML, CSS và JavaScript dùng đường dẫn tương đối.
- Trong Supabase của project **fiber-cookies**, mở **Table Editor → fiber_cookie_signups** để xem đăng ký. Sau khi liên hệ, điền cột `contacted_at`.
- Bản ghi `kiem-thu-fiber-cookies@example.test` chỉ dùng để kiểm thử triển khai.
- Xuất dữ liệu khi cần sao lưu và lưu bản sao ở nơi chỉ đội phụ trách có quyền truy cập.

## Chạy tại máy

Chạy `python3 -m http.server 8000` ở thư mục repo và mở http://localhost:8000. Khi cần thử gửi từ máy, bổ sung origin này vào biến `LEAD_ALLOWED_ORIGINS` của một project kiểm thử.

## Backend Supabase

- Migration `20261126090000_fiber_cookie_signups.sql` đã được áp dụng qua SQL Editor trên project đang chạy. Dùng tệp migration để dựng môi trường mới. Nếu chuyển project hiện tại sang quản lý migration qua CLI, ghi nhận phiên bản này là đã áp dụng trong lịch sử migration trước khi đồng bộ.
- Edge Function `submit-lead` đã được triển khai từ thư mục `supabase/functions/submit-lead`. Đặt `LEAD_ALLOWED_ORIGINS` thành `https://dinhquocanh118-gif.github.io` cho môi trường chính thức. Khi cập nhật mã, dùng Supabase Dashboard hoặc `supabase functions deploy submit-lead` trên đúng project đã liên kết.
- `config.js` chỉ chứa Project URL và publishable key. Khóa có quyền ghi chỉ được đọc từ môi trường của Edge Function.
- Bảng đăng ký bật RLS. Khách và tài khoản đăng nhập thông thường không có quyền đọc bảng hoặc gọi RPC ghi trực tiếp. Luồng ghi cho phép tối đa 30 lượt/phút toàn hệ thống và 3 lượt/giờ mỗi email hoặc số điện thoại.

Sau mỗi cập nhật, mở URL GitHub Pages, chọn một vị bánh, gửi dữ liệu kiểm thử và đối chiếu bản ghi trong bảng `fiber_cookie_signups`.
