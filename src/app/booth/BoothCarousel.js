"use client";

import { boothGalleryCache } from "@/lib/booth-gallery-cache";
import { useCallback, useEffect, useRef, useState } from "react";

const segments = Array.from({ length: 18 }, (_, index) => <i key={index} />);

export default function BoothCarousel() {
  const [entry, setEntry] = useState(null);
  const [outgoing, setOutgoing] = useState(null);
  const [error, setError] = useState(false);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [visible, setVisible] = useState(false);
  const currentEntry = useRef(null);
  const loading = useRef(false);
  const transitionTimer = useRef(null);

  const advance = useCallback(async () => {
    if (loading.current || document.hidden) return;
    loading.current = true;
    try {
      const nextEntry = await boothGalleryCache.next();
      window.clearTimeout(transitionTimer.current);
      setOutgoing(currentEntry.current?.id !== nextEntry?.id ? currentEntry.current : null);
      currentEntry.current = nextEntry;
      setEntry(nextEntry);
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
    const updateVisibility = () => setVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      window.clearTimeout(transitionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        await boothGalleryCache.refresh();
        if (!cancelled) setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    refresh();
    advance();
    const timer = window.setInterval(refresh, 60000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [advance, visible]);

  useEffect(() => {
    if (!visible || !cycle) return;
    const timer = window.setTimeout(advance, 20000);
    return () => window.clearTimeout(timer);
  }, [advance, cycle, visible]);

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
