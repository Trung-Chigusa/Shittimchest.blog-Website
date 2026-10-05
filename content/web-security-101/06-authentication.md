---
title: "Lỗi xác thực: mật khẩu, phiên đăng nhập và những cái bẫy quen thuộc"
slug: web-101-broken-authentication
excerpt: "Đăng nhập trông đơn giản nhưng có hàng chục chỗ để sai: lưu mật khẩu, chống dò mật khẩu, quản lý phiên, đặt lại mật khẩu và JWT. Một bản đồ các lỗi thường gặp cùng cách làm đúng."
category: web-security
tags: [web, owasp, authentication, session, jwt, intermediate]
difficulty: INTERMEDIATE
topicType: TUTORIAL
cover: /images/covers/web101-06-auth.svg
---

Form đăng nhập chỉ có hai ô và một nút. Nhưng phía sau nó là cả một chuỗi quyết định thiết kế — và chỉ cần sai một mắt xích, kẻ tấn công không cần "hack" gì cả: họ **đăng nhập** như người dùng thật.

Bài này đi qua năm khu vực hay có lỗi nhất, mỗi khu vực kèm cách làm đúng.

## 1. Lưu mật khẩu

Database rồi sẽ có ngày bị lộ. Câu hỏi là khi đó kẻ tấn công nhận được gì.

| Cách lưu | Khi database bị lộ |
| -------- | ------------------ |
| Văn bản thuần | Mất toàn bộ mật khẩu ngay lập tức |
| MD5 / SHA-1 / SHA-256 không salt | Tra bảng có sẵn, vỡ gần hết trong vài giờ |
| SHA-256 có salt | Vẫn quá nhanh: GPU thử hàng tỷ lần mỗi giây |
| **bcrypt / scrypt / Argon2id** | Chậm có chủ đích, mỗi mật khẩu phải dò riêng |

```js
import bcrypt from "bcryptjs";

// ✅ Lưu
const passwordHash = await bcrypt.hash(password, 12);

// ✅ Kiểm tra
const ok = await bcrypt.compare(password, user.passwordHash);
```

Hàm băm mật khẩu phải **chậm** và **có salt riêng cho từng người dùng** — các thuật toán trên tự lo cả hai.

## 2. Chống dò mật khẩu

Hai kiểu tấn công phổ biến:

- **Brute force:** thử nhiều mật khẩu cho một tài khoản.
- **Credential stuffing:** dùng danh sách email/mật khẩu lộ từ dịch vụ khác, mỗi tài khoản chỉ thử một hai lần.

Biện pháp:

- Giới hạn tần suất theo **cả IP lẫn tài khoản**.
- Khoá tạm thời tăng dần sau nhiều lần sai (đừng khoá vĩnh viễn — đó là công cụ DoS cho kẻ xấu).
- Hỗ trợ xác thực hai lớp (TOTP, passkey).
- Từ chối mật khẩu nằm trong danh sách đã bị lộ.

```js
// Ví dụ đơn giản: tối đa 5 lần thử mỗi phút cho mỗi cặp IP + email
assertRateLimit(`login:${ip}:${email}`, 5, 60);
```

## 3. Đừng để lộ tài khoản nào tồn tại

```text
❌ "Email này chưa đăng ký."      ❌ "Sai mật khẩu."
✅ "Email hoặc mật khẩu không đúng."
```

Thông báo khác nhau cho phép kẻ tấn công lọc ra danh sách email hợp lệ (**user enumeration**). Hãy kiểm tra cả form đăng ký và quên mật khẩu — chúng thường là nơi rò rỉ. Câu trả lời an toàn cho quên mật khẩu: *"Nếu email tồn tại, chúng tôi đã gửi hướng dẫn."*

## 4. Quản lý phiên đăng nhập

Sau khi đăng nhập, cookie phiên chính là mật khẩu tạm thời. Hãy bảo vệ nó tương xứng:

```js
res.cookie("session", token, {
  httpOnly: true, // JavaScript không đọc được → giảm thiệt hại khi có XSS
  secure: true, // chỉ gửi qua HTTPS
  sameSite: "lax", // giảm CSRF
  maxAge: 7 * 24 * 3600 * 1000,
});
```

Các lỗi hay gặp:

- **Session fixation:** không cấp ID phiên mới sau khi đăng nhập.
- **Đăng xuất "giả":** chỉ xoá cookie ở trình duyệt, token cũ ở server vẫn dùng được.
- **Phiên không bao giờ hết hạn**, hoặc không bị huỷ khi người dùng đổi mật khẩu.
- **ID phiên đoán được** (số tăng dần, dựa trên thời gian). Luôn dùng bộ sinh số ngẫu nhiên mật mã.

## 5. Đặt lại mật khẩu

Đây là "cửa sau" hợp pháp của mọi hệ thống, nên phải chắc chắn ngang cửa chính:

- Token đặt lại phải **ngẫu nhiên, đủ dài, dùng một lần, hết hạn nhanh** (10–30 phút).
- Lưu **hash** của token trong database, không lưu bản gốc.
- Không tin header `Host` khi tạo link trong email (kẻ tấn công có thể trỏ link về tên miền của họ).
- Mã OTP 6 số phải giới hạn số lần thử, nếu không sẽ bị dò hết trong vài phút.
- Sau khi đổi mật khẩu: huỷ mọi phiên cũ và gửi email thông báo.

## 6. JWT: tiện nhưng dễ dùng sai

| Lỗi | Hậu quả | Cách đúng |
| --- | ------- | --------- |
| Chấp nhận `alg: none` hoặc thuật toán do token tự khai | Tự ký token giả | Cố định danh sách thuật toán khi verify |
| Secret ngắn, dễ đoán | Dò ra secret ngoại tuyến | Secret ngẫu nhiên ≥ 32 byte |
| Không kiểm tra `exp` | Token sống mãi | Luôn đặt và kiểm tra thời hạn |
| Lưu JWT trong `localStorage` | XSS lấy được token | Cookie `HttpOnly` |
| Đặt dữ liệu nhạy cảm trong payload | Ai cũng đọc được (chỉ là Base64) | Payload chỉ chứa định danh tối thiểu |

```js
import { jwtVerify } from "jose";

// ✅ Chỉ định rõ thuật toán được chấp nhận
const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
```

Và nhớ rằng JWT **không thu hồi được** trước hạn nếu bạn không tự xây cơ chế (danh sách chặn, phiên bản token). Với phần lớn ứng dụng web thông thường, phiên lưu ở server vẫn là lựa chọn đơn giản và an toàn hơn.

## Checklist kiểm thử trong lab

1. Đăng nhập sai 20 lần liên tiếp — có bị giới hạn không? Theo IP hay theo tài khoản?
2. So sánh thông báo và **thời gian phản hồi** giữa email tồn tại và không tồn tại.
3. Đăng xuất rồi gửi lại request bằng cookie cũ.
4. Đổi mật khẩu ở một trình duyệt — phiên ở trình duyệt khác còn sống không?
5. Yêu cầu đặt lại mật khẩu hai lần — token đầu còn dùng được không? Dùng lại token đã dùng thì sao?
6. Giải mã JWT (jwt.io trong lab) xem có gì không nên có trong payload.

## Ghi nhớ nhanh

- Mật khẩu: bcrypt/Argon2id, không bao giờ tự chế thuật toán.
- Giới hạn tần suất + 2FA; thông báo lỗi chung chung.
- Cookie phiên: `HttpOnly`, `Secure`, `SameSite`; đổi ID phiên sau đăng nhập; đăng xuất phải huỷ ở server.
- Token đặt lại mật khẩu: ngẫu nhiên, một lần, hết hạn nhanh.
- JWT: cố định thuật toán, secret mạnh, có `exp`.
