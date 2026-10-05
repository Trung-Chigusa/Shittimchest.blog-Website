---
title: "Command Injection: một dấu chấm phẩy và server chạy lệnh lạ"
slug: web-101-command-injection
excerpt: "Khi ứng dụng ghép dữ liệu người dùng vào lệnh hệ thống, một ký tự đặc biệt đủ để chạy lệnh khác. Vì sao shell là thủ phạm và cách gọi tiến trình con an toàn trong Node.js, Python."
category: web-security
tags: [web, owasp, command-injection, rce, injection, intermediate]
difficulty: INTERMEDIATE
topicType: TUTORIAL
cover: /images/covers/web101-08-cmdi.svg
---

Một trang quản trị có công cụ nhỏ: nhập địa chỉ IP, bấm "Ping", xem kết quả. Lập trình viên viết nó trong năm phút bằng cách gọi lệnh `ping` của hệ điều hành. Rồi một ngày, ai đó nhập `8.8.8.8; cat /etc/passwd` — và trang web in ra cả kết quả ping lẫn danh sách tài khoản của máy chủ.

Đây là **OS Command Injection**: anh em họ của SQL Injection, nhưng thứ bị chèn lệnh không phải database mà là **shell của hệ điều hành**. Hậu quả thường là chiếm toàn bộ máy chủ.

## Thủ phạm thật sự: shell

Shell (`sh`, `bash`, `cmd.exe`) không chỉ chạy chương trình. Nó **diễn giải** cả một ngôn ngữ nhỏ với các ký tự đặc biệt:

| Ký tự | Ý nghĩa với shell |
| ----- | ----------------- |
| `;` | Kết thúc lệnh, chạy lệnh tiếp theo |
| `&&` / `\|\|` | Chạy lệnh sau nếu lệnh trước thành công / thất bại |
| `\|` | Chuyển đầu ra sang lệnh khác |
| `` `...` `` và `$(...)` | Chạy lệnh con và chèn kết quả vào |
| `>` `<` | Ghi / đọc file |
| Xuống dòng | Bắt đầu lệnh mới |

Khi bạn đưa chuỗi do người dùng nhập cho shell, bạn cho họ dùng cả ngôn ngữ đó.

## Đoạn code có lỗi

```js
import { exec } from "node:child_process";

// ❌ exec() chạy chuỗi lệnh qua shell
app.get("/tools/ping", (req, res) => {
  exec(`ping -c 1 ${req.query.host}`, (error, stdout) => res.send(`<pre>${stdout}</pre>`));
});
```

Với `host=8.8.8.8; id`, shell nhận được `ping -c 1 8.8.8.8; id` — hai lệnh riêng biệt, và lệnh thứ hai do người lạ chọn.

Phiên bản Python của cùng lỗi:

```python
# ❌ shell=True + ghép chuỗi
subprocess.run(f"ping -c 1 {host}", shell=True)
```

## Khi không thấy kết quả: injection "mù"

Nhiều tính năng chạy lệnh ở nền và không in đầu ra (nén file, chuyển đổi video, gửi mail). Lỗi vẫn ở đó, chỉ là khó thấy hơn. Trong lab, người kiểm thử xác nhận bằng:

- **Độ trễ:** chèn lệnh `sleep 5` và đo thời gian phản hồi.
- **Kênh ngoài:** khiến server gọi DNS/HTTP tới máy chủ của người kiểm thử.

Với người phòng thủ: *không hiển thị đầu ra không phải là biện pháp bảo vệ.*

## Cách phòng chống

### 1. Tốt nhất: đừng gọi lệnh hệ thống

Hầu hết việc cần làm đều có thư viện: kiểm tra kết nối bằng socket, nén bằng thư viện zip, xử lý ảnh bằng thư viện ảnh, thao tác file bằng API của ngôn ngữ. Không có shell thì không có shell injection.

### 2. Buộc phải gọi: không qua shell, truyền tham số dạng mảng

```js
import { execFile } from "node:child_process";
import { isIP } from "node:net";

app.get("/tools/ping", (req, res) => {
  const host = String(req.query.host ?? "");
  // ✅ Allowlist: chỉ nhận địa chỉ IP hợp lệ
  if (!isIP(host)) return res.status(400).json({ message: "IP không hợp lệ" });

  // ✅ execFile không dùng shell: mỗi phần tử là đúng một tham số
  execFile("ping", ["-c", "1", host], { timeout: 5000 }, (error, stdout) => {
    res.type("text/plain").send(stdout);
  });
});
```

```python
# ✅ Danh sách tham số, không shell=True
subprocess.run(["ping", "-c", "1", host], timeout=5, check=False)
```

Khi không có shell, `;` hay `$(...)` chỉ là ký tự bình thường nằm trong một tham số.

### 3. Vẫn phải validate: argument injection

Bỏ shell chưa đủ. Nếu giá trị bắt đầu bằng dấu `-`, chương trình đích có thể hiểu nó là **tuỳ chọn**:

```bash
# Người dùng nhập "-oProxyCommand=..." cho một tính năng gọi ssh
# Người dùng nhập "--output=/var/www/html/x.php" cho một tính năng gọi curl
```

Biện pháp:

- Validate theo **allowlist** chặt (IP, số, tên file khớp `^[a-zA-Z0-9._-]+$`).
- Dùng `--` để báo hết phần tuỳ chọn khi chương trình hỗ trợ: `["--", userValue]`.

### 4. Giảm thiệt hại

- Ứng dụng chạy bằng **tài khoản quyền thấp**, không phải `root`.
- Chạy trong container tối giản, hệ thống file chỉ đọc, không có công cụ thừa.
- Chặn kết nối ra Internet từ máy chủ ứng dụng nếu không cần.
- Đặt `timeout` cho mọi tiến trình con.

## Những nơi hay ẩn lỗi này

- Công cụ chẩn đoán mạng trong trang quản trị (ping, traceroute, nslookup).
- Xử lý file: chuyển đổi ảnh/video/PDF bằng công cụ dòng lệnh, giải nén.
- Tích hợp Git, sao lưu, xuất báo cáo.
- Thiết bị nhúng và router — nơi lỗi này đặc biệt phổ biến.
- Các hàm "tiện lợi": `exec`, `system`, `popen`, `shell_exec`, dấu backtick trong PHP/Ruby/Perl, `os.system`, `Runtime.exec` với `sh -c`.

```bash
# Rà nhanh các lời gọi nguy hiểm trong project
grep -rnE "child_process|exec\(|execSync|shell=True|os\.system|popen|shell_exec|system\(" src/
```

## Checklist kiểm thử trong lab

1. Tìm tham số có vẻ được đưa cho lệnh hệ thống: tên máy, IP, tên file, định dạng, tuỳ chọn.
2. Thêm từng ký tự đặc biệt và quan sát lỗi hoặc thay đổi thời gian phản hồi.
3. Thử giá trị bắt đầu bằng `-` để phát hiện argument injection.
4. Kiểm tra tiến trình ứng dụng đang chạy bằng tài khoản nào.

## Ghi nhớ nhanh

- Không ghép dữ liệu người dùng vào chuỗi lệnh. Không `shell=True`, không `exec` với template string.
- Ưu tiên thư viện thay cho lệnh hệ thống.
- Buộc phải gọi: `execFile`/`spawn` với mảng tham số + allowlist + `--`.
- Quyền thấp, container, timeout để giới hạn thiệt hại.
