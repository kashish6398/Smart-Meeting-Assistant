"use client";

import { useEffect, useState, useRef } from "react";
import {
  StreamCall,
  useStreamVideoClient,
  SpeakerLayout,
  CallControls,
  StreamTheme,
  ParticipantView,
  useCallStateHooks
} from "@stream-io/video-react-sdk";

import { TranscriptPanel } from "@/app/components/transcript";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const MeetingUI = ({ participants, onLeave, userName }) => {
  const localParticipant = participants.find((p) => p.isLocalParticipant);

  return (
    <div className="h-screen bg-[#0f172a] text-white flex overflow-hidden font-sans">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col p-6 gap-6 relative">
        {/* Meeting Assistant (Main View) */}
        <div className="flex-1 bg-[#1e293b]/50 backdrop-blur-md rounded-[2.5rem] border-2 border-blue-500/40 flex flex-col items-center justify-center relative shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
          <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-600 to-blue-400 flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/10 animate-pulse">
            MA
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-white/90 tracking-tight">
              Smart Meeting Assistant
            </h2>
            <p className="text-blue-400/80 text-sm mt-2 font-medium tracking-widest uppercase">
              Listening & Processing...
            </p>
          </div>

          <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">
              Meeting Assistant
            </span>
            <div className="flex gap-1 ml-2">
              <div className="w-1 h-3 bg-blue-500/50 rounded-full animate-[bounce_1s_infinite_100ms]" />
              <div className="w-1 h-4 bg-blue-500/50 rounded-full animate-[bounce_1s_infinite_200ms]" />
              <div className="w-1 h-3 bg-blue-500/50 rounded-full animate-[bounce_1s_infinite_300ms]" />
            </div>
          </div>
        </div>

        {/* Local User & Controls Overlay */}
        <div className="h-56 flex flex-col items-center gap-6">
          {/* User Video */}
          <div className="w-72 aspect-video rounded-3xl overflow-hidden relative border-2 border-white/10 shadow-2xl transform transition-transform hover:scale-105 duration-300">
            {localParticipant ? (
              <ParticipantView participant={localParticipant} />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/10">
              {userName} (You)
            </div>
          </div>

          {/* Controls */}
          <div className="bg-black/40 backdrop-blur-2xl px-8 py-3 rounded-3xl border border-white/10 shadow-2xl flex items-center gap-2">
            <CallControls onLeave={onLeave} />
          </div>
        </div>
      </div>

      {/* Live Transcript Sidebar */}
      <div className="w-[420px] bg-[#1e293b]/30 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">
        <TranscriptPanel />
      </div>
    </div>
  );
};

export default function MeetingRoom({ callId, onLeave, userId }) {
  const client = useStreamVideoClient();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);

  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const callType = "default";

  useEffect(() => {
    if (!client) return;
    if (joinedRef.current) return;

    joinedRef.current = true;

    const init = async () => {
      try {
        const myCall = client.call(callType, callId);

        await myCall.getOrCreate({
          data: {
            created_by_id: userId,
            members: [{ user_id: userId, role: "call_member" }],
          },
        });
        await myCall.camera.enable();
        await myCall.microphone.enable();

        await myCall.join({ create: true });

        await myCall.startClosedCaptions({ language: "en" });

        myCall.on("call.session_ended", () => {
          onLeave?.();
        });

        setCall(myCall);
      } catch (err) {
        setError(err.message);
      }
    };

    init();

    return () => {
      if (call && !leavingRef.current) {
        leavingRef.current = true;
        call.leave().catch(() => {});
      }
    };
  }, [client, callId, userId]);

  const handleLeaveClick = async () => {
    if (leavingRef.current) {
      onLeave?.();
      return;
    }
    leavingRef.current = true;
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

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0f172a]">
        <div className="p-10 bg-red-900/20 border border-red-500/50 rounded-[2.5rem] text-center backdrop-blur-xl">
          <h3 className="text-2xl font-bold mb-2">Meeting Error</h3>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={onLeave}
            className="mt-8 px-8 py-3 bg-red-600 rounded-2xl font-bold"
          >
            Exit
          </button>
        </div>
      </div>
    );

  if (!call)
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0f172a]">
        <div className="text-center">
          <div className="animate-spin h-20 w-20 border-4 border-t-blue-500 rounded-full mx-auto"></div>
          <p className="mt-10 text-xl font-medium text-white/60">
            Initializing Smart Workspace...
          </p>
        </div>
      </div>
    );

  return (
    <StreamTheme>
      <StreamCall call={call}>
        <MeetingUIWithHooks onLeave={handleLeaveClick} />
      </StreamCall>
    </StreamTheme>
  );
}

const MeetingUIWithHooks = ({ onLeave }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const userName = searchParams?.get("name") || "User";

  return (
    <MeetingUI
      participants={participants}
      onLeave={onLeave}
      userName={userName}
    />
  );
};