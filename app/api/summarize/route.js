import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

export async function POST(request) {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    return Response.json(
      { error: "ASSEMBLYAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return Response.json(
        { error: "No transcript text provided." },
        { status: 400 }
      );
    }

    const res = await client.lemur.task({
      input_text: text,
      prompt:
        "Provide a concise summary of this conversation in 3-5 sentences. Focus on the main points discussed, key decisions made, and any important outcomes.",
    });

    return Response.json({ summary: res.response });
  } catch (err) {
    console.error("Summarization error:", err);
    return Response.json(
      { error: err.message || "Failed to generate summary." },
      { status: 500 }
    );
  }
}
