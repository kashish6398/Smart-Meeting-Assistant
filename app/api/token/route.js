import { StreamClient } from "@stream-io/node-sdk";

export async function POST(request) {
  try {
    const { userId } = await request.json();

    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return Response.json(
        { error: "Missing API Credentials" },
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
      { error: error.message },
      { status: 500 }
    );
  }
}
