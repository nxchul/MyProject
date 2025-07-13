// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  // Verify NDA approved
  const { data: nda } = await supabase
    .from("nda_requests")
    .select("status")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (nda?.status !== "APPROVED") {
    return NextResponse.json({ error: "NDA not approved" }, { status: 403 });
  }

  // Generate signed URL (e.g., from bucket "pdk")
  const { data, error } = await supabase.storage
    .from("pdk")
    .createSignedUrl("pdk_package.zip", 60 * 60); // 1 hour

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }

  // Redirect to signed URL
  return NextResponse.redirect(data.signedUrl);
}