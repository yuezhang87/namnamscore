"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileSize, setFileSize] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);

      const url = URL.createObjectURL(compressedFile);
      setImageUrl(url);
      setFileSize(`${originalSizeMB} MB → ${compressedSizeMB} MB`);
    } catch (error) {
      console.error("Compression error:", error);
      alert("Oops, something went wrong. Try another photo?");
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setImageUrl(null);
    setFileSize(null);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center max-w-md w-full">
        <h1 className="text-4xl font-medium mb-2 text-gray-900">
          NamNamScore
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          Your meal, scored 🤤
        </p>

        {isProcessing ? (
          <div className="border-2 border-dashed border-amber-300 rounded-2xl p-12 bg-amber-50">
            <p className="text-5xl mb-4">⏳</p>
            <p className="text-lg font-medium text-gray-700">
              Processing your photo...
            </p>
          </div>
        ) : !imageUrl ? (
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
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
        ) : (
          <div>
            <img
              src={imageUrl}
              alt="Your meal"
              className="w-full rounded-2xl mb-4"
            />
            {fileSize && (
              <p className="text-xs text-gray-400 mb-3">
                Compressed: {fileSize}
              </p>
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
        Built by Yue · Day 3 of 9 🚀
      </p>
    </main>
  );
}