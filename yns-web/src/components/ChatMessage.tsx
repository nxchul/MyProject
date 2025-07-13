import clsx from "clsx";

export type ChatRole = "user" | "assistant";

interface ChatMessageProps {
  role: ChatRole;
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  return (
    <div
      className={clsx("flex w-full py-1", {
        "justify-end": isUser,
        "justify-start": !isUser,
      })}
    >
      <div
        className={clsx(
          "max-w-[80%] whitespace-pre-wrap rounded-md px-4 py-2 text-sm leading-relaxed", // bubble
          {
            "bg-blue-600 text-white": isUser,
            "bg-slate-200 text-slate-900": !isUser,
          }
        )}
      >
        {content}
      </div>
    </div>
  );
}