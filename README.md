# Meeting Notes Generator

CLI tool that transcribes meeting audio and generates structured notes using [AssemblyAI](https://www.assemblyai.com/).

Features:
- Transcription with speaker diarization
- AI-generated summary, action items, and topics (via LeMUR)
- Clean terminal output + markdown file export

## Setup

```bash
npm install
```

Create a `.env` file with your AssemblyAI API key:

```
ASSEMBLYAI_API_KEY=your_key_here
```

Get a free API key at [assemblyai.com/dashboard/signup](https://www.assemblyai.com/dashboard/signup).

## Usage

```bash
# From a URL
node index.js https://assembly.ai/sports_injuries.mp3

# From a local file
node index.js ./recording.mp3
```

Output is printed to the terminal and saved to `notes-output.md`.
