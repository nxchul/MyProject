// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const { error } = await supabase
    .from("nda_requests")
    .update({ status: "APPROVED" })
    .eq("id", id);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  // send email to user (out of scope)
  return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" + "/admin/nda");
}