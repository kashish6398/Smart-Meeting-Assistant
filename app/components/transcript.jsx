"use client";

import { useEffect, useState, useRef } from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { useChatContext } from "stream-chat-react";

export function TranscriptPanel({ callId = "smart-meeting-room", userName = "User" }) {
  const { client } = useChatContext();
  const [activeTab, setActiveTab] = useState("transcript"); // "transcript" | "ai"
  const [transcripts, setTranscripts] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState([]);
  const [manualSpeech, setManualSpeech] = useState("");
  const [copied, setCopied] = useState(false);

  const transcriptEndRef = useRef(null);
  const qaEndRef = useRef(null);
  const call = useCall();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Auto scroll transcript feed
  useEffect(() => {
    if (activeTab === "transcript") {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcripts, activeTab]);

  // Auto scroll Q&A feed
  useEffect(() => {
    if (activeTab === "ai") {
      qaEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [qaHistory, activeTab]);

  // Sync transcript line to backend store
  const syncTranscriptToBackend = async (item) => {
    try {
      await fetch(`${backendUrl}/api/transcripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: callId,
          transcript: item,
        }),
      });
    } catch (err) {
      console.warn("Could not sync transcript to backend:", err);
    }
  };

  useEffect(() => {
    if (!call) return;

    let channel = null;
    if (client) {
      try {
        channel = client.channel("livestream", call.id);
        channel.watch().catch((err) => {
          console.warn("Channel watch notice:", err);
        });
      } catch (e) {
        console.warn("Could not initialize Stream chat channel:", e);
      }
    }

    const handleClosedCaption = (event) => {
      if (event?.closed_caption) {
        const newTranscript = {
          text: event.closed_caption.text,
          speaker:
            event.closed_caption.user?.name ||
            event.closed_caption.user?.id ||
            "Participant",
          timestamp: new Date(event.closed_caption.start_time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setTranscripts((prev) => [...prev, newTranscript]);
        syncTranscriptToBackend(newTranscript);
      }
    };

    const handleNewMessage = (event) => {
      const message = event.message;
      if (message?.user?.id === "meeting-assistant-bot") {
        const botItem = {
          speaker: "Meeting Assistant",
          text: message.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isBot: true,
        };
        setTranscripts((prev) => [...prev, botItem]);
      }
    };

    call.on("call.closed_caption", handleClosedCaption);
    if (channel) {
      channel.on("message.new", handleNewMessage);
    }

    return () => {
      call.off("call.closed_caption", handleClosedCaption);
      if (channel) {
        channel.off("message.new", handleNewMessage);
      }
    };
  }, [call, client, callId]);

  // Add manual note/speech
  const handleAddManualSpeech = (e) => {
    e.preventDefault();
    if (!manualSpeech.trim()) return;

    const newTranscript = {
      speaker: userName,
      text: manualSpeech.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setTranscripts((prev) => [...prev, newTranscript]);
    syncTranscriptToBackend(newTranscript);
    setManualSpeech("");
  };

  // Summarize meeting with NaraRouter
  const handleSummarize = async () => {
    setIsSummarizing(true);
    setActiveTab("ai");
    try {
      const res = await fetch(`${backendUrl}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: callId,
          transcripts: transcripts.length > 0 ? transcripts : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate summary");
      }
      setAiSummary(data);
    } catch (err) {
      alert(`Summary Error: ${err.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Ask AI Assistant Question
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const userQ = question.trim();
    setQuestion("");
    setIsAsking(true);

    const userEntry = {
      role: "user",
      text: userQ,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setQaHistory((prev) => [...prev, userEntry]);

    try {
      const res = await fetch(`${backendUrl}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_id: callId,
          question: userQ,
          transcripts: transcripts.length > 0 ? transcripts : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to answer question");
      }

      const aiEntry = {
        role: "assistant",
        text: data.answer,
        model: data.model,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setQaHistory((prev) => [...prev, aiEntry]);
    } catch (err) {
      const errEntry = {
        role: "assistant",
        text: `Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setQaHistory((prev) => [...prev, errEntry]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopySummary = () => {
    if (!aiSummary?.summary) return;
    navigator.clipboard.writeText(aiSummary.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#07070c] text-[#f4f4f5] font-sans">
      {/* Top Controls & Navigation Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#090910]">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-indigo-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-tight">Meeting Intelligence</h3>
              <p className="text-[10px] text-zinc-500 font-mono">
                {transcripts.length} {transcripts.length === 1 ? "event" : "events"} synced
              </p>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="group px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 active:scale-[0.98] disabled:opacity-50 text-white text-[11px] font-medium rounded-full shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-1.5"
          >
            {isSummarizing ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>Summarize</span>
                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Minimalist Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium tracking-wide transition-all duration-200 ${
              activeTab === "transcript"
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Live Transcript
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium tracking-wide transition-all duration-200 ${
              activeTab === "ai"
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            AI Summary & Q&A
          </button>
        </div>
      </div>

      {/* Tab 1: Live Transcript Stream */}
      {activeTab === "transcript" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
            {transcripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-zinc-300">Listening to conversation...</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  Speech will automatically appear here and sync with NaraRouter AI.
                </p>
              </div>
            ) : (
              transcripts.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all duration-200 ${
                    item.isBot
                      ? "bg-indigo-950/20 border-indigo-500/30"
                      : "bg-[#0c0c14]/90 border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-[11px] ${
                        item.isBot ? "text-indigo-400" : "text-zinc-200"
                      }`}
                    >
                      {item.speaker}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans text-[11px]">
                    {item.text}
                  </p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Note Input */}
          <form
            onSubmit={handleAddManualSpeech}
            className="p-3 border-t border-white/[0.08] bg-[#090910] flex gap-2"
          >
            <input
              type="text"
              placeholder="Add note or test transcription..."
              value={manualSpeech}
              onChange={(e) => setManualSpeech(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#0d0d16] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-zinc-200 rounded-xl text-xs font-medium transition active:scale-[0.98]"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: AI Summary & Interactive Q&A */}
      {activeTab === "ai" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Structured AI Summary Card */}
            {aiSummary && (
              <div className="p-4 bg-[#0c0c16] rounded-2xl border border-indigo-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-medium text-indigo-300 uppercase tracking-wider">
                      Meeting Synthesis
                    </span>
                  </div>
                  <button
                    onClick={handleCopySummary}
                    className="text-[10px] font-mono text-zinc-400 hover:text-white transition"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {aiSummary.summary}
                </div>
                <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-zinc-500">
                  Model: {aiSummary.model}
                </div>
              </div>
            )}

            {/* Q&A Stream */}
            {qaHistory.length === 0 && !aiSummary ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-zinc-300">Ask the AI Meeting Assistant</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  Query action items, decisions made, or specific speaker statements in real time.
                </p>
              </div>
            ) : (
              qaHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                    item.role === "user"
                      ? "bg-white/[0.04] border-white/[0.08] ml-4"
                      : "bg-[#0c0c16] border-indigo-500/30 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-[11px] ${
                        item.role === "user" ? "text-zinc-300" : "text-indigo-400"
                      }`}
                    >
                      {item.role === "user" ? "You" : "Assistant"}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                  <div className="text-zinc-300 whitespace-pre-wrap text-[11px]">
                    {item.text}
                  </div>
                </div>
              ))
            )}

            {isAsking && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                Synthesizing response with NaraRouter...
              </div>
            )}
            <div ref={qaEndRef} />
          </div>

          {/* Question Input */}
          <form
            onSubmit={handleAskQuestion}
            className="p-3 border-t border-white/[0.08] bg-[#090910] flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about discussion (e.g. 'What are action items?')..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking}
              className="flex-1 px-3 py-2 bg-[#0d0d16] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition active:scale-[0.98]"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}