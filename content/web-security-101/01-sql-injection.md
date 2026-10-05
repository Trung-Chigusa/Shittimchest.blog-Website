---
title: "SQL Injection: khi ô đăng nhập nói chuyện thẳng với database"
slug: web-101-sql-injection
excerpt: "Lỗi kinh điển nhất của web: dữ liệu người dùng bị hiểu thành câu lệnh SQL. Cùng xem nó xảy ra thế nào, nhận biết ra sao và sửa tận gốc bằng truy vấn tham số hoá."
category: web-security
tags: [web, owasp, sqli, injection, beginner]
difficulty: BEGINNER
topicType: TUTORIAL
cover: /images/covers/web101-01-sqli.svg
---

Bạn mở một form đăng nhập, gõ vào ô email một chuỗi kỳ lạ kết thúc bằng dấu nháy đơn, bấm Enter — và trang web trả về lỗi 500 kèm một dòng nhắc tới `syntax error`. Chúc mừng, bạn vừa nhìn thấy dấu hiệu của **SQL Injection (SQLi)**: lỗi đã hơn 25 năm tuổi nhưng vẫn nằm trong nhóm nguy hiểm nhất của OWASP Top 10.

> **Lưu ý đạo đức:** mọi thử nghiệm trong series này chỉ thực hiện trên lab của bạn hoặc hệ thống bạn được cho phép bằng văn bản. Thử trên hệ thống của người khác là vi phạm pháp luật.

## SQL Injection là gì?

Ứng dụng web thường tạo câu truy vấn bằng cách **ghép chuỗi** dữ liệu người dùng vào câu SQL. Khi đó database không còn phân biệt được đâu là *lệnh* do lập trình viên viết, đâu là *dữ liệu* do người dùng nhập. Kẻ tấn công chỉ cần nhập dữ liệu có hình dạng của một câu lệnh.

Một câu để nhớ: **SQLi xảy ra khi dữ liệu được phép trở thành code.**

## Đoạn code có lỗi

```js
// ❌ Ghép chuỗi trực tiếp vào câu SQL
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users
               WHERE email = '${email}' AND password = '${password}'`;
  const user = await db.query(sql);
  if (user.rows.length) return res.send("Đăng nhập thành công");
  res.status(401).send("Sai thông tin");
});
```

Giả sử ai đó nhập vào ô email giá trị `admin@lab.local' --`. Câu SQL mà database thực sự nhận được là:

```sql
SELECT * FROM users
WHERE email = 'admin@lab.local' --' AND password = 'bất kỳ'
```

Dấu `'` đóng chuỗi sớm, còn `--` biến toàn bộ phần kiểm tra mật khẩu thành chú thích. Điều kiện chỉ còn lại `email = 'admin@lab.local'` — đăng nhập thành công mà không cần mật khẩu.

## Các dạng thường gặp

| Dạng | Đặc điểm | Dấu hiệu khi kiểm thử |
| ---- | -------- | --------------------- |
| In-band (Error / UNION) | Kết quả hoặc lỗi SQL hiện ngay trên trang | Thông báo lỗi database, dữ liệu lạ xuất hiện |
| Blind – Boolean | Không thấy dữ liệu, chỉ thấy trang "đúng" hoặc "sai" | `AND 1=1` và `AND 1=2` cho hai kết quả khác nhau |
| Blind – Time | Trang không đổi gì, chỉ chậm đi | Phản hồi trễ đúng số giây bạn yêu cầu |
| Out-of-band | Dữ liệu được gửi ra ngoài qua DNS/HTTP | Server của bạn nhận được truy vấn lạ |

## Hậu quả

- **Đọc trộm dữ liệu:** tài khoản, email, hash mật khẩu, đơn hàng.
- **Vượt qua đăng nhập** như ví dụ ở trên.
- **Sửa hoặc xoá dữ liệu:** `UPDATE`, `DELETE`, thậm chí `DROP TABLE`.
- **Chiếm máy chủ** trong một số cấu hình (database được phép ghi file hoặc chạy lệnh hệ thống).

## Cách nhận biết khi review code

Hãy tìm mọi nơi câu SQL được tạo bằng phép cộng chuỗi hoặc template string:

```bash
# Tìm nhanh các truy vấn ghép chuỗi trong project
grep -rnE "(SELECT|INSERT|UPDATE|DELETE).*(\$\{|\+ *req\.|%s|\.format\()" src/
```

Những vị trí hay bị bỏ sót: `ORDER BY` động, bộ lọc tìm kiếm nâng cao, API xuất báo cáo, và các truy vấn "raw" trong ORM.

## Cách phòng chống

### 1. Truy vấn tham số hoá — cách sửa tận gốc

```js
// ✅ Dữ liệu được gửi tách khỏi câu lệnh
const result = await db.query(
  "SELECT id, email, password_hash FROM users WHERE email = $1",
  [email],
);
```

Database nhận câu lệnh và dữ liệu qua hai kênh riêng. Dù người dùng nhập gì, nó vẫn chỉ là *một giá trị chuỗi*.

### 2. Cẩn thận với ORM

ORM (Prisma, Sequelize, Hibernate…) tham số hoá sẵn, nhưng vẫn có "cửa sau":

```js
// ❌ Vẫn dính SQLi dù đang dùng ORM
await prisma.$queryRawUnsafe(`SELECT * FROM "Post" WHERE title LIKE '%${q}%'`);

// ✅ Tagged template của Prisma tự tham số hoá
await prisma.$queryRaw`SELECT * FROM "Post" WHERE title LIKE ${"%" + q + "%"}`;
```

### 3. Allowlist cho những thứ không tham số hoá được

Tên bảng, tên cột, chiều sắp xếp không thể truyền như tham số. Hãy ánh xạ từ một danh sách cố định:

```js
const sortable = { newest: "created_at", popular: "view_count" };
const column = sortable[req.query.sort] ?? "created_at";
const sql = `SELECT * FROM posts ORDER BY ${column} DESC`;
```

### 4. Các lớp phòng thủ bổ sung

- Tài khoản database của ứng dụng chỉ có quyền tối thiểu (không `DROP`, không quyền admin).
- Không trả thông báo lỗi SQL ra cho người dùng; ghi log nội bộ.
- WAF giúp chặn bớt payload phổ biến, nhưng **không thay thế** việc sửa code.

## Những hiểu lầm phổ biến

- *"Mình đã escape dấu nháy rồi."* — Escape thủ công rất dễ sót (encoding, số không có nháy, `LIKE`).
- *"Form có kiểm tra bằng JavaScript."* — Kẻ tấn công gửi request thẳng tới server, không qua form.
- *"Mình chặn từ khoá `SELECT`, `UNION`."* — Blacklist luôn có cách vượt qua bằng viết hoa xen kẽ, comment, encoding.

## Luyện tập ở đâu?

- **PortSwigger Web Security Academy** — chuỗi lab SQL injection miễn phí, có lời giải.
- **OWASP Juice Shop** và **DVWA** — dựng bằng Docker trên máy của bạn.

```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
```

## Ghi nhớ nhanh

- Không bao giờ ghép chuỗi dữ liệu người dùng vào câu SQL.
- Mặc định dùng truy vấn tham số hoá hoặc ORM; rà soát kỹ mọi truy vấn "raw".
- Tên cột/bảng động → allowlist.
- Quyền database tối thiểu, không lộ lỗi ra ngoài.
