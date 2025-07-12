"use client";
import { useEffect, useRef, useState } from "react";
import ChatMessage, { ChatRole } from "@/components/ChatMessage";

interface Message {
  role: ChatRole;
  content: string;
}

interface ApiResponse { response: string; citations?: { id: number; source: string }[] }

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = (await res.json()) as ApiResponse;
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response +
          (data.citations && data.citations.length
            ? "\n\n" + data.citations.map(c => `[${c.id}] ${c.source}`).join("\n")
            : ""),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[80vh] flex-col rounded-lg border bg-white/50 backdrop-blur">
      <div
        ref={containerRef}
        className="flex-grow overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">
            Ask anything about YNS and TSMC Design House services.
          </p>
        )}
        {messages.map((m, idx) => (
          <ChatMessage key={idx} role={m.role} content={m.content} />
        ))}
        {loading && (
          <ChatMessage role="assistant" content="Typing…" />
        )}
      </div>
      <div className="border-t bg-white/70 px-4 py-3">
        <textarea
          className="h-20 w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          placeholder="Type your message and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="mt-2 text-right">
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}