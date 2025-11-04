import type { Account } from '../api';

export function Sidebar({
  accounts,
  selectedAccountId,
  onSelectAccount,
}: {
  accounts: Account[];
  selectedAccountId?: string;
  onSelectAccount: (id?: string) => void;
}) {
  return (
    <aside className="sidebar">
              <div className="section">
        <div className="section-title">Accounts</div>
        <button
          className={`pill ${!selectedAccountId ? 'active' : ''}`}
          onClick={() => onSelectAccount(undefined)}
        >
          All
        </button>
{accounts.map((a) => (
          <button
            key={a.id}
            className={`pill ${selectedAccountId === a.id ? 'active' : ''}`}
            title={`${a.user}@${a.host}`}
            onClick={() => onSelectAccount(a.id)}
          >
            {a.id}
          </button>
        ))}
      </div>
    </aside>
  );
}
