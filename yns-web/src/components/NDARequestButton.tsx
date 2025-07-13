"use client";
import { useState } from "react";

export default function NDARequestButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pdk/request", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const { envelopeUrl } = await res.json();
      window.location.href = envelopeUrl; // redirect to DocuSign
    } catch (err) {
      console.error(err);
      alert("Failed to initiate NDA request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
    >
      {loading ? "Processing…" : "Start NDA Signing"}
    </button>
  );
}