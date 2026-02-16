import "./globals.css";

export const metadata = {
  title: "Meeting Notes Generator",
  description:
    "Transcribe meeting audio and generate AI-powered notes with AssemblyAI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
