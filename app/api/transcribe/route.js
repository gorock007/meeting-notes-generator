import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

async function tryLemur(transcriptId, prompt) {
  try {
    const res = await client.lemur.task({
      transcript_ids: [transcriptId],
      prompt,
    });
    return res.response;
  } catch {
    return null;
  }
}

export async function POST(request) {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    return Response.json(
      { error: "ASSEMBLYAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let audioSource;

    if (contentType.includes("multipart/form-data")) {
      // File upload — upload to AssemblyAI first
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file) {
        return Response.json({ error: "No file provided." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadUrl = await client.files.upload(buffer);
      audioSource = uploadUrl;
    } else {
      // JSON body with URL
      const body = await request.json();
      if (!body.url) {
        return Response.json(
          { error: "No audio URL provided." },
          { status: 400 }
        );
      }
      audioSource = body.url;
    }

    // Transcribe with speaker diarization, summarization, and auto chapters
    const transcript = await client.transcripts.transcribe({
      audio: audioSource,
      speaker_labels: true,
      speech_models: ["universal-2"],
      summarization: true,
      summary_type: "paragraph",
      auto_chapters: true,
    });

    if (transcript.status === "error") {
      return Response.json(
        { error: `Transcription failed: ${transcript.error}` },
        { status: 500 }
      );
    }

    const utterances = (transcript.utterances ?? []).map((u) => ({
      speaker: u.speaker,
      text: u.text,
    }));

    // Run LeMUR analysis in parallel
    const [summary, actionItems, topics] = await Promise.all([
      tryLemur(
        transcript.id,
        "Provide a concise summary of this conversation in 3-5 sentences. Focus on the main points discussed."
      ),
      tryLemur(
        transcript.id,
        "List the key action items from this conversation as a bullet-point list. If there are no clear action items, note that."
      ),
      tryLemur(
        transcript.id,
        "List the main topics discussed in this conversation as a bullet-point list."
      ),
    ]);

    // Fallback to built-in summarization if LeMUR is unavailable
    const builtInSummary = transcript.summary || null;
    const chapters = (transcript.chapters ?? []).map((ch) => ch.headline);
    const builtInTopics =
      chapters.length > 0 ? chapters.map((h) => `- ${h}`).join("\n") : null;

    return Response.json({
      utterances,
      summary: summary || builtInSummary,
      actionItems,
      topics: topics || builtInTopics,
      lemurAvailable: summary !== null,
      summaryAvailable: summary !== null || builtInSummary !== null,
      topicsAvailable: topics !== null || builtInTopics !== null,
    });
  } catch (err) {
    console.error("Transcription error:", err);
    return Response.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
