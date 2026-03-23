"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AdminAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: id(),
      role: "assistant",
      content:
        "Ask me anything about visitor traffic, busiest hours, monthly trends, top reasons, colleges, and registered accounts.",
    },
  ]);

  const quickPrompts = [
    "Which month has the most visitors?",
    "Top 3 reasons this month",
    "Busiest hour this week",
    "Compare top colleges this month",
  ];

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: id(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = [...messages, userMessage].slice(-12).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await fetch("/api/admin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: historyPayload,
        }),
      });

      const data = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      const assistantMessage: ChatMessage = {
        id: id(),
        role: "assistant",
        content:
          data.answer || data.error || "I could not generate a response at the moment.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: id(),
          role: "assistant",
          content: "I could not reach the assistant service. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const sendQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-4 text-white shadow-lg shadow-emerald-900/30 transition-colors duration-200 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500"
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">Ask AI Assistant</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-emerald-100/30 bg-card shadow-xl overflow-hidden">
          <div className="border-b bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-teal-50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-950">NEU Library AI Assistant</p>
                  <p className="text-[11px] text-emerald-800/80">Ask me anything about your admin data</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-md hover:bg-white/60 flex items-center justify-center"
                aria-label="Close AI assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-emerald-900/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1">
                <Sparkles className="h-3 w-3" />
                Live analytics
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1">
                Gemini 3.1
              </span>
            </div>
          </div>

          <div className="h-[360px] overflow-y-auto p-3 space-y-3 bg-background">
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendQuickPrompt(prompt)}
                  className="rounded-lg border bg-card px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-muted/60"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-xl bg-emerald-600 text-white px-3 py-2"
                    : "mr-8 rounded-xl bg-muted px-3 py-2"
                }
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            ))}

            {loading && (
              <div className="mr-8 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t p-3 flex items-center gap-2 bg-card">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about stats, logs, or accounts..."
              className="flex-1 h-10 rounded-lg border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              maxLength={500}
            />
            <Button type="submit" size="sm" disabled={!canSend} className="h-10 px-3">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
