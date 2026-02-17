export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
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

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes meeting transcripts. Provide concise, well-structured summaries.",
          },
          {
            role: "user",
            content: `Provide a concise summary of this conversation in 3-5 sentences. Focus on the main points discussed, key decisions made, and any important outcomes.\n\nTranscript:\n${text}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error?.message || "Failed to generate summary from OpenAI."
      );
    }

    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      throw new Error("No summary was generated.");
    }

    return Response.json({ summary });
  } catch (err) {
    console.error("Summarization error:", err);
    return Response.json(
      { error: err.message || "Failed to generate summary." },
      { status: 500 }
    );
  }
}
