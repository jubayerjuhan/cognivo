"use client";

import { useState } from "react";

export type Card = { question: string; answer: string };

export function Flashcards({ cards }: { cards: Card[] }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Click a card to reveal the answer.</p>
      {cards.map((c, i) => {
        const open = flipped[i];
        return (
          <button
            key={i}
            onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
            className={`block w-full rounded-lg border p-4 text-left transition ${
              open ? "border-emerald-300 bg-emerald-50" : "border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
            }`}
          >
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {open ? "Answer" : `Question ${i + 1}`}
            </div>
            <div className="text-sm">{open ? c.answer : c.question}</div>
          </button>
        );
      })}
    </div>
  );
}
