"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const playerKey = "fishface-player-id";
const nameKey = "fishface-full-name";
const formatMargin = (margin) => `${margin >= 0 ? "+" : ""}${margin.toFixed(3)}`;

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
  const activityCountRef = useRef(0);
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
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [systemsOpen, setSystemsOpen] = useState(false);
  const [purgeMode, setPurgeMode] = useState(false);
  const [activity, setActivity] = useState("");

  const runActivity = useCallback(async (label, operation) => {
    activityCountRef.current += 1;
    setActivity(label);
    try {
      return await operation();
    } finally {
      activityCountRef.current -= 1;
      if (!activityCountRef.current) setActivity("");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const attachVideo = useCallback((video) => {
    videoRef.current = video;
    if (video && streamRef.current) video.srcObject = streamRef.current;
  }, []);

  const startCamera = useCallback(async (requestedDeviceId) => {
    return runActivity("LINKING OPTICS", async () => {
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
    });
  }, [runActivity, stopCamera]);

  const loadLeaderboard = useCallback(async () => {
    if (!playerId) return;
    return runActivity("SYNCING REEF TELEMETRY", async () => {
      const response = await fetch(`/api/leaderboard?playerId=${encodeURIComponent(playerId)}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setCurrentEntry(data.currentEntry);
      setEntries(data.entries);
    });
  }, [playerId, runActivity]);

  const begin = async (event) => {
    event.preventDefault();
    const name = fullName.trim();
    if (!name) return;
    return runActivity("ASSIGNING SPECIMEN", async () => {
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
    });
  };

  const rerollFish = async () => {
    return runActivity("SWITCHING SPECIMEN", async () => {
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
    });
  };

  const endTurn = () => {
    window.clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = null;
    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    localStorage.removeItem(nameKey);
    const nextPlayerId = crypto.randomUUID();
    localStorage.setItem(playerKey, nextPlayerId);
    setPlayerId(nextPlayerId);
    setCountdown(0); setFish(null); setPhoto(null); setPhotoUrl(""); setPhotoDimensions(null);
    setResult(null); setCurrentEntry(null); setFullName(""); setReady(false); setError(""); setSystemsOpen(false);
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm(`Delete ${entry.fullName}'s target-match entry?`)) return;
    return runActivity("PURGING RECORD", async () => {
      setError("");
      try {
        const response = await fetch(`/api/leaderboard?id=${encodeURIComponent(entry.id)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        await loadLeaderboard();
      } catch (caught) { setError(caught.message || "Unable to delete this leaderboard entry."); }
    });
  };

  const submit = async (image, publish = false) => {
    if (!image) return false;
    setRanking(true);
    setError("");
    try {
      return await runActivity(publish ? "ENTERING LEADERBOARD" : "COMPARING SPECIMENS", async () => {
        const form = new FormData();
        form.append("playerId", playerId);
        form.append("fullName", fullName.trim());
        form.append("image", image, "fishface.jpg");
        if (publish) form.append("publish", "true");
        const response = await fetch("/api/submit", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        console.debug("FishFace score", { capture: photoDimensions, fish: data.fish, scores: data, publish });
        setResult(data);
        if (publish) await loadLeaderboard();
        return true;
      });
    } catch (caught) {
      setError(caught.message || "Unable to rank this FishFace.");
      return false;
    } finally { setRanking(false); }
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
    runActivity("CAPTURING IMAGE", () => new Promise((resolve) => canvas.toBlob((blob) => {
      if (!blob) return resolve();
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhoto(blob);
      setPhotoUrl(URL.createObjectURL(blob));
      submit(blob).finally(resolve);
    }, "image/jpeg", 0.9)));
  }, [photoUrl, runActivity, submit]);

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

  const enterLeaderboard = async () => {
    if (await submit(photo, true)) endTurn();
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

  return <main className="command-deck">
    <header className="masthead">
      <div><p className="eyebrow">AQUATIC ANALOGUE // FOUR-HOUR FISH-OFF</p><h1><span>FISH</span>FACE</h1><p className="mission">Make the face. Match the fish. Rule the reef.</p></div>
      <div className="header-controls"><p className="system-status"><span aria-hidden="true" />OPTICAL LINK {ready ? "ACTIVE" : "STANDBY"}</p>{activity && <ProgressMeter label={activity} />}<button className="cog-button" type="button" onClick={() => setSystemsOpen((open) => !open)} aria-expanded={systemsOpen} aria-controls="systems-panel" aria-label="Open systems controls">⚙</button></div>
    </header>
    {systemsOpen && <section className="systems-panel" id="systems-panel">
      <p className="panel-code">AUXILIARY SYSTEMS</p>
      <label className="camera-picker">Optical source<select value={deviceId} onChange={(event) => startCamera(event.target.value)} disabled={!ready}>
        {devices.length ? devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>) : <option>Start a run to connect a camera</option>}
      </select></label>
      <button className="secondary" onClick={endTurn} type="button">End turn</button>
      <label className="purge-toggle"><input type="checkbox" checked={purgeMode} onChange={(event) => setPurgeMode(event.target.checked)} /> Enable leaderboard purge</label>
    </section>}
    <section className="game-grid">
      <article className="card play-card">
        {!ready ? <form onSubmit={begin} className="start-form">
          <p className="panel-code">01 // INTAKE</p><h2>Identify yourself, cadet.</h2>
          <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="ENTER DESIGNATION" required /></label>
          <button>Assign specimen</button>
        </form> : <>
          <div className="camera">
            <p className="camera-readout">LIVE // FACE SCANNER</p>
            {photo ? <img src={photoUrl} alt="Your captured FishFace" /> : <><video ref={attachVideo} autoPlay playsInline muted /><div className="crop-box">{countdown ? <span>{countdown}</span> : null}</div></>}
            <div className="target"><p>ASSIGNED SPECIMEN</p>
              {fish?.imageUrl && <img src={fish.imageUrl} alt={fish.species} />}
              <strong>{fish?.species}</strong>
            </div>
          </div>
          <div className="actions">
            <button className="secondary" onClick={rerollFish} disabled={ranking} type="button">Switch specimen</button>
            {!photo ? <button onClick={capture} disabled={countdown > 0} type="button">{countdown ? "Hold position…" : "Initiate capture"}</button> : <>
              <button className="secondary" onClick={() => { URL.revokeObjectURL(photoUrl); setPhotoUrl(""); setPhoto(null); setPhotoDimensions(null); setResult(null); }} disabled={ranking} type="button">Retake scan</button>
              <button onClick={enterLeaderboard} disabled={ranking || !result} type="button">Enter leaderboard</button>
            </>}
          </div>
          {result && <section className="comparison-result" aria-live="polite">
            <p className="result">{result.targetWon ? "TARGET IDENTIFIED // Your specimen was the closest match." : `TARGET MISSED // ${result.closestMatchFish.species} was closer.`}</p>
            <p className="comparison-detail">Target rank #{result.assignedFishRank} · margin {formatMargin(result.targetMargin)}</p>
            <ComparisonStrip selfieUrl={photoUrl} targetFish={result.fish} closestMatchFish={result.closestMatchFish} />
          </section>}
        </>}
        {!ready && selectedEntry && <LeaderboardDetail entry={selectedEntry} />}
        {error && <p className="error" role="alert">{error}</p>}
      </article>
      <aside className="card leaderboard">
        <p className="panel-code">02 // TELEMETRY</p><p className="eyebrow">CURRENT ROUND</p><h2>Your latest capture</h2>
        {currentEntry ? <div className="current-entry"><ComparisonStrip selfieUrl={currentEntry.imageUrl} targetFish={currentEntry.fish} closestMatchFish={currentEntry.closestMatchFish} /><p>{currentEntry.targetWon ? "Target identified" : `Closest match: ${currentEntry.closestMatchFish.species}`} · target rank #{currentEntry.assignedFishRank} · margin {formatMargin(currentEntry.targetMargin)}</p></div> : <p>No scored capture yet.</p>}
        <p className="eyebrow">LIVE LEADERBOARD</p><h2>Current period</h2>
        {entries.length ? <ol>{entries.map((entry) => <li key={entry.id}><button className="leaderboard-entry" type="button" onClick={() => setSelectedEntry(entry)} aria-pressed={selectedEntry?.id === entry.id}><span className="leaderboard-thumbnails"><img src={entry.fish.imageUrl} alt="" /><img src={entry.imageUrl} alt="" /><img src={entry.closestMatchFish.imageUrl} alt="" /></span><span>{entry.fullName}</span><strong>{entry.targetWon ? "TARGET" : `#${entry.assignedFishRank}`} · {formatMargin(entry.targetMargin)}</strong></button>{purgeMode && <button className="purge-button" type="button" onClick={() => deleteEntry(entry)} aria-label={`Delete ${entry.fullName}'s leaderboard entry`}>PURGE</button>}</li>)}</ol> : <p>No faces in the water yet.</p>}
      </aside>
    </section>
    <footer className="repo-link">
      <a href="https://github.com/nurih/FishFace" target="_blank" rel="noreferrer" aria-label="Open FishFace source code on GitHub">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.5c-2.23.49-2.7-.95-2.7-.95-.36-.93-.89-1.18-.89-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.87.87 2.33.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.96 0-.87.31-1.58.82-2.14-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.8c.68 0 1.37.09 2.01.27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.14 0 3.08-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.14.46.55.38A8 8 0 0 0 8 0Z" /></svg>
        <span>VIEW SOURCE</span>
      </a>
    </footer>
  </main>;
}

function ProgressMeter({ label }) {
  return <div className="progress-meter" role="status" aria-live="polite"><span>FUEL // {label}</span><i aria-hidden="true" /></div>;
}

function ComparisonStrip({ selfieUrl, targetFish, closestMatchFish, large = false, targetFirst = false }) {
  const selfie = <figure><img src={selfieUrl} alt="Your captured FishFace" /><figcaption>SELFIE</figcaption></figure>;
  const target = <figure><img src={targetFish.imageUrl} alt={targetFish.species} /><figcaption>TARGET // {targetFish.species}</figcaption></figure>;
  const bestMatch = <figure><img src={closestMatchFish.imageUrl} alt={closestMatchFish.species} /><figcaption>BEST MATCH // {closestMatchFish.species}</figcaption></figure>;
  return <div className={`comparison-strip${large ? " comparison-strip-large" : ""}${targetFirst ? " comparison-strip-target-first" : ""}`}>
    {targetFirst ? <>{target}{selfie}{bestMatch}</> : <>{selfie}{target}{bestMatch}</>}
  </div>;
}

function LeaderboardDetail({ entry }) {
  return <section className="leaderboard-detail" aria-live="polite">
    <p className="panel-code">SELECTED LEADERBOARD RECORD</p>
    <h2>{entry.fullName}</h2>
    <p>{entry.targetWon ? "Target identified" : `Closest match: ${entry.closestMatchFish.species}`} · target rank #{entry.assignedFishRank} · margin {formatMargin(entry.targetMargin)}</p>
    <ComparisonStrip selfieUrl={entry.imageUrl} targetFish={entry.fish} closestMatchFish={entry.closestMatchFish} large targetFirst />
  </section>;
}
