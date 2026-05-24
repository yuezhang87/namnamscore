export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-medium mb-4 text-gray-900">
          NamNamScore
        </h1>
        <p className="text-2xl mb-2">🤤</p>
        <p className="text-lg text-gray-600 mb-8">
          Your meal, scored with personality.
        </p>
        <div className="inline-block bg-amber-100 text-amber-900 px-4 py-2 rounded-full text-sm font-medium">
          Coming soon
        </div>
      </div>

      <p className="absolute bottom-8 text-xs text-gray-400">
        Built by Yue · Day 2 of 9 🚀
      </p>
    </main>
  );
}