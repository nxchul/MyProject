import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminNDAPage() {
  const supabase = createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Simple admin check via email
  if (session?.user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: requests } = await supabase
    .from("nda_requests")
    .select("id, status, users!nda_requests_user_id_fkey(email)")
    .order("created_at", { ascending: false });

  const reqs = requests as any[];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">NDA Requests</h1>
      <table className="mt-6 w-full table-auto text-left text-sm">
        <thead>
          <tr>
            <th className="border-b px-2 py-2">ID</th>
            <th className="border-b px-2 py-2">User</th>
            <th className="border-b px-2 py-2">Status</th>
            <th className="border-b px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reqs?.map((r) => (
            <tr key={r.id}>
              <td className="border-b px-2 py-2">{r.id}</td>
              <td className="border-b px-2 py-2">{r.users?.email}</td>
              <td className="border-b px-2 py-2">{r.status}</td>
              <td className="border-b px-2 py-2">
                {r.status === "SIGNED" && (
                  <Link
                    href={`/api/admin/nda/${r.id}/approve`}
                    className="rounded bg-green-600 px-3 py-1 text-white"
                  >
                    Approve
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}