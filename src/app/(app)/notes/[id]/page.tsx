"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { AiPanel, type Attachment } from "@/components/AiPanel";

// BlockNote touches `window`, so it must only render on the client.
const NoteEditor = dynamic(() => import("@/components/NoteEditor"), {
  ssr: false,
  loading: () => <p className="px-12 text-slate-400">Loading editor…</p>,
});

type Note = { _id: string; title: string; content: unknown[]; updatedAt: string };
type SaveState = "saved" | "dirty" | "saving" | "error";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Pending changes are kept in refs so the debounced save always sends the latest version.
  const pending = useRef<{ title?: string; content?: unknown[] }>({});
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api<Note>(`/api/notes/${id}`)
      .then((n) => {
        setNote(n);
        setTitle(n.title);
      })
      .catch((e) => {
        toast.error(errMsg(e));
        router.push("/notes");
      });
    api<Attachment[]>(`/api/notes/${id}/attachments`).then(setAttachments).catch(() => {});
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
    (patch: { title?: string; content?: unknown[] }) => {
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
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <button className="text-sm text-slate-500 hover:text-slate-800" onClick={() => router.push("/notes")}>
            ← All notes
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${saveState === "error" ? "text-red-600" : "text-slate-500"}`}>
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
        <div className="mx-auto max-w-4xl py-8">
          <input
            className="mb-4 w-full bg-transparent px-[54px] text-3xl font-bold outline-none placeholder:text-slate-300"
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
