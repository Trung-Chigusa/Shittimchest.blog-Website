---
title: "Path Traversal: ../../ và hành trình đọc file ngoài ý muốn"
slug: web-101-path-traversal
excerpt: "Một tham số tên file và vài dấu ../ đủ để đọc file cấu hình, mã nguồn hay khoá bí mật. Cách lỗi này hoạt động, các biến thể như LFI và Zip Slip, và cách chặn bằng việc chuẩn hoá đường dẫn."
category: web-security
tags: [web, owasp, path-traversal, lfi, beginner]
difficulty: BEGINNER
topicType: TUTORIAL
cover: /images/covers/web101-09-path.svg
---

Trang tải tài liệu có đường dẫn `/download?file=bao-cao.pdf`. Nếu thay tên file bằng `../../../../etc/passwd` thì sao? Với khá nhiều ứng dụng, câu trả lời là: bạn nhận được file `passwd` của máy chủ.

**Path Traversal** (còn gọi là Directory Traversal) xảy ra khi ứng dụng dùng dữ liệu người dùng để tạo đường dẫn file mà không đảm bảo kết quả vẫn nằm trong thư mục cho phép.

## `..` nghĩa là gì?

Trong mọi hệ điều hành phổ biến, `..` nghĩa là "thư mục cha". Ghép đủ nhiều `../` và bạn leo lên tận thư mục gốc, rồi từ đó đi xuống bất kỳ đâu:

```text
/var/www/app/files/  +  ../../../../etc/passwd
                     =  /etc/passwd
```

## Đoạn code có lỗi

```js
import path from "node:path";

// ❌ Tên file đi thẳng vào đường dẫn
app.get("/download", (req, res) => {
  const filePath = path.join(__dirname, "files", req.query.file);
  res.sendFile(filePath);
});
```

Nhiều người nghĩ `path.join` là an toàn. Thực tế nó **chuẩn hoá** `..` — tức là giúp kẻ tấn công thoát ra ngoài một cách gọn gàng:

```js
path.join("/var/www/app/files", "../../../../etc/passwd");
// → "/etc/passwd"
```

## Kẻ tấn công nhắm tới file nào?

| Mục tiêu | Vì sao giá trị |
| -------- | -------------- |
| `.env`, file cấu hình | Mật khẩu database, khoá API, secret ký phiên |
| Mã nguồn ứng dụng | Tìm thêm lỗi khác, thông tin hệ thống nội bộ |
| `~/.ssh/id_rsa`, khoá riêng TLS | Đăng nhập thẳng vào máy chủ, giả mạo dịch vụ |
| `/etc/passwd`, `/proc/self/environ` | Danh sách tài khoản, biến môi trường của tiến trình |
| File log | Token, dữ liệu người dùng, đôi khi cả mật khẩu |

## Các biến thể cần biết

**Vượt bộ lọc ngây thơ.** Nếu ứng dụng chỉ xoá chuỗi `../` một lần hoặc chỉ kiểm tra dạng thô, vẫn còn nhiều cách viết khác:

| Biến thể | Ví dụ |
| -------- | ----- |
| Mã hoá URL | `%2e%2e%2f` |
| Mã hoá hai lần | `%252e%252e%252f` |
| Lồng nhau | `....//` (xoá `../` một lần sẽ còn lại `../`) |
| Dấu gạch chéo Windows | `..\..\` |
| Đường dẫn tuyệt đối | `/etc/passwd` thay vì leo từng cấp |

**Local File Inclusion (LFI).** Khi tên file được đưa vào lệnh *nạp và chạy code* (`include` trong PHP, template engine), lỗi không chỉ dừng ở đọc file: nếu kẻ tấn công đưa được nội dung của họ vào một file trên máy chủ, LFI có thể leo thang thành thực thi mã.

**Zip Slip.** File nén chứa mục có tên `../../shell.jsp`. Thư viện giải nén ghi đúng theo tên đó và file rơi ra ngoài thư mục đích. Lỗi tương tự xảy ra với tên file trong form upload.

## Cách phòng chống

### 1. Tốt nhất: không nhận đường dẫn từ người dùng

Cho người dùng chọn bằng **ID**, server tự tra ra file:

```js
// ✅ Người dùng chỉ gửi ID; đường dẫn thật nằm trong database
app.get("/download/:id", requireLogin, async (req, res) => {
  const doc = await db.document.findFirst({ where: { id: req.params.id, ownerId: req.user.id } });
  if (!doc) return res.status(404).end();
  res.download(doc.storagePath, doc.displayName);
});
```

Cách này tiện thể giải quyết luôn bài toán phân quyền.

### 2. Buộc phải nhận tên file: chuẩn hoá rồi kiểm tra

```js
import path from "node:path";

const BASE = path.resolve("files");

app.get("/download", (req, res) => {
  const name = String(req.query.file ?? "");
  const target = path.resolve(BASE, name); // chuẩn hoá thành đường dẫn tuyệt đối

  // ✅ Kết quả cuối cùng phải nằm bên trong thư mục cho phép
  if (!target.startsWith(BASE + path.sep)) {
    return res.status(400).json({ message: "Tên file không hợp lệ" });
  }
  res.sendFile(target);
});
```

Thứ tự là mấu chốt: **giải mã → chuẩn hoá → kiểm tra → dùng đúng giá trị đã kiểm tra.** Kiểm tra chuỗi thô rồi mới chuẩn hoá là sai lầm kinh điển.

Nếu thư mục có thể chứa symlink, hãy dùng `fs.realpath` để lấy đường dẫn thật trước khi so sánh.

### 3. Allowlist tên file

Khi tên file chỉ cần là chữ, số và vài ký tự an toàn:

```js
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(name) || name.includes("..")) {
  return res.status(400).json({ message: "Tên file không hợp lệ" });
}
```

### 4. Giới hạn quyền của tiến trình

- Ứng dụng chạy bằng tài khoản chỉ đọc được đúng thư mục nó cần.
- Chạy trong container; không đặt khoá bí mật trong cùng hệ thống file nếu tránh được.
- Khi giải nén, kiểm tra từng mục bằng đúng cách ở mục 2 trước khi ghi.

## Checklist kiểm thử trong lab

1. Tìm mọi tham số trông như tên file, đường dẫn, tên template, ngôn ngữ, giao diện (`file`, `path`, `page`, `template`, `lang`, `theme`).
2. Thử leo thư mục tới một file chắc chắn tồn tại (`/etc/passwd` trên Linux, `C:\Windows\win.ini` trên Windows).
3. Nếu bị chặn, thử các biến thể mã hoá và đường dẫn tuyệt đối.
4. Kiểm tra cả chiều **ghi**: tên file khi upload, tên mục trong file nén.
5. Đừng quên header và cookie — đôi khi tên template nằm ở đó.

## Ghi nhớ nhanh

- Tránh nhận đường dẫn từ người dùng; dùng ID ánh xạ tới file.
- Nếu phải nhận: `resolve` → kiểm tra nằm trong thư mục gốc → dùng giá trị đã kiểm tra.
- `path.join` không phải bộ lọc.
- Áp dụng cho cả đọc, ghi, giải nén và `include`.
