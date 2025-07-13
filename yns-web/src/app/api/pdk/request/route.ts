// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Insert NDA request row (status: PENDING)
  const { data, error } = await supabase.from("nda_requests").insert({
    user_id: session.user.id,
    status: "PENDING",
  }).select().single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create NDA request" }, { status: 500 });
  }

  // TODO: Integrate DocuSign API to create envelope and return signing URL.
  const mockSigningUrl = "https://demo.docusign.net";

  return NextResponse.json({ envelopeUrl: mockSigningUrl, requestId: data.id });
}