"use client";

import { apiFetch as fetch } from "@/lib/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import BoothResult from "./BoothResult";
import BoothCarousel from "./BoothCarousel";
import { boothGalleryCache } from "@/lib/booth-gallery-cache";

export default function PhotoBooth() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const countdownRef = useRef(null);
  const [stage, setStage] = useState("start");
  const [fullName, setFullName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [fish, setFish] = useState(null);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (stage !== "play") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is required to take a selfie.");
      return;
    }
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera access is required to take a selfie."));
    return () => { cancelled = true; stopCamera(); };
  }, [stage, stopCamera]);

  useEffect(() => () => {
    window.clearInterval(countdownRef.current);
    stopCamera();
  }, [stopCamera]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const assignment = async (id, name, reroll = false) => {
    const response = await fetch("/api/assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id, fullName: name, reroll }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to assign a fish.");
    return data.fish;
  };

  const startTurn = async (event) => {
    event.preventDefault();
    const name = fullName.trim();
    if (!name) return setError("Enter your name.");
    setBusy(true);
    setError("");
    try {
      const id = crypto.randomUUID();
      const target = await assignment(id, name);
      setFullName(name);
      setPlayerId(id);
      setFish(target);
      setResult(null);
      setStage("play");
    } catch (caught) {
      setError(caught.message);
    } finally { setBusy(false); }
  };

  const switchFish = async () => {
    setBusy(true);
    setError("");
    try { setFish(await assignment(playerId, fullName, true)); }
    catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.clientWidth || !video.clientHeight) return;
    setBusy(true);
    setError("");
    const displayScale = Math.max(video.clientWidth / video.videoWidth, video.clientHeight / video.videoHeight);
    const cropSize = Math.min(video.clientWidth * 0.6 / displayScale, video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(240, Math.round(cropSize));
    canvas.getContext("2d").drawImage(video, (video.videoWidth - cropSize) / 2, (video.videoHeight - cropSize) / 2,
      cropSize, cropSize, 0, 0, canvas.width, canvas.height);
    const image = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    setBusy(false);
    if (!image) return setError("Unable to capture a selfie.");
    setPreview({ image, url: URL.createObjectURL(image) });
    setStage("review");
  };

  const ratePhoto = async () => {
    if (!preview?.image || busy) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("playerId", playerId);
      form.append("fullName", fullName);
      form.append("image", preview.image, "fishface.jpg");
      form.append("booth", "true");
      const response = await fetch("/api/submit", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to score this selfie.");
      setResult({ ...data, fullName });
      setPreview(null);
      setStage("result");
    } catch (caught) {
      setError(caught.message);
    } finally { setBusy(false); }
  };

  const capture = () => {
    if (busy || countdownRef.current || !videoRef.current?.videoWidth) return;
    let remaining = 3;
    setCountdown(remaining);
    countdownRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining) return;
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
      capturePhoto();
    }, 1000);
  };

  const retake = () => {
    setPreview(null);
    setError("");
    setStage("play");
  };

  const endTurn = () => {
    window.clearInterval(countdownRef.current);
    countdownRef.current = null;
    stopCamera();
    setCountdown(0);
    setPlayerId("");
    setFullName("");
    setFish(null);
    setResult(null);
    setPreview(null);
    setError("");
    setStage("start");
  };

  const finishTurn = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/booth/${result.id}/publish`, { method: "POST" });
      if (!response.ok) throw new Error("Unable to finish this turn.");
      boothGalleryCache.invalidate();
      endTurn();
    } catch (caught) {
      setError(caught.message);
    } finally { setBusy(false); }
  };

  return <main className="booth">
    <header className="masthead"><div><p className="eyebrow">FISHFACE PHOTO BOOTH</p><h1><span>FISH</span>FACE</h1><p className="mission">Unleash your creativity! Powered by MongoDB, Atlas Vector Search & Voyage AI</p></div></header>
    {stage === "start" && <BoothCarousel />}
    {stage === "start" && <section className="card booth-intro">
      <p className="panel-code">01 // START</p><h2>Fish-Face Competition</h2>
      <ol>
        <li>Make your best fish-face impression.</li>
        <li>Take a selfie.</li>
        <li>See how well your fish-face matches your target fish.</li>
      </ol>
      <form className="start-form" onSubmit={startTurn}>
        <label>Your name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
        <button type="submit" disabled={busy}>Let's go!</button>
      </form>
    </section>}
    {(stage === "play" || stage === "review") && <section className="card booth-play">
      <p className="panel-code">02 // {stage === "review" ? "REVIEW" : "CAMERA"}</p>
      <div className="booth-heading">
        <h2>{stage === "review" ? "Review your selfie" : "Make your best Fish Face, and take a selfie!"}</h2>
        {stage === "play" && <button className="booth-switch" type="button" onClick={switchFish} disabled={busy || countdown > 0} aria-label="Switch fish" title="Switch fish">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 1-2.4-5.7" /><path d="M20 4v6h-6" /></svg>
        </button>}
      </div>
      <div className="booth-stage">
        <div className={`camera${stage === "review" ? " camera-review" : ""}`}>
          <p className="camera-readout">{stage === "review" ? "SELFIE PREVIEW" : "LIVE // FACE SCANNER"}</p>
          {stage === "review" ? <img src={preview.url} alt="Captured selfie" /> : <>
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="crop-box">{countdown > 0 && <span>{countdown}</span>}</div>
          </>}
        </div>
        <div className="booth-controls">
          <div className="booth-target">
            <img src={fish.imageUrl} alt={fish.species} />
            <div className="booth-target-label"><strong>Your Target</strong><span>{fish.species}</span></div>
          </div>
          {stage === "review" ? <div className="booth-review-actions">
            <button type="button" onClick={ratePhoto} disabled={busy}>{busy ? "Rating…" : "Rate my FishFace"}</button>
            <button className="secondary" type="button" onClick={retake} disabled={busy}>Retake</button>
          </div> : <button className="booth-capture" type="button" onClick={capture} disabled={busy || countdown > 0} aria-label={countdown ? "Hold still" : "Take selfie"} title="Take selfie">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          </button>}
          <button className="secondary leave-turn" type="button" onClick={endTurn} disabled={busy}>End turn</button>
        </div>
      </div>
    </section>}
    {stage === "result" && result && <BoothResult result={result} onEnd={finishTurn} ending={busy} />}
    {error && <p className="error" role="alert">{error}</p>}
  </main>;
}
