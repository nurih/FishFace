"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function BoothResult({ result, onEnd, ending = false }) {
  const [permalink, setPermalink] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const url = new URL(`/booth/result/${result.id}`, window.location.origin).toString();
    setPermalink(url);
    QRCode.toDataURL(url, { width: 220, margin: 2 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [result.id]);

  return <section className="booth-result" aria-live="polite">
    <p className="panel-code">FISHFACE PHOTO BOOTH // RESULT</p>
    <h2>{result.fullName ? `${result.fullName}'s FishFace Photo Strip` : "FishFace Photo Strip"}</h2>
    <p className="booth-outcome">{result.targetWon ? "Target matched!" : "Here is your closest match"}</p>
    <p className="booth-score">Target rank #{result.assignedFishRank} · margin {result.targetMargin >= 0 ? "+" : ""}{result.targetMargin.toFixed(3)}</p>
    <div className="booth-triple">
      <figure><img src={result.fish.imageUrl} alt={result.fish.species} /><figcaption>YOUR TARGET<br /><strong>{result.fish.species}</strong></figcaption></figure>
      <figure><img src={result.imageUrl} alt="Your FishFace selfie" /><figcaption>{result.fullName}</figcaption></figure>
      <figure><img src={result.closestMatchFish.imageUrl} alt={result.closestMatchFish.species} /><figcaption>BEST MATCH<br /><strong>{result.closestMatchFish.species}</strong></figcaption></figure>
    </div>
    <div className="booth-result-actions">
      <div className="booth-qr">
        {qrUrl && <a href={permalink} aria-label="Open this result"><img src={qrUrl} alt="QR code for this result permalink" /></a>}
        <p>Scan QR to download</p>
      </div>
      <button type="button" onClick={() => window.print()}>Print</button>
      <button className="secondary" type="button" onClick={onEnd} disabled={ending}>{ending ? "Adding…" : "End Turn"}</button>
    </div>
  </section>;
}
