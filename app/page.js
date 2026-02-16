"use client";

import { useState, useRef } from "react";

const SPEAKER_COLORS = [
  "speaker-a",
  "speaker-b",
  "speaker-c",
  "speaker-d",
  "speaker-e",
];

function speakerColor(speaker) {
  const idx = speaker.charCodeAt(0) - "A".charCodeAt(0);
  return SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
}

const STEPS = [
  { key: "uploading", label: "Uploading audio" },
  { key: "transcribing", label: "Transcribing with speaker labels" },
  { key: "analyzing", label: "Generating AI notes with LeMUR" },
];

const TABS = [
  { key: "summary", label: "Summary" },
  { key: "actions", label: "Action Items" },
  { key: "topics", label: "Topics" },
  { key: "transcript", label: "Transcript" },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url && !file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStep("uploading");

    try {
      let res;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        setStep("uploading");
        res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
      } else {
        setStep("transcribing");
        res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      }

      setStep("analyzing");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
      setActiveTab(data.lemurAvailable ? "summary" : "transcript");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStep(null);
    }
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setUrl("");
    }
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function generateMarkdown() {
    if (!result) return "";
    const lines = result.utterances
      .map((u) => `**Speaker ${u.speaker}:** ${u.text}`)
      .join("\n\n");

    const lemurSection = result.lemurAvailable
      ? `## Summary\n\n${result.summary}\n\n---\n\n## Action Items\n\n${result.actionItems}\n\n---\n\n## Topics Discussed\n\n${result.topics}\n\n---\n\n`
      : "";

    return `# Meeting Notes\n\n*Generated on ${new Date().toLocaleString()}*\n\n---\n\n${lemurSection}## Full Transcript\n\n${lines}\n`;
  }

  function downloadMarkdown() {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meeting-notes.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10 fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
          Meeting Notes Generator
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Paste an audio URL or upload a file to generate AI-powered meeting
          notes
        </p>
      </div>

      {/* Input Card */}
      <div className="glass gradient-border w-full max-w-2xl p-8 mb-8 fade-in">
        <form onSubmit={handleSubmit}>
          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">
              Audio URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              placeholder="https://example.com/meeting-audio.mp3"
              disabled={loading || !!file}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-40"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
              id="file-upload"
            />
            {file ? (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <svg
                  className="w-5 h-5 text-indigo-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <span className="text-white truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-slate-400 hover:text-white transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-lg px-4 py-3 cursor-pointer hover:bg-white/8 hover:border-white/30 transition ${loading ? "opacity-40 pointer-events-none" : ""}`}
              >
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span className="text-slate-400">Upload audio file</span>
              </label>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!url && !file)}
            className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="spinner" />
                Processing...
              </>
            ) : (
              "Generate Notes"
            )}
          </button>
        </form>

        {/* Progress Steps */}
        {loading && step && (
          <div className="mt-6 space-y-3">
            {STEPS.map((s, i) => {
              const stepIdx = STEPS.findIndex((x) => x.key === step);
              const thisIdx = i;
              const isDone = thisIdx < stepIdx;
              const isActive = thisIdx === stepIdx;

              return (
                <div key={s.key} className="flex items-center gap-3">
                  {isDone ? (
                    <svg
                      className="w-5 h-5 text-green-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isActive ? (
                    <div className="spinner shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
                  )}
                  <span
                    className={
                      isDone
                        ? "text-green-400"
                        : isActive
                          ? "text-white"
                          : "text-slate-500"
                    }
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl mb-8 glass border-red-500/30 p-6 fade-in">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-slate-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="w-full max-w-2xl fade-in">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {TABS.filter(
              (t) => t.key === "transcript" || result.lemurAvailable
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === t.key
                    ? "tab-active"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="glass p-6 mb-6">
            {activeTab === "summary" && result.lemurAvailable && (
              <div className="fade-in">
                <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </p>
              </div>
            )}

            {activeTab === "actions" && result.lemurAvailable && (
              <div className="fade-in">
                <h2 className="text-xl font-bold text-white mb-4">
                  Action Items
                </h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {result.actionItems}
                </div>
              </div>
            )}

            {activeTab === "topics" && result.lemurAvailable && (
              <div className="fade-in">
                <h2 className="text-xl font-bold text-white mb-4">
                  Topics Discussed
                </h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {result.topics}
                </div>
              </div>
            )}

            {activeTab === "transcript" && (
              <div className="fade-in">
                <h2 className="text-xl font-bold text-white mb-4">
                  Full Transcript
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {result.utterances.map((u, i) => (
                    <div key={i}>
                      <span
                        className={`font-semibold ${speakerColor(u.speaker)}`}
                      >
                        Speaker {u.speaker}
                      </span>
                      <p className="text-slate-300 mt-0.5">{u.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={downloadMarkdown}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download as Markdown
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-12 pb-6 text-center text-sm text-slate-600">
        Powered by{" "}
        <a
          href="https://www.assemblyai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-500 hover:text-indigo-400 transition"
        >
          AssemblyAI
        </a>
      </footer>
    </main>
  );
}
