"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const segments = Array.from({ length: 18 }, (_, index) => <i key={index} />);

export default function BoothCarousel() {
  const [entry, setEntry] = useState(null);
  const [outgoing, setOutgoing] = useState(null);
  const [error, setError] = useState(false);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const [cycle, setCycle] = useState(0);
  const currentId = useRef(null);
  const currentEntry = useRef(null);
  const loading = useRef(false);
  const transitionTimer = useRef(null);

  const advance = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const query = currentId.current ? `?before=${encodeURIComponent(currentId.current)}` : "";
      const response = await fetch(`/api/booth/gallery${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      currentId.current = data.entry?.id || null;
      window.clearTimeout(transitionTimer.current);
      setOutgoing(currentEntry.current?.id !== data.entry?.id ? currentEntry.current : null);
      currentEntry.current = data.entry;
      setEntry(data.entry);
      transitionTimer.current = window.setTimeout(() => setOutgoing(null), 450);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoadingFirst(false);
      loading.current = false;
      setCycle((value) => value + 1);
    }
  }, []);

  useEffect(() => {
    advance();
    return () => window.clearTimeout(transitionTimer.current);
  }, [advance]);

  useEffect(() => {
    if (!cycle) return;
    const timer = window.setTimeout(advance, 10000);
    return () => window.clearTimeout(timer);
  }, [advance, cycle]);

  return <section className="card booth-carousel" aria-label="Photo booth gallery">
    <div className="booth-carousel-heading">
      <div><p className="panel-code">RECENT FISH FACES</p><h2>{entry?.fullName ? `${entry.fullName}'s FishFace` : "FishFace gallery"}</h2></div>
    </div>
    {entry && <div className="booth-carousel-cue" key={cycle} aria-hidden="true">
      <span className="booth-carousel-cue-segments">{segments}</span>
      <span className="booth-carousel-cue-progress"><span className="booth-carousel-cue-segments">{segments}</span></span>
    </div>}
    {entry ? <div className="booth-carousel-slides">{[outgoing, entry].filter(Boolean).map((slide) =>
      <div className={`booth-carousel-frames booth-carousel-slide ${slide.id === entry.id ? "booth-carousel-slide-current" : "booth-carousel-slide-outgoing"}`} key={slide.id} aria-hidden={slide.id !== entry.id}>
        <figure><img src={slide.target.imageUrl} alt={slide.target.species} /><figcaption>Target <strong>{slide.target.species}</strong></figcaption></figure>
        <figure><img src={slide.selfieUrl} alt={`${slide.fullName}'s selfie`} /><figcaption>Selfie <strong>{slide.fullName}</strong></figcaption></figure>
        <figure><img src={slide.match.imageUrl} alt={slide.match.species} /><figcaption>Match <strong>{slide.match.species}</strong></figcaption></figure>
      </div>)}</div> : <p className="booth-carousel-empty">{loadingFirst ? "Loading FishFaces…" : error ? "Gallery unavailable." : "No FishFaces yet."}</p>}
  </section>;
}
