export const Loader = ({ label = "Loading..." }: { label?: string }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      <span>{label}</span>
    </div>
  );
};
