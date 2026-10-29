"use client";

import { ChevronsUpDownIcon, ImagePlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createIdea, deleteIdea, updateIdea, type IdeaInput } from "@/app/actions";
import { Markdown } from "@/components/markdown";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Idea } from "@/lib/ideas";

const STATUSES: Idea["status"][] = ["spark", "exploring", "building", "shipped", "shelved"];
const MAX_COVER = 5 * 1024 * 1024;

function CategoryCombobox({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const typed = q.trim();
  const canCreate = typed && !options.some((o) => o.toLowerCase() === typed.toLowerCase());
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQ("");
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-sm dark:bg-input/30"
        >
          <span className={value ? "" : "text-muted-foreground"}>{value || "No category"}</span>
          <ChevronsUpDownIcon className="size-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput value={q} onValueChange={setQ} placeholder="Search or create…" className="text-base md:text-sm" />
          <CommandList>
            <CommandEmpty>No categories yet.</CommandEmpty>
            <CommandGroup>
              {value && <CommandItem value="__none" onSelect={() => pick("")}>No category</CommandItem>}
              {options.map((o) => (
                <CommandItem key={o} value={o} data-checked={o === value} onSelect={() => pick(o)}>
                  {o}
                </CommandItem>
              ))}
              {canCreate && (
                <CommandItem value={`__create ${typed}`} forceMount onSelect={() => pick(typed)}>
                  Create “{typed}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function IdeaEditor({ idea, categories }: { idea?: Idea; categories: string[] }) {
  const [title, setTitle] = useState(idea?.title ?? "");
  const [pitch, setPitch] = useState(idea?.pitch ?? "");
  const [status, setStatus] = useState<Idea["status"]>(idea?.status ?? "spark");
  const [category, setCategory] = useState(idea?.category ?? "");
  const [tags, setTags] = useState(idea?.tags.join(", ") ?? "");
  const [links, setLinks] = useState(idea?.links.join("\n") ?? "");
  const [isPrivate, setIsPrivate] = useState(idea?.is_private ?? true);
  const [body, setBody] = useState(idea?.body ?? "");
  const [preview, setPreview] = useState(false);
  const [coverUrl, setCoverUrl] = useState(idea?.cover_url ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  const shown = localUrl ?? coverUrl;
  const setCover = (f: File | null) => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setFile(f);
    setLocalUrl(f ? URL.createObjectURL(f) : null);
  };

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_COVER) {
      toast.error("Cover must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    setCover(f);
  }

  function removeCover() {
    setCover(null);
    setCoverUrl(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      let cover_url = coverUrl;
      if (file) {
        // Browser upload (owner session cookie -> RLS) avoids the 1 MB server-action body cap.
        const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${idea?.id ?? crypto.randomUUID()}-${Date.now()}.${ext}`;
        const supabase = createClient();
        const { error } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type });
        if (error) return void toast.error("Cover upload failed.");
        cover_url = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
      }
      const input: IdeaInput = {
        title,
        pitch,
        body,
        status,
        category: category || null,
        tags: tags.split(","),
        links: links.split("\n"),
        cover_url,
        is_private: isPrivate,
      };
      const res = idea ? await updateIdea(idea.id, input) : await createIdea(input);
      if (res?.error) toast.error(res.error);
    });
  }

  function remove() {
    if (!idea || !confirm("Delete this idea? This can't be undone.")) return;
    start(async () => {
      const res = await deleteIdea(idea.id);
      if (res?.error) toast.error(res.error);
    });
  }

  const field = "space-y-1.5";
  const big = "h-11 md:h-9";
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 pt-6">
      <h1 className="text-3xl font-semibold">{idea ? "Edit idea" : "New idea"}</h1>

      <div className={field}>
        <Label htmlFor="title">Title</Label>
        <Input id="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={big} />
      </div>
      <div className={field}>
        <Label htmlFor="pitch">Pitch</Label>
        <Input id="pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="One line" className={big} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={field}>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Idea["status"])}>
            <SelectTrigger className="h-11 w-full text-base md:h-9 md:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={field}>
          <Label>Category</Label>
          <CategoryCombobox value={category} options={categories} onChange={setCategory} />
        </div>
      </div>

      <div className={field}>
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" className={big} />
      </div>
      <div className={field}>
        <Label htmlFor="links">Links</Label>
        <Textarea id="links" rows={3} value={links} onChange={(e) => setLinks(e.target.value)} placeholder="One URL per line" className="text-base md:text-sm" />
      </div>

      <div className={field}>
        <Label>Cover</Label>
        {shown && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Cover preview" className="aspect-[16/9] w-full rounded-2xl object-cover" />
        )}
        <div className="flex gap-2">
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-card px-4 text-sm font-medium md:h-9">
            <ImagePlusIcon className="size-4" /> {shown ? "Replace" : "Upload"}
            <input ref={fileInput} type="file" accept="image/*" onChange={onFile} className="sr-only" />
          </label>
          {shown && (
            <button type="button" onClick={removeCover} className="inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm text-muted-foreground md:h-9">
              <XIcon className="size-4" /> Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-card p-4">
        <Label htmlFor="private">Private (hidden from visitors)</Label>
        <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
      </div>

      <div className={field}>
        <div className="flex items-center justify-between">
          <Label htmlFor="body">Body (markdown)</Label>
          <div className="flex gap-1 rounded-full bg-card p-1 text-sm">
            {[false, true].map((p) => (
              <button
                key={String(p)}
                type="button"
                aria-pressed={preview === p}
                onClick={() => setPreview(p)}
                className="rounded-full px-3 py-1 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {p ? "Preview" : "Write"}
              </button>
            ))}
          </div>
        </div>
        {preview ? (
          <div className="prose-idea min-h-64 rounded-2xl bg-card p-4">
            <Markdown>{body || "*Nothing to preview.*"}</Markdown>
          </div>
        ) : (
          <Textarea id="body" rows={14} value={body} onChange={(e) => setBody(e.target.value)} className="min-h-64 text-base md:text-sm" />
        )}
      </div>

      <div className="frosted sticky bottom-0 -mx-4 flex items-center gap-3 bg-background/70 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[20px] sm:mx-0 sm:rounded-2xl">
        <button
          disabled={pending}
          className="h-11 flex-1 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition active:scale-95 disabled:opacity-50 sm:flex-none"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <Link href={idea ? `/ideas/${idea.slug}` : "/"} className="px-3 text-sm text-muted-foreground">
          Cancel
        </Link>
        {idea && (
          <button type="button" disabled={pending} onClick={remove} className="ml-auto px-3 text-sm text-destructive disabled:opacity-50">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
