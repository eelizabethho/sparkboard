"use client";

import { ChevronsUpDownIcon, ImagePlusIcon, XIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createIdea, deleteIdea, updateIdea, type IdeaInput } from "@/app/actions";
import type { BlockDoc } from "@/components/block-editor";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Idea } from "@/lib/ideas";

const BlockEditor = dynamic(() => import("@/components/block-editor"), {
  ssr: false,
  loading: () => <div className="min-h-[50vh] animate-pulse rounded-2xl bg-card" />,
});

const STATUSES: Idea["status"][] = ["spark", "exploring", "building", "shipped", "shelved"];
const MAX_IMAGE = 5 * 1024 * 1024;

// Browser upload (owner session cookie -> RLS) avoids the 1 MB server-action body cap.
// Covers and in-post images share the public `covers` bucket.
async function uploadImage(file: File, prefix: string) {
  if (file.size > MAX_IMAGE) throw new Error("Images must be 5 MB or smaller.");
  const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${prefix}-${Date.now()}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Image upload failed.");
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
}

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
  const [coverUrl, setCoverUrl] = useState(idea?.cover_url ?? null);
  const [coverY, setCoverY] = useState(idea?.cover_y ?? 50);
  const [repositioning, setRepositioning] = useState(false);
  const drag = useRef<{ y: number; start: number; range: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const docRef = useRef<(() => BlockDoc) | null>(null);
  const [pending, start] = useTransition();
  // File-name prefix for uploads; made on first upload, not during render (render must be deterministic).
  const prefixRef = useRef<string | null>(idea?.id ?? null);
  const prefix = () => (prefixRef.current ??= crypto.randomUUID());

  const shown = localUrl ?? coverUrl;
  const setCover = (f: File | null) => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setFile(f);
    setLocalUrl(f ? URL.createObjectURL(f) : null);
    setCoverY(50);
  };

  // Reposition: drag the cover vertically. The draggable range is how much taller the image is
  // than its 16:9 frame (object-fit: cover); dragging down reveals more of the top.
  function onCoverPointerDown(e: React.PointerEvent<HTMLImageElement>) {
    if (!repositioning) return;
    const img = e.currentTarget;
    const rendered = (img.clientWidth * img.naturalHeight) / (img.naturalWidth || 1);
    drag.current = { y: e.clientY, start: coverY, range: Math.max(1, rendered - img.clientHeight) };
    img.setPointerCapture(e.pointerId);
  }
  function onCoverPointerMove(e: React.PointerEvent<HTMLImageElement>) {
    const d = drag.current;
    if (!d) return;
    setCoverY(Math.round(Math.min(100, Math.max(0, d.start - ((e.clientY - d.y) / d.range) * 100))));
  }
  function onCoverKey(e: React.KeyboardEvent) {
    if (!repositioning || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    setCoverY((y) => Math.min(100, Math.max(0, y + (e.key === "ArrowUp" ? -5 : 5))));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMAGE) {
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

  async function uploadInPost(f: File) {
    try {
      return await uploadImage(f, `${prefix()}-body`);
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      let cover_url = coverUrl;
      if (file) {
        try {
          cover_url = await uploadImage(file, prefix());
        } catch (err) {
          return void toast.error((err as Error).message);
        }
      }
      const doc = docRef.current?.();
      const input: IdeaInput = {
        title,
        pitch,
        body: doc?.body ?? idea?.body ?? "",
        content: doc?.content ?? idea?.content ?? null,
        status,
        category: category || null,
        tags: tags.split(","),
        links: links.split("\n"),
        cover_url,
        cover_y: coverY,
        is_private: isPrivate,
      };
      const res = idea ? await updateIdea(idea.id, input) : await createIdea(input);
      if (res?.error) toast.error(res.error);
    });
  }

  function remove() {
    if (!idea || !confirm("Delete this post? This can't be undone.")) return;
    start(async () => {
      const res = await deleteIdea(idea.id);
      if (res?.error) toast.error(res.error);
    });
  }

  const field = "space-y-1.5";
  const big = "h-11 md:h-9";
  const bare = "w-full bg-transparent outline-none placeholder:text-muted-foreground/50";
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl pt-6">
      {shown ? (
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shown}
            alt={repositioning ? "Cover: drag up or down, or use the arrow keys, to choose what shows" : "Cover"}
            draggable={false}
            tabIndex={repositioning ? 0 : -1}
            onPointerDown={onCoverPointerDown}
            onPointerMove={onCoverPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={onCoverKey}
            style={{ objectPosition: `center ${coverY}%` }}
            className={`aspect-[16/9] w-full object-cover ${repositioning ? "cursor-grab touch-none select-none outline-none ring-2 ring-primary active:cursor-grabbing" : ""}`}
          />
          {repositioning && (
            <span className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs backdrop-blur-[20px]">
              Drag to reposition
            </span>
          )}
          <div
            className={`absolute right-3 bottom-3 flex gap-2 transition ${repositioning ? "" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"}`}
          >
            <button
              type="button"
              onClick={() => setRepositioning((r) => !r)}
              className="inline-flex h-9 items-center rounded-full bg-background/80 px-4 text-sm font-medium backdrop-blur-[20px]"
            >
              {repositioning ? "Done" : "Reposition"}
            </button>
            {!repositioning && (
              <>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-background/80 px-4 text-sm font-medium backdrop-blur-[20px]">
                  <ImagePlusIcon className="size-4" /> Change
                  <input ref={fileInput} type="file" accept="image/*" onChange={onFile} className="sr-only" />
                </label>
                <button type="button" onClick={removeCover} aria-label="Remove cover" className="inline-flex size-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-[20px]">
                  <XIcon className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition hover:bg-card">
          <ImagePlusIcon className="size-4" /> Add cover
          <input ref={fileInput} type="file" accept="image/*" onChange={onFile} className="sr-only" />
        </label>
      )}

      <input
        aria-label="Title"
        required
        maxLength={200}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className={`${bare} mt-6 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl`}
      />
      <input
        aria-label="Summary"
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        placeholder="One-line summary"
        className={`${bare} mt-3 text-lg text-muted-foreground sm:text-xl`}
      />

      <details className="group mt-4 rounded-2xl text-sm">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-1.5 text-muted-foreground hover:bg-card">
          <ChevronsUpDownIcon className="size-3.5" /> Details
          <span className="text-xs opacity-70">
            {[category, status, tags.trim() && `${tags.split(",").filter((t) => t.trim()).length} tags`].filter(Boolean).join(" · ")}
          </span>
        </summary>
        <div className="mt-3 grid gap-5 rounded-2xl bg-card p-4 sm:grid-cols-2">
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
          <div className={field}>
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" className={big} />
          </div>
          <div className={field}>
            <Label htmlFor="links">Links</Label>
            <Textarea id="links" rows={2} value={links} onChange={(e) => setLinks(e.target.value)} placeholder="One URL per line" className="text-base md:text-sm" />
          </div>
        </div>
      </details>

      {/* BlockNote indents blocks 54px for the drag handle. Wide screens: pull it out so text lines up with the
          title. Narrow screens: only into the page gutter, so the handle stays on screen. */}
      <div className="mt-6 -mx-4 pb-8 min-[900px]:-mx-[54px]">
        <BlockEditor initialContent={idea?.content ?? null} markdown={idea?.body ?? ""} uploadFile={uploadInPost} docRef={docRef} />
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
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} /> Private
        </label>
        {idea && (
          <button type="button" disabled={pending} onClick={remove} className="px-3 text-sm text-destructive disabled:opacity-50">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
