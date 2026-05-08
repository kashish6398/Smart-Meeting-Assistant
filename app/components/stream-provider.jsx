import { useStreamClients } from "./hooks/use-stream-clients";

const apiKey = process.env.NEST_PUBLIC_STREAM_API_KEY;

export default function StreamVideoProvider({ children, user, token }) {
    const {videoClient, chatClient } = useStreamClients({ apiKey, user, token});

    if(!videoClient || !chatClient) return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
            <p className="text-white text-xl font-semibold mt-6">Connecting...</p>
        </div>
    );
}