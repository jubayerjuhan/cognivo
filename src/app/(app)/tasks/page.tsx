"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";
import { Repeat, X } from "lucide-react";

type Task = { _id: string; title: string; dueDate: string | null; completed: boolean; repeat?: "none" | "daily" | "weekly" };

function sortTasks(list: Task[]) {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

// Due dates are stored as UTC midnight of the chosen day; display them as that calendar day.
function formatDue(d: string) {
  return new Date(d).toLocaleDateString(undefined, { timeZone: "UTC", dateStyle: "medium" });
}

function isOverdue(t: Task) {
  if (!t.dueDate || t.completed) return false;
  const today = new Date().toISOString().slice(0, 10);
  return t.dueDate.slice(0, 10) < today;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  useEffect(() => {
    api<Task[]>("/api/tasks")
      .then((t) => setTasks(sortTasks(t)))
      .catch((e) => toast.error(errMsg(e)));
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const task = await api<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title, dueDate: dueDate || null, repeat }),
      });
      setTasks((t) => sortTasks([task, ...(t ?? [])]));
      setTitle("");
      setDueDate("");
      setRepeat("none");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setAdding(false);
    }
  }

  async function toggle(task: Task) {
    // Optimistic update
    setTasks((t) => sortTasks(t!.map((x) => (x._id === task._id ? { ...x, completed: !x.completed } : x))));
    try {
      await api(`/api/tasks/${task._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });
      // A completed recurring task spawns its next occurrence server-side — refetch to show it.
      if (!task.completed && task.repeat && task.repeat !== "none") {
        const fresh = await api<Task[]>("/api/tasks");
        setTasks(sortTasks(fresh));
        toast.success("Done — next occurrence created");
      }
    } catch (e) {
      toast.error(errMsg(e));
      setTasks((t) => sortTasks(t!.map((x) => (x._id === task._id ? task : x))));
    }
  }

  async function remove(task: Task) {
    try {
      await api(`/api/tasks/${task._id}`, { method: "DELETE" });
      setTasks((t) => t!.filter((x) => x._id !== task._id));
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  const visible = (tasks ?? []).filter((t) =>
    filter === "all" ? true : filter === "done" ? t.completed : !t.completed
  );
  const doneCount = (tasks ?? []).filter((t) => t.completed).length;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Tasks</h1>
        {tasks && (
          <span className="text-sm text-slate-500">
            {doneCount}/{tasks.length} completed
          </span>
        )}
      </div>

      <form onSubmit={addTask} className="card mb-4 flex flex-wrap gap-2 p-3">
        <input
          className="input min-w-0 flex-1 basis-full sm:basis-auto"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="input w-full min-w-0 flex-1 sm:w-40 sm:flex-none"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <select
          className="input basis-full sm:basis-auto sm:w-36"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as "none" | "daily" | "weekly")}
          title="Repeat"
        >
          <option value="none">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <button className="btn-primary" disabled={adding || !title.trim()}>
          Add
        </button>
      </form>

      <div className="mb-3 flex gap-1 text-sm">
        {(["all", "active", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 capitalize ${
              filter === f ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {tasks === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No tasks here.</div>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {visible.map((t) => (
            <li key={t._id} className="group flex flex-wrap items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggle(t)}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className={`min-w-0 flex-1 break-words text-sm ${t.completed ? "text-slate-400 line-through" : ""}`}>
                {t.title}
                {t.repeat && t.repeat !== "none" && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 align-middle text-[11px] font-medium text-indigo-700">
                    <Repeat className="h-3 w-3" aria-hidden /> {t.repeat}
                  </span>
                )}
              </span>
              {t.dueDate && (
                <span className={`text-xs ${isOverdue(t) ? "font-semibold text-red-600" : "text-slate-500"}`}>
                  {isOverdue(t) ? "Overdue · " : "Due "}
                  {formatDue(t.dueDate)}
                </span>
              )}
              <button
                onClick={() => remove(t)}
                className="shrink-0 text-slate-300 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100"
                title="Delete"
                aria-label="Delete task"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
