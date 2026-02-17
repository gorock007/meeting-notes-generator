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
    const contentType = request.headers.get("content-type") || "";
    let audioSource;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file) {
        return Response.json({ error: "No file provided." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadUrl = await client.files.upload(buffer);
      audioSource = uploadUrl;
    } else {
      const body = await request.json();
      if (!body.url) {
        return Response.json(
          { error: "No audio URL provided." },
          { status: 400 }
        );
      }
      audioSource = body.url;
    }

    // Transcribe with speaker diarization using Universal-3 Pro
    const transcript = await client.transcripts.transcribe({
      audio: audioSource,
      speaker_labels: true,
      speech_models: ["universal-3-pro"],
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

    return Response.json({ utterances });
  } catch (err) {
    console.error("Transcription error:", err);
    return Response.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
