---
title: "IDOR & Broken Access Control: đổi một con số, thấy dữ liệu người khác"
slug: web-101-idor-broken-access-control
excerpt: "Lỗi đứng đầu OWASP Top 10: server kiểm tra bạn đã đăng nhập nhưng quên kiểm tra bạn có quyền hay không. IDOR, leo thang đặc quyền, mass assignment và cách thiết kế phân quyền đúng."
category: web-security
tags: [web, owasp, idor, access-control, intermediate]
difficulty: INTERMEDIATE
topicType: TUTORIAL
cover: /images/covers/web101-04-idor.svg
---

Bạn xem hoá đơn của mình ở địa chỉ `/invoices/1002`. Tò mò, bạn sửa số cuối thành `1003` — và hoá đơn của một người lạ hiện ra, đầy đủ tên, địa chỉ, số điện thoại. Không cần công cụ, không cần payload. Chỉ là một con số.

Đây là **IDOR (Insecure Direct Object Reference)**, thành viên nổi tiếng nhất của nhóm **Broken Access Control** — nhóm lỗi đứng **số 1** trong OWASP Top 10 (2021).

## Xác thực ≠ Phân quyền

Hai câu hỏi rất hay bị nhầm thành một:

- **Authentication (xác thực):** *Bạn là ai?*
- **Authorization (phân quyền):** *Bạn có được làm việc này với đối tượng này không?*

Phần lớn lỗi access control xảy ra vì code chỉ trả lời câu đầu tiên.

## Các dạng thường gặp

| Dạng | Mô tả | Ví dụ |
| ---- | ----- | ----- |
| IDOR (ngang hàng) | Truy cập dữ liệu của người dùng khác cùng cấp | Đổi `orderId`, `userId`, tên file |
| Leo thang đặc quyền (dọc) | Người dùng thường gọi được chức năng của admin | `POST /api/admin/users` không kiểm tra vai trò |
| Thiếu kiểm tra ở cấp chức năng | Nút bị ẩn trên giao diện nhưng API vẫn mở | Ẩn nút "Xoá" nhưng `DELETE /posts/5` vẫn chạy |
| Mass assignment | Client gửi thêm trường không được phép | Thêm `"role": "ADMIN"` vào body cập nhật hồ sơ |
| Forced browsing | Đoán đường dẫn không được liên kết | `/backup.zip`, `/admin/export` |

## Đoạn code có lỗi

```js
// ❌ Đã đăng nhập là xem được mọi đơn hàng
app.get("/api/orders/:id", requireLogin, async (req, res) => {
  const order = await db.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).end();
  res.json(order);
});
```

`requireLogin` chỉ trả lời "bạn là ai". Không dòng nào hỏi "đơn hàng này có phải của bạn không".

## Cách sửa

### 1. Ràng buộc quyền sở hữu ngay trong truy vấn

```js
// ✅ Chỉ tìm trong phạm vi dữ liệu của người đang đăng nhập
app.get("/api/orders/:id", requireLogin, async (req, res) => {
  const order = await db.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!order) return res.status(404).end(); // 404 để không lộ đơn hàng có tồn tại hay không
  res.json(order);
});
```

### 2. Tập trung logic phân quyền vào một nơi

Rải `if (user.role === "ADMIN")` khắp nơi là công thức để sót. Hãy gom về các hàm chính sách:

```js
// permissions.js
export const canEditPost = (actor, post) =>
  actor.status === "ACTIVE" && (actor.role === "ADMIN" || post.authorId === actor.id);

// route
if (!canEditPost(req.user, post)) return res.status(403).json({ message: "Không có quyền" });
```

### 3. Chặn mass assignment bằng allowlist trường

```js
// ❌ Client quyết định cập nhật trường nào
await db.user.update({ where: { id: req.user.id }, data: req.body });

// ✅ Server quyết định
const { displayName, bio } = req.body;
await db.user.update({ where: { id: req.user.id }, data: { displayName, bio } });
```

### 4. Mặc định từ chối

Route mới phải **bị chặn cho tới khi được cấp quyền rõ ràng**, không phải ngược lại. Đặt middleware phân quyền ở tầng router thay vì nhớ thêm vào từng handler.

## "Mình dùng UUID nên không lo"?

UUID khiến ID khó đoán, nhưng **không phải là kiểm soát truy cập**. ID vẫn lộ qua link chia sẻ, log, response của API khác, lịch sử trình duyệt. Hãy coi UUID là lớp làm chậm, còn kiểm tra quyền mới là thứ chặn.

## Checklist kiểm thử trong lab

Cách hiệu quả nhất là dùng **hai tài khoản** A và B cùng lúc:

1. Dùng A tạo dữ liệu (đơn hàng, bài viết, file). Ghi lại các ID.
2. Đăng nhập B, gọi lại đúng các request đó với ID của A — đọc, sửa, xoá.
3. Thử đổi phương thức: giao diện chỉ có `GET` nhưng `PUT`/`DELETE` có được chấp nhận không?
4. Dùng tài khoản thường gọi các endpoint `/admin/...`.
5. Thêm trường lạ vào body: `role`, `isAdmin`, `userId`, `status`, `price`.
6. Gọi API khi **không** gửi cookie/token.

```bash
# Ví dụ: dùng phiên của B để đọc tài nguyên của A trong lab
curl -s -b "session=$SESSION_B" https://app.lab/api/orders/$ORDER_ID_OF_A
```

Nếu bất kỳ bước nào thành công, bạn vừa tìm thấy một lỗi access control.

## Ghi nhớ nhanh

- Mỗi request phải trả lời được: *ai* đang làm *gì* trên *đối tượng nào*.
- Kiểm tra quyền **ở server**, trên từng đối tượng, không dựa vào việc ẩn nút.
- Lọc theo chủ sở hữu ngay trong câu truy vấn.
- Allowlist trường được cập nhật; mặc định từ chối; ghi log các lần bị từ chối.
