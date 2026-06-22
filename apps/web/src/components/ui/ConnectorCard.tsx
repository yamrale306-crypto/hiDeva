interface ConnectorCardProps {
  name: string;
  status: 'Connected' | 'Disconnected';
  description: string;
}

export function ConnectorCard({ name, status, description }: ConnectorCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
