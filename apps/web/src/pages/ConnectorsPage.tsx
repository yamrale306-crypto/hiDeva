import { ConnectorCard } from '@/components/ui/ConnectorCard';

const connectors = [
  { name: 'Supabase', status: 'Connected' as const, description: 'Database, auth, storage, and realtime.' },
  { name: 'OpenAI', status: 'Disconnected' as const, description: 'AI model access for chat and agents.' },
  { name: 'GitHub', status: 'Connected' as const, description: 'Repository, issue, and commit insights.' },
  { name: 'Slack', status: 'Disconnected' as const, description: 'Team chat and notifications.' },
];

export function ConnectorsPage() {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-sky-600">Connectors</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Integration status</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {connectors.map((connector) => (
          <ConnectorCard key={connector.name} {...connector} />
        ))}
      </div>
    </div>
  );
}
