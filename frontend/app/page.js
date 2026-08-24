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
    <main className="relative min-h-[100dvh] bg-[#050508] text-[#f4f4f5] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none">
      {/* Ambient Radial Mesh Lighting (Fixed Layer) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/15 via-blue-600/10 to-transparent rounded-full blur-[120px] animate-ambient" />
        <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[100px] animate-ambient" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Floating Status Pill Header */}
      <header className="relative z-10 mb-8 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/40">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-300 font-mono">
            NaraRouter & Stream Active
          </span>
        </div>
      </header>

      {/* Main Double-Bezel Card */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Outer Shell */}
        <div className="p-1.5 md:p-2 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] shadow-2xl shadow-black/80 backdrop-blur-2xl">
          {/* Inner Core */}
          <div className="p-7 md:p-9 rounded-[calc(2rem-0.375rem)] bg-[#09090f]/95 border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col">
            
            {/* Header / Brand */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.12] p-0.5 shadow-xl flex items-center justify-center mb-4 group transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105">
                <div className="w-full h-full rounded-[14px] bg-[#0c0c14] flex items-center justify-center text-indigo-400">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono font-medium uppercase tracking-[0.2em] mb-2">
                Executive Workspace
              </span>

              <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-white">
                Smart Meeting Assistant
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
                Live transcription, structured executive summaries & in-meeting intelligence.
              </p>
            </div>

            {/* Warning if Stream key is not filled in .env */}
            {!hasStreamKey && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
                <div className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-amber-100">Setup Required</p>
                  <p className="text-amber-300/80 mt-0.5">
                    Add <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">NEXT_PUBLIC_STREAM_API_KEY</code> and secret to <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">.env.local</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium tracking-[0.05em] uppercase text-zinc-400 mb-1.5 font-mono">
                  Participant Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0e16] border border-white/[0.08] text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-medium tracking-[0.05em] uppercase text-zinc-400 font-mono">
                    Meeting Space ID
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRoom}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors flex items-center gap-1"
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
                    className="w-full px-4 py-3 rounded-xl bg-[#0e0e16] border border-white/[0.08] text-white placeholder-zinc-600 font-mono text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Button-in-Button Nested CTA */}
              <button
                type="submit"
                className="group w-full mt-6 pl-6 pr-2.5 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-400 hover:to-blue-500 active:scale-[0.98] text-white font-medium rounded-full shadow-lg shadow-indigo-500/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-between"
              >
                <span className="text-sm font-semibold tracking-wide">
                  Enter Meeting Room
                </span>
                <span className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-white/25">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </button>
            </form>

            {/* Micro Keystrokes & Meta Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between text-zinc-500 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-[10px]">
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
