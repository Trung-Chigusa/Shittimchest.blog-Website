# Wanna Denia Team · shittimchest.blog

Blog cộng đồng CTF, bảo mật thông tin, mạng và hệ thống. Next.js (App Router) + TypeScript + Tailwind CSS + Prisma/PostgreSQL, JWT cookie, CSRF double-submit, RBAC, i18n `vi` / `en` / `ja`.

## Giao diện

- Phong cách **game HUD "Resonance"** (lấy cảm hứng từ các game action-RPG như Wuthering Waves, toàn bộ hình ảnh là thiết kế gốc): nền tối, chữ kem, nhấn vàng ánh kim, khung viền có góc bracket, nút vát góc, chữ HUD Chakra Petch.
- Mỗi danh mục "cộng hưởng" một nguyên tố màu (Quang phổ, Hỗn loạn, Khí động, Điện từ, Nhiệt hạch, Băng tinh); bài viết là thẻ Echo có sao độ hiếm theo độ khó.
- Tương tác (`components/fx/`): màn khởi động lần đầu mỗi phiên, nền hạt sao parallax theo chuột, con trỏ vòng sáng, hiệu ứng nổ khi click, thẻ nghiêng 3D + đốm sáng theo chuột, xuất hiện khi cuộn (CSS scroll-driven), âm thanh UI tổng hợp (tắt mặc định, nút loa trên header), phím tắt (`/`, `G H`, `G B`, `G D`, `?`), "+10 XP" khi thả tim, cấp Resonance + thanh XP trong dashboard.
- Tất cả hiệu ứng tắt khi người dùng bật *giảm chuyển động*; trên thiết bị cảm ứng không có con trỏ tuỳ biến.
- Font Be Vietnam Pro (hỗ trợ tiếng Việt đầy đủ) + Chakra Petch cho tiêu đề + JetBrains Mono cho code.
- Header dính, có menu mobile, menu tài khoản, đổi ngôn ngữ mà vẫn ở nguyên trang hiện tại.
- Blog: tìm kiếm, chip danh mục, lọc tag/ngôn ngữ/sắp xếp tự áp dụng, phân trang giữ bộ lọc.
- Trang bài viết: thanh tiến độ đọc, mục lục tự highlight, khối code có tô màu + nút copy, like/lưu có trạng thái, bình luận hiện ngay sau khi gửi.
- Dashboard theo tab: tổng quan, bài viết (sửa/xoá), trình soạn Markdown (toolbar, xem trước song song, chèn ảnh, upload ảnh bìa, Ctrl+S lưu nháp), bài đã lưu, hồ sơ.
- Admin: lọc theo trạng thái, duyệt/từ chối (có hộp nhập lý do), gỡ bài, danh sách thành viên.
- Đăng nhập / đăng ký / quên mật khẩu (OTP qua email) với kiểm tra form bằng tiếng Việt, đo độ mạnh mật khẩu, hiện/ẩn mật khẩu.

## Cấu trúc

```
app/[locale]/          trang theo ngôn ngữ (home, blog, blog/[slug], login, register,
                       forgot-password, dashboard, admin)
app/api/               API routes (auth, posts, comments, likes, bookmarks, uploads, admin)
components/ui/         Button, Input, Select, Textarea, Badge, Avatar, EmptyState, ConfirmDialog
components/layout/     Header, Footer, MobileMenu, UserMenu, ThemeToggle, LanguageSwitcher
components/blog/       PostCard, PostFilters, Pagination, MarkdownRenderer, CodeBlock, TOC…
components/dashboard/  DashboardShell, PostEditor, MyPostsList, AdminPanel
messages/*.json        chuỗi giao diện cho vi / en / ja (cùng cấu trúc, được kiểm tra kiểu)
lib/                   auth, csrf, db, i18n, format, validators, permissions…
prisma/                schema, migrations, seed
```

## Chạy local

```bash
npm install
cp .env.example .env        # sửa DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Kiểm tra chất lượng:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Triển khai (Proxmox LXC)

Hạ tầng hiện tại:

| CT  | Vai trò       | Ghi chú                                  |
| --- | ------------- | ---------------------------------------- |
| 211 | wanna-web     | Docker: app `:3000` + nginx mẫu `:8080`  |
| 213 | wanna-web-2   | Bản sao của 211 (load balance)           |
| 212 | wanna-waf     | Nginx WAF + TLS, upstream 211/213 `:3000` |
| 214 | wanna-db      | PostgreSQL                               |

> **Quan trọng:** 211 và 213 phải chạy **cùng một image**. Nếu mỗi node tự build riêng (hoặc một node còn bản cũ), HTML từ node này sẽ trỏ tới file CSS/JS mà node kia không có → trang hiện ra không có CSS. Vì vậy: build một lần, chuyển image sang node còn lại.

1. Build trên 211 (giữ nguyên `.env`, `docker-compose.yml`, `docker/nginx.conf`):

   ```bash
   cd /opt/wanna-denia-team
   docker compose build --build-arg BUILD_ID=$(date +%Y%m%d%H%M%S) app
   docker compose up -d app
   ```

2. Chuyển đúng image đó sang 213 (chạy trên host Proxmox):

   ```bash
   pct exec 211 -- sh -c 'docker save wanna-denia-team-app:latest | gzip -1 > /tmp/app.tgz'
   pct pull 211 /tmp/app.tgz /root/app.tgz && pct push 213 /root/app.tgz /tmp/app.tgz
   pct exec 213 -- sh -c 'gunzip -c /tmp/app.tgz | docker load && cd /opt/wanna-denia-team && docker compose up -d --no-build app'
   ```

3. Kiểm tra cả hai node có cùng build: `docker exec wanna-denia-app cat /app/.next/BUILD_ID`.

`docker-compose.yml` đang chạy `npm start` nên **không** tự chạy migrate/seed. Schema không đổi trong đợt làm lại giao diện này nên không cần migrate.

Biến môi trường tuỳ chọn cho seed: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (chỉ dùng khi tạo admin lần đầu; seed không bao giờ đổi mật khẩu tài khoản đã có).

## Ghi chú production

- Đổi `AUTH_SECRET`, `JWT_SECRET`, `SMTP_PASS`, mật khẩu PostgreSQL trước khi public.
- Đổi mật khẩu tài khoản admin mặc định nếu vẫn còn dùng.
- Ảnh upload nằm trong volume Docker của từng node. Với 2 node, upload và `/uploads` phải cùng đi về một node (WAF có upstream `wanna_upload_backend` cho việc này) hoặc dùng storage chung (NFS/S3).
- Rate limit hiện lưu in-memory theo từng node; nếu public lớn nên chuyển sang Redis.

Xem thêm [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md).
