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
      setActiveTab(data.summaryAvailable ? "summary" : "transcript");
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

  const stepIdx = STEPS.findIndex((x) => x.key === step);

  return (
    <main className="relative z-10 min-h-screen flex flex-col">
      {/* Top rule */}
      <div className="h-1 bg-terracotta" />

      <div className="flex-1 flex flex-col items-center px-5 py-12 sm:py-16 max-w-2xl mx-auto w-full">
        {/* Header */}
        <header className="text-center mb-12 fade-up">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-terracotta mb-4">
            Audio Transcription & Analysis
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-ink leading-[1.1] mb-4">
            Meeting Notes
            <br />
            <em className="text-ink-muted">Generator</em>
          </h1>
          <p className="text-ink-muted text-base max-w-sm mx-auto leading-relaxed">
            Paste an audio URL or upload a file to generate AI&#8209;powered
            meeting notes.
          </p>
        </header>

        {/* Input Card */}
        <div className="card-elevated w-full p-6 sm:p-8 mb-8 fade-up fade-up-d1">
          <form onSubmit={handleSubmit}>
            {/* URL Input */}
            <div className="mb-5">
              <label className="block text-xs font-medium tracking-wide uppercase text-ink-muted mb-2">
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
                className="w-full border border-rule bg-cream/50 rounded-sm px-4 py-3 text-ink placeholder-ink-muted/50 input-focus transition-colors disabled:opacity-40 text-sm"
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 editorial-rule" />
              <span className="text-xs font-medium uppercase tracking-wider text-ink-muted/60">
                or
              </span>
              <div className="flex-1 editorial-rule" />
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
                <div className="flex items-center gap-3 border border-rule bg-cream-dark/50 rounded-sm px-4 py-3">
                  <svg
                    className="w-4 h-4 text-terracotta shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  <span className="text-ink text-sm truncate flex-1">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-ink-muted hover:text-terracotta transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center gap-2 border border-dashed border-rule rounded-sm px-4 py-6 cursor-pointer hover:border-terracotta hover:bg-terracotta-pale/40 transition-all group ${loading ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <svg
                    className="w-5 h-5 text-ink-muted group-hover:text-terracotta transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span className="text-ink-muted text-sm group-hover:text-terracotta transition-colors">
                    Upload audio or video file
                  </span>
                  <span className="text-ink-muted/50 text-xs">
                    MP3, WAV, M4A, MP4, WebM, OGG
                  </span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!url && !file)}
              className="w-full py-3 px-6 rounded-sm font-medium text-sm text-white bg-ink hover:bg-ink-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                "Generate Notes"
              )}
            </button>
          </form>

          {/* Progress Steps */}
          {loading && step && (
            <div className="mt-6 pt-6 border-t border-rule-light">
              <div className="progress-bar mb-5" />
              <div className="space-y-3">
                {STEPS.map((s, i) => {
                  const isDone = i < stepIdx;
                  const isActive = i === stepIdx;

                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      {isDone ? (
                        <svg
                          className="w-4 h-4 text-sage shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : isActive ? (
                        <div className="spinner shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-rule shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          isDone
                            ? "text-sage line-through"
                            : isActive
                              ? "text-ink font-medium"
                              : "text-ink-muted/50"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="w-full mb-8 border border-terracotta/20 bg-terracotta-pale rounded-sm p-5 fade-up">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-terracotta shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium text-terracotta text-sm">
                  Something went wrong
                </p>
                <p className="text-ink-light text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="w-full fade-up fade-up-d2">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-ink">Your Notes</h2>
              <button
                onClick={downloadMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide uppercase text-ink-muted border border-rule rounded-sm hover:border-ink-muted hover:text-ink transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download .md
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-rule mb-0">
              {TABS.filter((t) => {
                if (t.key === "transcript") return true;
                if (t.key === "summary") return result.summaryAvailable;
                if (t.key === "topics") return result.topicsAvailable;
                if (t.key === "actions") return result.lemurAvailable;
                return result.lemurAvailable;
              }).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === t.key
                      ? "text-ink"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                  {activeTab === t.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-terracotta" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="card p-6 sm:p-8 border-t-0">
              {activeTab === "summary" && result.summaryAvailable && (
                <div className="fade-up">
                  <p className="text-ink-light leading-[1.8] text-[15px] whitespace-pre-wrap">
                    {result.summary}
                  </p>
                </div>
              )}

              {activeTab === "actions" && result.lemurAvailable && (
                <div className="fade-up">
                  <div className="text-ink-light leading-[1.8] text-[15px] whitespace-pre-wrap">
                    {result.actionItems}
                  </div>
                </div>
              )}

              {activeTab === "topics" && result.topicsAvailable && (
                <div className="fade-up">
                  <div className="text-ink-light leading-[1.8] text-[15px] whitespace-pre-wrap">
                    {result.topics}
                  </div>
                </div>
              )}

              {activeTab === "transcript" && (
                <div className="fade-up">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {result.utterances.map((u, i) => (
                      <div key={i} className="group">
                        <span
                          className={`text-xs font-semibold tracking-wide uppercase ${speakerColor(u.speaker)}`}
                        >
                          Speaker {u.speaker}
                        </span>
                        <p className="text-ink-light text-[15px] leading-[1.7] mt-0.5">
                          {u.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-ink-muted/50 tracking-wide">
        Powered by{" "}
        <a
          href="https://www.assemblyai.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-muted hover:text-terracotta transition-colors"
        >
          AssemblyAI
        </a>
      </footer>
    </main>
  );
}
