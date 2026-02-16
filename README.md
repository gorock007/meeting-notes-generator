# Meeting Notes Generator

Transcribe meeting audio and generate AI-powered notes using [AssemblyAI](https://www.assemblyai.com/). Available as a CLI tool and a web app.

Features:
- Transcription with speaker diarization
- AI-generated summary, action items, and topics (via LeMUR)
- Modern dark-themed web UI with progress indicators
- Download results as markdown
- CLI mode for terminal usage

## Setup

```bash
npm install
```

Create a `.env` file with your AssemblyAI API key:

```
ASSEMBLYAI_API_KEY=your_key_here
```

Get a free API key at [assemblyai.com/dashboard/signup](https://www.assemblyai.com/dashboard/signup).

## Web UI

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — paste an audio URL or upload a file, then click **Generate Notes**.

## CLI Usage

```bash
# From a URL
node index.js https://assembly.ai/sports_injuries.mp3

# From a local file
node index.js ./recording.mp3
```

Output is printed to the terminal and saved to `notes-output.md`.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add `ASSEMBLYAI_API_KEY` in **Settings > Environment Variables**
4. Deploy — Vercel auto-detects Next.js, no extra config needed
