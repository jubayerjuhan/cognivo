import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { Task } from "@/models/Task";
import { AiCall } from "@/models/AiCall";
import { Deck } from "@/models/Deck";
import { AiUsageChart } from "@/components/AiUsageChart";

export const dynamic = "force-dynamic";

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const userId = user.id;
  await connectDB();

  const weekAgo = new Date();
  weekAgo.setUTCHours(0, 0, 0, 0);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);

  const [notes, tasks, tasksDone, aiCalls, perDay, recentNotes, upcoming, decks, openDue] = await Promise.all([
    Note.countDocuments({ userId }),
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, completed: true }),
    AiCall.countDocuments({ userId }),
    AiCall.aggregate<{ _id: string; count: number }>([
      { $match: { userId, createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    Note.find({ userId }).select("title updatedAt").sort({ updatedAt: -1 }).limit(5).lean(),
    Task.find({ userId, completed: false }).sort({ dueDate: 1, createdAt: -1 }).limit(5).lean(),
    Deck.find({ userId }).select("cards").lean(),
    Task.find({ userId, completed: false, dueDate: { $ne: null } }).select("dueDate").lean(),
  ]);

  const nowMs = Date.now();
  const dueCards = decks.reduce(
    (sum, d) => sum + ((d.cards ?? []) as { dueAt?: string }[]).filter((c) => !c.dueAt || new Date(c.dueAt).getTime() <= nowMs).length,
    0
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueCount = openDue.filter((t) => t.dueDate && new Date(t.dueDate).toISOString().slice(0, 10) < todayStr).length;
  const dueTodayCount = openDue.filter((t) => t.dueDate && new Date(t.dueDate).toISOString().slice(0, 10) === todayStr).length;

  // Fill in days with zero calls so the chart always shows 7 bars.
  const counts = new Map(perDay.map((d) => [d._id, d.count]));
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      date: key,
      calls: counts.get(key) ?? 0,
    };
  });

  const pct = tasks ? Math.round((tasksDone / tasks) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="text-xl font-bold sm:text-2xl">Welcome back{user?.firstName ? `, ${user.firstName}` : ""}</h1>
      <p className="mb-6 text-slate-500">Here&apos;s an overview of your workspace.</p>

      {(overdueCount > 0 || dueTodayCount > 0 || dueCards > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {overdueCount > 0 && (
            <Link href="/tasks" className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100">
              {overdueCount} task{overdueCount === 1 ? "" : "s"} overdue
            </Link>
          )}
          {dueTodayCount > 0 && (
            <Link href="/tasks" className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100">
              {dueTodayCount} due today
            </Link>
          )}
          {dueCards > 0 && (
            <Link href="/review" className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100">
              {dueCards} flashcard{dueCards === 1 ? "" : "s"} due for review
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Notes" value={notes} />
        <StatCard label="Tasks" value={tasks} />
        <StatCard label="Tasks completed" value={tasksDone} hint={tasks ? `${pct}% done` : undefined} />
        <StatCard label="AI calls made" value={aiCalls} />
        <StatCard label="Cards due" value={dueCards} hint={dueCards ? "open Review" : undefined} />
      </div>

      <div className="card mt-6 p-4 sm:p-5">
        <h2 className="mb-4 font-semibold">AI calls — last 7 days</h2>
        <AiUsageChart data={chartData} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card min-w-0 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent notes</h2>
            <Link href="/notes" className="text-sm text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-slate-500">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentNotes.map((n) => (
                <li key={String(n._id)} className="flex justify-between gap-2 text-sm">
                  <Link href={`/notes/${n._id}`} className="min-w-0 truncate hover:text-indigo-600">
                    {n.title || "Untitled"}
                  </Link>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card min-w-0 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Open tasks</h2>
            <Link href="/tasks" className="text-sm text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing to do</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={String(t._id)} className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{t.title}</span>
                  {t.dueDate && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(t.dueDate).toLocaleDateString(undefined, { timeZone: "UTC" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
