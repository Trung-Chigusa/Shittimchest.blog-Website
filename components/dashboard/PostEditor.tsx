"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, Wand2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { postInputSchema } from "@/lib/validators";
import { slugify } from "@/lib/slug";

const editorSchema = postInputSchema.omit({ tags: true }).extend({
  tagsText: z.string().max(240).optional(),
});

type EditorInput = z.input<typeof editorSchema>;
type EditorValues = z.output<typeof editorSchema>;

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  const json = await response.json();
  return json.data.token as string;
}

export function PostEditor({
  categories,
  labels,
}: {
  categories: { id: string; name: string }[];
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditorInput, unknown, EditorValues>({
    resolver: zodResolver(editorSchema),
    shouldFocusError: true,
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "## Notes\n\nWrite your CTF/cybersecurity notes here.\n\n```bash\nnmap -sV target.local\n```",
      coverImage: "",
      categoryId: categories[0]?.id ?? "",
      tagsText: "ctf, beginner",
      language: "vi",
      difficulty: "BEGINNER",
      topicType: "NOTE",
      status: "DRAFT",
      seoTitle: "",
      seoDescription: "",
    },
  });

  const content = useWatch({ control, name: "content" });
  const title = useWatch({ control, name: "title" });
  const preview = useMemo(() => content || "", [content]);

  async function uploadCover(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const token = await csrfToken();
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": token },
        body: form,
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setValue("coverImage", json.data.url, { shouldValidate: true });
      setMessage("Cover uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: EditorValues) {
    setMessage("");
    const token = await csrfToken();
    const response = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "x-csrf-token": token },
      body: JSON.stringify({
        ...values,
        tags: values.tagsText
          ?.split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    const json = await response.json();
    if (!json.success) {
      setMessage(json.message);
      return;
    }
    setMessage("Da luu bai.");
    router.refresh();
  }

  function onInvalid() {
    setMessage("Khong luu duoc: kiem tra lai cac o bi bao loi phia tren. Tieu de can toi thieu 5 ky tu, slug chi dung chu thuong/so/dau gach ngang, va noi dung khong duoc rong.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="glass-panel space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.title}</span>
            <Input {...register("title")} />
            {errors.title ? <p className="mt-1 text-xs text-red-200">{errors.title.message}</p> : null}
          </label>
          <label>
            <span className="mb-2 flex items-center justify-between gap-2 text-sm text-slate-300">
              {labels.slug}
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-cyan-200"
                onClick={() => setValue("slug", slugify(title), { shouldValidate: true })}
              >
                <Wand2 className="h-3 w-3" /> Generate
              </button>
            </span>
            <Input {...register("slug")} />
            {errors.slug ? <p className="mt-1 text-xs text-red-200">{errors.slug.message}</p> : null}
          </label>
        </div>
        <label>
          <span className="mb-2 block text-sm text-slate-300">{labels.excerpt}</span>
          <Textarea className="min-h-20" {...register("excerpt")} />
          {errors.excerpt ? <p className="mt-1 text-xs text-red-200">{errors.excerpt.message}</p> : null}
        </label>
        <label>
          <span className="mb-2 block text-sm text-slate-300">{labels.content}</span>
          <Textarea className="min-h-[360px] font-mono" {...register("content")} />
          {errors.content ? <p className="mt-1 text-xs text-red-200">{errors.content.message}</p> : null}
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.cover}</span>
            <Input {...register("coverImage")} placeholder="https://... or /uploads/file.webp" />
          </label>
          <label>
            <span className="mb-2 block text-sm text-slate-300">Upload</span>
            <div className="flex gap-2">
              <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadCover(event.target.files?.[0])} />
              <Button type="button" variant="secondary" disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.category}</span>
            <Select {...register("categoryId")}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.language}</span>
            <Select {...register("language")}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </Select>
          </label>
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.status}</span>
            <Select {...register("status")}>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending Review</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.difficulty}</span>
            <Select {...register("difficulty")}>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </Select>
          </label>
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.topicType}</span>
            <Select {...register("topicType")}>
              <option value="CTF">CTF</option>
              <option value="TUTORIAL">Tutorial</option>
              <option value="NOTE">Note</option>
              <option value="RESEARCH">Research</option>
              <option value="LAB">Lab</option>
              <option value="TOOL">Tool</option>
            </Select>
          </label>
          <label>
            <span className="mb-2 block text-sm text-slate-300">{labels.tags}</span>
            <Input {...register("tagsText")} placeholder="ctf, web, beginner" />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input {...register("seoTitle")} placeholder="SEO title" />
          <Input {...register("seoDescription")} placeholder="SEO description" />
        </div>
        {message ? <p className="rounded-md border border-cyan-200/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{message}</p> : null}
        <Button disabled={isSubmitting || !categories.length}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {labels.save}
        </Button>
      </form>
      <div className="glass-panel p-5">
        <p className="cyber-label">Markdown preview</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">{title || "Untitled draft"}</h2>
        <div className="mt-5 max-h-[780px] overflow-auto rounded-md border border-white/10 bg-slate-950/35 p-4">
          <MarkdownRenderer content={preview} />
        </div>
      </div>
    </div>
  );
}
