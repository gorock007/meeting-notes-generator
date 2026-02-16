import "dotenv/config";
import { AssemblyAI } from "assemblyai";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";

// ── Config ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.ASSEMBLYAI_API_KEY;
if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
  console.error(
    "❌ Missing API key. Set ASSEMBLYAI_API_KEY in your .env file.\n" +
      "   Get a free key at https://www.assemblyai.com/dashboard/signup"
  );
  process.exit(1);
}

const input = process.argv[2];
if (!input) {
  console.error(
    "Usage: node index.js <audio-url-or-file-path>\n" +
      "Example: node index.js https://assembly.ai/sports_injuries.mp3"
  );
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isUrl(str) {
  return str.startsWith("http://") || str.startsWith("https://");
}

function divider(title) {
  const line = "═".repeat(60);
  return `\n${line}\n  ${title}\n${line}`;
}

async function tryLemur(client, transcriptId, prompt) {
  try {
    const res = await client.lemur.task({
      transcript_ids: [transcriptId],
      prompt,
    });
    return res.response;
  } catch (err) {
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const client = new AssemblyAI({ apiKey: API_KEY });

  // Validate input
  if (!isUrl(input) && !existsSync(input)) {
    console.error(`❌ File not found: ${input}`);
    process.exit(1);
  }

  // 1. Transcribe with speaker diarization
  console.log(divider("📝 TRANSCRIBING AUDIO"));
  console.log(`\n  Source: ${input}`);
  console.log("  Speaker diarization: enabled");
  console.log("  Please wait...\n");

  const transcript = await client.transcripts.transcribe({
    audio: input,
    speaker_labels: true,
    speech_models: ["universal-3-pro"],
  });

  if (transcript.status === "error") {
    console.error(`❌ Transcription failed: ${transcript.error}`);
    process.exit(1);
  }

  // Display speaker-labeled transcript
  console.log(divider("🎙️  TRANSCRIPT (by speaker)"));
  console.log();
  const utterances = transcript.utterances ?? [];
  for (const u of utterances) {
    console.log(`  Speaker ${u.speaker}: ${u.text}`);
  }

  // 2. Use LeMUR for analysis
  console.log(divider("🤖 GENERATING MEETING NOTES WITH LeMUR"));
  console.log("\n  Analyzing transcript...\n");

  const [summary, actionItems, topics] = await Promise.all([
    tryLemur(
      client,
      transcript.id,
      "Provide a concise summary of this conversation in 3-5 sentences. Focus on the main points discussed."
    ),
    tryLemur(
      client,
      transcript.id,
      "List the key action items from this conversation as a bullet-point list. If there are no clear action items, note that."
    ),
    tryLemur(
      client,
      transcript.id,
      "List the main topics discussed in this conversation as a bullet-point list."
    ),
  ]);

  const lemurAvailable = summary !== null;

  if (!lemurAvailable) {
    console.log(
      "  ⚠️  LeMUR is not available on your plan.\n" +
        "     Upgrade at https://www.assemblyai.com/dashboard to enable\n" +
        "     AI-generated summaries, action items, and topics.\n" +
        "     Saving transcript-only output.\n"
    );
  }

  // 3. Display results
  if (lemurAvailable) {
    console.log(divider("📋 MEETING SUMMARY"));
    console.log(`\n${summary}\n`);

    console.log(divider("✅ ACTION ITEMS"));
    console.log(`\n${actionItems}\n`);

    console.log(divider("💬 TOPICS DISCUSSED"));
    console.log(`\n${topics}\n`);
  }

  // 4. Save to markdown
  const speakerLines = utterances
    .map((u) => `**Speaker ${u.speaker}:** ${u.text}`)
    .join("\n\n");

  const lemurSections = lemurAvailable
    ? `## Summary

${summary}

---

## Action Items

${actionItems}

---

## Topics Discussed

${topics}

---

`
    : `> LeMUR analysis unavailable on current plan. Upgrade to enable AI summaries.

---

`;

  const markdown = `# Meeting Notes

*Generated on ${new Date().toLocaleString()}*

---

${lemurSections}## Full Transcript

${speakerLines}
`;

  await writeFile("notes-output.md", markdown, "utf-8");
  console.log(divider("💾 SAVED"));
  console.log("\n  Output written to notes-output.md\n");
}

main().catch((err) => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});
