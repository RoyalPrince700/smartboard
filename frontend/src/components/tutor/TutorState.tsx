import { AlertCircle, Bot, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export function TutorLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Bot size={21} aria-hidden="true" />
          <span className="absolute -bottom-1 -right-1 h-3 w-3 animate-pulse rounded-full border-2 border-indigo-50 bg-amber-400" />
        </span>
        <div>
          <p className="font-semibold text-slate-800">Tutor is thinking</p>
          <p className="text-sm text-slate-500">Working through this carefully...</p>
        </div>
      </div>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-1.5 flex-1 rounded-full bg-indigo-200"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function TutorError({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-500" aria-hidden="true" />
        <div>
          <p className="font-semibold">Tutor could not respond</p>
          <p className="mt-1 text-sm leading-relaxed text-rose-700">{message}</p>
          <p className="mt-2 text-xs text-rose-600">Your work on the board is still safe.</p>
        </div>
      </div>
    </div>
  );
}

export function TutorEmpty() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Lightbulb size={27} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-800">Let&apos;s work through it together</h2>
      <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-slate-500">
        Ask a question, or write on the board and choose Tutor to get a clear explanation.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1.5">Solve a problem</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5">Explain a topic</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5">Explore an idea</span>
      </div>
    </div>
  );
}
