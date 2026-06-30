interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="font-serif text-3xl text-slate-900 md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
};
