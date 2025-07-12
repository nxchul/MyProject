import { createSupabaseServer } from "@/lib/supabase-server";
import Link from "next/link";

export default async function MPWPage() {
  const supabase = createSupabaseServer();
  const { data: shuttles } = await supabase
    .from("mpw_shuttles")
    .select("id, process, tape_out_date, wafer_delivery_date")
    .order("tape_out_date", { ascending: true });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">MPW Shuttle Schedule</h1>
      <table className="mt-6 w-full table-auto text-left text-sm">
        <thead>
          <tr>
            <th className="border-b px-2 py-2">Process</th>
            <th className="border-b px-2 py-2">Tape-out Date</th>
            <th className="border-b px-2 py-2">Wafer Delivery</th>
            <th className="border-b px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {shuttles?.map((s) => (
            <tr key={s.id}>
              <td className="border-b px-2 py-2">{s.process}</td>
              <td className="border-b px-2 py-2">{new Date(s.tape_out_date).toLocaleDateString()}</td>
              <td className="border-b px-2 py-2">{new Date(s.wafer_delivery_date).toLocaleDateString()}</td>
              <td className="border-b px-2 py-2">
                <Link
                  href={`/mpw/${s.id}`}
                  className="rounded bg-blue-600 px-3 py-1 text-white"
                >
                  Apply
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}