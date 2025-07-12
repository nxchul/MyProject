// @ts-nocheck
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "@supabase/supabase-js";
import { retrieveContext } from "@/lib/rag";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnon);

    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

    // Get last user question
    const question = messages.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";

    // Retrieve documents for RAG
    const relevantDocs = await retrieveContext(question, 4);
    const contextText = relevantDocs.map((d: any) => d.pageContent).join("\n---\n");
    const citations = relevantDocs.map((d: any, idx: number) => ({ id: idx + 1, source: d.metadata?.source }));

    const systemPrompt = `You are an assistant for YNS & TSMC Design House. Use the provided CONTEXT to answer user queries. If answer not found, say you don't know.

CONTEXT:\n${contextText}`;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatMessages,
    });

    const response = completion.choices[0].message.content ?? "";

    return NextResponse.json({ response, citations });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}