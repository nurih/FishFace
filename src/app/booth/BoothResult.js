"use client";

import { siteUrl } from "@/lib/api-client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function BoothResult({ result, onEnd, ending = false }) {
  const [permalink, setPermalink] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const url = new URL(siteUrl(`/booth/result/?id=${encodeURIComponent(result.id)}`), window.location.origin).toString();
    setPermalink(url);
    QRCode.toDataURL(url, { width: 220, margin: 2 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [result.id]);

  return <section className="booth-result" aria-live="polite">
    <div className="booth-print-card">
      <div className="booth-print-frame">
        <header className="booth-print-heading">
          <p>FISHFACE PHOTO BOOTH <span>2026</span></p>
          <h2>{result.fullName ? `${result.fullName}'s FishFace` : "FishFace"}</h2>
          <p className="booth-print-outcome">{result.targetWon ? "TARGET MATCHED!" : "MEET YOUR BEST MATCH"}</p>
          <p className="booth-print-score">TARGET RANK #{result.assignedFishRank} · MARGIN {result.targetMargin >= 0 ? "+" : ""}{result.targetMargin.toFixed(3)}</p>
        </header>
        <figure className="booth-print-selfie"><img src={result.imageUrl} alt={`${result.fullName || "Player"}'s FishFace selfie`} /><figcaption>THE FACE BEHIND THE FISH <span>{result.fullName}</span></figcaption></figure>
        <div className="booth-print-fish">
          <figure><img src={result.fish.imageUrl} alt={result.fish.species} /><figcaption>ATTEMPTED THIS<strong>{result.fish.species}</strong></figcaption></figure>
          <figure><img src={result.closestMatchFish.imageUrl} alt={result.closestMatchFish.species} /><figcaption>GOT THAT ... {result.targetWon ? <> Winner!🏆</>: <> 🤷 </>}<strong>{result.closestMatchFish.species}</strong></figcaption></figure>
        </div>
        <footer className="booth-print-footer">
          <img src={siteUrl("/Local Event Logo - Horizontal Light.svg")} alt="MongoDB" />
          <p>Build Anything. Change Everything.</p>
        </footer>
      </div>
    </div>
    <div className={`booth-result-actions${onEnd ? "" : " booth-result-actions-saved"}`}>
      <div className="booth-qr">
        {qrUrl && <a href={permalink} aria-label="Open this result"><img src={qrUrl} alt="QR code for this result permalink" /></a>}
        <p>Scan QR to download</p>
      </div>
      <button type="button" onClick={() => window.print()}>Print</button>
      {onEnd && <button className="secondary" type="button" onClick={onEnd} disabled={ending}>{ending ? "Adding…" : "End Turn"}</button>}
    </div>
  </section>;
}
