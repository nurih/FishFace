"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BoothResult from "../../BoothResult";

export default function SavedBoothResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);

  const finishTurn = async () => {
    setEnding(true);
    setError("");
    try {
      const response = await fetch(`/api/booth/${encodeURIComponent(id)}/publish`, { method: "POST" });
      if (!response.ok) throw new Error("Unable to finish this turn.");
      window.location.assign("/booth");
    } catch (caught) {
      setError(caught.message);
      setEnding(false);
    }
  };

  useEffect(() => {
    fetch(`/api/booth/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "Result not found." : "Unable to load result.");
        return response.json();
      })
      .then(setResult)
      .catch((caught) => setError(caught.message));
  }, [id]);

  return <main className="booth">
    <header className="masthead"><div><p className="eyebrow">FISHFACE PHOTO BOOTH</p><h1><span>FISH</span>FACE</h1></div></header>
    {result ? <BoothResult result={result} onEnd={finishTurn} ending={ending} /> : <p role={error ? "alert" : "status"}>{error || "Loading result…"}</p>}
    {result && error && <p className="error" role="alert">{error}</p>}
  </main>;
}
