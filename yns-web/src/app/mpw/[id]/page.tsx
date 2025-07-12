import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import GDSUpload from "@/components/GDSUpload";

interface Props {
  params: { id: string };
}

export default async function MPWApplyPage({ params }: Props) {
  const supabase = createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  const shuttleId = params.id;
  // fetch shuttle for info
  const { data: shuttle } = await supabase
    .from("mpw_shuttles")
    .select("process, tape_out_date")
    .eq("id", shuttleId)
    .single();

  // fetch existing application if any
  const { data: application } = await supabase
    .from("mpw_applications")
    .select("id, status, gds_path")
    .eq("user_id", session.user.id)
    .eq("shuttle_id", shuttleId)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Apply for {shuttle?.process} MPW</h1>
      <p className="mt-2 text-sm text-slate-600">
        Tape-out Date: {new Date(shuttle?.tape_out_date).toLocaleDateString()}
      </p>

      <section className="mt-6 rounded border p-4">
        <h2 className="font-medium">GDS File Upload</h2>
        <GDSUpload
          shuttleId={shuttleId}
          existingApplication={application}
          userId={session.user.id}
        />
        {application?.status && (
          <p className="mt-4 text-sm text-slate-700">
            Current status: {application.status}
          </p>
        )}
      </section>
    </main>
  );
}