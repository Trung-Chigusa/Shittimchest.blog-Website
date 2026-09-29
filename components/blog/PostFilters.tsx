"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function PostFilters({
  dictionary,
  categories,
  tags,
  defaults,
}: {
  dictionary: {
    search: string;
    category: string;
    tag: string;
    language: string;
    sort: string;
    latest: string;
    popular: string;
  };
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
  defaults: Record<string, string | undefined>;
}) {
  return (
    <form className="glass-panel grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto]" action="">
      <label className="relative">
        <span className="sr-only">{dictionary.search}</span>
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
        <Input name="search" defaultValue={defaults.search} placeholder={dictionary.search} className="pl-9" />
      </label>
      <Select name="category" defaultValue={defaults.category ?? ""} aria-label={dictionary.category}>
        <option value="">{dictionary.category}</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select name="tag" defaultValue={defaults.tag ?? ""} aria-label={dictionary.tag}>
        <option value="">{dictionary.tag}</option>
        {tags.map((tag) => (
          <option key={tag.slug} value={tag.slug}>
            {tag.name}
          </option>
        ))}
      </Select>
      <Select name="language" defaultValue={defaults.language ?? "all"} aria-label={dictionary.language}>
        <option value="all">{dictionary.language}</option>
        <option value="vi">VI</option>
        <option value="en">EN</option>
        <option value="ja">JA</option>
      </Select>
      <Select name="sort" defaultValue={defaults.sort ?? "latest"} aria-label={dictionary.sort}>
        <option value="latest">{dictionary.latest}</option>
        <option value="popular">{dictionary.popular}</option>
      </Select>
      <Button type="submit">Filter</Button>
    </form>
  );
}
