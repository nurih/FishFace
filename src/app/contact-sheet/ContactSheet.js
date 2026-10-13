"use client";

import { useCallback, useEffect, useState } from "react";

export default function ContactSheet() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/contact-sheet?page=${page}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load selfies.");
      const result = await response.json();
      if (page > result.pages) return setPage(result.pages);
      setData(result);
      setError("");
    } catch (caught) { setError(caught.message); }
  }, [page]);

  useEffect(() => { setData(null); load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm("Delete this selfie?")) return;
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/contact-sheet", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Unable to delete selfie.");
      await load();
    } catch (caught) { setError(caught.message); }
    finally { setBusy(null); }
  };

  return <main style={{ maxWidth: 1000 }}>
    <h1 style={{ fontSize: 24, letterSpacing: 0, textShadow: "none" }}>Contact sheet</h1>
    {error && <p role="alert">{error}</p>}
    {data && <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
        {data.entries.map((entry) => <div key={entry.id} style={{ position: "relative" }}>
          <img src={entry.imageUrl} alt="Selfie" style={{ display: "block", width: "100%", aspectRatio: "1", objectFit: "cover" }} />
          <button type="button" aria-label="Delete selfie" title="Delete selfie" disabled={busy !== null}
            onClick={() => remove(entry.id)} style={{ position: "absolute", right: 2, bottom: 2, padding: 4, lineHeight: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7" />
            </svg>
          </button>
        </div>)}
      </div>
      {!data.entries.length && <p>No selfies.</p>}
      <nav style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>{page} / {data.pages}</span>
        <button type="button" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
      </nav>
    </>}
  </main>;
}
