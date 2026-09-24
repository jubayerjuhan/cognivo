"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { Flashcards, type Card } from "./Flashcards";

export type Attachment = {
  _id: string;
  fileName: string;
  size: number;
  pages: number;
  createdAt: string;
};

type Result =
  | { type: "summary"; text: string; source: string; truncated: boolean; fromPdf: boolean }
  | { type: "quiz"; cards: Card[]; source: string; truncated: boolean; fromPdf: boolean }
  | { type: "answer"; text: string; question: string; source: string; truncated: boolean; fromPdf: boolean };

export function AiPanel({
  noteId,
  attachments,
  setAttachments,
  beforeAi,
}: {
  noteId: string;
  attachments: Attachment[];
  setAttachments: (fn: (a: Attachment[]) => Attachment[]) => void;
  beforeAi: () => Promise<void>;
}) {
  // "note" or an attachment id
  const [source, setSource] = useState<string>("note");
  const [busy, setBusy] = useState<null | "summary" | "quiz" | "answer">(null);
  const [result, setResult] = useState<Result | null>(null);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const fromPdf = source !== "note";
  const sourceBody = fromPdf ? { attachmentId: source } : { noteId };

  async function run(kind: "summary" | "quiz" | "answer") {
    setBusy(kind);
    try {
      if (!fromPdf) await beforeAi(); // make sure the latest note text is saved first
      if (kind === "summary") {
        const r = await api<{ summary: string; source: string; truncated: boolean }>("/api/ai/summarize", {
          method: "POST",
          body: JSON.stringify(sourceBody),
        });
        setResult({ type: "summary", text: r.summary, source: r.source, truncated: r.truncated, fromPdf });
      } else if (kind === "quiz") {
        const r = await api<{ cards: Card[]; source: string; truncated: boolean }>("/api/ai/quiz", {
          method: "POST",
          body: JSON.stringify(sourceBody),
        });
        setResult({ type: "quiz", cards: r.cards, source: r.source, truncated: r.truncated, fromPdf });
      } else {
        const q = question.trim();
        if (!q) return;
        const r = await api<{ answer: string; source: string; truncated: boolean }>("/api/ai/ask", {
          method: "POST",
          body: JSON.stringify({ ...sourceBody, question: q }),
        });
        setResult({ type: "answer", text: r.answer, question: q, source: r.source, truncated: r.truncated, fromPdf });
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function upload(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("PDF must be 4MB or smaller");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const att = await api<Attachment & { hasText: boolean }>(`/api/notes/${noteId}/attachments`, {
        method: "POST",
        body: fd,
      });
      setAttachments((a) => [att, ...a]);
      setSource(att._id);
      if (att.hasText) toast.success(`Uploaded ${att.fileName}`);
      else toast("Uploaded, but no text could be extracted (scanned PDF?)", { icon: "⚠️" });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(att: Attachment) {
    if (!confirm(`Delete ${att.fileName}?`)) return;
    try {
      await api(`/api/attachments/${att._id}`, { method: "DELETE" });
      setAttachments((a) => a.filter((x) => x._id !== att._id));
      if (source === att._id) setSource("note");
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  return (
    <aside className="w-full shrink-0 overflow-y-auto border-t border-slate-200 bg-white lg:w-96 lg:border-l lg:border-t-0">
      {/* Attachments */}
      <div className="border-b border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">📎 PDF attachments</h2>
          <button className="btn-secondary" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload PDF"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </div>
        {attachments.length === 0 ? (
          <p className="text-xs text-slate-500">No PDFs attached. Upload one to summarize it or ask questions.</p>
        ) : (
          <ul className="space-y-1">
            {attachments.map((a) => (
              <li key={a._id} className="flex items-center justify-between gap-2 text-sm">
                <a
                  href={`/api/attachments/${a._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-indigo-600 hover:underline"
                  title={a.fileName}
                >
                  {a.fileName}
                </a>
                <span className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                  {a.pages}p · {(a.size / 1024).toFixed(0)}KB
                  <button className="text-red-500 hover:text-red-700" onClick={() => remove(a)} title="Delete">
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI assistant */}
      <div className="space-y-3 p-4">
        <h2 className="font-semibold">✨ AI Assistant</h2>
        <label className="block text-xs font-medium text-slate-600">
          Source
          <select className="input mt-1" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="note">This note</option>
            {attachments.map((a) => (
              <option key={a._id} value={a._id}>
                PDF: {a.fileName}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={() => run("summary")} disabled={!!busy}>
            {busy === "summary" ? "Summarizing…" : "Summarize"}
          </button>
          <button className="btn-secondary flex-1" onClick={() => run("quiz")} disabled={!!busy}>
            {busy === "quiz" ? "Generating…" : "Generate Quiz"}
          </button>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run("answer");
          }}
        >
          <input
            className="input"
            placeholder={fromPdf ? "Ask a question about this PDF…" : "Ask a question about this note…"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="btn-secondary" disabled={!!busy || !question.trim()}>
            {busy === "answer" ? "…" : "Ask"}
          </button>
        </form>

        {busy && <p className="animate-pulse text-sm text-slate-500">Thinking…</p>}

        {result && !busy && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {result.type === "summary" ? "Summary" : result.type === "quiz" ? "Flashcards" : "Answer"}
              </h3>
              <button className="text-xs text-slate-400 hover:text-slate-700" onClick={() => setResult(null)}>
                Clear
              </button>
            </div>
            {result.type === "answer" && (
              <p className="mb-2 text-xs italic text-slate-500">Q: {result.question}</p>
            )}
            {result.type === "quiz" ? (
              <Flashcards cards={result.cards} />
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{result.text}</ReactMarkdown>
              </div>
            )}
            <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500">
              {result.fromPdf ? "Based on the uploaded document" : "Based on your note"}: {result.source}
              {result.truncated && " (content was truncated to fit the AI's limit)"}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
