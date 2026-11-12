"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { Sparkles } from "lucide-react";

const EXAMPLES = [
  "Summarize everything I know about photosynthesis",
  "What deadlines and tasks appear in my notes?",
  "Explain the key ideas from my PDFs",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: string[] } | null>(null);

  async function ask(q: string) {
    const query = q.trim();
    if (!query) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api<{ answer: string; sources: string[] }>("/api/ai/ask-all", {
        method: "POST",
        body: JSON.stringify({ question: query }),
      });
      setResult(r);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
        <Sparkles className="h-6 w-6 text-indigo-600" aria-hidden /> Ask your workspace
      </h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        One question, answered from all your notes and PDFs at once.
      </p>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          className="input min-w-0 flex-1"
          placeholder="Ask anything about your notes…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="btn-primary" disabled={busy || !question.trim()}>
          {busy ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((x) => (
          <button
            key={x}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
            onClick={() => {
              setQuestion(x);
              ask(x);
            }}
          >
            {x}
          </button>
        ))}
      </div>

      {busy && <p className="mt-6 animate-pulse text-sm text-slate-500">Searching your workspace…</p>}

      {result && (
        <div className="card mt-6 p-5">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{result.answer}</ReactMarkdown>
          </div>
          {result.sources.length > 0 && (
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Drawn from: {result.sources.join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
