"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { BlockRenderer } from "@/components/BlockRenderer";
import { ArrowLeft, Printer } from "lucide-react";

type Note = { _id: string; title: string; content: unknown[] };

export default function PrintNotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    api<Note>(`/api/notes/${id}`).then(setNote).catch((e) => toast.error(errMsg(e)));
  }, [id]);

  if (!note) return <p className="p-6 text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="no-print mb-6 flex items-center justify-between">
        <button className="btn-secondary" onClick={() => router.push(`/notes/${id}`)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to note
        </button>
        <button className="btn-primary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden /> Print / Save as PDF
        </button>
      </div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{note.title || "Untitled"}</h1>
      <BlockRenderer blocks={note.content} />
    </div>
  );
}
