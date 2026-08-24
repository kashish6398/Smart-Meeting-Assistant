"use client";

import { useEffect, useState, useRef } from "react";
import {
  StreamCall,
  useStreamVideoClient,
  CallControls,
  StreamTheme,
  ParticipantView,
  useCallStateHooks,
  useCall,
} from "@stream-io/video-react-sdk";

import { TranscriptPanel } from "@/app/components/transcript";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const MeetingUI = ({ participants, onLeave, userName, callId }) => {
  const localParticipant = participants?.find((p) => p.isLocalParticipant);

  return (
    <div className="h-[100dvh] bg-[#050508] text-[#f4f4f5] flex overflow-hidden font-sans select-none">
      {/* Main Video & AI Focus Workspace */}
      <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-6 relative min-w-0">
        
        {/* Top Minimalist Island Bar */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-zinc-300 font-mono tracking-wide">
              Space: <span className="text-white font-semibold">{callId}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-400 text-xs font-mono">
            <span>{participants?.length || 1} online</span>
          </div>
        </div>

        {/* Meeting Assistant Centerpiece (Double-Bezel Architecture) */}
        <div className="flex-1 p-1.5 md:p-2 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] shadow-2xl flex flex-col min-h-0 relative overflow-hidden">
          {/* Inner Core */}
          <div className="w-full h-full rounded-[calc(2rem-0.375rem)] bg-[#08080f]/90 border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            {/* Ambient background glow inside core */}
            <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none animate-ambient" />
            
            {/* Holographic AI Centerpiece Orb */}
            <div className="relative z-10 w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500/30 via-white/20 to-blue-500/20 shadow-2xl border border-white/10 animate-float flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0c0c16] flex items-center justify-center text-indigo-400 shadow-inner">
                <svg className="w-10 h-10 md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
            </div>

            <div className="relative z-10 mt-6 text-center max-w-sm">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase tracking-[0.2em]">
                Live Synthesis Engine
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-[-0.02em] mt-2">
                Smart Meeting Assistant
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Listening & synchronizing discussions into actionable intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Local Participant Preview & Controls */}
        <div className="flex items-center justify-between gap-4 z-10">
          {/* User Preview Squircle */}
          <div className="w-48 aspect-video rounded-2xl overflow-hidden relative p-1 bg-white/[0.03] border border-white/[0.08] shadow-lg flex-shrink-0">
            <div className="w-full h-full rounded-[12px] overflow-hidden bg-[#0a0a10] relative">
              {localParticipant ? (
                <ParticipantView participant={localParticipant} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-[11px] font-mono">
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-300 border border-white/10">
                {userName}
              </div>
            </div>
          </div>

          {/* Floating Controls Island */}
          <div className="px-4 py-1.5 rounded-full bg-[#0c0c14]/90 border border-white/[0.1] shadow-2xl backdrop-blur-2xl flex items-center">
            <CallControls onLeave={onLeave} />
          </div>

          <div className="w-48 hidden lg:block text-right text-[11px] font-mono text-zinc-500">
            Encrypted Stream &bull; Low Latency
          </div>
        </div>
      </div>

      {/* Live AI Sidebar (Double-Bezel Architecture) */}
      <aside className="w-[430px] border-l border-white/[0.08] bg-[#07070c]/90 backdrop-blur-2xl flex flex-col shadow-2xl overflow-hidden flex-shrink-0 z-20">
        <TranscriptPanel callId={callId} userName={userName} />
      </aside>
    </div>
  );
};

export default function MeetingRoom({ callId, onLeave, userId }) {
  const client = useStreamVideoClient();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const callType = "default";

  useEffect(() => {
    if (!client || !callId || !userId) return;

    let isSubscribed = true;
    let myCall = null;

    const init = async () => {
      try {
        myCall = client.call(callType, callId);

        await myCall.getOrCreate({
          data: {
            created_by_id: userId,
            members: [{ user_id: userId, role: "call_member" }],
          },
        });

        // Safe media enablement - handle browser permission denial gracefully
        try {
          await myCall.camera.enable();
        } catch (camErr) {
          console.warn("Camera could not be enabled:", camErr);
          await myCall.camera.disable().catch(() => {});
        }

        try {
          await myCall.microphone.enable();
        } catch (micErr) {
          console.warn("Microphone could not be enabled:", micErr);
          await myCall.microphone.disable().catch(() => {});
        }

        // Join call safely
        await myCall.join({ create: true });

        // Try enabling closed captions if supported
        try {
          await myCall.startClosedCaptions({ language: "en" });
        } catch (ccErr) {
          console.log("Closed captions notice:", ccErr);
        }

        myCall.on("call.session_ended", () => {
          onLeave?.();
        });

        if (isSubscribed) {
          setCall(myCall);
          setError(null);
        }
      } catch (err) {
        console.error("Call initialization error:", err);
        if (isSubscribed) {
          setError(err.message || "Failed to connect to video call");
        }
      }
    };

    init();

    return () => {
      isSubscribed = false;
      if (myCall) {
        myCall.leave().catch(() => {});
      }
    };
  }, [client, callId, userId]);

  const handleLeaveClick = async () => {
    try {
      if (call) {
        await call.leave().catch(() => {});
      }
    } catch (err) {
      console.error("Error leaving call:", err);
    } finally {
      onLeave?.();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] text-white bg-[#050508] p-6">
        <div className="p-8 max-w-md w-full bg-[#0c0c14] border border-red-500/30 rounded-[2rem] text-center shadow-2xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Connection Interrupted</h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">{error}</p>
          <button
            onClick={onLeave}
            className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white text-sm font-semibold rounded-full shadow-lg transition-all duration-200"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] text-white bg-[#050508]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="mt-4 text-xs font-mono tracking-widest uppercase text-zinc-400">
            Joining Space...
          </p>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme>
      <StreamCall call={call}>
        <MeetingUIWithHooks onLeave={handleLeaveClick} callId={callId} />
      </StreamCall>
    </StreamTheme>
  );
}

const RemoteAudio = ({ participant }) => {
  const call = useCall();
  const audioRef = useRef(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !call || participant.isLocalParticipant) return;

    const unbind = call.bindAudioElement(audioEl, participant.sessionId, "audioTrack");
    return () => {
      unbind();
    };
  }, [call, participant.sessionId, participant.isLocalParticipant]);

  if (participant.isLocalParticipant) return null;
  return <audio ref={audioRef} autoPlay playsInline />;
};

const MeetingUIWithHooks = ({ onLeave, callId }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const userName = searchParams?.get("name") || "User";

  return (
    <>
      <MeetingUI
        participants={participants}
        onLeave={onLeave}
        userName={userName}
        callId={callId}
      />
      {participants.map((p) => (
        <RemoteAudio key={p.sessionId} participant={p} />
      ))}
    </>
  );
};