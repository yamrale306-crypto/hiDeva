const cards = [
  { label: 'Notes', value: '124', description: 'Your latest knowledge items.' },
  { label: 'Tasks', value: '28', description: 'Items due this week.' },
  { label: 'Agents', value: '6', description: 'Active AI workflows.' },
  { label: 'Connectors', value: '12', description: 'External integrations connected.' },
];

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{card.value}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
