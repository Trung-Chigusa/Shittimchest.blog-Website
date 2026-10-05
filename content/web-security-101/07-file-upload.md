---
title: "Upload file: cánh cửa bạn tự mở cho webshell"
slug: web-101-file-upload
excerpt: "Cho người dùng tải file lên là cho họ ghi dữ liệu vào server của bạn. Những kiểu kiểm tra dễ bị vượt qua và bộ biện pháp nhiều lớp để tính năng upload thực sự an toàn."
category: web-security
tags: [web, owasp, file-upload, rce, intermediate]
difficulty: INTERMEDIATE
topicType: TUTORIAL
cover: /images/covers/web101-07-upload.svg
---

Tính năng "đổi ảnh đại diện" có vẻ vô hại. Cho đến khi ai đó tải lên một file tên `avatar.php` thay vì `avatar.png`, rồi mở đúng đường dẫn của nó. Nếu server thực thi file đó, người lạ vừa có một **webshell** — toàn quyền chạy lệnh trên máy chủ của bạn.

Upload file là một trong số ít tính năng cho phép người dùng **ghi dữ liệu tuỳ ý lên server**. Hãy đối xử với nó tương xứng.

## Chuyện gì có thể xảy ra?

| Rủi ro | Xảy ra khi |
| ------ | ---------- |
| Thực thi mã từ xa (RCE) | File script (`.php`, `.jsp`, `.aspx`) được lưu trong thư mục web và server chạy nó |
| Stored XSS | File `.html` hoặc `.svg` chứa script được phục vụ từ chính tên miền của bạn |
| Ghi đè file hệ thống | Tên file chứa `../` và server dùng nguyên tên đó |
| Từ chối dịch vụ | File cực lớn, hàng nghìn file, "zip bomb", ảnh có kích thước điểm ảnh khổng lồ |
| Phát tán mã độc | Server của bạn trở thành nơi lưu trữ file độc hại cho người khác tải |

## Những kiểu kiểm tra dễ bị vượt qua

**Chỉ kiểm tra ở trình duyệt.** Thuộc tính `accept="image/*"` hay JavaScript chỉ là tiện ích giao diện. Request có thể được gửi thẳng tới server.

**Tin vào `Content-Type`.** Header này do client gửi, sửa được tuỳ ý:

```http
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----x

------x
Content-Disposition: form-data; name="file"; filename="avatar.php"
Content-Type: image/png

<?php /* nội dung không phải ảnh */ ?>
------x--
```

**Danh sách đen phần mở rộng.** Chặn `.php` nhưng quên `.phtml`, `.php5`, `.phar`, chữ hoa `.PhP`, phần mở rộng kép `shell.php.jpg` trên server cấu hình sai, hay dấu chấm và khoảng trắng ở cuối tên trên Windows.

Bài học: **allowlist, không blacklist** — và không dựa vào một lớp kiểm tra duy nhất.

## Cách làm đúng: phòng thủ nhiều lớp

### 1. Chỉ nhận đúng loại file cần thiết và tự đặt tên

```js
const allowed = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

const ext = allowed.get(file.type);
if (!ext) throw new ApiError("Chỉ nhận ảnh PNG, JPEG hoặc WEBP");
if (file.size > 2 * 1024 * 1024) throw new ApiError("Ảnh tối đa 2MB");

// Tên file do server sinh ra — không bao giờ dùng tên người dùng gửi
const filename = `${crypto.randomUUID()}.${ext}`;
```

Tên ngẫu nhiên giải quyết cùng lúc ba vấn đề: path traversal trong tên file, ghi đè file của người khác, và đoán đường dẫn.

### 2. Kiểm tra nội dung thật của file

Phần mở rộng và `Content-Type` đều do client khai. Hãy đọc **magic bytes** — vài byte đầu đặc trưng của từng định dạng:

```js
const signatures = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff],
};

const matches = (bytes, signature) => signature.every((value, index) => bytes[index] === value);
if (!matches(bytes, signatures[ext])) throw new ApiError("Nội dung file không khớp định dạng");
```

Chắc chắn hơn nữa: **mã hoá lại ảnh** bằng thư viện xử lý ảnh (resize, chuyển sang WEBP). Bước này loại bỏ metadata và mọi thứ "đi nhờ" trong file.

### 3. Lưu ở nơi không thể thực thi

- Tốt nhất: lưu trên **object storage** (S3, MinIO…) và phục vụ từ một **tên miền riêng** không dùng chung cookie với ứng dụng.
- Nếu lưu trên cùng máy chủ: đặt **ngoài thư mục web**, hoặc tắt hẳn việc thực thi script trong thư mục upload.

```nginx
# Thư mục upload chỉ phục vụ file tĩnh, không chuyển cho PHP/ứng dụng xử lý
location /uploads/ {
    types { image/png png; image/jpeg jpg jpeg; image/webp webp; }
    default_type application/octet-stream;
    add_header X-Content-Type-Options nosniff always;
    add_header Content-Security-Policy "default-src 'none'" always;
}
```

### 4. Giới hạn tài nguyên

- Kích thước tối đa cho mỗi file (đặt ở cả reverse proxy lẫn ứng dụng).
- Số file / dung lượng mỗi người dùng, giới hạn tần suất upload.
- Giới hạn kích thước điểm ảnh trước khi xử lý ảnh; cẩn thận khi giải nén file nén.

### 5. Yêu cầu đăng nhập và kiểm tra quyền

Endpoint upload phải xác thực, có chống CSRF, và file riêng tư phải được kiểm tra quyền khi tải về — không chỉ dựa vào việc "không ai biết đường dẫn".

## SVG: "ảnh" nhưng chứa được script

SVG là XML và có thể chứa `<script>` hoặc thuộc tính sự kiện. Nếu cho phép upload SVG và phục vụ từ tên miền chính, bạn đang mở cửa cho Stored XSS. Lựa chọn an toàn: không nhận SVG từ người dùng, hoặc chuyển thành PNG ở server, hoặc phục vụ kèm `Content-Disposition: attachment` từ tên miền riêng.

## Checklist kiểm thử trong lab

1. Tải lên file không phải ảnh nhưng đặt `Content-Type: image/png`.
2. Thử các biến thể phần mở rộng, chữ hoa/thường, phần mở rộng kép.
3. Đặt `filename` chứa `../` — file được lưu ở đâu?
4. Tải lên `.html` / `.svg` rồi mở trực tiếp: trình duyệt hiển thị hay tải về?
5. Tải lên file rất lớn — server từ chối ở bước nào?
6. Mở đường dẫn file đã upload khi **chưa đăng nhập** và bằng tài khoản khác.

## Ghi nhớ nhanh

- Allowlist loại file; kiểm tra nội dung thật, không tin thứ client khai.
- Server tự đặt tên file ngẫu nhiên.
- Lưu nơi không thực thi được, tốt nhất là tên miền/kho lưu trữ riêng.
- Giới hạn kích thước và tần suất; `nosniff`; cẩn thận với SVG.
