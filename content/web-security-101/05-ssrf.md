---
title: "SSRF: biến server của bạn thành người đưa thư cho kẻ tấn công"
slug: web-101-ssrf
excerpt: "Tính năng “nhập URL để server tải về” có thể mở đường vào mạng nội bộ và metadata của cloud. Cách SSRF hoạt động, vì sao lọc chuỗi là không đủ và cách phòng thủ nhiều lớp."
category: web-security
tags: [web, owasp, ssrf, cloud, intermediate]
difficulty: ADVANCED
topicType: TUTORIAL
cover: /images/covers/web101-05-ssrf.svg
---

"Dán link ảnh vào đây, hệ thống sẽ tự tải về làm avatar." Một tính năng tiện lợi — và cũng là lời mời. Thay vì link ảnh, ai đó dán vào `http://localhost:8080/admin`. Server của bạn ngoan ngoãn gửi request tới chính nó, lấy trang quản trị nội bộ và trả nội dung về cho người lạ.

Đây là **Server-Side Request Forgery (SSRF)**: kẻ tấn công không tự gửi request tới mục tiêu được — nên họ nhờ server của bạn gửi hộ, từ **bên trong** mạng.

## Vì sao SSRF nguy hiểm?

Server của bạn đứng ở vị trí đặc quyền:

- Nó nằm **sau firewall**, nhìn thấy các dịch vụ nội bộ không mở ra Internet (database, Redis, trang admin, hệ thống giám sát).
- Trên cloud, nó truy cập được **metadata service** tại `169.254.169.254` — nơi có thể chứa khoá truy cập tạm thời của máy chủ.
- Các dịch vụ nội bộ thường tin tưởng request đến từ `localhost` hoặc dải IP nội bộ và không yêu cầu đăng nhập.

Vụ rò rỉ dữ liệu Capital One năm 2019 (hơn 100 triệu hồ sơ) bắt đầu từ chính một lỗi SSRF truy cập metadata service.

## Tính năng nào hay dính?

- Tải ảnh / file từ URL, tạo ảnh xem trước cho link.
- Webhook: người dùng nhập URL để hệ thống gọi lại.
- Nhập dữ liệu từ nguồn ngoài (RSS, CSV, file cấu hình).
- Chuyển đổi tài liệu: xuất PDF từ HTML, render SVG, xử lý XML.

Hễ thấy **server gửi request tới địa chỉ do người dùng kiểm soát**, hãy nghĩ tới SSRF.

## Đoạn code có lỗi

```js
// ❌ Server tải bất kỳ URL nào người dùng đưa
app.post("/api/preview", async (req, res) => {
  const response = await fetch(req.body.url);
  res.send(await response.text());
});
```

Trong lab, gửi `{"url": "http://127.0.0.1:6379/"}` hay `{"url": "http://169.254.169.254/latest/meta-data/"}` là đủ thấy server chạm tới những nơi lẽ ra không ai bên ngoài chạm được.

## Vì sao lọc chuỗi không đủ?

Phản xạ đầu tiên là chặn `localhost` và `127.0.0.1`. Nhưng có rất nhiều cách viết khác cho cùng một địa chỉ, và người phòng thủ cần biết chúng tồn tại:

| Kỹ thuật vượt lọc | Ý tưởng |
| ----------------- | ------- |
| Dạng biểu diễn IP khác | Số thập phân, hệ 8, hệ 16, IPv6 (`[::1]`) đều trỏ về loopback |
| Tên miền trỏ về IP nội bộ | DNS của kẻ tấn công trả về `10.0.0.5` |
| Chuyển hướng (redirect) | URL hợp lệ trả về `302` tới địa chỉ nội bộ |
| DNS rebinding | Lần phân giải đầu ra IP công khai, lần sau ra IP nội bộ |
| Giao thức khác | `file://`, `gopher://`, `ftp://` nếu thư viện hỗ trợ |

Kết luận: **đừng kiểm tra chuỗi URL, hãy kiểm tra địa chỉ IP mà server thực sự kết nối tới.**

## Cách phòng chống

### 1. Tốt nhất: allowlist đích đến

Nếu tính năng chỉ cần gọi vài dịch vụ biết trước, đừng nhận URL tự do:

```js
const allowedHosts = new Set(["images.example-cdn.com", "avatars.example.org"]);
const url = new URL(req.body.url);
if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) {
  return res.status(400).json({ message: "Nguồn không được hỗ trợ" });
}
```

### 2. Buộc phải nhận URL tự do: phân giải rồi kiểm tra IP

```js
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

async function resolvePublicAddress(rawUrl) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Chỉ hỗ trợ http/https");

  const { address } = await lookup(url.hostname);
  // "unicast" = địa chỉ công khai; loopback, private, linkLocal... đều bị từ chối
  if (ipaddr.parse(address).range() !== "unicast") throw new Error("Địa chỉ nội bộ không được phép");

  return { url, address };
}
```

Hai chi tiết quyết định việc bộ lọc này có thật sự chặn được hay không:

- **Kết nối tới đúng IP vừa kiểm tra** (ghim IP), nếu không DNS rebinding sẽ đổi kết quả giữa lúc kiểm tra và lúc kết nối.
- **Tắt tự động redirect**, hoặc lặp lại toàn bộ bước kiểm tra cho từng lần chuyển hướng.

### 3. Các dải địa chỉ cần chặn

| Dải | Ý nghĩa |
| --- | ------- |
| `127.0.0.0/8`, `::1` | Loopback |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | Mạng nội bộ |
| `169.254.0.0/16` | Link-local, gồm metadata của cloud |
| `0.0.0.0/8`, `100.64.0.0/10`, `fc00::/7` | Các dải đặc biệt khác |

### 4. Phòng thủ ở tầng hạ tầng

- Dịch vụ gọi URL ngoài nên chạy trong **vùng mạng riêng**, firewall chặn chiều ra tới mạng nội bộ.
- Trên AWS, bật **IMDSv2** (yêu cầu token qua header mà SSRF đơn giản không gửi được).
- Dịch vụ nội bộ vẫn phải yêu cầu xác thực — đừng tin tưởng chỉ vì request đến từ mạng trong.
- Không trả nguyên response về cho người dùng; chỉ trả thứ tính năng cần (ảnh đã xử lý, tiêu đề trang).

## SSRF "mù"

Nhiều khi server không trả nội dung về, nhưng vẫn gửi request. Khi đó kẻ tấn công suy luận qua thời gian phản hồi, mã lỗi, hoặc truy vấn DNS/HTTP gửi tới máy chủ của họ. Với người phòng thủ: **không thấy dữ liệu trả về không có nghĩa là an toàn.**

## Checklist kiểm thử trong lab

1. Tìm mọi tham số nhận URL, tên miền hoặc IP (kể cả trong JSON, XML, header như `Referer`).
2. Trỏ tham số tới một máy chủ bạn kiểm soát để xác nhận server có gửi request.
3. Thử `http://127.0.0.1`, dải nội bộ của lab và địa chỉ metadata.
4. Thử một URL công khai trả về redirect tới địa chỉ nội bộ.
5. Quan sát sự khác biệt về thời gian và thông báo lỗi giữa cổng mở và cổng đóng.

## Ghi nhớ nhanh

- Server gửi request theo ý người dùng = nguy cơ SSRF.
- Allowlist đích đến khi có thể; nếu không, kiểm tra **IP sau khi phân giải** và ghim kết nối.
- Chỉ `http`/`https`, kiểm soát redirect.
- Chặn ở cả tầng mạng; bảo vệ metadata service; dịch vụ nội bộ vẫn cần xác thực.
