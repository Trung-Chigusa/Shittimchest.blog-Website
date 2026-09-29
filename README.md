# Wanna Denia Team

Web platform cho cộng đồng CTF, cybersecurity, network, system và blog tri thức. Project dùng Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, OTP Gmail, JWT cookie, role-based access control và Docker Compose để mang lên Ubuntu LXC trong Proxmox.

## Tính năng chính

- Public home, public blog, blog detail render Markdown có sanitize.
- Đăng ký bằng email/password, gửi OTP qua Gmail SMTP, OTP lưu dạng hash và hết hạn.
- Login bằng JWT httpOnly cookie, CSRF double-submit cho mutation API.
- Dashboard member tạo bài, draft/pending/publish theo quyền, Markdown preview, upload cover ảnh an toàn.
- Admin/moderator duyệt hoặc reject bài pending.
- i18n 3 ngôn ngữ: `vi`, `en`, `ja`.
- Video nền `public/videos/nen web.mp4` đã được copy sẵn.
- Docker Compose gồm app, PostgreSQL và Nginx reverse proxy mẫu.

## Chạy nhanh trên Ubuntu LXC

```bash
sudo apt update
sudo apt install -y ca-certificates curl git openssl
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
newgrp docker
```

Copy thư mục `wanna-denia-team` lên LXC, sau đó:

```bash
cd wanna-denia-team
cp .env.example .env
openssl rand -hex 32
openssl rand -hex 32
nano .env
docker compose up -d --build
docker compose logs -f app
```

Mở:

- App trực tiếp: `http://IP-LXC:3000`
- Qua Nginx mẫu: `http://IP-LXC:8080`

Tài khoản seed demo:

- Email: `admin@wannadenia.local`
- Password: `Admin@123456`

Đổi mật khẩu admin ngay nếu deploy public.

## Cấu hình Gmail SMTP

Trong `.env`, điền:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="Wanna Denia Team <your-gmail@gmail.com>"
```

`SMTP_PASS` nên là Gmail App Password, không dùng mật khẩu Gmail chính.

## Database và seed

Container app tự chạy:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Chạy thủ công khi cần:

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
docker compose exec app npx prisma validate
```

## Backup và restore PostgreSQL

Backup:

```bash
docker compose exec -T postgres pg_dump -U wanna -d wanna_denia > wanna_denia_backup.sql
```

Restore:

```bash
cat wanna_denia_backup.sql | docker compose exec -T postgres psql -U wanna -d wanna_denia
```

## Development local

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run prisma:validate
```

## Update app an toàn trên LXC

```bash
cd wanna-denia-team
docker compose exec -T postgres pg_dump -U wanna -d wanna_denia > "backup-$(date +%F).sql"
git pull
docker compose up -d --build
docker compose logs -f app
```

## Ghi chú production

- Đổi `AUTH_SECRET`, `JWT_SECRET`, `SMTP_PASS`, password PostgreSQL trước khi public.
- Đặt reverse proxy HTTPS bằng Nginx/Caddy và Let's Encrypt.
- Chỉ mở port cần thiết bằng firewall.
- Backup DB định kỳ.
- Theo dõi log app, Nginx và PostgreSQL.
- Nếu dùng Internet public lớn, thay in-memory rate limit bằng Redis.

Xem thêm [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md).
