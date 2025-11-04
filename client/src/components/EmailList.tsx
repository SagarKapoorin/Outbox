import type { EmailItem } from '../api';

export function EmailList({
  items,
  loading,
  selectedId,
  onSelect,
  total,
}: {
  items: EmailItem[];
  loading: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
  total: number;
}) {
  // console.log(items+" "+total+" "+loading);
  return (
                 <div className="email-list">
      <div className="list-header">
        <div>Emails{typeof total === 'number' ? ` • ${total}` : ''}</div>
        {loading && <div className="muted">Loading…</div>}
      </div>
            <ul>
        {items.map((e) => (
          <li
            key={e.id}
            className={`email-item ${selectedId === e.id ? 'selected' : ''}`}
            onClick={() => onSelect(e.id)}
          >
      <div className="row">
              <div className="subject">{e.subject || '(no subject)'}</div>
              <div className="date">
                {e.date ? new Date(e.date).toLocaleString() : ''}
              </div>
            </div>
    <div className="row">
              <div className="fromto">{e.from || ''}</div>
            </div>
            <div className="labels">
              {(e.labels || []).map((l) => (
                <span className={`badge badge-${l.replace(/\s+/g, '').toLowerCase()}`} key={l}>
                  {l}
                </span>
              ))}
      </div>
          </li>
        ))}
        {!loading && items.length === 0 && (
          <li className="empty">No emails match your filters.</li>
        )}
      </ul>
    </div>
  );
}

