---
title: "CSRF: khi trình duyệt của bạn bị mượn tay gửi request"
slug: web-101-csrf
excerpt: "Cross-Site Request Forgery lợi dụng việc trình duyệt tự gửi cookie. Hiểu ba điều kiện để CSRF xảy ra và cách chặn bằng CSRF token, SameSite cookie và kiểm tra Origin."
category: web-security
tags: [web, owasp, csrf, cookie, beginner]
difficulty: BEGINNER
topicType: TUTORIAL
cover: /images/covers/web101-03-csrf.svg
---

Bạn đang đăng nhập ngân hàng ở một tab. Ở tab khác, bạn mở một trang "nhận quà miễn phí". Trang đó không hỏi mật khẩu, không cài gì cả — nhưng vài giây sau tài khoản của bạn đã chuyển đi một khoản tiền. Bạn không bấm gì. **Trình duyệt của bạn đã làm thay.**

Đó là **Cross-Site Request Forgery (CSRF)**: kẻ tấn công không lấy được cookie của bạn, họ chỉ khiến trình duyệt của bạn gửi một request *kèm sẵn* cookie đó.

## Cơ chế: cookie đi theo mọi request

Khi trình duyệt gửi request tới `bank.lab`, nó tự đính kèm cookie của `bank.lab` — bất kể request đó được tạo ra từ trang nào. Server nhìn thấy cookie hợp lệ và tin rằng chính bạn muốn thực hiện hành động.

Trang của kẻ tấn công chỉ cần chứa một form tự gửi:

```html
<!-- Trang "nhận quà" trong lab -->
<form action="https://bank.lab/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="1000" />
</form>
<script>
  document.forms[0].submit();
</script>
```

## Ba điều kiện để CSRF thành công

1. **Có hành động đáng giá:** đổi email, đổi mật khẩu, chuyển tiền, thêm admin.
2. **Xác thực chỉ dựa vào cookie** (hoặc thứ trình duyệt tự gửi như Basic Auth).
3. **Mọi tham số đều đoán được:** không có giá trị bí mật nào mà kẻ tấn công không biết.

Chỉ cần phá một trong ba điều kiện, tấn công thất bại. Mọi biện pháp phòng chống đều nhắm vào điều kiện 2 hoặc 3.

## Đoạn code có lỗi

```js
// ❌ Chỉ kiểm tra phiên đăng nhập
app.post("/account/email", requireLogin, async (req, res) => {
  await db.user.update({ where: { id: req.user.id }, data: { email: req.body.email } });
  res.redirect("/account");
});
```

Kẻ tấn công đổi email của nạn nhân thành email của họ, rồi dùng "Quên mật khẩu" để chiếm tài khoản.

## Cách phòng chống

### 1. CSRF token

Server sinh một giá trị ngẫu nhiên gắn với phiên; mọi request thay đổi dữ liệu phải gửi kèm giá trị đó. Trang của kẻ tấn công không đọc được token (Same-Origin Policy) nên không thể gửi đúng.

Biến thể **double-submit** không cần lưu trạng thái ở server — chính blog này đang dùng:

```js
// Server: phát token qua cookie mà JavaScript đọc được
res.cookie("csrf", crypto.randomBytes(32).toString("hex"), { sameSite: "lax", secure: true });

// Client: gửi lại token trong header
await fetch("/api/comments", {
  method: "POST",
  headers: { "content-type": "application/json", "x-csrf-token": token },
  body: JSON.stringify({ content }),
});

// Server: so sánh cookie với header bằng phép so sánh thời gian hằng
if (!timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
  return res.status(403).json({ message: "CSRF token không hợp lệ" });
}
```

### 2. SameSite cookie

```js
res.cookie("session", sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: "lax", // hoặc "strict" cho ứng dụng nhạy cảm
});
```

| Giá trị | Cookie được gửi khi | Ghi chú |
| ------- | ------------------- | ------- |
| `Strict` | Chỉ khi request xuất phát từ chính site | An toàn nhất, nhưng bấm link từ email sẽ thấy như chưa đăng nhập |
| `Lax` | Điều hướng cấp cao bằng GET từ site khác | Mặc định hợp lý cho đa số ứng dụng |
| `None` | Mọi request (bắt buộc kèm `Secure`) | Chỉ dùng khi thực sự cần nhúng chéo site |

### 3. Kiểm tra Origin / Referer

Với request thay đổi dữ liệu, từ chối nếu header `Origin` không thuộc danh sách tên miền của bạn. Đây là lớp bổ sung rẻ và hiệu quả.

### 4. Thiết kế đúng ngay từ đầu

- **GET không được thay đổi trạng thái.** `GET /delete?id=5` là lời mời cho CSRF qua một thẻ `<img>`.
- Hành động nhạy cảm (đổi mật khẩu, rút tiền) yêu cầu nhập lại mật khẩu hoặc mã 2FA.

## Những hiểu lầm phổ biến

- *"Mình dùng POST nên an toàn."* — Form ẩn tự gửi POST dễ như ví dụ ở trên.
- *"API của mình nhận JSON nên không sao."* — Kiểm tra `Content-Type` có giúp, nhưng cấu hình CORS lỏng lẻo hoặc endpoint chấp nhận cả form sẽ phá vỡ giả định đó.
- *"Đã có SameSite=Lax là xong."* — `Lax` vẫn gửi cookie với GET điều hướng; nếu bạn còn endpoint GET thay đổi dữ liệu thì vẫn dính. Ngoài ra, một subdomain bị XSS được coi là *same-site*.
- *"Có HTTPS rồi."* — HTTPS chống nghe lén, không liên quan tới CSRF.

## CSRF khác XSS thế nào?

| | CSRF | XSS |
| - | ---- | --- |
| Kẻ tấn công chạy code ở đâu | Trên trang **của họ** | Trên trang **của bạn** |
| Đọc được response không | Không | Có |
| Token CSRF có chặn được không | Có | Không — XSS đọc được token |

Vì vậy: **còn XSS thì mọi lớp chống CSRF đều vô nghĩa.** Hãy xử lý XSS trước.

## Checklist kiểm thử trong lab

1. Liệt kê mọi request thay đổi dữ liệu (POST/PUT/PATCH/DELETE và cả GET đáng ngờ).
2. Gửi lại request sau khi bỏ token → server phải từ chối.
3. Dùng token của tài khoản A cho phiên của tài khoản B → phải từ chối.
4. Đổi `POST` thành `GET` → không được chấp nhận.
5. Kiểm tra thuộc tính `SameSite`, `HttpOnly`, `Secure` của cookie phiên.

## Ghi nhớ nhanh

- CSRF = trình duyệt tự gửi cookie + server không kiểm tra ý định.
- Token CSRF + `SameSite` + kiểm tra `Origin` là bộ ba tiêu chuẩn.
- GET chỉ để đọc.
- Vá XSS trước, vì XSS vượt qua mọi lớp chống CSRF.
