"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { toPng } from "html-to-image";

type AnalysisResult = {
  vibe_score: number;
  label: string;
  emoji: string;
  caption: string;
  roast: string;
};

function scoreHexColor(score: number) {
  if (score >= 90) return "#9333ea";
  if (score >= 70) return "#16a34a";
  if (score >= 50) return "#4b5563";
  if (score >= 30) return "#ea580c";
  return "#dc2626";
}


export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-generate card image once results arrive — no user gesture needed here
  useEffect(() => {
    if (!result || !imageDataUrl || !cardRef.current) return;
    const cardEl = cardRef.current;
    let cancelled = false;

    const capture = async () => {
      setIsGeneratingCard(true);
      setCardDataUrl(null);
      setCardBlob(null);

      try {
        // img.complete only means the bytes arrived; decode() waits until pixel
        // data is ready for drawing. On mobile, off-screen images are often not
        // decoded yet even when complete === true.
        const imgEl = cardEl.querySelector("img") as HTMLImageElement | null;
        if (imgEl) {
          await imgEl.decode().catch(() => {
            // decode() unsupported on some older mobile browsers — fall back to
            // waiting for the load event if the image isn't ready yet.
            if (!imgEl.complete || imgEl.naturalWidth === 0) {
              return new Promise<void>((res) => {
                imgEl.addEventListener("load", () => res(), { once: true });
              });
            }
          });
        }

        if (cancelled) return;

        // html-to-image known issue: the first toPng call on an element with
        // images often misses them (race inside the library's drawImage path).
        // Calling it twice — discarding the first result — reliably captures the
        // food photo on the second pass.
        await toPng(cardEl, { pixelRatio: 2 }).catch(() => {});

        if (cancelled) return;

        const dataUrl = await toPng(cardEl, { pixelRatio: 2 });

        if (cancelled) return;

        setCardDataUrl(dataUrl);
        const blob = await fetch(dataUrl).then((r) => r.blob());
        if (!cancelled) setCardBlob(blob);
      } catch (err) {
        console.error("Card generation failed:", err);
      } finally {
        if (!cancelled) setIsGeneratingCard(false);
      }
    };

    capture();
    return () => {
      cancelled = true;
    };
  }, [result, imageDataUrl]);

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

      // Convert to base64 data URL for the share card — blob URLs are blocked
      // when embedded inside an SVG foreignObject (how html-to-image works)
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
      setImageDataUrl(base64DataUrl);
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
    setImageDataUrl(null);
    setResult(null);
    setError(null);
    setCardDataUrl(null);
    setCardBlob(null);
  }

  function downloadCard() {
    if (!cardBlob) return;
    const blobUrl = URL.createObjectURL(cardBlob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "namnamscore.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  // Called from a button click — user gesture is preserved because cardBlob is
  // already in state (no async work between the click and the share call).
  function handleShare() {
    if (!cardBlob || !result) return;
    const file = new File([cardBlob], "namnamscore.png", { type: "image/png" });

    // canShare({ files }) is the correct gate — navigator.share alone is true on
    // desktop Chrome too but file sharing may not be supported.
    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      navigator
        .share({ files: [file], title: `NamNamScore: ${result.vibe_score} — ${result.label}` })
        .catch((err) => {
          // AbortError just means the user dismissed the sheet — not an error
          if ((err as Error).name !== "AbortError") {
            console.error(err);
            downloadCard(); // last-resort fallback
          }
        });
    } else {
      downloadCard();
    }
  }

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof (navigator as Navigator & { canShare?: (d: ShareData) => boolean }).canShare === "function";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center max-w-md w-full">
        <h1 className="text-4xl font-medium mb-2 text-gray-900">NamNamScore</h1>
        <p className="text-lg text-gray-500 mb-8">Your meal, scored 🤤</p>

        {/* Upload picker */}
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

        {/* Compressing */}
        {isProcessing && (
          <div className="border-2 border-dashed border-amber-300 rounded-2xl p-12 bg-amber-50">
            <p className="text-5xl mb-4">⏳</p>
            <p className="text-lg font-medium text-gray-700">
              Processing your photo...
            </p>
          </div>
        )}

        {/* Analyzing */}
        {isAnalyzing && (
          <div className="bg-purple-50 rounded-2xl p-12">
            <p className="text-2xl mb-2">🤖</p>
            <p className="text-gray-700">Nam is thinking...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div>
            <div className="bg-red-50 rounded-2xl p-6 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={reset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-medium transition"
            >
              Try another
            </button>
          </div>
        )}

        {/* Generating card */}
        {result && isGeneratingCard && !cardDataUrl && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 py-12">
            <span className="animate-spin">⏳</span>
            Creating share card…
          </div>
        )}

        {/* Card is the result — buttons sit below it, outside the image */}
        {cardDataUrl && result && (
          <div className="flex flex-col gap-3">
            <img
              src={cardDataUrl}
              alt="Your NamNamScore card"
              className="w-full rounded-2xl shadow-sm"
            />
            {canNativeShare ? (
              <button
                onClick={handleShare}
                className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white font-semibold px-4 py-3 rounded-2xl transition flex items-center justify-center gap-2"
              >
                <span>📤</span> Share / Save to Camera Roll
              </button>
            ) : (
              <button
                onClick={downloadCard}
                className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold px-4 py-3 rounded-2xl transition flex items-center justify-center gap-2"
              >
                <span>💾</span> Download image
              </button>
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

      {/* Off-screen share card rendered for html-to-image capture */}
      {imageDataUrl && result && (
        <div
          style={{
            position: "fixed",
            top: "-9999px",
            left: "-9999px",
            zIndex: -1,
          }}
        >
          <div
            ref={cardRef}
            style={{
              width: "375px",
              backgroundColor: "#ffffff",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              overflow: "hidden",
            }}
          >
            {/* Food photo — square crop */}
            <div
              style={{
                width: "375px",
                height: "375px",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl ?? ""}
                alt="meal"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>

            {/* Score section */}
            <div
              style={{
                padding: "28px 28px 20px",
                textAlign: "center",
                backgroundColor: "#ffffff",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  margin: "0 0 8px 0",
                }}
              >
                Vibe Score
              </p>
              <p
                style={{
                  fontSize: "80px",
                  fontWeight: "700",
                  color: scoreHexColor(result.vibe_score),
                  lineHeight: "1",
                  margin: "0",
                }}
              >
                {result.vibe_score}
              </p>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#111827",
                  marginTop: "10px",
                  margin: "10px 0 0 0",
                }}
              >
                {result.emoji} {result.label}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  marginTop: "6px",
                  margin: "6px 0 0 0",
                }}
              >
                {result.caption}
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                backgroundColor: "#f3f4f6",
                margin: "0 28px",
              }}
            />

            {/* Roast section */}
            <div
              style={{
                padding: "20px 28px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#fcd34d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                🤖
              </div>
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "12px 14px",
                  borderRadius: "16px",
                  borderTopLeftRadius: "4px",
                  flex: 1,
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    fontWeight: "600",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 4px 0",
                  }}
                >
                  Nam
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: "1.55",
                    margin: "0",
                  }}
                >
                  {result.roast}
                </p>
              </div>
            </div>

            {/* Branding footer */}
            <div
              style={{
                padding: "14px 28px 20px",
                borderTop: "1px solid #f3f4f6",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#d97706",
                  letterSpacing: "0.02em",
                  margin: "0",
                }}
              >
                NamNamScore 🍜
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
