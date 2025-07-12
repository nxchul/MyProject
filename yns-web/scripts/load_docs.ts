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

  const allDocs = [];
  for (const file of files) {
    const loader = new PDFLoader(file, {
      splitPages: false,
    });
    const docs = await loader.loadAndSplit(textSplitter);
    // Attach metadata
    docs.forEach((d) => {
      d.metadata = {
        ...d.metadata,
        source: path.basename(file),
      };
    });
    allDocs.push(...docs as any);
  }

  console.log(`Uploading ${allDocs.length} chunks to Supabase`);

  await SupabaseVectorStore.fromDocuments(allDocs, new OpenAIEmbeddings(), {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });

  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});