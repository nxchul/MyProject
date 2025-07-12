// @ts-nocheck
// ^ Disable TS errors for experimental LangChain paths

import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { glob } from "glob";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const docsPath = path.resolve(__dirname, "../docs/**/*.{pdf,txt,md}");
  const files = glob.sync(docsPath);
  console.log(`Found ${files.length} files`);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docsDir = path.resolve(__dirname, "../docs");
  const directoryLoader = new DirectoryLoader(docsDir, {
    ".pdf": (filePath) => new PDFLoader(filePath, { splitPages: false }),
    ".md": (filePath) => new TextLoader(filePath),
    ".txt": (filePath) => new TextLoader(filePath),
  });
  const rawDocs = await directoryLoader.load();
  const docs = await textSplitter.splitDocuments(rawDocs);
  docs.forEach((d) => {
    d.metadata = {
      ...d.metadata,
      source: path.basename(d.metadata?.source || d.metadata?.filePath || ""),
    };
  });

  console.log(`Uploading ${docs.length} chunks to Supabase`);
  await SupabaseVectorStore.fromDocuments(docs as any, new OpenAIEmbeddings(), {
    client,
    tableName: process.env.SUPABASE_VECTOR_TABLE || "documents",
    queryName: "match_documents",
  });

  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});