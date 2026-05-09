import { useStreamClients } from "./hooks/use-stream-clients";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

import { StreamVideo } from "@stream-io/video-react-sdk";
import { Chat } from "stream-chat-react";

export default function StreamVideoProvider({ children, user, token }) {
    const {videoClient, chatClient } = useStreamClients({ apiKey, user, token});

    if(!videoClient || !chatClient) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-[4px] border-transparent border-t-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg">Connecting...</p>
          </div>
        </div>
    );

    return (
      <StreamVideo client={videoClient}>
        <Chat client={chatClient}>
          {children}
        </Chat>
      </StreamVideo>
    );
}