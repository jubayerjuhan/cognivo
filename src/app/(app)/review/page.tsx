"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { Layers, Trash2 } from "lucide-react";

type DeckSummary = { _id: string; title: string; noteId: string; total: number; due: number; updatedAt: string };
type StoredCard = { question: string; answer: string; box: number; dueAt: string };
type DeckFull = { _id: string; title: string; cards: StoredCard[] };

export default function ReviewPage() {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [session, setSession] = useState<{ deck: DeckFull; queue: number[]; pos: number } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<DeckSummary[]>("/api/decks").then(setDecks).catch((e) => toast.error(errMsg(e)));
  }, []);

  useEffect(load, [load]);

  async function start(deckId: string, all = false) {
    try {
      const deck = await api<DeckFull>(`/api/decks/${deckId}`);
      const now = Date.now();
      let queue = deck.cards.map((c, i) => ({ c, i })).filter(({ c }) => all || new Date(c.dueAt).getTime() <= now).map(({ i }) => i);
      if (!queue.length) {
        toast("No cards due — starting a full review instead");
        queue = deck.cards.map((_, i) => i);
      }
      if (!queue.length) return toast.error("This deck has no cards");
      setSession({ deck, queue, pos: 0 });
      setFlipped(false);
      setDone(0);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function grade(result: "again" | "good") {
    if (!session || busy) return;
    const cardIndex = session.queue[session.pos];
    setBusy(true);
    try {
      await api(`/api/decks/${session.deck._id}/review`, {
        method: "POST",
        body: JSON.stringify({ cardIndex, result }),
      });
      const next = session.pos + 1;
      setDone((d) => d + 1);
      setFlipped(false);
      if (next >= session.queue.length) {
        setSession(null);
        toast.success("Review complete — nice work!");
        load();
      } else {
        setSession({ ...session, pos: next });
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeDeck(d: DeckSummary) {
    if (!confirm(`Delete deck "${d.title}"?`)) return;
    try {
      await api(`/api/decks/${d._id}`, { method: "DELETE" });
      setDecks((list) => (list ?? []).filter((x) => x._id !== d._id));
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  if (session) {
    const card = session.deck.cards[session.queue[session.pos]];
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="min-w-0 truncate text-lg font-bold">{session.deck.title}</h1>
          <span className="shrink-0 text-sm text-slate-500">
            {session.pos + 1} / {session.queue.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded bg-slate-100">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(done / session.queue.length) * 100}%` }} />
        </div>
        <div className="mt-6 [perspective:1400px]">
          <button
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "Answer shown — tap to flip back" : "Question shown — tap to reveal the answer"}
            className="relative block h-72 w-full text-left transition-transform duration-500 [transform-style:preserve-3d]"
            style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <span className="flip-face absolute inset-0 flex flex-col rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-8 shadow-sm">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Question · tap to flip
              </span>
              <span className="block overflow-y-auto text-lg leading-relaxed">{card.question}</span>
            </span>
            <span className="flip-face absolute inset-0 flex flex-col rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-8 shadow-sm [transform:rotateY(180deg)]">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Answer · tap to flip back
              </span>
              <span className="block overflow-y-auto text-lg leading-relaxed">{card.answer}</span>
            </span>
          </button>
        </div>
        {flipped ? (
          <div className="mt-4 flex gap-3">
            <button className="btn-danger flex-1 py-2.5" onClick={() => grade("again")} disabled={busy}>
              Still learning
            </button>
            <button className="btn-primary flex-1 py-2.5" onClick={() => grade("good")} disabled={busy}>
              Got it
            </button>
          </div>
        ) : (
          <p className="mt-4 text-center text-sm text-slate-400">Tap the card to reveal the answer, then grade yourself.</p>
        )}
        <button
          className="mt-6 text-sm text-slate-500 hover:text-slate-800"
          onClick={() => {
            setSession(null);
            load();
          }}
        >
          End session
        </button>
      </div>
    );
  }

  const totalDue = (decks ?? []).reduce((s, d) => s + d.due, 0);

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
        <Layers className="h-6 w-6 text-indigo-600" aria-hidden /> Flashcard review
      </h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Spaced repetition: cards you know come back less often.
        {totalDue > 0 ? ` ${totalDue} card${totalDue === 1 ? "" : "s"} due now.` : " Nothing due right now."}
      </p>

      {decks === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : decks.length === 0 ? (
        <div className="card p-6 text-center text-slate-500 sm:p-10">
          No decks yet. Open a note, run <span className="font-medium text-slate-700">Generate Quiz</span> in the AI
          panel, then choose <span className="font-medium text-slate-700">Save as deck</span>.
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((d) => (
            <div key={d._id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{d.title}</h2>
                <p className="text-xs text-slate-500">
                  {d.total} cards · {d.due} due
                  {d.noteId && (
                    <>
                      {" · "}
                      <Link href={`/notes/${d.noteId}`} className="text-indigo-600 hover:underline">
                        open note
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <button className="btn-primary" onClick={() => start(d._id)} disabled={d.total === 0}>
                Review{d.due > 0 ? ` (${d.due})` : ""}
              </button>
              <button className="btn-secondary" onClick={() => start(d._id, true)}>
                All cards
              </button>
              <button className="text-slate-300 hover:text-red-600" onClick={() => removeDeck(d)} title="Delete deck" aria-label="Delete deck">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
