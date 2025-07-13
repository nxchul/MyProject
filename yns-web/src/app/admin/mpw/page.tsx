import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const AdminMPWTable = dynamic(() => import("@/components/AdminMPWTable"), { ssr: false });

export default async function AdminMPWPage() {
  const supabase = createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: apps } = await supabase
    .from("mpw_applications")
    .select(
      "id, status, xor_summary, gds_path, xor_report_path, user:users(email), shuttle:mpw_shuttles(process, tape_out_date)"
    )
    .order("created_at", { ascending: false });

  const rows = apps as any[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">MPW Applications</h1>
      <AdminMPWTable apps={rows} />
    </main>
  );
}