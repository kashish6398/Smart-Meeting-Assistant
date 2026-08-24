import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Smart Meeting Assistant — Executive AI Workspace",
  description:
    "Real-time transcription, live insights, executive summaries, and interactive AI Q&A powered by NaraRouter & Stream Video.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050508] text-[#ededed] font-sans selection:bg-indigo-500/30 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
