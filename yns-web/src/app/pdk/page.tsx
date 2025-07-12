import { redirect } from "next/navigation";
import NDARequestButton from "@/components/NDARequestButton";
import { createSupabaseServer } from "@/lib/supabase-server";

export default async function PDKPage() {
  const supabase = createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Check NDA status
  const { data: nda, error } = await supabase
    .from("nda_requests")
    .select("status")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">PDK & DK Access</h1>
      {nda?.status === "APPROVED" ? (
        <div className="mt-6 rounded border p-4">
          <p className="text-green-700">Your NDA is approved.</p>
          <a
            href="/api/pdk/download"
            className="mt-4 inline-block rounded bg-green-600 px-3 py-2 text-white"
          >
            Download PDK Package
          </a>
        </div>
      ) : (
        <div className="mt-6 rounded border p-4">
          <p className="mb-4 text-slate-700">
            You must sign an NDA to access the PDK. Click below to begin the e-signature process.
          </p>
          <NDARequestButton />
        </div>
      )}
    </main>
  );
}