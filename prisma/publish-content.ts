/**
 * Publishes a folder of Markdown posts (with YAML front matter) as a blog series.
 *
 *   npx tsx prisma/publish-content.ts content/web-security-101 [--dry-run]
 *
 * Safe to re-run: posts are matched by slug. Existing posts get their text, cover,
 * tags and metadata refreshed; status, publish date, author and view count are kept.
 * The author is CONTENT_AUTHOR_EMAIL if set, otherwise the oldest ADMIN account.
 */
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { PrismaClient, type Difficulty, type PostLanguage, type TopicType } from "@prisma/client";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

const difficulties: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const topicTypes: TopicType[] = ["CTF", "TUTORIAL", "NOTE", "RESEARCH", "LAB", "TOOL"];
const languages: PostLanguage[] = ["vi", "en", "ja"];

type Series = { title: string; language: PostLanguage; navHeading: string; navIntro: string; currentLabel: string };

type Entry = {
  file: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  difficulty: Difficulty;
  topicType: TopicType;
  cover: string | null;
  body: string;
};

function fail(file: string, message: string): never {
  throw new Error(`${file}: ${message}`);
}

/** Mirrors the limits in lib/validators.ts so published posts stay editable in the dashboard. */
function parseEntry(dir: string, file: string): Entry {
  const { data, content } = matter(readFileSync(path.join(dir, file), "utf8"));
  const title = String(data.title ?? "").trim();
  const slug = String(data.slug ?? "").trim();
  const excerpt = String(data.excerpt ?? "").trim();
  const tags: string[] = Array.isArray(data.tags) ? data.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [];

  if (title.length < 5 || title.length > 150) fail(file, "title must be 5–150 characters");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 120) fail(file, "invalid slug");
  if (!excerpt || excerpt.length > 300) fail(file, `excerpt must be 1–300 characters (got ${excerpt.length})`);
  if (!data.category) fail(file, "category (slug) is required");
  if (tags.length > 10 || tags.some((tag) => tag.length > 32)) fail(file, "at most 10 tags of 32 characters");
  if (!difficulties.includes(data.difficulty)) fail(file, `difficulty must be one of ${difficulties.join(", ")}`);
  if (!topicTypes.includes(data.topicType)) fail(file, `topicType must be one of ${topicTypes.join(", ")}`);
  if (!content.trim()) fail(file, "post body is empty");

  return {
    file,
    title,
    slug,
    excerpt,
    category: String(data.category),
    tags,
    difficulty: data.difficulty,
    topicType: data.topicType,
    cover: data.cover ? String(data.cover) : null,
    body: content.trim(),
  };
}

/** "Series" footer appended to every post, with the current part highlighted. */
function seriesNav(series: Series, entries: Entry[], current: Entry) {
  const items = entries.map((entry, index) =>
    entry.slug === current.slug
      ? `${index + 1}. **${entry.title}** *(${series.currentLabel})*`
      : `${index + 1}. [${entry.title}](/${series.language}/blog/${entry.slug})`,
  );
  return `\n\n---\n\n## ${series.navHeading}\n\n${series.navIntro}\n\n${items.join("\n")}\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dir = args.find((arg) => !arg.startsWith("--"));
  if (!dir) throw new Error("Usage: tsx prisma/publish-content.ts <content-dir> [--dry-run]");

  const series = JSON.parse(readFileSync(path.join(dir, "series.json"), "utf8")) as Series;
  if (!languages.includes(series.language)) throw new Error("series.json: unsupported language");

  const entries = readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => parseEntry(dir, file));
  if (!entries.length) throw new Error(`No .md files in ${dir}`);

  const duplicate = entries.find((entry, index) => entries.findIndex((other) => other.slug === entry.slug) !== index);
  if (duplicate) fail(duplicate.file, `duplicate slug ${duplicate.slug}`);

  console.log(`${series.title}: ${entries.length} posts${dryRun ? " (dry run)" : ""}`);
  if (dryRun) {
    for (const entry of entries) console.log(`  ok  ${entry.slug}  (${entry.body.length} chars)`);
    return;
  }

  const authorEmail = process.env.CONTENT_AUTHOR_EMAIL;
  const author = authorEmail
    ? await prisma.user.findUnique({ where: { email: authorEmail.toLowerCase() } })
    : await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" }, orderBy: { createdAt: "asc" } });
  if (!author) throw new Error("No author found: set CONTENT_AUTHOR_EMAIL or create an ADMIN account");
  console.log(`  author: ${author.displayName}`);

  const now = Date.now();
  for (const [index, entry] of entries.entries()) {
    const category = await prisma.category.findUnique({ where: { slug: entry.category }, select: { id: true } });
    if (!category) fail(entry.file, `category "${entry.category}" does not exist`);

    const shared = {
      title: entry.title,
      excerpt: entry.excerpt,
      content: entry.body + seriesNav(series, entries, entry),
      coverImage: entry.cover,
      categoryId: category.id,
      language: series.language,
      difficulty: entry.difficulty,
      topicType: entry.topicType,
    };

    const existing = await prisma.post.findUnique({ where: { slug: entry.slug }, select: { id: true } });
    const post = existing
      ? await prisma.post.update({ where: { id: existing.id }, data: shared })
      : await prisma.post.create({
          data: {
            ...shared,
            slug: entry.slug,
            authorId: author.id,
            status: "PUBLISHED",
            // Part 1 gets the newest timestamp so the series lists in reading order.
            publishedAt: new Date(now - index * 60_000),
          },
        });

    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    for (const name of entry.tags) {
      const tagSlug = slugify(name);
      if (!tagSlug) continue;
      const tag = await prisma.tag.upsert({ where: { slug: tagSlug }, update: {}, create: { name, slug: tagSlug } });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
    }

    console.log(`  ${existing ? "updated" : "created"}  ${entry.slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
