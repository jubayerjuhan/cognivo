import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Brain,
  Brush,
  Check,
  FileText,
  Layers,
  ListTodo,
  NotebookPen,
  Paperclip,
  Sparkles,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: NotebookPen,
    title: "Rich notes",
    text: "A beautiful block editor for lecture notes, research and ideas — headings, lists, checklists and more, auto-saved as you type.",
  },
  {
    icon: Paperclip,
    title: "PDF attachments",
    text: "Attach PDFs to any note. Cognivo extracts the text automatically, so your documents become searchable, askable knowledge.",
  },
  {
    icon: Sparkles,
    title: "AI assistant",
    text: "Summarize a note in seconds, then ask questions about it — answers come from your own material, not the open web.",
  },
  {
    icon: Layers,
    title: "Instant flashcards",
    text: "Turn any note into a quiz with one click. Flip through flashcards generated from your content and actually retain it.",
  },
  {
    icon: Brush,
    title: "Whiteboard",
    text: "Sketch diagrams, mind maps and flows on an infinite canvas that lives right beside your notes.",
  },
  {
    icon: ListTodo,
    title: "Tasks & dashboard",
    text: "Due dates, completion tracking and an overview of everything — including how much AI help you have used.",
  },
];

const steps = [
  {
    icon: FileText,
    title: "1. Capture",
    text: "Write rich notes or drop in a PDF. Everything is stored in your private workspace.",
  },
  {
    icon: Sparkles,
    title: "2. Understand",
    text: "AI reads your material and gives you summaries, key points and straight answers to your questions.",
  },
  {
    icon: Zap,
    title: "3. Retain",
    text: "Generate flashcards, tick off tasks and watch your dashboard fill up as your knowledge grows.",
  },
];

export default async function Home() {
  if (getSessionUserId()) redirect("/dashboard");

  return (
    <main className="min-h-full bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Brain className="h-5 w-5" aria-hidden />
            </span>
            Cogni<span className="-ml-2 text-indigo-600">vo</span>
          </span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#ai" className="hover:text-slate-900">AI</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="btn-secondary px-4 py-2">Sign in</Link>
            <Link href="/sign-up" className="btn-primary px-4 py-2">
              Get started <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> AI-powered knowledge workspace
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Your second brain,
              <span className="block text-indigo-600">
                supercharged by AI
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-slate-500 sm:text-lg">
              Take rich notes, attach PDFs, and let AI summarize, quiz and answer
              questions about your own material — all in one calm workspace.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up" className="btn-primary px-6 py-3 text-base">
                Start learning free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a href="#features" className="btn-secondary px-6 py-3 text-base">See features</a>
            </div>
            <p className="mt-4 text-xs text-slate-400">Free to use · No credit card · Works on any device</p>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto mt-14 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                <span className="ml-3 hidden rounded-md bg-white px-3 py-1 text-xs text-slate-400 ring-1 ring-slate-200 sm:block">
                  cognivo / notes / photosynthesis
                </span>
              </div>
              <div className="flex">
                <div className="hidden w-14 flex-col items-center gap-5 border-r border-slate-100 py-5 sm:flex">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white"><Brain className="h-4 w-4" aria-hidden /></span>
                  <NotebookPen className="h-5 w-5 text-indigo-600" aria-hidden />
                  <Brush className="h-5 w-5 text-slate-300" aria-hidden />
                  <ListTodo className="h-5 w-5 text-slate-300" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 p-5 sm:p-7">
                  <p className="text-lg font-bold text-slate-800">Photosynthesis — Chapter Notes</p>
                  <div className="mt-4 space-y-2.5" aria-hidden>
                    <div className="h-2.5 w-11/12 rounded bg-slate-200" />
                    <div className="h-2.5 w-9/12 rounded bg-slate-200" />
                    <div className="h-2.5 w-10/12 rounded bg-slate-100" />
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center rounded bg-indigo-600 text-white"><Check className="h-3 w-3" aria-hidden /></span> Light-dependent reactions — ATP + NADPH</li>
                    <li className="flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center rounded bg-indigo-600 text-white"><Check className="h-3 w-3" aria-hidden /></span> Calvin cycle fixes carbon into glucose</li>
                    <li className="flex items-center gap-2"><span className="h-4 w-4 rounded border border-slate-300" /> Factors: light intensity, CO₂, temperature</li>
                  </ul>
                  <div className="mt-6 rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-100">
                    <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                      <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden /> AI Summary
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      Photosynthesis converts light energy into glucose in two stages: the
                      light reactions produce ATP and NADPH, which the Calvin cycle then
                      uses to fix carbon…
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200"><Layers className="h-3 w-3" aria-hidden /> 8 flashcards generated</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200"><Paperclip className="h-3 w-3" aria-hidden /> chapter-4.pdf attached</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Everything you need to learn faster</h2>
            <p className="mt-3 text-slate-600">Notes, documents, AI and planning — one workspace instead of five apps.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI spotlight */}
      <section id="ai" className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900 px-6 py-12 text-white sm:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Powered by fast Groq AI
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Ask your notes anything</h2>
              <p className="mt-3 leading-relaxed text-slate-300">
                “What are the key points of chapter 4?” Cognivo answers from your notes and
                PDFs — with summaries, key points and quizzes generated in seconds, not
                generic chatbot guesses.
              </p>
              <Link href="/sign-up" className="btn-primary mt-6 px-5 py-2.5 shadow-none">
                Try it free <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="space-y-3">
              <div className="ml-auto w-fit max-w-full rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm">
                Summarize my biology notes
              </div>
              <div className="w-fit max-w-full rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed text-slate-200 ring-1 ring-white/10">
                <span className="font-semibold text-white">Overview:</span> Your notes cover
                photosynthesis in two stages — light reactions in the thylakoid membrane and
                the Calvin cycle in the stroma…
              </div>
              <div className="ml-auto w-fit max-w-full rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm">
                Make a quiz from this
              </div>
              <div className="w-fit max-w-full rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-sm text-slate-200 ring-1 ring-white/10">
                <span className="flex items-center gap-1.5 font-semibold text-white"><Layers className="h-4 w-4" aria-hidden /> 8 flashcards ready</span>
                <span className="mt-1 block">Q: Where do the light reactions take place?</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Start learning smarter today</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-500">
            Create your free workspace and turn your first note into a summary in under a minute.
          </p>
          <Link href="/sign-up" className="btn-primary mt-7 px-6 py-3 text-base">
            Get started free <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2 font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white"><Brain className="h-3.5 w-3.5" aria-hidden /></span>
            Cognivo
          </span>
          <nav className="flex gap-5">
            <a href="#features" className="hover:text-slate-800">Features</a>
            <a href="#how" className="hover:text-slate-800">How it works</a>
            <Link href="/sign-in" className="hover:text-slate-800">Sign in</Link>
          </nav>
          <span>© 2026 Cognivo</span>
        </div>
      </footer>
    </main>
  );
}
