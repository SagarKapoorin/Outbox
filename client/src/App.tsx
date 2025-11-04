import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { api, type Account, type EmailItem } from './api';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { useDebounce } from './hooks/useDebounce';

const LABELS = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'] as const;

function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
// console.log("Selected Folder: "+selectedFolder+" "+query+" "+labelFilter);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page] = useState(0);
  const [size] = useState(25);
  // console.log("Emails: "+emails.length);
  const [selectedId, setSelectedId] = useState<string | undefined>();
     const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>();
const [suggest, setSuggest] = useState<string>('');
  const [loadingSuggest, setLoadingSuggest] = useState(false);
// console.log("Selected Email: "+selectedEmail?.id);
  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    console.log('searching...', { q: debouncedQuery, account: selectedAccount, label: labelFilter });
    setLoading(true);
    setSuggest('');
    api
      .searchEmails({   q: debouncedQuery , account: selectedAccount , label: labelFilter, page, size })
      .then((r) => {
        setEmails(r.items);
        setTotal(r.total);
        const still = r.items.find((e) => e.id === selectedId);
        const first = r.items[0];
        if (!still) {
          setSelectedId(first?.id);
          setSelectedEmail(first || null);
        }
      })
      .catch(() => {
        setEmails([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debouncedQuery, selectedAccount, labelFilter, page, size, selectedId]);

  const onSelectEmail = async (id: string) => {
    setSelectedId(id);
    // console.log("Selected Email ID: "+id);
    setSuggest('');
    try {
      const e = await api.getEmail(id);
      setSelectedEmail(e);
    } catch {
      const fallback = emails.find((x) => x.id === id) || null;
      setSelectedEmail(fallback);
    }
  };

  const addLabel = async (id: string, label: string) => {
    try {
      const updated = await api.setLabel(id, label);
      setSelectedEmail(updated);
      console.log('label +', label, id)
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, labels: (updated.labels || []) } : e)));
    } catch (e) {
      console.error(e);
      alert('Failed to add label.');
    }
  };

  const removeLabel = async (id: string, label: string) => {
    const current = (selectedEmail?.id === id ? selectedEmail?.labels : emails.find((e) => e.id === id)?.labels) || [];
    if (current.length <= 1) {
      alert('At least one label is required.');
      return;
    }
    try {
      // Best-effort: expects backend DELETE /emails/:id/label
      const updated = await api.removeLabel(id, label);
      setSelectedEmail(updated);
      console.log('label -', label, id)
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, labels: (updated.labels || []) } : e)));
    } catch (e) {
      console.error(e);
      alert('Failed to remove label. Backend must support DELETE /emails/:id/label');
    }
  };

      const suggestReply = async (id: string) => {
    setLoadingSuggest(true);
    setSuggest('');
    try {
      const r = await api.suggestReply(id);
      setSuggest(r.reply);
    } catch (e) {
      console.error(e);
      alert('Failed to suggest reply. Ensure OpenAI key + KB are configured.');
    } finally {
      setLoadingSuggest(false);
    }
  };

  const headerRight = useMemo(
    () => (
      <div className="header-controls">
        <input
          className="input"
          placeholder="Search subject and body…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="select" value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)}>
          <option value="">All labels</option>
          {LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
    ),
    [query, labelFilter]
  );

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Onebox</div>
        {headerRight}
         </header>
      <div className="content">
        <Sidebar
          accounts={accounts}
          selectedAccountId={selectedAccount}
          onSelectAccount={setSelectedAccount}
        />
              <main className="main">
          <div className="columns">
            <div className="col list">
              <EmailList items={emails} loading={loading} selectedId={selectedId} onSelect={onSelectEmail} total={total} />
            </div>
            <div className="col detail">
              <EmailDetail
                email={selectedEmail}
                onAddLabel={addLabel}
                onRemoveLabel={removeLabel}
                onSuggestReply={suggestReply}
                suggestReply={suggest}
                loadingSuggest={loadingSuggest}
              />
            </div>
               </div>
        </main>
      </div>
    </div>
  );
}

export default App;
