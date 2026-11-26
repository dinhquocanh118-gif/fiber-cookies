# Fiber Cookies

Landing page tiếng Việt giới thiệu bốn vị bánh quy rau củ từ đề án và nhận đăng ký để đội Fiber Cookies liên hệ lại. Hình sản phẩm lấy từ phần minh họa của đề án. Trang dùng HTML/CSS/JS tĩnh và đường dẫn tương đối cho GitHub Pages.

## Chạy tại máy

```sh
python3 -m http.server 8000
```

Mở http://localhost:8000. Trang hiển thị rõ khi biểu mẫu chưa có điểm nhận dữ liệu.

## Kết nối Supabase

Cài Supabase CLI và đăng nhập tài khoản có quyền quản lý project. Dùng đúng project Fiber Cookies trước khi chạy migration.

```sh
supabase login
supabase link --project-ref PROJECT_REF
supabase db push
supabase secrets set LEAD_ALLOWED_ORIGINS=https://dinhquocanh118-gif.github.io
supabase functions deploy submit-lead
```

Nếu kiểm tra frontend trên máy với backend Supabase, thêm `http://localhost:8000` vào danh sách origin phân cách bằng dấu phẩy. Sau khi kiểm tra, đặt lại danh sách origin chính thức.

Trong `config.js`, điền Project URL dạng `https://PROJECT_REF.supabase.co` và publishable key dạng `sb_publishable_...`. Edge Function lấy khóa phía máy chủ từ môi trường Supabase. Chỉ công bố Project URL và publishable key.

## GitHub Pages

Trong **Settings → Pages → Build and deployment**, chọn **Deploy from a branch**, sau đó chọn **main → /(root) → Save**. Sau khi job triển khai thành công, mở URL được GitHub cung cấp.

## Kiểm tra và xử lý đăng ký

1. Trên URL GitHub Pages, gửi một mẫu kiểm thử với email dành riêng cho nhóm.
2. Trong **Supabase → Table Editor → leads**, kiểm tra tên, kênh liên hệ, vị quan tâm và thời điểm đồng ý. Sau khi liên hệ, điền `contacted_at`.
3. Từ frontend, kiểm tra gửi thiếu kênh liên hệ, bỏ chọn đồng ý và thử lỗi mạng. Khi máy chủ chưa xác nhận, biểu mẫu giữ lại dữ liệu để gửi lại với cùng mã yêu cầu.
4. Với publishable key, thử đọc bảng `leads` hoặc gọi thẳng `submit_lead` qua REST. Cả hai phải bị từ chối. Chỉ cấp quyền dashboard cho người phụ trách xử lý đăng ký.
5. Khi cần lưu bản sao, xuất dữ liệu từ Supabase vào nơi lưu trữ nội bộ của đội dự án. Thay đổi schema qua migration trong repo.

Luồng gửi dùng Edge Function để xác thực, chặn bẫy bot đơn giản và ghi qua RPC phía máy chủ. Database chặn hơn 30 lượt/phút toàn hệ thống hoặc hơn 3 lượt/giờ cho cùng email hay số điện thoại. RLS và quyền truy cập PostgreSQL giới hạn dữ liệu liên hệ.
