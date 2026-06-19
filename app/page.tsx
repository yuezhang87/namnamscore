"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";

type AnalysisResult = {
  vibe_score: number;
  label: string;
  emoji: string;
  caption: string;
  roast: string;
};

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      const previewUrl = URL.createObjectURL(compressedFile);
      setImageUrl(previewUrl);
      setIsProcessing(false);

      setIsAnalyzing(true);

      const formData = new FormData();
      formData.append("image", compressedFile);

      const response = await fetch("/api/score", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("AI failed to analyze");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Oops, something went wrong. Try another photo?");
    } finally {
      setIsProcessing(false);
      setIsAnalyzing(false);
    }
  }

  function reset() {
    setImageUrl(null);
    setResult(null);
    setError(null);
  }

  function scoreColor(score: number) {
    if (score >= 90) return "text-purple-600";
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-gray-600";
    if (score >= 30) return "text-orange-600";
    return "text-red-600";
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center max-w-md w-full">
        <h1 className="text-4xl font-medium mb-2 text-gray-900">NamNamScore</h1>
        <p className="text-lg text-gray-500 mb-8">Your meal, scored 🤤</p>

        {isProcessing && !imageUrl && (
          <div className="border-2 border-dashed border-amber-300 rounded-2xl p-12 bg-amber-50">
            <p className="text-5xl mb-4">⏳</p>
            <p className="text-lg font-medium text-gray-700">
              Processing your photo...
            </p>
          </div>
        )}

        {!imageUrl && !isProcessing && (
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-amber-500 hover:bg-amber-50 transition">
              <p className="text-5xl mb-4">📸</p>
              <p className="text-lg font-medium text-gray-700">
                Pick a meal photo
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Tap to choose or take a photo
              </p>
            </div>
          </label>
        )}

        {imageUrl && (
          <div>
            <img
              src={imageUrl}
              alt="Your meal"
              className="w-full rounded-2xl mb-4"
            />

            {isAnalyzing && (
              <div className="bg-purple-50 rounded-2xl p-6 mb-4">
                <p className="text-2xl mb-2">🤖</p>
                <p className="text-gray-700">Nam is thinking...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-2xl p-6 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="text-left mb-4">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                    Vibe Score
                  </p>
                  <p
                    className={`text-6xl font-medium ${scoreColor(
                      result.vibe_score
                    )}`}
                  >
                    {result.vibe_score}
                  </p>
                  <p className="text-lg font-medium text-gray-800 mt-2">
                    {result.emoji} {result.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{result.caption}</p>
                </div>

                <div className="flex gap-2 items-start mt-6">
                  <div className="w-9 h-9 rounded-full bg-amber-300 flex-shrink-0 flex items-center justify-center text-lg">
                    🤖
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Nam
                    </p>
                    <p className="text-gray-800 leading-relaxed">
                      {result.roast}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-medium transition"
            >
              Try another
            </button>
          </div>
        )}
      </div>

      <p className="absolute bottom-6 text-xs text-gray-400">
        Built by Yue · Day 4 of 9 🚀
      </p>
    </main>
  );
}