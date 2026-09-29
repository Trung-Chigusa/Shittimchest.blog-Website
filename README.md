# Wanna Denia Team · shittimchest.blog

Blog cộng đồng CTF, bảo mật thông tin, mạng và hệ thống. Next.js (App Router) + TypeScript + Tailwind CSS + Prisma/PostgreSQL, JWT cookie, CSRF double-submit, RBAC, i18n `vi` / `en` / `ja`.

## Giao diện

- Design system dùng CSS variables (`app/globals.css`) cho **light / dark / theo hệ thống**, chuyển bằng nút mặt trời/mặt trăng trên header, lưu vào `localStorage`, không bị nháy khi tải trang.
- Font Be Vietnam Pro (hỗ trợ tiếng Việt đầy đủ) + JetBrains Mono cho code.
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

Cập nhật một node (lặp lại cho 211 rồi 213 để không bị gián đoạn):

```bash
cd /opt/wanna-denia-team
# chép code mới vào (giữ nguyên .env)
docker compose build app
docker compose up -d app
docker compose logs -f app
```

`docker-compose.yml` đang chạy `npm start` nên **không** tự chạy migrate/seed. Schema không đổi trong đợt làm lại giao diện này nên không cần migrate.

Biến môi trường tuỳ chọn cho seed: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (chỉ dùng khi tạo admin lần đầu; seed không bao giờ đổi mật khẩu tài khoản đã có).

## Ghi chú production

- Đổi `AUTH_SECRET`, `JWT_SECRET`, `SMTP_PASS`, mật khẩu PostgreSQL trước khi public.
- Đổi mật khẩu tài khoản admin mặc định nếu vẫn còn dùng.
- Ảnh upload nằm trong volume Docker của từng node. Với 2 node, upload và `/uploads` phải cùng đi về một node (WAF có upstream `wanna_upload_backend` cho việc này) hoặc dùng storage chung (NFS/S3).
- Rate limit hiện lưu in-memory theo từng node; nếu public lớn nên chuyển sang Redis.

Xem thêm [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md).
