import { StreamClient } from "@stream-io/node-sdk";

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = body?.userId;

    if (!userId) {
      return Response.json(
        { error: "Missing userId in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return Response.json(
        {
          error:
            "Missing Stream API Credentials. Please configure NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET in .env.local",
        },
        { status: 500 }
      );
    }

    const serverClient = new StreamClient(apiKey, apiSecret);
    const validity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const token = serverClient.createToken(userId, validity);

    return Response.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
