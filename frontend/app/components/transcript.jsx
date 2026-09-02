"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  
  // Web Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

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
  const syncTranscriptToBackend = useCallback(async (item) => {
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
  }, [backendUrl, callId]);

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript.trim();

      if (transcriptText) {
        const newTranscript = {
          speaker: userName || "Participant",
          text: transcriptText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };

        setTranscripts((prev) => [...prev, newTranscript]);
        syncTranscriptToBackend(newTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition notice:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if user still wants listening active
      if (recognitionRef.current?.shouldListen) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore if already started
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    // Auto-start speech recognition
    try {
      recognition.shouldListen = true;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.log("Speech recognition auto-start waiting for user gesture:", e);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.shouldListen = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [userName, syncTranscriptToBackend]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.shouldListen = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      recognitionRef.current.shouldListen = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Error starting speech recognition:", e);
      }
    }
  };

  // Stream call event listeners
  useEffect(() => {
    if (!call) return;

    let channel = null;
    if (client && client.userID) {
      try {
        channel = client.channel("livestream", call.id);
        channel.watch().catch(() => {});
      } catch (e) {}
    }

    const handleClosedCaption = (event) => {
      if (event?.closed_caption?.text) {
        const newTranscript = {
          text: event.closed_caption.text,
          speaker:
            event.closed_caption.user?.name ||
            event.closed_caption.user?.id ||
            "Participant",
          timestamp: new Date(event.closed_caption.start_time || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };

        setTranscripts((prev) => [...prev, newTranscript]);
        syncTranscriptToBackend(newTranscript);
      }
    };

    const handleNewMessage = (event) => {
      const message = event.message;
      if (message?.user?.id === "meeting-assistant-bot" && message?.text) {
        const botItem = {
          speaker: "Meeting Assistant",
          text: message.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
  }, [call, client, callId, syncTranscriptToBackend]);

  // Add manual note/speech
  const handleAddManualSpeech = (e) => {
    e.preventDefault();
    if (!manualSpeech.trim()) return;

    const newTranscript = {
      speaker: userName,
      text: manualSpeech.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
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
      setAiSummary({
        summary: `### Unable to complete summary\n\n${err.message}`,
        model: "NaraRouter",
      });
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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
        text: data.answer || "No response received",
        model: data.model,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setQaHistory((prev) => [...prev, aiEntry]);
    } catch (err) {
      const errEntry = {
        role: "assistant",
        text: `Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
    <div className="h-full flex flex-col bg-background text-foreground font-sans">
      {/* Top Controls & Navigation Header */}
      <div className="p-4 border-b border-border-subtle bg-surface-card">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-subtle border border-border-subtle flex items-center justify-center text-accent">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground tracking-tight">Meeting Intelligence</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-zinc-500 font-mono font-semibold">
                  {transcripts.length} {transcripts.length === 1 ? "event" : "events"} synced
                </p>
                {speechSupported && (
                  <button
                    onClick={toggleSpeechRecognition}
                    title={isListening ? "Microphone listening (Click to pause)" : "Microphone paused (Click to start speech transcription)"}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold flex items-center gap-1 transition ${
                      isListening
                        ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                        : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                    {isListening ? "Voice Active" : "Voice Paused"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="group px-3 py-1.5 bg-gradient-to-r from-accent to-pink-500 hover:from-accent-hover hover:to-pink-400 active:scale-[0.98] disabled:opacity-50 text-white text-[11px] font-semibold rounded-full shadow-md shadow-accent/15 transition-all duration-200 flex items-center gap-1.5"
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
        <div className="flex p-1 rounded-xl bg-surface-inner border border-border-subtle text-xs">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 ${
              activeTab === "transcript"
                ? "bg-accent text-white shadow-sm"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            Live Transcript
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200 ${
              activeTab === "ai"
                ? "bg-accent text-white shadow-sm"
                : "text-zinc-500 hover:text-foreground"
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
                <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-border-subtle flex items-center justify-center text-accent mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-foreground">Listening to conversation...</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed font-medium">
                  Speak into your microphone or type below. Speech is automatically transcribed in real time and synced to NaraRouter.
                </p>
              </div>
            ) : (
              transcripts.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all duration-200 ${
                    item.isBot
                      ? "bg-accent-subtle/50 border-accent/20"
                      : "bg-surface-card border-border-subtle hover:border-border-highlight"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-[11px] ${
                        item.isBot ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {item.speaker}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono font-medium">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans text-[11px] font-medium">
                    {item.text}
                  </p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Note / Test Input */}
          <form
            onSubmit={handleAddManualSpeech}
            className="p-3 border-t border-border-subtle bg-surface-card flex gap-2"
          >
            <input
              type="text"
              placeholder="Speak or type transcript test message..."
              value={manualSpeech}
              onChange={(e) => setManualSpeech(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface-inner border border-border-subtle rounded-xl text-xs text-foreground placeholder-zinc-400 focus:outline-none focus:border-accent/50"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-accent-subtle hover:bg-accent/20 text-accent rounded-xl text-xs font-semibold transition active:scale-[0.98]"
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
              <div className="p-4 bg-surface-card rounded-2xl border border-accent/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                      Meeting Synthesis
                    </span>
                  </div>
                  <button
                    onClick={handleCopySummary}
                    className="text-[10px] font-mono font-semibold text-zinc-500 hover:text-accent transition"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans font-medium">
                  {aiSummary.summary}
                </div>
                <div className="pt-2 border-t border-border-subtle text-[10px] font-mono text-zinc-400">
                  Model: {aiSummary.model}
                </div>
              </div>
            )}

            {/* Q&A Stream */}
            {qaHistory.length === 0 && !aiSummary ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-border-subtle flex items-center justify-center text-accent mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-foreground">Ask the AI Meeting Assistant</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed font-medium">
                  Query action items, decisions made, or specific speaker statements in real time.
                </p>
              </div>
            ) : (
              qaHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                    item.role === "user"
                      ? "bg-surface-inner border-border-subtle ml-4"
                      : "bg-surface-card border-accent/20 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-[11px] ${
                        item.role === "user" ? "text-zinc-600" : "text-accent"
                      }`}
                    >
                      {item.role === "user" ? "You" : "Assistant"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono font-medium">
                      {item.timestamp}
                    </span>
                  </div>
                  <div className="text-zinc-700 whitespace-pre-wrap text-[11px] font-medium">
                    {item.text}
                  </div>
                </div>
              ))
            )}

            {isAsking && (
              <div className="p-3 rounded-xl bg-accent-subtle border border-accent/10 flex items-center gap-2 text-[11px] text-accent font-mono font-medium">
                <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
                Synthesizing response with NaraRouter...
              </div>
            )}
            <div ref={qaEndRef} />
          </div>

          {/* Question Input */}
          <form
            onSubmit={handleAskQuestion}
            className="p-3 border-t border-border-subtle bg-surface-card flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about discussion (e.g. 'What are action items?')..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking}
              className="flex-1 px-3 py-2 bg-surface-inner border border-border-subtle rounded-xl text-xs text-foreground placeholder-zinc-400 focus:outline-none focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-3.5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition active:scale-[0.98]"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
