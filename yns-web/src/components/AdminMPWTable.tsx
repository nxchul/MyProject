"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

interface Application {
  id: string;
  status: string;
  xor_summary: string | null;
  xor_report_path: string | null;
  gds_path: string | null;
  user: { email: string } | null;
  shuttle: { process: string; tape_out_date: string } | null;
}

export default function AdminMPWTable({ apps }: { apps: Application[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    return apps.filter((app) => {
      const matchStatus = statusFilter === "ALL" || app.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        app.id.includes(q) ||
        app.user?.email.toLowerCase().includes(q) ||
        app.shuttle?.process.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [apps, statusFilter, search]);

  const statuses = Array.from(new Set(apps.map((a) => a.status)));

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <select
          className="rounded border px-2 py-1"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by ID, user, process..."
          className="w-72 rounded border px-2 py-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm text-slate-600">Showing {filtered.length} / {apps.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-left text-sm">
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
            {filtered.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="border-b px-2 py-2 font-mono text-xs">{app.id}</td>
                <td className="border-b px-2 py-2">{app.user?.email}</td>
                <td className="border-b px-2 py-2">{app.shuttle?.process}</td>
                <td className="border-b px-2 py-2">{app.status}</td>
                <td className="border-b px-2 py-2">{app.xor_summary}</td>
                <td className="border-b px-2 py-2">
                  {app.xor_report_path ? (
                    <Link
                      href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]}/storage/v1/object/public/xor/${app.xor_report_path}`}
                      target="_blank"
                      className="text-blue-600 underline"
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
      </div>
    </div>
  );
}