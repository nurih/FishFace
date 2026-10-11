import "./globals.css";
import AmbientFish from "./AmbientFish";

const bubbleSeeds = [
  [5, 92, 3, 48, 8, 22, -4, .2],
  [8, 80, -2, 32, 4, 18, -15, .28],
  [11, 88, 5, 55, 13, 27, -21, .16],
  [15, 65, -3, 38, 6, 24, -9, .18],
  [23, 90, 4, 42, 3, 17, -13, .25],
  [31, 72, -5, 30, 11, 25, -6, .13],
  [34, 83, 2, 51, 5, 20, -19, .2],
  [36, 79, -2, 45, 7, 23, -11, .16],
  [45, 96, 4, 59, 15, 29, -23, .13],
  [51, 84, -4, 39, 5, 21, -8, .2],
  [57, 70, 2, 47, 9, 26, -17, .15],
  [61, 95, -3, 54, 4, 18, -3, .24],
  [70, 78, 5, 43, 12, 27, -20, .14],
  // [73, 85, -1, 34, 6, 22, -10, .21],
  // [75, 88, 3, 51, 3, 17, -7, .27],
  // [82, 64, -4, 38, 10, 25, -14, .15],
  // [89, 90, 4, 55, 8, 23, -22, .18],
  // [93, 76, -2, 46, 5, 19, -12, .22],
  // [95, 86, 2, 35, 14, 28, -5, .12],
  // [97, 56, -4, 42, 4, 21, -16, .22],
];

const ambientBubbles = bubbleSeeds.flatMap((bubble, index) =>
  Array.from({ length: 4 }, (_, copy) => copy === 0 ? bubble : [
    (bubble[0] + copy * 19 + index * 7) % 100,
    Math.max(18, bubble[1] - copy * 13 + (index % 4) * 3),
    bubble[2] + (copy % 2 ? -3 : 3),
    bubble[3] + copy * 4,
    Math.max(3, bubble[4] + (copy - 2) * 2),
    bubble[5] + copy * 2,
    bubble[6] - copy * 5 - index,
    bubble[7],
  ]),
);

export const metadata = {
  title: "FishFace",
  description: "Find your inner fish.",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>
    <AmbientFish />
    <div className="ambient-bubbles" aria-hidden="true">
      {ambientBubbles.map(([x, y, drift, sway, size, duration, delay, alpha], index) =>
        <span key={index} style={{
          "--x": `${x}%`, "--start": `${Math.max(0, (100 - y) / 4)}vh`, "--drift": `${drift}vw`,
          "--quarter-x": `${drift / 4 + sway / 32}vw`, "--half-x": `${drift / 2 - sway / 32}vw`,
          "--three-quarter-x": `${drift * .75 + sway / 32}vw`,
          "--size": `${size < 8 ? size : Math.round(size * 1.8)}px`,
          "--duration": `${duration}s`, "--delay": `${delay}s`, "--alpha": +(alpha * 1.15).toFixed(3),
          "--shape-duration": `${2.5 + index % 5 * .6}s`,
        }}><i /></span>)}
    </div>
    {children}
  </body></html>;
}
