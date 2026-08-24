"use client";

import { useStreamClients } from "./hooks/use-stream-clients";
import { StreamVideo } from "@stream-io/video-react-sdk";
import { Chat } from "stream-chat-react";
import { useState, useEffect } from "react";

export default function StreamVideoProvider({ children, user, token }) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050508] text-white p-6">
        <div className="max-w-md w-full bg-[#0c0c14] border border-amber-500/40 rounded-[2rem] p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Stream API Key Missing</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Please configure <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono">NEXT_PUBLIC_STREAM_API_KEY</code> and <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono">STREAM_API_SECRET</code> in <code className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-200 font-mono">.env.local</code>.
          </p>
          <a
            href="/"
            className="inline-block w-full py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-white rounded-full text-xs font-semibold transition"
          >
            ← Return to Lobby
          </a>
        </div>
      </div>
    );
  }

  const { videoClient, chatClient, clientError } = useStreamClients({ apiKey, user, token });

  if (clientError || (isTimedOut && (!videoClient || !chatClient))) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050508] text-white p-6">
        <div className="max-w-md w-full bg-[#0c0c14] border border-red-500/30 rounded-[2rem] p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2 text-white">Connection Issue</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            {clientError || "Connecting to Stream Video services took longer than expected. Check that your Stream API Key and Secret are valid."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-full text-xs font-semibold transition"
            >
              Retry
            </button>
            <a
              href="/"
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-white rounded-full text-xs font-semibold transition flex items-center justify-center"
            >
              Lobby
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!videoClient || !chatClient) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050508] text-white">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="mt-4 text-xs font-mono tracking-widest uppercase text-zinc-400">
            Connecting to Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <Chat client={chatClient}>
        {children}
      </Chat>
    </StreamVideo>
  );
}