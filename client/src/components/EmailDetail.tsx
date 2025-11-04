import { useState } from 'react';
import type { EmailItem } from '../api';

export function EmailDetail({
  email,
  onMarkInterested,
  onAddLabel,
  onRemoveLabel,
  onSuggestReply,
  suggestReply,
  loadingSuggest,
}: {
  email?: EmailItem | null;
  onMarkInterested: (id: string) => Promise<void> | void;
  onAddLabel: (id: string, label: string) => Promise<void> | void;
  onRemoveLabel: (id: string, label: string) => Promise<void> | void;
  onSuggestReply: (id: string) => Promise<void> | void;
  suggestReply?: string;
  loadingSuggest: boolean;
}) {
  const [showBody, setShowBody] = useState(true);

  if (!email) {
    return <div className="email-detail empty">Select an email to view details.</div>;
  }

  const labels = email.labels || [];

  return (
    <div className="email-detail">
      <div className="detail-header">
        <div className="subject-large">{email.subject || '(no subject)'}</div>
        <div className="actions">
          <button
            className="btn"
            onClick={() => onMarkInterested(email.id)}
            disabled={labels.includes('Interested')}
            title={labels.includes('Interested') ? 'Already marked' : 'Mark as Interested'}
          >
            Mark Interested
          </button>
          <button className="btn" onClick={() => onSuggestReply(email.id)} disabled={loadingSuggest}>
            {loadingSuggest ? 'Suggesting…' : 'Suggest Reply'}
          </button>
        </div>
      </div>
      <div className="meta">
        <div><strong>From:</strong> {email.from || ''}</div>
        <div><strong>To:</strong> {email.to || ''}</div>
        <div><strong>Date:</strong> {email.date ? new Date(email.date).toLocaleString() : ''}</div>
      </div>
      <div className="labels">
        {labels.map((l) => (
          <span key={l} className={`badge badge-${l.replace(/\s+/g, '').toLowerCase()}`}>
            {l}
            {labels.length > 1 && (
              <button
                className="badge-x"
                title="Remove label"
                onClick={() => onRemoveLabel(email.id, l)}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <div className="label-adder">
          <select
            className="select"
            value={''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              onAddLabel(email.id, val);
              e.currentTarget.value = '';
            }}
          >
            <option value="">Add label…</option>
            {['Interested','Meeting Booked','Not Interested','Spam','Out of Office']
              .filter((l) => !(email.labels || []).includes(l))
              .map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
          </select>
        </div>
      </div>
      <div className="body-toggle">
        <label>
          <input type="checkbox" checked={showBody} onChange={(e) => setShowBody(e.target.checked)} /> Show body
        </label>
      </div>
      {showBody && (
        <pre className="body">
{(email.text || '').slice(0, 20000)}
        </pre>
      )}
      {suggestReply && (
        <div className="suggest">
          <div className="section-title">Suggested Reply</div>
          <pre className="suggest-box">{suggestReply}</pre>
        </div>
      )}
    </div>
  );
}
