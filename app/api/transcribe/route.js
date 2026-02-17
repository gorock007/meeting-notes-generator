import { AssemblyAI } from "assemblyai";
import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

function isYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(
    url
  );
}

function downloadYouTubeAudio(url) {
  return new Promise((resolve, reject) => {
    const outputPath = join(tmpdir(), `yt-${randomUUID()}.%(ext)s`);
    execFile(
      "yt-dlp",
      [
        "-x",
        "--audio-format",
        "mp3",
        "--no-playlist",
        "-o",
        outputPath,
        url,
      ],
      { timeout: 120000 },
      (error) => {
        if (error) {
          reject(new Error(`Failed to download YouTube audio: ${error.message}`));
        } else {
          // yt-dlp with -x --audio-format mp3 outputs as .mp3
          const mp3Path = outputPath.replace("%(ext)s", "mp3");
          resolve(mp3Path);
        }
      }
    );
  });
}

export async function POST(request) {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    return Response.json(
      { error: "ASSEMBLYAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let tempFile = null;

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

      if (isYouTubeUrl(body.url)) {
        tempFile = await downloadYouTubeAudio(body.url);
        const audioBuffer = await readFile(tempFile);
        const uploadUrl = await client.files.upload(audioBuffer);
        audioSource = uploadUrl;
      } else {
        audioSource = body.url;
      }
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
  } finally {
    if (tempFile) {
      unlink(tempFile).catch(() => {});
    }
  }
}
