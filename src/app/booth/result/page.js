"use client";

import { apiFetch as fetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import BoothResult from "../BoothResult";

export default function SavedBoothResult() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setError("Result not found.");
      return;
    }
    fetch(`/api/booth/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "Result not found." : "Unable to load result.");
        return response.json();
      })
      .then(setResult)
      .catch((caught) => setError(caught.message));
  }, []);

  return <main className="booth">
    <header className="masthead"><div><p className="eyebrow">FISHFACE PHOTO BOOTH</p><h1><span>FISH</span>FACE</h1></div></header>
    {result ? <BoothResult result={result} /> : <p role={error ? "alert" : "status"}>{error || "Loading result…"}</p>}
    {result && error && <p className="error" role="alert">{error}</p>}
  </main>;
}
