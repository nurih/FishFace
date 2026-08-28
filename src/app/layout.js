import "./globals.css";

export const metadata = {
  title: "FishFace",
  description: "Find your inner fish.",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
