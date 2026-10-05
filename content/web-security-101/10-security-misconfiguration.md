---
title: "Security Misconfiguration: khi lỗi không nằm trong code mà nằm ở cấu hình"
slug: web-101-security-misconfiguration
excerpt: "Mật khẩu mặc định, chế độ debug, file .env lộ ra ngoài, CORS mở toang, thiếu security header… Những lỗi cấu hình phổ biến nhất và một checklist hardening trước khi đưa web lên Internet."
category: web-security
tags: [web, owasp, misconfiguration, cors, hardening, beginner]
difficulty: BEGINNER
topicType: TUTORIAL
cover: /images/covers/web101-10-misconfig.svg
---

Code của bạn có thể sạch hoàn toàn: truy vấn tham số hoá, phân quyền chặt, upload an toàn. Rồi ai đó mở `https://your-site/.env` và tải về toàn bộ mật khẩu database — vì web server được cấu hình phục vụ mọi file trong thư mục.

**Security Misconfiguration** là nhóm lỗi "không ai viết ra nhưng ai cũng dính": hệ thống an toàn về mặt code, nhưng được triển khai với cấu hình mặc định, thừa tính năng hoặc mở quá rộng. Tin tốt là hầu hết đều phát hiện được bằng checklist.

## Mười lỗi cấu hình gặp nhiều nhất

| # | Lỗi | Hậu quả |
| - | --- | ------- |
| 1 | Tài khoản / mật khẩu mặc định (`admin/admin`) | Chiếm quyền quản trị trong vài giây |
| 2 | Bật chế độ debug trên production | Lộ stack trace, biến môi trường, đôi khi có cả console chạy code |
| 3 | Lộ file nhạy cảm: `.env`, `.git/`, bản sao lưu `.zip`, `.sql` | Lộ secret và toàn bộ mã nguồn |
| 4 | Liệt kê thư mục (directory listing) | Kẻ tấn công duyệt file như trên ổ đĩa |
| 5 | Thông báo lỗi quá chi tiết | Lộ phiên bản, đường dẫn, câu truy vấn |
| 6 | CORS cấu hình sai | Trang lạ đọc được dữ liệu của người dùng đã đăng nhập |
| 7 | Thiếu security header | Dễ bị clickjacking, XSS nặng hơn, hạ cấp HTTPS |
| 8 | Dịch vụ quản trị mở ra Internet (database, Redis, bảng điều khiển) | Truy cập trực tiếp, thường không cần mật khẩu |
| 9 | Phần mềm, thư viện không cập nhật | Dính lỗ hổng đã công bố, có sẵn công cụ khai thác |
| 10 | Kho lưu trữ cloud để công khai | Rò rỉ dữ liệu hàng loạt |

## Soi kỹ: CORS

CORS hay bị hiểu là "tính năng bảo mật". Thực ra nó là cơ chế **nới lỏng** Same-Origin Policy — cấu hình sai tức là tự mở cửa.

```js
// ❌ Phản chiếu mọi Origin và cho phép gửi kèm cookie
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
```

Với cấu hình trên, bất kỳ trang web nào cũng có thể gọi API của bạn **bằng cookie của nạn nhân và đọc được kết quả**.

```js
// ✅ Danh sách origin cố định
const allowedOrigins = ["https://app.example.com", "https://admin.example.com"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
```

Các lỗi CORS khác cần tránh:

- So khớp bằng `endsWith("example.com")` → `evil-example.com` lọt qua.
- Cho phép origin `null`.
- Tin rằng `Access-Control-Allow-Origin: *` an toàn cho API nội bộ chỉ vì "không ai biết địa chỉ".

## Soi kỹ: security header

| Header | Tác dụng | Giá trị khởi đầu hợp lý |
| ------ | -------- | ----------------------- |
| `Content-Security-Policy` | Giới hạn nguồn script, style, khung… | `default-src 'self'; frame-ancestors 'none'` |
| `Strict-Transport-Security` | Buộc trình duyệt luôn dùng HTTPS | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | Chặn trình duyệt tự đoán kiểu file | `nosniff` |
| `X-Frame-Options` | Chống clickjacking (trình duyệt cũ) | `DENY` |
| `Referrer-Policy` | Hạn chế rò rỉ URL sang trang khác | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Tắt camera, micro, định vị nếu không dùng | `camera=(), microphone=(), geolocation=()` |

Kiểm tra nhanh trên hệ thống của bạn:

```bash
curl -sI https://your-site.example | grep -iE "content-security|strict-transport|x-content-type|x-frame|referrer-policy"
```

## Soi kỹ: file không nên lộ

```nginx
# Chặn mọi file/thư mục ẩn (.env, .git, .htpasswd…), trừ .well-known cho Let's Encrypt
location ~ /\.(?!well-known) {
    deny all;
}

# Tắt liệt kê thư mục và ẩn phiên bản nginx
autoindex off;
server_tokens off;
```

Và quan trọng hơn: **đừng để secret trong thư mục web ngay từ đầu.** Đưa `.env` vào `.gitignore`, dùng biến môi trường hoặc trình quản lý secret, và đổi ngay mọi khoá đã lỡ commit — xoá commit không làm khoá an toàn trở lại.

## Checklist hardening trước khi public

1. **Đổi mọi mật khẩu mặc định**; xoá tài khoản mẫu, dữ liệu demo.
2. **Tắt debug**, trả về trang lỗi chung; ghi chi tiết vào log nội bộ.
3. **Secret nằm ngoài mã nguồn**; quét repo tìm khoá bị lộ.
4. **Chỉ mở cổng cần thiết** (thường là 80/443); database, Redis, trang quản trị chỉ nghe ở mạng nội bộ.
5. **HTTPS ở mọi nơi**, tự chuyển hướng từ HTTP, bật HSTS.
6. **Thêm security header** và kiểm tra lại bằng công cụ.
7. **CORS dùng allowlist**; cookie có `HttpOnly`, `Secure`, `SameSite`.
8. **Cập nhật** hệ điều hành, web server, thư viện; bật cảnh báo lỗ hổng phụ thuộc.
9. **Gỡ thứ không dùng**: module, endpoint thử nghiệm, trang mẫu, tài liệu API công khai nếu không cần.
10. **Sao lưu và giám sát**: có bản sao lưu đã thử khôi phục, có cảnh báo khi đăng nhập thất bại tăng đột biến.

## Tự kiểm tra hệ thống của chính mình

```bash
# Cổng nào đang mở ra ngoài?
nmap -sV -Pn your-server.example

# Cấu hình TLS có ổn không?
testssl.sh https://your-site.example

# Thư viện có lỗ hổng đã biết không?
npm audit --omit=dev
```

Chạy lại các lệnh này sau mỗi lần thay đổi hạ tầng — cấu hình có xu hướng "trôi" dần theo thời gian.

## Lời kết cho series

Mười bài, mười nhóm lỗi — nhưng nếu nhìn lại, chúng xoay quanh vài nguyên tắc rất ít:

- **Không tin dữ liệu từ client.** Kiểm tra ở server, allowlist thay vì blacklist.
- **Tách dữ liệu khỏi lệnh.** SQL, shell, HTML, đường dẫn file — đều cùng một bài học.
- **Kiểm tra quyền trên từng đối tượng**, mặc định từ chối.
- **Quyền tối thiểu và nhiều lớp phòng thủ**, vì lớp nào rồi cũng có ngày thủng.
- **Cấu hình cũng là code**: review, tự động hoá, kiểm tra định kỳ.

Bước tiếp theo: dựng một lab (Juice Shop, DVWA, các lab của PortSwigger), thử lại từng lỗi bằng chính tay mình, rồi viết writeup chia sẻ ở đây. Học thật, làm thật, chia sẻ thật.
