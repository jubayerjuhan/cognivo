"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { AiPanel, type Attachment } from "@/components/AiPanel";
import Link from "next/link";
import { Brush, Download, Link2, Printer, Sparkles, Unlink } from "lucide-react";

// BlockNote touches `window`, so it must only render on the client.
const NoteEditor = dynamic(() => import("@/components/NoteEditor"), {
  ssr: false,
  loading: () => <p className="px-4 text-slate-400 sm:px-12">Loading editor…</p>,
});

type Note = { _id: string; title: string; content: unknown[]; updatedAt: string; tags?: string[]; folder?: string; shared?: boolean; shareId?: string };
type SaveState = "saved" | "dirty" | "saving" | "error";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tagsStr, setTagsStr] = useState("");
  const [folderVal, setFolderVal] = useState("");
  const [shared, setShared] = useState(false);
  const [shareId, setShareId] = useState("");
  const [wbLinked, setWbLinked] = useState(false);
  const [tagging, setTagging] = useState(false);

  // Pending changes are kept in refs so the debounced save always sends the latest version.
  const pending = useRef<{ title?: string; content?: unknown[]; tags?: string[]; folder?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api<Note>(`/api/notes/${id}`)
      .then((n) => {
        setNote(n);
        setTitle(n.title);
        setTagsStr((n.tags ?? []).join(", "));
        setFolderVal(n.folder ?? "");
        setShared(!!n.shared);
        setShareId(n.shareId ?? "");
      })
      .catch((e) => {
        toast.error(errMsg(e));
        router.push("/notes");
      });
    api<Attachment[]>(`/api/notes/${id}/attachments`).then(setAttachments).catch(() => {});
    api<{ noteId?: string }>("/api/whiteboard?meta=1")
      .then((m) => setWbLinked(m.noteId === id))
      .catch(() => {});
  }, [id, router]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const body = pending.current;
    if (!Object.keys(body).length) return;
    pending.current = {};
    setSaveState("saving");
    try {
      await api(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify(body) });
      setSaveState(Object.keys(pending.current).length ? "dirty" : "saved");
    } catch (e) {
      // Put the failed changes back so the next save retries them.
      pending.current = { ...body, ...pending.current };
      setSaveState("error");
      toast.error(`Save failed: ${errMsg(e)}`);
    }
  }, [id]);

  const queueSave = useCallback(
    (patch: { title?: string; content?: unknown[]; tags?: string[]; folder?: string }) => {
      pending.current = { ...pending.current, ...patch };
      setSaveState("dirty");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 1200);
    },
    [flush]
  );

  // Save on tab close / navigation away.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      flush();
    };
  }, [flush]);

  async function deleteNote() {
    if (!confirm("Delete this note and its attachments?")) return;
    try {
      pending.current = {};
      await api(`/api/notes/${id}`, { method: "DELETE" });
      toast.success("Note deleted");
      router.push("/notes");
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function autoTag() {
    setTagging(true);
    try {
      await flush();
      const r = await api<{ tags: string[] }>("/api/ai/autotag", {
        method: "POST",
        body: JSON.stringify({ noteId: id }),
      });
      setTagsStr(r.tags.join(", "));
      toast.success(r.tags.length ? `Tags: ${r.tags.join(", ")}` : "No tags suggested");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setTagging(false);
    }
  }

  async function toggleShare() {
    try {
      const r = await api<{ shared: boolean; shareId: string }>(`/api/notes/${id}/share`, {
        method: "POST",
        body: JSON.stringify({ shared: !shared }),
      });
      setShared(r.shared);
      setShareId(r.shareId);
      if (r.shared) {
        const url = `${window.location.origin}/s/${r.shareId}`;
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Share link copied to clipboard");
        } catch {
          toast.success(`Share link: ${url}`);
        }
      } else {
        toast("Sharing turned off");
      }
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  if (!note) return <p className="p-6 text-slate-500">Loading…</p>;

  const statusText = {
    saved: "All changes saved",
    dirty: "Unsaved changes…",
    saving: "Saving…",
    error: "Save failed",
  }[saveState];

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <section className="min-w-0 flex-1 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 sm:gap-3 sm:px-6">
          <button className="text-sm text-slate-500 hover:text-slate-800" onClick={() => router.push("/notes")}>
            ← All notes
          </button>
          <div className="flex items-center gap-3">
            <span className={`hidden text-xs min-[420px]:inline ${saveState === "error" ? "text-red-600" : "text-slate-500"}`}>
              {statusText}
            </span>
            <button className="btn-secondary" onClick={flush} disabled={saveState === "saved"}>
              Save
            </button>
            <button className="btn-danger" onClick={deleteNote}>
              Delete
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:px-6">
          <input
            className="input w-32 py-1 text-xs"
            placeholder="Folder"
            value={folderVal}
            onChange={(e) => {
              setFolderVal(e.target.value);
              queueSave({ folder: e.target.value });
            }}
          />
          <input
            className="input min-w-32 flex-1 py-1 text-xs sm:max-w-56"
            placeholder="Tags, comma separated"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            onBlur={() =>
              queueSave({ tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean) })
            }
          />
          <button className="btn-secondary py-1 text-xs" onClick={autoTag} disabled={tagging}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> {tagging ? "Tagging…" : "Auto-tag"}
          </button>
          <button className="btn-secondary py-1 text-xs" onClick={toggleShare}>
            {shared ? <Unlink className="h-3.5 w-3.5" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
            {shared ? "Unshare" : "Share"}
          </button>
          <a className="btn-secondary py-1 text-xs" href={`/api/notes/${id}/export`}>
            <Download className="h-3.5 w-3.5" aria-hidden /> .md
          </a>
          <Link className="btn-secondary py-1 text-xs" href={`/notes/${id}/print`}>
            <Printer className="h-3.5 w-3.5" aria-hidden /> Print
          </Link>
          {wbLinked && (
            <Link href="/whiteboard" className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
              <Brush className="h-3.5 w-3.5" aria-hidden /> Whiteboard linked
            </Link>
          )}
          {shared && shareId && (
            <span className="w-full truncate text-xs text-slate-400 sm:w-auto">
              Public: {typeof window !== "undefined" ? window.location.origin : ""}/s/{shareId}
            </span>
          )}
        </div>
        <div className="mx-auto max-w-4xl py-4 sm:py-8">
          <input
            className="mb-4 w-full bg-transparent px-4 text-2xl font-bold outline-none placeholder:text-slate-300 sm:px-[54px] sm:text-3xl"
            placeholder="Untitled"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              queueSave({ title: e.target.value });
            }}
          />
          <NoteEditor
            initialContent={note.content ?? []}
            onChange={(content) => queueSave({ content })}
          />
        </div>
      </section>

      <AiPanel
        noteId={id}
        attachments={attachments}
        setAttachments={setAttachments}
        beforeAi={flush}
      />
    </div>
  );
}
