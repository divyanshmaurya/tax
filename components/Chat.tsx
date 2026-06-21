"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";
interface Msg {
  role: Role;
  content: string;
}

const STORAGE_KEY = "form8843_intake";

const STARTERS = [
  "I'm an F-1 student with no income — do I need to file anything?",
  "Which part of the form do I fill out?",
  "How do I calculate the days to exclude on line 4b?",
  "Where and when do I mail my Form 8843?",
];

const GREETING =
  "Hi! I'm the Form 8843 assistant for Alien Tax Advisory. I can explain who must file, run the " +
  "substantial-presence test, walk through the form line-by-line, and tell you how to mail it. " +
  "What would you like to know?";

export function Chat() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [intakeLoaded, setIntakeLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setIntakeLoaded(Boolean(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function readIntake() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const history = [...messages, { role: "user" as const, content: trimmed }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Drop the local greeting; send only the real turns.
          messages: history.filter((m, i) => !(i === 0 && m.role === "assistant")),
          intake: readIntake(),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        updateLast(data.error || "Something went wrong. Please try again.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        updateLast(acc);
      }
    } catch {
      updateLast("Network error — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function updateLast(content: string) {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = { role: "assistant", content };
      return next;
    });
  }

  return (
    <div className="card flex h-[72vh] min-h-[520px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
          <p className="text-sm font-semibold">Form 8843 Assistant</p>
        </div>
        {intakeLoaded && (
          <span className="chip bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            Personalized to your intake
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-brand)] px-4 py-2.5 text-sm text-white"
                  : "max-w-[88%] rounded-2xl rounded-bl-sm bg-[var(--color-canvas)] px-4 py-3 text-sm text-[var(--color-ink)]"
              }
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <div className="prose-chat">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <TypingDots />
                )
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-line)] px-5 py-3">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-[var(--color-line)] p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about Form 8843…"
          className="input max-h-32 flex-1 resize-none"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary">
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-muted)]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
