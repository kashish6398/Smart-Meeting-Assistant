import { useState, useEffect } from "react";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";

export function useStreamClients({ apiKey, user, token }) {
  const [videoClient, setVideoClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [clientError, setClientError] = useState(null);

  useEffect(() => {
    if (!user?.id || !token || !apiKey) return;

    let isMounted = true;

    const initClients = async () => {
      try {
        const tokenProvider = () => Promise.resolve(token);
        const myVideoClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          tokenProvider,
        });

        const myChatClient = StreamChat.getInstance(apiKey);
        if (myChatClient.userID !== user.id || !myChatClient.user) {
          try {
            if (myChatClient.userID && myChatClient.userID !== user.id) {
              await myChatClient.disconnectUser().catch(() => {});
            }
            await myChatClient.connectUser(user, token);
          } catch (chatErr) {
            console.warn("Chat connect note:", chatErr);
          }
        }

        if (isMounted) {
          setVideoClient(myVideoClient);
          setChatClient(myChatClient);
          setClientError(null);
        }
      } catch (error) {
        console.error("Client initialization error:", error);
        if (isMounted) {
          setClientError(error?.message || "Failed to initialize Stream client");
        }
      }
    };

    initClients();

    return () => {
      isMounted = false;
    };
  }, [apiKey, user?.id, token]);

  return { videoClient, chatClient, clientError };
}
