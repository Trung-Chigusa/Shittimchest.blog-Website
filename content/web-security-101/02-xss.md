---
title: "XSS: khi trang web chạy đoạn script không phải của mình"
slug: web-101-xss
excerpt: "Cross-Site Scripting cho phép kẻ tấn công chạy JavaScript trong trình duyệt của người dùng khác. Phân biệt Reflected, Stored, DOM-based và cách chặn bằng encoding đúng ngữ cảnh, CSP, HttpOnly."
category: web-security
tags: [web, owasp, xss, javascript, beginner]
difficulty: BEGINNER
topicType: TUTORIAL
cover: /images/covers/web101-02-xss.svg
---

Một diễn đàn cho phép bình luận. Ai đó để lại bình luận trông trống trơn, nhưng mọi người mở bài viết đó đều bị đăng xuất, vài người mất tài khoản. Thủ phạm là một thẻ `<script>` nằm trong bình luận — trang web đã in nó ra **nguyên văn**, và trình duyệt của nạn nhân ngoan ngoãn chạy nó.

Đó là **Cross-Site Scripting (XSS)**: kẻ tấn công không hack server, họ mượn trang web của bạn để chạy code trong trình duyệt của người dùng.

## Vì sao trình duyệt lại chạy?

Trình duyệt tin mọi thứ đến từ origin của bạn. Nếu HTML trả về có `<script>`, nó chạy với **đầy đủ quyền của trang**: đọc DOM, gọi API bằng cookie của người dùng, đổi giao diện. Trình duyệt không biết đoạn script đó do bạn viết hay do một người lạ chèn vào.

## Ba dạng XSS

| Dạng | Payload nằm ở đâu | Ví dụ điển hình |
| ---- | ----------------- | --------------- |
| Reflected | Trong request, được "dội lại" ngay ở response | Trang tìm kiếm in lại từ khoá |
| Stored | Được lưu trong database, hiện cho mọi người xem | Bình luận, tên hiển thị, tiểu sử |
| DOM-based | Không qua server; JavaScript phía client tự chèn vào trang | Đọc `location.hash` rồi gán vào `innerHTML` |

Stored XSS nguy hiểm nhất vì nạn nhân không cần bấm vào link lạ — chỉ cần mở trang.

## Đoạn code có lỗi

**Reflected** — server chèn thẳng tham số vào HTML:

```js
// ❌ req.query.q đi thẳng vào HTML
app.get("/search", (req, res) => {
  res.send(`<h1>Kết quả cho: ${req.query.q}</h1>`);
});
```

Truy cập `/search?q=<script>alert(document.domain)</script>` trong lab và hộp thoại bật lên: script của "người dùng" đã chạy trong trang của bạn.

**DOM-based** — lỗi nằm hoàn toàn ở frontend:

```js
// ❌ Dữ liệu từ URL được diễn giải như HTML
const name = new URLSearchParams(location.search).get("name");
document.querySelector("#hello").innerHTML = `Xin chào ${name}`;
```

## Kẻ tấn công làm được gì?

- Gửi request thay người dùng (đổi email, đổi mật khẩu, chuyển tiền).
- Đánh cắp session nếu cookie không có cờ `HttpOnly`.
- Ghi lại phím bấm, chèn form đăng nhập giả ngay trên tên miền thật.
- Lây lan: một bình luận XSS tự đăng tiếp bình luận khác (XSS worm).

## Cách phòng chống

### 1. Encode đầu ra theo đúng ngữ cảnh

Nguyên tắc vàng: **dữ liệu người dùng phải được encode tại thời điểm in ra, theo nơi nó được in.**

| Ngữ cảnh | Ví dụ | Cách xử lý |
| -------- | ----- | ---------- |
| Nội dung HTML | `<p>DATA</p>` | HTML-encode `< > & " '` |
| Thuộc tính HTML | `<input value="DATA">` | Encode và luôn đặt trong dấu nháy |
| Trong JavaScript | `const x = "DATA"` | Dùng `JSON.stringify`, tránh nhúng trực tiếp |
| URL | `<a href="DATA">` | Chỉ cho phép `http:`/`https:`, encode tham số |

### 2. Để framework làm việc này

React, Vue, Angular tự encode khi bạn dùng cú pháp thông thường:

```jsx
// ✅ React tự encode — an toàn
<p>{comment.content}</p>

// ❌ Tự tắt cơ chế bảo vệ
<p dangerouslySetInnerHTML={{ __html: comment.content }} />
```

Các "cửa thoát hiểm" cần rà soát kỹ: `dangerouslySetInnerHTML`, `v-html`, `innerHTML`, `document.write`, `eval`.

### 3. Với DOM: dùng API an toàn

```js
// ✅ textContent không bao giờ diễn giải HTML
document.querySelector("#hello").textContent = `Xin chào ${name}`;
```

### 4. Buộc phải nhận HTML? Sanitize bằng thư viện

Trình soạn thảo rich text hay Markdown cần cho phép một số thẻ. Đừng tự viết regex — dùng thư viện đã được kiểm chứng:

```js
import DOMPurify from "dompurify";

const clean = DOMPurify.sanitize(dirtyHtml, { ALLOWED_TAGS: ["b", "i", "a", "p", "code", "pre"] });
```

Blog bạn đang đọc render Markdown qua `rehype-sanitize` vì đúng lý do này: bài viết của thành viên không thể chứa `<script>` hay thuộc tính `onerror`.

### 5. Lớp phòng thủ thứ hai

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'
Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax
```

- **CSP** hạn chế nguồn script được phép chạy, làm nhiều payload vô hiệu.
- **HttpOnly** khiến JavaScript không đọc được cookie phiên.

Hai lớp này giảm thiệt hại, **không thay thế** việc encode đúng.

## Checklist kiểm thử trong lab

1. Liệt kê mọi nơi dữ liệu bạn nhập được hiển thị lại: tìm kiếm, hồ sơ, bình luận, thông báo lỗi, tên file.
2. Nhập một chuỗi vô hại dễ nhận ra, ví dụ `xss"'<test>`, rồi xem mã nguồn trang: ký tự nào bị encode, ký tự nào không.
3. Xác định ngữ cảnh (HTML, thuộc tính, JavaScript, URL) trước khi nghĩ tới payload.
4. Đừng quên DOM: tìm `innerHTML`, `location`, `postMessage` trong các file JavaScript.

## Ghi nhớ nhanh

- XSS là lỗi **in ra** không an toàn, không phải lỗi nhập vào.
- Encode theo ngữ cảnh, ưu tiên cơ chế có sẵn của framework.
- `textContent` thay cho `innerHTML`; HTML bắt buộc thì sanitize bằng thư viện.
- CSP và `HttpOnly` là lưới an toàn, không phải thuốc chữa.
