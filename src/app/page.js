"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const playerKey = "fishface-player-id";
const nameKey = "fishface-full-name";
const formatScore = (score) => (score * 100).toFixed(2);

function getPlayerId() {
  let id = localStorage.getItem(playerKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(playerKey, id);
  }
  return id;
}

export default function Home() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const [playerId, setPlayerId] = useState("");
  const [fullName, setFullName] = useState("");
  const [ready, setReady] = useState(false);
  const [fish, setFish] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoDimensions, setPhotoDimensions] = useState(null);
  const [ranking, setRanking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [currentEntry, setCurrentEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const [countdown, setCountdown] = useState(0);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const attachVideo = useCallback((video) => {
    videoRef.current = video;
    if (video && streamRef.current) video.srcObject = streamRef.current;
  }, []);

  const startCamera = useCallback(async (requestedDeviceId) => {
    stopCamera();
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: requestedDeviceId ? { deviceId: { exact: requestedDeviceId } } : true,
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      const videoInputs = (await navigator.mediaDevices.enumerateDevices()).filter((item) => item.kind === "videoinput");
      setDevices(videoInputs);
      setDeviceId(requestedDeviceId || videoInputs[0]?.deviceId || "");
    } catch {
      setError("Camera access is required to make a FishFace.");
    }
  }, [stopCamera]);

  const loadLeaderboard = useCallback(async () => {
    if (!playerId) return;
    const response = await fetch(`/api/leaderboard?playerId=${encodeURIComponent(playerId)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setCurrentEntry(data.currentEntry);
    setEntries(data.entries);
  }, [playerId]);

  const begin = async (event) => {
    event.preventDefault();
    const name = fullName.trim();
    if (!name) return;
    setError("");
    try {
      const response = await fetch("/api/assignment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, fullName: name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      localStorage.setItem(nameKey, name);
      setFish(data.fish);
      setReady(true);
      await startCamera();
    } catch (caught) {
      setError(caught.message || "Unable to begin the round.");
    }
  };

  const rerollFish = async () => {
    setError("");
    try {
      const response = await fetch("/api/assignment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, fullName: fullName.trim(), reroll: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhoto(null);
      setPhotoUrl("");
      setPhotoDimensions(null);
      setResult(null);
      setFish(data.fish);
    } catch (caught) {
      setError(caught.message || "Unable to choose another fish.");
    }
  };

  const snapPhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.clientWidth || !video.clientHeight) return;
    const displayScale = Math.max(video.clientWidth / video.videoWidth, video.clientHeight / video.videoHeight);
    const cropSize = Math.min(video.clientWidth * 0.6 / displayScale, video.videoWidth, video.videoHeight);
    const cropX = (video.videoWidth - cropSize) / 2;
    const cropY = (video.videoHeight - cropSize) / 2;
    const outputSize = Math.min(240, Math.round(cropSize));
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    canvas.getContext("2d").drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);
    setPhotoDimensions({ width: canvas.width, height: canvas.height });
    canvas.toBlob((blob) => {
      if (!blob) return;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhoto(blob);
      setPhotoUrl(URL.createObjectURL(blob));
    }, "image/jpeg", 0.9);
  }, [photoUrl]);

  const capture = () => {
    if (countdownTimerRef.current || !videoRef.current?.videoWidth) return;
    let remaining = 3;
    setCountdown(remaining);
    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining) {
        setCountdown(remaining);
        return;
      }
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(0);
      snapPhoto();
    }, 1000);
  };

  const submit = async () => {
    if (!photo) return;
    setRanking(true);
    setError("");
    try {
      const form = new FormData();
      form.append("playerId", playerId);
      form.append("fullName", fullName.trim());
      form.append("image", photo, "fishface.jpg");
      const response = await fetch("/api/submit", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      console.debug("FishFace score", { capture: photoDimensions, fish: data.fish, scores: data });
      setResult(data);
      await loadLeaderboard();
    } catch (caught) {
      setError(caught.message || "Unable to rank this FishFace.");
    } finally {
      setRanking(false);
    }
  };

  useEffect(() => {
    setPlayerId(getPlayerId());
    setFullName(localStorage.getItem(nameKey) || "");
    loadLeaderboard();
    return () => {
      stopCamera();
      window.clearInterval(countdownTimerRef.current);
    };
  }, [loadLeaderboard, stopCamera]);

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  return <main>
    <header><p className="eyebrow">THE FOUR-HOUR FISH-OFF</p><h1>FishFace</h1><p>Make the face. Match the fish. Rule the reef.</p></header>
    <section className="game-grid">
      <article className="card play-card">
        {!ready ? <form onSubmit={begin} className="start-form">
          <h2>Ready to get weird?</h2>
          <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" required /></label>
          <button>Meet your fish</button>
        </form> : <>
          <div className="camera">
            {photo ? <img src={photoUrl} alt="Your captured FishFace" /> : <><video ref={attachVideo} autoPlay playsInline muted /><div className="crop-box">{countdown ? <span>{countdown}</span> : null}</div></>}
            <div className="target">
              {fish?.imageUrl && <img src={fish.imageUrl} alt={fish.species} />}
              <strong>{fish?.species}</strong>
            </div>
          </div>
          <label className="camera-picker">Camera<select value={deviceId} onChange={(event) => startCamera(event.target.value)}>
            {devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}
          </select></label>
          <div className="actions">
            <button className="secondary" onClick={rerollFish} disabled={ranking} type="button">Change fish</button>
            {!photo ? <button onClick={capture} disabled={countdown > 0} type="button">{countdown ? "Get ready…" : "Capture FishFace"}</button> : <>
              <button className="secondary" onClick={() => { URL.revokeObjectURL(photoUrl); setPhotoUrl(""); setPhoto(null); setPhotoDimensions(null); }} type="button">Retake</button>
              <button onClick={submit} disabled={ranking} type="button">{ranking ? "Ranking…" : "Score it"}</button>
            </>}
          </div>
          {result && <p className="result">Your {formatScore(result.assignedFishSimilarity)}% fish match is in the leaderboard.</p>}
        </>}
        {error && <p className="error" role="alert">{error}</p>}
      </article>
      <aside className="card leaderboard">
        <p className="eyebrow">CURRENT ROUND</p><h2>Your latest capture</h2>
        {currentEntry ? <div className="current-entry"><div><img src={currentEntry.imageUrl} alt="Your latest FishFace" /><img src={currentEntry.fish.imageUrl} alt={currentEntry.fish.species} /></div><p>{formatScore(currentEntry.score)}% × {currentEntry.fish.species}</p></div> : <p>No scored capture yet.</p>}
        <p className="eyebrow">LIVE LEADERBOARD</p><h2>Current period</h2>
        {entries.length ? <ol>{entries.map((entry) => <li key={entry.id}><span>{entry.fullName}</span><strong>{formatScore(entry.score)}%</strong></li>)}</ol> : <p>No faces in the water yet.</p>}
      </aside>
    </section>
  </main>;
}
