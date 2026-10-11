"use client";

import { useEffect, useRef } from "react";

const sizes = [18, 22, 15, 19, 14, 21, 16, 20, 17, 23, 15, 18];
const random = (min, max) => min + Math.random() * (max - min);
const length = (x, y) => Math.hypot(x, y) || 1;

function obstacleRect() {
  const element = document.querySelector(".play-card, .booth-play, .booth-intro, .booth-result");
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { left: rect.left - 30, right: rect.right + 30, top: rect.top - 30, bottom: rect.bottom + 30 };
}

function openPoint(width, height, obstacle, fish = [], origin) {
  let best;
  let bestSpace = -1;
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = origin ? Math.max(18, Math.min(width - 18, origin.x + random(-260, 260))) : random(18, width - 18);
    const y = origin ? Math.max(18, Math.min(height - 18, origin.y + random(-220, 220))) : random(18, height - 18);
    if (obstacle && x > obstacle.left && x < obstacle.right && y > obstacle.top && y < obstacle.bottom) continue;
    if (origin && length(x - origin.x, y - origin.y) < 70) continue;
    const space = fish.reduce((nearest, other) => Math.min(nearest, length(x - other.x, y - other.y)), Infinity);
    if (space > bestSpace) { best = { x, y }; bestSpace = space; }
  }
  return best || { x: Math.random() < .5 ? 18 : width - 18, y: random(18, height - 18) };
}

function avoidRect(x, y, rect) {
  if (!rect) return { x: 0, y: 0 };
  const nearestX = Math.max(rect.left, Math.min(x, rect.right));
  const nearestY = Math.max(rect.top, Math.min(y, rect.bottom));
  let dx = x - nearestX;
  let dy = y - nearestY;
  if (!dx && !dy) {
    const edges = [x - rect.left, rect.right - x, y - rect.top, rect.bottom - y];
    const edge = edges.indexOf(Math.min(...edges));
    return { x: edge === 0 ? -3 : edge === 1 ? 3 : 0, y: edge === 2 ? -3 : edge === 3 ? 3 : 0 };
  }
  const distance = length(dx, dy);
  const strength = Math.max(0, 1 - distance / 85);
  return { x: dx / distance * strength * 3, y: dy / distance * strength * 3 };
}

export default function AmbientFish() {
  const nodes = useRef([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let obstacle = obstacleRect();
    const fish = [];
    nodes.current.forEach((node, index) => {
      const position = openPoint(width, height, obstacle, fish);
      const heading = random(0, Math.PI * 2);
      fish.push({ node, ...position, vx: Math.cos(heading), vy: Math.sin(heading),
        target: position, nextTarget: 0,
        nextDart: random(5, 18), dartEnd: 0, speed: random(12, 22), size: sizes[index] });
    });
    let frame;
    let last = performance.now();
    let elapsed = 0;
    let nextMeasure = 0;

    function tick(now) {
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      elapsed += dt;
      if (elapsed >= nextMeasure) {
        width = window.innerWidth;
        height = window.innerHeight;
        obstacle = obstacleRect();
        nextMeasure = elapsed + .5;
      }
      for (const current of fish) {
        if (elapsed > current.nextTarget || length(current.target.x - current.x, current.target.y - current.y) < 35) {
          current.target = openPoint(width, height, obstacle, fish.filter((other) => other !== current), current);
          current.nextTarget = elapsed + random(5, 12);
        }
        if (elapsed > current.nextDart) {
          current.dartEnd = elapsed + random(.35, .8);
          current.nextDart = elapsed + random(9, 22);
        }
        let steerX = (current.target.x - current.x) / length(current.target.x - current.x, current.target.y - current.y);
        let steerY = (current.target.y - current.y) / length(current.target.x - current.x, current.target.y - current.y);
        for (const other of fish) {
          if (other === current) continue;
          const dx = current.x - other.x;
          const dy = current.y - other.y;
          const distance = length(dx, dy);
          if (distance < 65) {
            const strength = (1 - distance / 65) * 2.5;
            steerX += dx / distance * strength;
            steerY += dy / distance * strength;
          }
        }
        const obstacleForce = avoidRect(current.x + current.vx * 45, current.y + current.vy * 45, obstacle);
        steerX += obstacleForce.x;
        steerY += obstacleForce.y;
        if (current.x < 45) steerX += (45 - current.x) / 20;
        if (current.x > width - 45) steerX -= (current.x - width + 45) / 20;
        if (current.y < 45) steerY += (45 - current.y) / 20;
        if (current.y > height - 45) steerY -= (current.y - height + 45) / 20;
        const magnitude = length(steerX, steerY);
        const blend = Math.min(1, dt * 2);
        current.vx += (steerX / magnitude - current.vx) * blend;
        current.vy += (steerY / magnitude - current.vy) * blend;
        const direction = length(current.vx, current.vy);
        current.vx /= direction;
        current.vy /= direction;
        const speed = current.speed * (elapsed < current.dartEnd ? 3 : 1);
        current.x += current.vx * speed * dt;
        current.y += current.vy * speed * dt;
        current.node.style.transform = `translate3d(${current.x - current.size / 2}px, ${current.y - current.size * 1.1}px, 0) rotate(${Math.atan2(current.vy, current.vx) * 180 / Math.PI + 90}deg)`;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div className="ambient-fish" aria-hidden="true">
    {sizes.map((size, index) => <span key={index} ref={(node) => { nodes.current[index] = node; }} style={{ "--size": `${size}px` }}><i /></span>)}
  </div>;
}
