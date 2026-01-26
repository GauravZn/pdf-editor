export default function Translate() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center px-4">
      <div
        className="
          w-full max-w-md
          bg-zinc-800 border border-zinc-700
          rounded-xl p-6 sm:p-8
          shadow-lg text-center
        "
      >
        <div className="text-4xl mb-3">🌍</div>

        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
          Translate PDF
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base mb-6">
          Translate your documents into multiple languages with ease.
        </p>

        <div className="inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-zinc-700 text-zinc-300">
          Coming soon 🚧
        </div>
      </div>
    </div>
  );
}
