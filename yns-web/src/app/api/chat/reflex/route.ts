import { NextResponse } from "next/server";
import { ynsReflexAgent } from "@/lib/reflex-agent";

export async function POST(req: Request) {
  try {
    const { message } = (await req.json()) as {
      message: string;
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Process query through Reflex agent
    const result = await ynsReflexAgent.processQuery(message);

    return NextResponse.json({
      response: result.response,
      metadata: {
        queryType: result.queryType,
        llmUsed: result.llmUsed,
        provider: result.metadata.provider,
        model: result.metadata.model,
        cost: result.metadata.cost,
        fallback: result.metadata.fallback
      }
    });

  } catch (error: any) {
    console.error("Reflex agent error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = ynsReflexAgent.getLLMStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting agent status:", error);
    return NextResponse.json(
      { error: "Failed to get agent status" },
      { status: 500 }
    );
  }
}