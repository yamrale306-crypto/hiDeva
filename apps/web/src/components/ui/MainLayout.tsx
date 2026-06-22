interface MainLayoutProps {
  activePage: 'dashboard' | 'connectors';
  onNavigate: (page: 'dashboard' | 'connectors') => void;
  children: React.ReactNode;
}

export function MainLayout({ activePage, onNavigate, children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-600">hiDeva OS</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Workspace</h1>
            <p className="mt-2 text-sm text-slate-600">Secure AI productivity for teams, knowledge, and integration workflows.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${activePage === 'dashboard' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'}`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('connectors')}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${activePage === 'connectors' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'}`}
            >
              Connectors
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
