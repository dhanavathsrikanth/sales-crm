import LoadingSpinner from "./LoadingSpinner";

export default function FullPageSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-zinc-500 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
