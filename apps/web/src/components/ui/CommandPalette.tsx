import { useState } from 'react';

const commands = [
  { id: 'search', label: 'Search workspace' },
  { id: 'new-note', label: 'Create note' },
  { id: 'new-task', label: 'Create task' },
  { id: 'open-settings', label: 'Open settings' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <div className="fixed bottom-6 right-6 z-20">
      <button
        onClick={() => setOpen(true)}
        className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-900/10 transition hover:bg-slate-800"
      >
        Command Palette
      </button>
      {open ? (
        <div className="mt-3 w-[320px] rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Command palette</h3>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900">Close</button>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <div className="mt-4 space-y-2">
            {commands
              .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
              .map((item) => (
                <button
                  key={item.id}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  {item.label}
                </button>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
