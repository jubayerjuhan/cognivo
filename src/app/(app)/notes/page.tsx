"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";

type NoteSummary = { _id: string; title: string; updatedAt: string };

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      api<NoteSummary[]>(`/api/notes?q=${encodeURIComponent(q)}`)
        .then(setNotes)
        .catch((e) => toast.error(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function createNote() {
    setCreating(true);
    try {
      const note = await api<{ _id: string }>("/api/notes", { method: "POST", body: "{}" });
      router.push(`/notes/${note._id}`);
    } catch (e) {
      toast.error(errMsg(e));
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notes</h1>
        <div className="flex gap-2">
          <input
            className="input w-56"
            placeholder="Search by title…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" onClick={createNote} disabled={creating}>
            + New note
          </button>
        </div>
      </div>

      {notes === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          {q ? "No notes match your search." : "No notes yet. Create your first one!"}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
