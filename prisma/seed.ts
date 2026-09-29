import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient, PostLanguage, PostStatus, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

const categories = [
  ["CTF Writeups", "ctf-writeups", "Flag hunts, exploitation notes, crypto and reverse writeups.", "flag"],
  ["Web Security", "web-security", "OWASP, auth, SSRF, XSS, SQL injection and secure coding.", "shield"],
  ["Network Security", "network-security", "Packet analysis, routing, firewall and network labs.", "network"],
  ["System Administration", "system-administration", "Linux, Windows, hardening, monitoring and automation.", "server"],
  ["Blue Team / SOC", "blue-team-soc", "Detection engineering, SIEM, logs and incident response.", "radar"],
  ["Red Team Basics", "red-team-basics", "Responsible offensive security fundamentals.", "terminal"],
  ["Forensics", "forensics", "Disk, memory, log and timeline analysis.", "search"],
  ["Malware Analysis Notes", "malware-analysis-notes", "Safe reversing notes and defensive observations.", "bug"],
  ["Linux / Windows", "linux-windows", "Operating system notes for builders and defenders.", "laptop"],
  ["Tools & Labs", "tools-labs", "Hands-on lab guides and tool workflows.", "flask"],
] as const;

const tags = [
  "ctf",
  "web",
  "blue-team",
  "red-team",
  "linux",
  "windows",
  "soc",
  "forensics",
  "network",
  "beginner",
  "lab",
];

const posts = [
  {
    language: PostLanguage.vi,
    title: "Bắt đầu với CTF Web: đọc request trước khi tấn công",
    excerpt:
      "Một ghi chú nhập môn về cách quan sát request, cookie, header và response để tránh đoán mò trong bài CTF web.",
    categorySlug: "web-security",
    tags: ["ctf", "web", "beginner"],
    content: `# Bắt đầu với CTF Web

Khi gặp một bài web CTF, đừng vội ném payload. Hãy xem ứng dụng đang nói gì với bạn.

## Checklist nhanh

- Mở DevTools và đọc request/response.
- Kiểm tra cookie, header, redirect và status code.
- Ghi lại mọi endpoint xuất hiện trong UI.
- Dùng payload nhỏ để xác nhận giả thuyết.

\`\`\`http
GET /profile?id=1 HTTP/1.1
Host: lab.local
Cookie: session=...
\`\`\`

Wanna Denia Team ưu tiên học chắc, làm thật và chia sẻ lại bằng writeup dễ đọc.`,
  },
  {
    language: PostLanguage.en,
    title: "SOC Notes: Turn Noisy Logs Into Useful Signals",
    excerpt:
      "A practical beginner note on grouping events, keeping context, and writing tiny detection hypotheses.",
    categorySlug: "blue-team-soc",
    tags: ["blue-team", "soc", "beginner"],
    content: `# SOC Notes

The first job is not to collect every log forever. The first job is to preserve enough context to ask better questions.

## A small workflow

- Group by user, host, process and time window.
- Keep the raw event beside your interpretation.
- Write one detection hypothesis at a time.

\`\`\`yaml
hypothesis: "PowerShell launched from Office should be rare"
fields:
  - parent_process
  - command_line
  - user
\`\`\`

Small notes compound into operational clarity.`,
  },
  {
    language: PostLanguage.ja,
    title: "Linux Lab: 最初のハードニングメモ",
    excerpt:
      "Linux サーバーを安全に運用するための、初心者向けの短いチェックリストです。",
    categorySlug: "linux-windows",
    tags: ["linux", "beginner", "lab"],
    content: `# Linux Lab

安全なサーバー運用は、小さな確認の積み重ねです。

## 最初のチェック

- 不要なサービスを停止する。
- SSH の設定を確認する。
- 更新を定期的に適用する。
- ログを読み、異常を記録する。

\`\`\`bash
sudo ss -tulpn
sudo journalctl -p warning -n 50
\`\`\`

Wanna Denia Team は、学び、実践し、共有するコミュニティです。`,
  },
];

async function main() {
  for (const [name, slug, description, icon] of categories) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, description, icon },
      create: { name, slug, description, icon },
    });
  }

  for (const name of tags) {
    await prisma.tag.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
  }

  // The seed runs on every container start. The admin account is only created once;
  // an existing account (and its password) is never touched here.
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@wannadenia.local";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  let initialPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!existingAdmin && !initialPassword) {
    // Never fall back to a well-known password: generate one and show it once.
    initialPassword = `${randomBytes(9).toString("base64url")}#A1`;
    console.log(`[seed] Created admin ${adminEmail} with generated password: ${initialPassword}`);
  }
  const admin =
    existingAdmin ??
    (await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hashPassword(initialPassword!),
        displayName: "Wanna Denia Admin",
        role: UserRole.ADMIN,
        emailVerified: true,
        bio: "Administrator account. Change this password before public deployment.",
      },
    }));

  // Sample posts only go into an empty blog. Previously every restart overwrote their
  // content, reset publishedAt to "now" and re-created them after an admin deleted them.
  if ((await prisma.post.count()) > 0) return;

  for (const sample of posts) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: sample.categorySlug },
    });
    const slug = slugify(sample.title);
    const post = await prisma.post.create({
      data: {
        title: sample.title,
        slug,
        excerpt: sample.excerpt,
        content: sample.content,
        language: sample.language,
        categoryId: category.id,
        authorId: admin.id,
        coverImage: `/images/${sample.categorySlug}.svg`,
        status: PostStatus.PUBLISHED,
        difficulty: "BEGINNER",
        topicType: sample.categorySlug === "web-security" ? "CTF" : "NOTE",
        seoTitle: sample.title,
        seoDescription: sample.excerpt,
        publishedAt: new Date(),
      },
    });

    for (const tagName of sample.tags) {
      const tag = await prisma.tag.findUniqueOrThrow({ where: { slug: slugify(tagName) } });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
