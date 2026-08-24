import { useState, useEffect } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";

export function useStreamClients({ apiKey, user, token }) {
  const [videoClient, setVideoClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [clientError, setClientError] = useState(null);

  useEffect(() => {
    if (!user?.id || !token || !apiKey) return;

    let didCancel = false;

    const initClients = async () => {
      try {
        // Initialize or retrieve Video Client instance safely
        const tokenProvider = () => Promise.resolve(token);
        const myVideoClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          tokenProvider,
        });

        // Initialize or connect Chat Client safely
        const myChatClient = StreamChat.getInstance(apiKey);
        if (myChatClient.userID !== user.id) {
          try {
            await myChatClient.connectUser(user, token);
          } catch (chatErr) {
            console.warn("Chat connect note:", chatErr);
          }
        }

        if (!didCancel) {
          setVideoClient(myVideoClient);
          setChatClient(myChatClient);
          setClientError(null);
        }
      } catch (error) {
        console.error("Client initialization error:", error);
        if (!didCancel) {
          setClientError(error?.message || "Failed to initialize Stream client");
        }
      }
    };

    initClients();

    return () => {
      didCancel = true;
    };
  }, [apiKey, user?.id, token]);

  return { videoClient, chatClient, clientError };
}