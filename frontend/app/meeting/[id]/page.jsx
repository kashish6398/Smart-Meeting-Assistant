"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import StreamProvider from "@/app/components/stream-provider";
import MeetingRoom from "@/app/components/meeting-room";
import { StreamTheme } from "@stream-io/video-react-sdk";

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callId = params?.id || "smart-meeting-room";
  const rawName = searchParams?.get("name") || "Anonymous";

  // Stable user object initialized once per session
  const [user] = useState(() => {
    const sanitizedBase = rawName.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "user";
    const uniqueUserId = `${sanitizedBase}-${Math.random().toString(36).substring(2, 6)}`;
    return {
      id: uniqueUserId,
      name: rawName,
    };
  });

  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Server returned error ${res.status}`);
        }
        if (isMounted) {
          if (data.token) {
            setToken(data.token);
          } else {
            setError("No token returned from authentication server");
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const handleLeave = () => {
    router.push("/");
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050508] text-white p-6">
        <div className="p-8 max-w-md w-full bg-[#0c0c14] border border-red-500/30 rounded-[2rem] text-center shadow-2xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Authentication Error</h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white rounded-full font-semibold text-xs transition-all"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050508] text-white">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="mt-4 text-xs font-mono tracking-widest uppercase text-zinc-400">
            Authorizing Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <StreamProvider user={user} token={token}>
      <StreamTheme>
        <MeetingRoom callId={callId} onLeave={handleLeave} userId={user.id} />
      </StreamTheme>
    </StreamProvider>
  );
}
