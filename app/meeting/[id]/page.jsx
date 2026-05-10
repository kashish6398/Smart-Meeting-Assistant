"use client";

const { useSearchParams, useRouter, useParams } = require("next/navigation");
import { StreamTheme } from "@stream-io/video-react-sdk";
import React, { useState, useEffect } from "react";
import StreamProvider from "../../components/stream-provider";

const MeetingPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  const callID = params.id;
  const name = searchParams.get("name") || "anonymous";

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setUser({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
    });
  },[name]); 

  useEffect(() => {
    if(!user) return;

    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({userId: user.id}),
    })

    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get token");
      }
      return data;
    })
    .then((data) => {
      if (data.token) setToken(data.token);
      else setError("No token returned");
    })
    .catch((error) => setError(error.message));
    }, [user]);

    if(error) {
      return (
        <div className= "flex items-center justify-center min-h-screen bg-gray-900 text-white">
          <div className= "p-6 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-500 font-bold text-lg mb-2">Error</p>
          <p>{error}</p>
          <button
           onClick={()=> router.push("/")}
           className="mt-4 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600"
          >
            Back
          </button>
          </div>
        </div>
      )
    }

    if(!token || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Connecting...</p>
          </div>
        </div>
      )
    }

  return <StreamProvider user={user} token={token}>
    <StreamTheme>
      Meeting Room
    </StreamTheme>
  </StreamProvider>;

};

export default MeetingPage;

