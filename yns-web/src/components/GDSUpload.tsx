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
  const [progress, setProgress] = useState<number>(0);

  const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
  const ALLOWED_EXT = [
    ".gds",
    ".gds.gz",
    ".tgz",
    ".tar",
    ".tar.gz",
  ];

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (!ALLOWED_EXT.some((e) => file.name.toLowerCase().endsWith(e))) {
      setMessage(`Invalid file type. Allowed: ${ALLOWED_EXT.join(', ')}`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setMessage("File too large (max 100MB)");
      return;
    }
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

      // Try signed upload URL to get progress callbacks
      // @ts-ignore - `createSignedUploadUrl` is available in supabase-js >= 2.24
      const { data: signedData, error: signedError } = await supabaseBrowser.storage
        .from("gds")
        .createSignedUploadUrl(path);

      if (!signedError && signedData?.signedUrl && signedData?.token) {
        // Use XHR for progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
            }
          };
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 204) {
              resolve();
            } else {
              reject(new Error(`Upload failed. Status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("PUT", signedData.signedUrl, true);
          xhr.setRequestHeader("Content-Type", "application/octet-stream");
          xhr.send(file);
        });
        // Tell supabase upload finished via uploadToSignedUrl to finalize
        // @ts-ignore - uploadToSignedUrl typing may not yet exist in SDK types
        await supabaseBrowser.storage
          .from("gds")
          .uploadToSignedUrl(path, (signedData as any).token, file);
      } else {
        // Fallback: direct upload (no progress)
        const { error: uploadError } = await supabaseBrowser.storage
          .from("gds")
          .upload(path, file, { contentType: "application/octet-stream" });
        if (uploadError) throw uploadError;
      }

      // update application status and path
      const { error: updateError } = await supabaseBrowser
        .from("mpw_applications")
        .update({ status: "GDS_UPLOADED", gds_path: path })
        .eq("id", applicationId);
      if (updateError) throw updateError;

      setMessage("Upload successful. XOR verification pending.");
      setProgress(100);
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
      {uploading && (
        <div className="h-2 w-full rounded bg-slate-200">
          <div
            className="h-full rounded bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}