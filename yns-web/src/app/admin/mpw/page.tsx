import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
      <table className="mt-6 w-full table-auto text-left text-sm">
        <thead>
          <tr>
            <th className="border-b px-2 py-2">ID</th>
            <th className="border-b px-2 py-2">User</th>
            <th className="border-b px-2 py-2">Process</th>
            <th className="border-b px-2 py-2">Status</th>
            <th className="border-b px-2 py-2">XOR Summary</th>
            <th className="border-b px-2 py-2">Report</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((app) => (
            <tr key={app.id}>
              <td className="border-b px-2 py-2 font-mono text-xs">{app.id}</td>
              <td className="border-b px-2 py-2">{app.user?.email}</td>
              <td className="border-b px-2 py-2">{app.shuttle?.process}</td>
              <td className="border-b px-2 py-2">{app.status}</td>
              <td className="border-b px-2 py-2">{app.xor_summary}</td>
              <td className="border-b px-2 py-2">
                {app.xor_report_path ? (
                  <Link
                    href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]}/storage/v1/object/public/xor/${app.xor_report_path}`}
                    className="text-blue-600 underline"
                    target="_blank"
                  >
                    View
                  </Link>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}