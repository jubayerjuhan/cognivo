"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { FolderOpen, Mic, Tag } from "lucide-react";

type NoteSummary = { _id: string; title: string; updatedAt: string; tags: string[]; folder: string };

function block(type: string, text: string, props: Record<string, unknown> = {}) {
  return {
    type,
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left", ...props },
    content: text ? [{ type: "text", text, styles: {} }] : [],
    children: [],
  };
}

const TEMPLATES: Record<string, { label: string; title: string; content: unknown[] }> = {
  blank: { label: "Blank note", title: "Untitled", content: [] },
  meeting: {
    label: "Meeting notes",
    title: "Meeting notes",
    content: [
      block("heading", "Meeting notes", { level: 1 }),
      block("paragraph", "Date: " + new Date().toLocaleDateString()),
      block("heading", "Agenda", { level: 2 }),
      block("bulletListItem", "Topic one"),
      block("bulletListItem", "Topic two"),
      block("heading", "Action items", { level: 2 }),
      block("checkListItem", "First action item", { checked: false }),
      block("checkListItem", "Second action item", { checked: false }),
    ],
  },
  study: {
    label: "Study notes",
    title: "Study notes",
    content: [
      block("heading", "Study notes", { level: 1 }),
      block("heading", "Key ideas", { level: 2 }),
      block("bulletListItem", ""),
      block("heading", "Examples", { level: 2 }),
      block("bulletListItem", ""),
      block("heading", "Questions I still have", { level: 2 }),
      block("bulletListItem", ""),
    ],
  },
  journal: {
    label: "Daily journal",
    title: "Journal — " + new Date().toLocaleDateString(),
    content: [
      block("heading", "Today", { level: 1 }),
      block("paragraph", ""),
      block("heading", "Grateful for", { level: 2 }),
      block("bulletListItem", ""),
      block("heading", "Tomorrow", { level: 2 }),
      block("checkListItem", "", { checked: false }),
    ],
  },
};

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState("blank");
  const [transcribing, setTranscribing] = useState(false);
  const audioInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<NoteSummary[]>("/api/notes")
      .then((all) => setFolders([...new Set(all.map((n) => n.folder).filter(Boolean))].sort()))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (folder) params.set("folder", folder);
      api<NoteSummary[]>(`/api/notes?${params.toString()}`)
        .then(setNotes)
        .catch((e) => toast.error(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [q, folder]);

  async function createNote() {
    setCreating(true);
    try {
      const t = TEMPLATES[template] ?? TEMPLATES.blank;
      const note = await api<{ _id: string }>("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title: t.title, content: t.content, folder }),
      });
      router.push(`/notes/${note._id}`);
    } catch (e) {
      toast.error(errMsg(e));
      setCreating(false);
    }
  }

  async function uploadAudio(file: File) {
    if (file.size > 24 * 1024 * 1024) {
      toast.error("Audio must be under 24MB");
      return;
    }
    setTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api<{ noteId: string }>("/api/ai/transcribe", { method: "POST", body: fd });
      toast.success("Audio transcribed into a note");
      router.push(`/notes/${r.noteId}`);
    } catch (e) {
      toast.error(errMsg(e));
      setTranscribing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Notes</h1>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <input
            className="input min-w-0 flex-1 sm:w-56 sm:flex-none"
            placeholder="Search notes & PDFs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input w-auto" value={template} onChange={(e) => setTemplate(e.target.value)} title="Template">
            {Object.entries(TEMPLATES).map(([k, t]) => (
              <option key={k} value={k}>{t.label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={createNote} disabled={creating}>
            + New note
          </button>
          <button className="btn-secondary" onClick={() => audioInput.current?.click()} disabled={transcribing}>
            <Mic className="h-4 w-4" aria-hidden /> {transcribing ? "Transcribing…" : "Audio note"}
          </button>
          <input
            ref={audioInput}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.flac"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAudio(e.target.files[0])}
          />
        </div>
      </div>

      {folders.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-3 py-1 text-xs font-medium ${folder === "" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"}`}
            onClick={() => setFolder("")}
          >
            All folders
          </button>
          {folders.map((f) => (
            <button
              key={f}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${folder === f ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"}`}
              onClick={() => setFolder(f)}
            >
              <FolderOpen className="h-3 w-3" aria-hidden /> {f}
            </button>
          ))}
        </div>
      )}

      {notes === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="card p-6 text-center text-slate-500 sm:p-10">
          {q || folder ? "No notes match. Try a different search or folder." : "No notes yet. Create your first one!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <Link
              key={n._id}
              href={`/notes/${n._id}`}
              className="card block p-4 transition hover:border-indigo-300 hover:shadow"
            >
              <h2 className="truncate font-semibold">{n.title || "Untitled"}</h2>
              <p className="mt-1 text-xs text-slate-500">
                Updated {new Date(n.updatedAt).toLocaleString()}
              </p>
              {(n.folder || (n.tags && n.tags.length > 0)) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {n.folder && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      <FolderOpen className="h-3 w-3" aria-hidden /> {n.folder}
                    </span>
                  )}
                  {(n.tags ?? []).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      <Tag className="h-3 w-3" aria-hidden /> {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
