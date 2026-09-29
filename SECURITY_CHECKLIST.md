# Security Checklist

## Đã hoàn thành

- Password hash bằng `bcryptjs` cost 12.
- OTP sinh 6 số, lưu hash, hết hạn theo `OTP_EXPIRES_MINUTES`, giới hạn attempts.
- JWT session trong cookie `httpOnly`, `sameSite=lax`, `secure` khi production.
- CSRF double-submit cho API mutation.
- Zod validation cho register, login, reset password, post, comment, category, tag.
- Server-side RBAC cho user, author, moderator, admin.
- User thường chỉ sửa/xóa bài của mình; moderator/admin duyệt bài.
- Markdown render qua `react-markdown`, `rehype-sanitize`, không thực thi script.
- Upload ảnh chỉ nhận PNG/JPEG/WEBP, giới hạn 2MB, tên file UUID.
- Security headers trong Next.js và Nginx mẫu.
- Audit log cho register, login, logout, create/update/delete/review post và comment.
- Healthcheck `/api/health`.

## Test đã chạy

```text
npm run lint       PASS
npm run typecheck  PASS
npm run test       PASS, 6 files, 11 tests
npm run build      PASS
npx prisma validate PASS (với DATABASE_URL tạm trong terminal)
```

Không chạy được `docker compose config` trên máy tạo project vì Docker CLI chưa được cài trong môi trường hiện tại.

## Audit dependency

`npm audit --omit=dev` sau khi nâng Next.js lên `16.2.10` còn cảnh báo moderate liên quan PostCSS nằm trong dependency nội bộ của Next. `npm audit fix --force` hiện gợi ý downgrade Next không hợp lý, nên không áp dụng. Khi Next phát hành bản mới hơn `16.2.10`, hãy chạy:

```bash
npm install next@latest eslint-config-next@latest
npm audit --omit=dev
npm run build
```

## Lỗi thường gặp

- Không nhận OTP: kiểm tra Gmail App Password, `SMTP_FROM`, port `587`, log container app.
- Prisma báo thiếu `DATABASE_URL`: kiểm tra `.env` và `docker compose config`.
- App không lên: `docker compose ps`, `docker compose logs -f app`.
- Login admin demo không được: chạy lại `docker compose exec app npx prisma db seed`.
- Upload lỗi: file phải là PNG/JPEG/WEBP và nhỏ hơn 2MB.

## Nên làm thêm nếu public Internet

- HTTPS với Let's Encrypt.
- Nginx/Caddy reverse proxy port 80/443.
- Firewall chỉ mở SSH, HTTP, HTTPS.
- Backup PostgreSQL định kỳ và test restore.
- Monitoring log và disk usage.
- Redis rate limiter nếu scale nhiều container.
- Cập nhật dependency định kỳ.
