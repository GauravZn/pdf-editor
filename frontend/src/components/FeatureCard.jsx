export default function FeatureCard({ title, icon, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        bg-zinc-800 border border-zinc-700
        rounded-xl p-5 text-left
        hover:border-indigo-500 hover:bg-zinc-750
        transition
      "
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </button>
  );
}