"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const[username, setUsername] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    const name = username.trim() === "" ? "Anonymous" : username.trim();

    const meetingID = process.env.NEXT_PUBLIC_CALL_ID;

    router.push(`/meeting/${meetingID}?name=${encodeURIComponent(name)}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-be from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="p-8 bg-gray-800/60 rounded-2xl border border-gray-700 w-80 shadow-2xl">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Enter your name
        </h2>
        <input
        placeholder="e.g. Piyush (optional)"
        value={username}
        onChange={e=>setUsername(e.target.value)}
        className="p-4 py-3 w-full rounded-lg bg-gray-700/80 border border-gray-600 text-white"
        />
        <button onClick={handleJoin} className="mt-5 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
          Join Meeting</button>
      </div>
    </div>
  )
}
