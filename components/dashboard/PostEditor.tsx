"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bold,
  Code,
  Columns2,
  ExternalLink,
  Eye,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  PenLine,
  Quote,
  Send,
  SquareCode,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { StatusBadge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { fmt } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import { slugify } from "@/lib/slug";
import { cn, readingTime } from "@/lib/utils";

export type EditablePost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  categoryId: string;
  tags: string[];
  language: "vi" | "en" | "ja";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  topicType: "CTF" | "TUTORIAL" | "NOTE" | "RESEARCH" | "LAB" | "TOOL";
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  seoTitle: string | null;
  seoDescription: string | null;
};

function editorSchema(t: Dictionary) {
  const d = t.dashboard;
  return z.object({
    title: z.string().trim().min(5, d.titleLength).max(150, d.titleLength),
    slug: z
      .string()
      .trim()
      .refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), d.slugInvalid)
      .refine((value) => !value || (value.length >= 3 && value.length <= 120), d.slugInvalid),
    excerpt: z.string().max(300, d.excerptLength),
    content: z.string().refine((value) => value.trim().length > 0, d.contentRequired),
    coverImage: z.string().trim(),
    categoryId: z.string().min(1, d.categoryRequired),
    tagsText: z.string().max(400),
    language: z.enum(["vi", "en", "ja"]),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    topicType: z.enum(["CTF", "TUTORIAL", "NOTE", "RESEARCH", "LAB", "TOOL"]),
    seoTitle: z.string().max(150),
    seoDescription: z.string().max(180),
  });
}

type Values = z.infer<ReturnType<typeof editorSchema>>;
type Intent = "DRAFT" | "PENDING" | "PUBLISHED";
type Mode = "write" | "split" | "preview";
type ToolAction = "heading" | "bold" | "italic" | "link" | "code" | "codeBlock" | "quote" | "list" | "orderedList";

const tools: { action: ToolAction; icon: typeof Bold }[] = [
  { action: "heading", icon: Heading2 },
  { action: "bold", icon: Bold },
  { action: "italic", icon: Italic },
  { action: "link", icon: Link2 },
  { action: "code", icon: Code },
  { action: "codeBlock", icon: SquareCode },
  { action: "quote", icon: Quote },
  { action: "list", icon: List },
  { action: "orderedList", icon: ListOrdered },
];

const starter = "## Giới thiệu\n\nViết ghi chú CTF / bảo mật của bạn ở đây.\n\n```bash\nnmap -sV target.local\n```\n";

function parseTags(text: string) {
  return [...new Set(text.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 10);
}

export function PostEditor({
  categories,
  post,
  canPublish,
}: {
  categories: { id: string; name: string }[];
  post?: EditablePost | null;
  canPublish: boolean;
}) {
  const { locale, t } = useI18n();
  const d = t.dashboard;
  const toast = useToast();
  const router = useRouter();
  const schema = useMemo(() => editorSchema(t), [t]);
  const [mode, setMode] = useState<Mode>("write");
  const [uploading, setUploading] = useState<"cover" | "inline" | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? starter,
      coverImage: post?.coverImage ?? "",
      categoryId: post?.categoryId ?? categories[0]?.id ?? "",
      tagsText: post?.tags.join(", ") ?? "",
      language: post?.language ?? (locale as Values["language"]),
      difficulty: post?.difficulty ?? "BEGINNER",
      topicType: post?.topicType ?? "NOTE",
      seoTitle: post?.seoTitle ?? "",
      seoDescription: post?.seoDescription ?? "",
    },
  });

  const [content, title, coverImage, excerpt, tagsText] = useWatch({
    control,
    name: ["content", "title", "coverImage", "excerpt", "tagsText"],
  });
  const tags = parseTags(tagsText ?? "");
  const wordCount = (content ?? "").trim().split(/\s+/).filter(Boolean).length;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!isDirty || intent) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, intent]);

  /** Wraps the current selection (or inserts a placeholder) with Markdown syntax. */
  function applyFormat(before: string, after = "", placeholder = "", block = false) {
    const area = textareaRef.current;
    if (!area) return;
    const value = getValues("content");
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const needsNewline = block && start > 0 && value[start - 1] !== "\n";
    const prefix = (needsNewline ? "\n" : "") + before;
    const next = value.slice(0, start) + prefix + selected + after + value.slice(end);
    setValue("content", next, { shouldDirty: true, shouldValidate: Boolean(errors.content) });
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  function linePrefix(prefix: string) {
    const area = textareaRef.current;
    if (!area) return;
    const value = getValues("content");
    const lineStart = value.lastIndexOf("\n", area.selectionStart - 1) + 1;
    const end = area.selectionEnd;
    const block = value.slice(lineStart, end) || "";
    const lines = (block || "").split("\n");
    const updated = lines.map((line, index) => (prefix === "1. " ? `${index + 1}. ` : prefix) + line).join("\n");
    setValue("content", value.slice(0, lineStart) + updated + value.slice(end), { shouldDirty: true });
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(lineStart + updated.length, lineStart + updated.length);
    });
  }

  async function upload(file: File | undefined, target: "cover" | "inline") {
    if (!file) return;
    setUploading(target);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiRequest<{ url: string }>("/api/uploads", { form });
      if (target === "cover") {
        setValue("coverImage", data.url, { shouldDirty: true });
        toast(d.coverUploaded, "success");
      } else {
        const alt = file.name.replace(/\.[^.]+$/, "");
        applyFormat(`![${alt}](${data.url})\n`, "", "", true);
      }
    } catch (error) {
      toast(errorMessage(error, t), "error");
    } finally {
      setUploading(null);
      if (inlineImageRef.current) inlineImageRef.current.value = "";
    }
  }

  async function save(values: Values, status: Intent) {
    setIntent(status);
    const body = {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      content: values.content,
      coverImage: values.coverImage,
      categoryId: values.categoryId,
      tags: parseTags(values.tagsText),
      language: values.language,
      difficulty: values.difficulty,
      topicType: values.topicType,
      status,
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
    };
    try {
      const data = await apiRequest<{ post: { slug: string; status: string } }>(
        post ? `/api/posts/${encodeURIComponent(post.slug)}` : "/api/posts",
        { method: post ? "PUT" : "POST", json: body },
      );
      toast(d.saved, "success");
      reset({ ...values, slug: data.post.slug });
      if (!post) {
        router.push(`/${locale}/dashboard?tab=posts`);
      } else if (data.post.slug !== post.slug) {
        router.replace(`/${locale}/dashboard?tab=editor&edit=${encodeURIComponent(data.post.slug)}`);
      }
      router.refresh();
    } catch (error) {
      toast(errorMessage(error, t), "error");
    } finally {
      setIntent(null);
    }
  }

  const submit = (status: Intent) =>
    handleSubmit(
      (values) => save(values, status),
      () => {
        toast(d.invalidForm, "error");
        setMode((current) => (current === "preview" ? "write" : current));
      },
    );

  const contentField = register("content");

  function runTool(action: ToolAction) {
    switch (action) {
      case "heading":
        return linePrefix("## ");
      case "bold":
        return applyFormat("**", "**", "text");
      case "italic":
        return applyFormat("_", "_", "text");
      case "link":
        return applyFormat("[", "](https://)", "link");
      case "code":
        return applyFormat("`", "`", "code");
      case "codeBlock":
        return applyFormat("```bash\n", "\n```\n", "command", true);
      case "quote":
        return linePrefix("> ");
      case "list":
        return linePrefix("- ");
      case "orderedList":
        return linePrefix("1. ");
    }
  }

  const modes: { value: Mode; label: string; icon: typeof Eye; className?: string }[] = [
    { value: "write", label: d.write, icon: PenLine },
    { value: "split", label: d.split, icon: Columns2, className: "hidden xl:inline-flex" },
    { value: "preview", label: d.preview, icon: Eye },
  ];

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      {/* Main column */}
      <div className="min-w-0 space-y-5">
        <div className="card p-5 sm:p-6">
          <label htmlFor="title" className="sr-only">
            {d.title}
          </label>
          <textarea
            id="title"
            rows={1}
            placeholder={d.titlePlaceholder}
            aria-invalid={Boolean(errors.title)}
            className="w-full resize-none bg-transparent font-display text-2xl font-bold leading-tight text-fg outline-none placeholder:text-subtle/70 sm:text-3xl [field-sizing:content]"
            {...register("title")}
            onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
          />
          {errors.title ? <p className="field-error">{errors.title.message}</p> : null}

          <div className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="slug" className="field-label">
                  {d.slug}
                </label>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  onClick={() => setValue("slug", slugify(title ?? ""), { shouldValidate: true, shouldDirty: true })}
                >
                  <Wand2 className="h-3 w-3" /> {d.generate}
                </button>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-subtle">/blog/</span>
                <Input id="slug" className="pl-14 font-mono text-[13px]" aria-invalid={Boolean(errors.slug)} {...register("slug")} />
              </div>
              {errors.slug ? <p className="field-error">{errors.slug.message}</p> : <p className="field-hint">{d.slugHint}</p>}
            </div>
            <div>
              <label htmlFor="excerpt" className="field-label">
                {d.excerpt}
              </label>
              <Textarea id="excerpt" className="min-h-[4.5rem]" aria-invalid={Boolean(errors.excerpt)} {...register("excerpt")} />
              {errors.excerpt ? (
                <p className="field-error">{errors.excerpt.message}</p>
              ) : (
                <p className="field-hint flex justify-between">
                  <span>{d.excerptHint}</span>
                  <span className="tabular-nums">{(excerpt ?? "").length}/300</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Markdown editor */}
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/50 px-2 py-1.5">
            <div className="flex flex-wrap items-center">
              {tools.map(({ action, icon: Icon }) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => runTool(action)}
                  disabled={mode === "preview"}
                  title={d.toolbar[action]}
                  aria-label={d.toolbar[action]}
                  className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-surface hover:text-fg disabled:opacity-40"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => inlineImageRef.current?.click()}
                disabled={mode === "preview" || uploading === "inline"}
                title={d.toolbar.image}
                aria-label={d.toolbar.image}
                className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-surface hover:text-fg disabled:opacity-40"
              >
                {uploading === "inline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              </button>
              <input
                ref={inlineImageRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => upload(event.target.files?.[0], "inline")}
              />
            </div>
            <div className="flex rounded-lg bg-surface p-0.5 shadow-sm ring-1 ring-line" role="tablist">
              {modes.map(({ value, label, icon: Icon, className }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-muted transition hover:text-fg",
                    mode === value && "bg-primary text-primary-fg hover:text-primary-fg",
                    className,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={cn("grid", mode === "split" && "xl:grid-cols-2 xl:divide-x xl:divide-line")}>
            <div className={cn(mode === "preview" && "hidden")}>
              <label htmlFor="content" className="sr-only">
                {d.content}
              </label>
              <textarea
                id="content"
                {...contentField}
                ref={(element) => {
                  contentField.ref(element);
                  textareaRef.current = element;
                }}
                spellCheck={false}
                aria-invalid={Boolean(errors.content)}
                className="block min-h-[520px] w-full resize-y bg-transparent p-5 font-mono text-[13.5px] leading-7 text-fg outline-none placeholder:text-subtle"
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
                    event.preventDefault();
                    applyFormat("**", "**", "text");
                  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
                    event.preventDefault();
                    applyFormat("_", "_", "text");
                  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                    event.preventDefault();
                    submit("DRAFT")();
                  }
                }}
              />
            </div>
            <div className={cn("max-h-[720px] overflow-y-auto p-5 sm:p-7", mode === "write" && "hidden", mode === "split" && "hidden xl:block")}>
              {content?.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="py-20 text-center text-sm text-subtle">{d.emptyPreview}</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-subtle">
            <span>{errors.content ? <span className="font-medium text-danger">{errors.content.message}</span> : "Markdown · GFM"}</span>
            <span className="tabular-nums">
              {fmt(d.words, { n: wordCount })} · {fmt(t.common.minRead, { n: readingTime(content ?? "") })}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
        <div className="card p-5">
          <p className="text-sm font-bold text-fg">{d.publishing}</p>
          {post ? (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">{d.currentStatus}</span>
              <StatusBadge status={post.status} label={t.status[post.status]} />
            </div>
          ) : null}
          {!canPublish ? <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-xs leading-relaxed text-primary">{d.reviewNote}</p> : null}
          {isDirty ? <p className="mt-3 text-xs font-medium text-warning">● {d.unsaved}</p> : null}
          <div className="mt-4 grid gap-2">
            <Button onClick={submit(canPublish ? "PUBLISHED" : "PENDING")} disabled={Boolean(intent)} className="w-full">
              {intent === "PUBLISHED" || intent === "PENDING" ? <Loader2 className="animate-spin" /> : <Send />}
              {canPublish ? d.publish : d.submitReview}
            </Button>
            <Button variant="secondary" onClick={submit("DRAFT")} disabled={Boolean(intent)} className="w-full">
              {intent === "DRAFT" ? <Loader2 className="animate-spin" /> : null}
              {d.saveDraft}
            </Button>
            {post ? (
              <Link href={`/${locale}/blog/${post.slug}`} target="_blank" className={buttonClasses({ variant: "ghost", size: "sm", className: "w-full" })}>
                <ExternalLink />
                {d.viewPost}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <p className="text-sm font-bold text-fg">{d.settings}</p>
          <div>
            <label htmlFor="categoryId" className="field-label">
              {d.category}
            </label>
            <Select id="categoryId" aria-invalid={Boolean(errors.categoryId)} {...register("categoryId")}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {errors.categoryId ? <p className="field-error">{errors.categoryId.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="topicType" className="field-label">
                {d.topicType}
              </label>
              <Select id="topicType" {...register("topicType")}>
                {(Object.keys(t.topicType) as (keyof Dictionary["topicType"])[]).map((key) => (
                  <option key={key} value={key}>
                    {t.topicType[key]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="difficulty" className="field-label">
                {d.difficulty}
              </label>
              <Select id="difficulty" {...register("difficulty")}>
                {(Object.keys(t.difficulty) as (keyof Dictionary["difficulty"])[]).map((key) => (
                  <option key={key} value={key}>
                    {t.difficulty[key]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label htmlFor="language" className="field-label">
              {d.language}
            </label>
            <Select id="language" {...register("language")}>
              <option value="vi">{t.languages.vi}</option>
              <option value="en">{t.languages.en}</option>
              <option value="ja">{t.languages.ja}</option>
            </Select>
          </div>
          <div>
            <label htmlFor="tagsText" className="field-label">
              {d.tags}
            </label>
            <Input id="tagsText" placeholder="ctf, web, beginner" {...register("tagsText")} />
            {tags.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="field-hint">{d.tagsHint}</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold text-fg">{d.cover}</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-dashed border-line bg-surface-2">
            {coverImage ? (
              <div className="relative aspect-[16/9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setValue("coverImage", "", { shouldDirty: true })}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur hover:bg-black/75"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {d.removeCover}
                </button>
              </div>
            ) : (
              <label className="flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 text-center text-sm text-muted transition hover:bg-surface hover:text-primary">
                {uploading === "cover" ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                <span className="font-semibold">{uploading === "cover" ? d.uploading : d.uploadCover}</span>
                <span className="text-xs text-subtle">{d.coverHint}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={uploading === "cover"}
                  onChange={(event) => upload(event.target.files?.[0], "cover")}
                />
              </label>
            )}
          </div>
          <Input className="mt-3 h-9 text-xs" placeholder={d.coverUrl} {...register("coverImage")} />
        </div>

        <details className="card group p-5">
          <summary className="cursor-pointer list-none text-sm font-bold text-fg">
            <span className="flex items-center justify-between">
              {d.seo}
              <span className="text-subtle transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="seoTitle" className="field-label">
                {d.seoTitle}
              </label>
              <Input id="seoTitle" maxLength={150} {...register("seoTitle")} />
            </div>
            <div>
              <label htmlFor="seoDescription" className="field-label">
                {d.seoDescription}
              </label>
              <Textarea id="seoDescription" maxLength={180} className="min-h-20" {...register("seoDescription")} />
            </div>
          </div>
        </details>
      </aside>
    </form>
  );
}
