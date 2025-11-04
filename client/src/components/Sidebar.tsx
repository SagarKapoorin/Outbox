import type { Account } from '../api';

type Folder = { id: string; name: string };

export function Sidebar({
  accounts,
  folders,
  selectedAccountId,
  onSelectAccount,
  selectedFolderId,
  onSelectFolder,
}: {
  accounts: Account[];
  folders: Folder[];
  selectedAccountId?: string;
  onSelectAccount: (id?: string) => void;
  selectedFolderId?: string;
  onSelectFolder: (id?: string) => void;
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
      <div className="section">
        <div className="section-title">Folders</div>
        <button
          className={`pill ${!selectedFolderId ? 'active' : ''}`}
          onClick={() => onSelectFolder(undefined)}
        >
          All
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            className={`pill ${selectedFolderId === f.id ? 'active' : ''}`}
            onClick={() => onSelectFolder(f.id)}
          >
            {f.name}
          </button>
        ))}
      </div>
    </aside>
  );
}

