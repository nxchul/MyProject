// @ts-nocheck
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const client = createClient(supabaseUrl, supabaseAnon);

const embeddings = new OpenAIEmbeddings();
let vectorStorePromise: Promise<SupabaseVectorStore> | null = null;

function getVectorStore() {
  if (!vectorStorePromise) {
    vectorStorePromise = SupabaseVectorStore.fromExistingIndex(embeddings, {
      client,
      tableName: process.env.SUPABASE_VECTOR_TABLE || "documents",
      queryName: "match_documents",
    });
  }
  return vectorStorePromise;
}

export async function retrieveContext(question: string, k = 4) {
  const store = await getVectorStore();
  const docs = await store.similaritySearch(question, k);
  return docs;
}