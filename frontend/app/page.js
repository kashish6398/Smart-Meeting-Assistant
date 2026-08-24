"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [meetingId, setMeetingId] = useState(
    process.env.NEXT_PUBLIC_CALL_ID || "smart-meeting-room"
  );
  const hasStreamKey = Boolean(process.env.NEXT_PUBLIC_STREAM_API_KEY);
  const router = useRouter();

  const handleJoin = (e) => {
    e?.preventDefault();
    const name = username.trim() === "" ? "Anonymous" : username.trim();
    const roomId = (meetingId.trim() === "" ? "smart-meeting-room" : meetingId.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");

    router.push(`/meeting/${roomId}?name=${encodeURIComponent(name)}`);
  };

  const handleGenerateRoom = () => {
    const randomId = "room-" + Math.random().toString(36).substring(2, 8);
    setMeetingId(randomId);
  };

  return (
    <main className="relative min-h-dvh bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none">
      {/* Ambient Radial Mesh Lighting (Fixed Layer) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-br from-accent/15 via-pink-400/10 to-transparent rounded-full blur-[120px] animate-ambient" />
        <div className="absolute -bottom-32 left-1/3 w-112.5 h-[450px] bg-accent/10 rounded-full blur-[100px] animate-ambient" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,77,109,0.04)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      </div>

      {/* Floating Status Pill Header */}
      <header className="relative z-10 mb-8 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-border-subtle backdrop-blur-xl shadow-lg shadow-accent/5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500 font-mono">
            NaraRouter & Stream Active
          </span>
        </div>
      </header>

      {/* Main Double-Bezel Card */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Outer Shell */}
        <div className="p-1.5 md:p-2 rounded-[2rem] bg-surface-card/60 border border-border-subtle shadow-2xl shadow-accent/10 backdrop-blur-2xl">
          {/* Inner Core */}
          <div className="p-7 md:p-9 rounded-[calc(2rem-0.375rem)] bg-surface-card border border-border-subtle shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col">
            
            {/* Header / Brand */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-accent-subtle to-transparent border border-border-highlight p-0.5 shadow-xl flex items-center justify-center mb-4 group transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105">
                <div className="w-full h-full rounded-[14px] bg-surface-inner flex items-center justify-center text-accent">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-secondary-subtle border border-secondary-color/20 text-secondary-color text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-2">
                Executive Workspace
              </span>

              <h1 className="text-3xl md:text-4xl font-serif text-foreground tracking-[-0.03em] mt-1">
                Smart Meeting Assistant
              </h1>
              <p className="text-xs md:text-sm text-zinc-500 mt-2 max-w-sm leading-relaxed font-medium">
                Live transcription, structured executive summaries & in-meeting intelligence.
              </p>
            </div>

            {/* Warning if Stream key is not filled in .env */}
            {!hasStreamKey && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed flex items-start gap-3">
                <div className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-amber-900">Setup Required</p>
                  <p className="text-amber-700 mt-0.5">
                    Add <code className="text-amber-950 font-mono bg-amber-100/80 px-1 py-0.5 rounded">NEXT_PUBLIC_STREAM_API_KEY</code> and secret to <code className="text-amber-950 font-mono bg-amber-100/80 px-1 py-0.5 rounded">.env.local</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-zinc-500 mb-1.5 font-mono">
                  Participant Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-surface-inner border border-border-subtle text-foreground placeholder-zinc-400 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold tracking-[0.05em] uppercase text-zinc-500 font-mono">
                    Meeting Space ID
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRoom}
                    className="text-[11px] text-accent hover:text-accent-hover font-mono font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>+ Generate ID</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="smart-meeting-room"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-surface-inner border border-border-subtle text-foreground placeholder-zinc-400 font-mono text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 transition-all duration-200"
                  />
                </div>
              </div>

              {/* SolveSync Filled Button */}
              <button
                type="submit"
                className="group w-full mt-6 pl-6 pr-2.5 py-3 bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold rounded-lg shadow-lg shadow-accent/15 transition-all duration-300 flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm tracking-wide">
                  Enter Meeting Room
                </span>
                <span className="w-6 h-6 rounded bg-white/20 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </button>
            </form>

            {/* Micro Keystrokes & Meta Footer */}
            <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between text-zinc-500 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-inner border border-border-subtle text-zinc-600 text-[10px]">
                  ↵ Enter
                </kbd>
                to join
              </span>
              <span>FastAPI &bull; NaraRouter 3.3</span>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
