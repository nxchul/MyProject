import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <div className="mt-6">
        <ChatWindow />
      </div>
    </main>
  );
}