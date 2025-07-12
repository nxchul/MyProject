"use client";
import { useRef, useState } from "react";
import supabaseBrowser from "@/lib/supabase-browser";

interface Props {
  shuttleId: string;
  userId: string;
  existingApplication?: {
    id: string;
    status: string;
    gds_path?: string;
  } | null;
}

export default function GDSUpload({ shuttleId, userId, existingApplication }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);

    try {
      // Ensure application row exists or insert
      let applicationId = existingApplication?.id;
      if (!applicationId) {
        const { data, error } = await supabaseBrowser
          .from("mpw_applications")
          .insert({ user_id: userId, shuttle_id: shuttleId, status: "INITIATED" })
          .select("id")
          .single();
        if (error) throw error;
        applicationId = data.id;
      }

      const path = `${userId}/${shuttleId}-${Date.now()}.gds`;
      const { error: uploadError } = await supabaseBrowser.storage
        .from("gds")
        .upload(path, file, { contentType: "application/octet-stream" });
      if (uploadError) throw uploadError;

      // update application status and path
      const { error: updateError } = await supabaseBrowser
        .from("mpw_applications")
        .update({ status: "GDS_UPLOADED", gds_path: path })
        .eq("id", applicationId);
      if (updateError) throw updateError;

      setMessage("Upload successful. XOR verification pending.");
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to upload GDS file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <input
        type="file"
        accept=".gds,.gds.gz,.tgz,.tar,.tar.gz"
        ref={fileInputRef}
      />
      <button
        className="w-fit rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Upload GDS"}
      </button>
      {message && <p className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}