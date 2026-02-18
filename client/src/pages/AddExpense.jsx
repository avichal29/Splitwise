import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowLeft, Receipt, Zap, Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

const GRADS = [
  'from-teal-500 to-emerald-500', 'from-violet-500 to-purple-500',
  'from-cyan-500 to-blue-500', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500', 'from-indigo-500 to-blue-500',
  'from-emerald-500 to-green-500',
];
function getGrad(n) { return GRADS[(n || 'A').charCodeAt(0) % GRADS.length]; }

const CATEGORIES = [
  { emoji: '🍕', label: 'Food' },
  { emoji: '🏠', label: 'Rent' },
  { emoji: '🚗', label: 'Transport' },
  { emoji: '🎬', label: 'Entertainment' },
  { emoji: '🛒', label: 'Groceries' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '💡', label: 'Utilities' },
  { emoji: '🎁', label: 'Other' },
];

export default function AddExpense() {
  const { user } = useAuth();
  const { currency, formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroup = searchParams.get('group');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [groupId, setGroupId] = useState(preselectedGroup || '');
  const [splitType, setSplitType] = useState('equal');
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [customSplits, setCustomSplits] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [friends, setFriends] = useState([]);
  const [category, setCategory] = useState('🎁');

  // Quick Add state
  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState(null);

  // CSV Import state
  const [showImport, setShowImport] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickText.trim()) return;
    setQuickLoading(true);
    setQuickResult(null);
    try {
      const res = await api.post('/expenses/quick', { text: quickText });
      setQuickResult({ success: true, expense: res.data });
      setQuickText('');
      setTimeout(() => setQuickResult(null), 4000);
    } catch (err) {
      setQuickResult({ success: false, error: err.response?.data?.error || 'Failed to parse' });
    } finally {
      setQuickLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { alert('CSV must have a header row and at least one data row'); return; }

      const header = lines[0].toLowerCase();
      // Auto-detect column indices
      const cols = header.split(',').map(c => c.trim().replace(/"/g, ''));
      const descIdx = cols.findIndex(c => ['description', 'narration', 'details', 'particulars', 'remarks', 'transaction', 'name', 'note'].some(k => c.includes(k)));
      const amtIdx = cols.findIndex(c => ['amount', 'debit', 'withdrawal', 'spent', 'value', 'price'].some(k => c.includes(k)));

      if (descIdx === -1 || amtIdx === -1) {
        alert('Could not detect columns. CSV needs "description" and "amount" columns.');
        return;
      }

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const desc = values[descIdx];
        const amt = parseFloat(values[amtIdx]?.replace(/[^0-9.]/g, ''));
        if (desc && amt > 0) {
          parsed.push({ description: desc, amount: amt, selected: true });
        }
      }
      setCsvData(parsed);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const toggleCsvRow = (idx) => {
    setCsvData(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const handleImport = async () => {
    const selected = csvData.filter(r => r.selected);
    if (selected.length === 0) { alert('Select at least one transaction'); return; }
    setImportLoading(true);
    try {
      const res = await api.post('/expenses/import', { transactions: selected.map(r => ({ description: r.description, amount: r.amount })) });
      setImportResult({ success: true, count: res.data.expenses.length });
      setCsvData([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setImportResult({ success: false, error: err.response?.data?.error || 'Import failed' });
    } finally {
      setImportLoading(false);
    }
  };

  useEffect(() => {
    api.get('/groups').then(res => setGroups(res.data));
    api.get('/friends').then(res => setFriends(res.data));
  }, []);

  useEffect(() => {
    if (groupId) {
      api.get(`/groups/${groupId}`).then(res => {
        setMembers(res.data.members);
        setSelectedMembers(res.data.members.map(m => m.id));
      });
    } else {
      setMembers([]);
      setSelectedMembers([user.id]);
    }
  }, [groupId]);

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSplitChange = (userId, value) => {
    setCustomSplits(prev => ({ ...prev, [userId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert('Select at least one person to split with');
      return;
    }

    setSubmitting(true);
    try {
      let splits;
      if (splitType === 'equal') {
        splits = selectedMembers.map(id => ({ user_id: id }));
      } else if (splitType === 'exact') {
        splits = selectedMembers.map(id => ({
          user_id: id,
          amount: parseFloat(customSplits[id] || 0)
        }));
        const total = splits.reduce((s, x) => s + x.amount, 0);
        if (Math.abs(total - parseFloat(amount)) > 0.01) {
          alert(`Split amounts (${formatAmount(total)}) don't add up to total (${formatAmount(amount)})`);
          setSubmitting(false);
          return;
        }
      } else if (splitType === 'percentage') {
        splits = selectedMembers.map(id => ({
          user_id: id,
          percentage: parseFloat(customSplits[id] || 0)
        }));
        const totalPct = splits.reduce((s, x) => s + x.percentage, 0);
        if (Math.abs(totalPct - 100) > 0.01) {
          alert(`Percentages (${totalPct.toFixed(1)}%) don't add up to 100%`);
          setSubmitting(false);
          return;
        }
      }

      await api.post('/expenses', {
        description: `${category} ${description}`,
        amount: parseFloat(amount),
        group_id: groupId ? parseInt(groupId) : null,
        split_type: splitType,
        splits
      });

      navigate(groupId ? `/groups/${groupId}` : '/');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const availablePeople = groupId
    ? members
    : [{ id: user.id, name: user.name, email: user.email }, ...friends];

  const splitTypeLabels = { equal: '÷ Equal', exact: '# Exact', percentage: '% Percent' };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-500" /> Add Expense
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track what you spent</p>
        </div>
      </div>

      {/* Quick Add */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Quick Add</h2>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Type naturally, we'll parse it</span>
        </div>
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            className="input-field flex-1"
            placeholder='e.g. "paid 500 for dinner at swiggy" or "uber 250"'
          />
          <button type="submit" disabled={quickLoading} className="btn-primary px-5 flex items-center gap-1.5 shrink-0">
            {quickLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Zap className="w-4 h-4" /> Add</>
            )}
          </button>
        </form>
        {quickResult && (
          <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 text-sm animate-slide-up ${
            quickResult.success
              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
          }`}>
            {quickResult.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Added <strong>{quickResult.expense.description}</strong> — {formatAmount(quickResult.expense.amount)}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quickResult.error}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* CSV Import */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Import from CSV</h2>
          </div>
          <button onClick={() => setShowImport(!showImport)} className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline">
            {showImport ? 'Hide' : 'Show'}
          </button>
        </div>

        {showImport && (
          <div className="space-y-4 animate-slide-up">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Upload a CSV from Google Pay, CRED, or your bank statement. Needs columns: <strong>description</strong> and <strong>amount</strong>.
            </p>

            <div className="relative">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-teal-400 dark:hover:border-teal-500/40 hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-all"
              >
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Click to select CSV file</span>
              </label>
            </div>

            {csvData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {csvData.filter(r => r.selected).length} of {csvData.length} transactions selected
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCsvData(prev => prev.map(r => ({ ...r, selected: true })))} className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline">Select all</button>
                    <button type="button" onClick={() => setCsvData(prev => prev.map(r => ({ ...r, selected: false })))} className="text-xs text-gray-400 font-medium hover:underline">Deselect all</button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 rounded-xl border border-black/5 dark:border-white/5 p-2">
                  {csvData.map((row, i) => (
                    <div
                      key={i}
                      onClick={() => toggleCsvRow(i)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                        row.selected
                          ? 'bg-teal-50/60 dark:bg-teal-500/10 border border-teal-200/60 dark:border-teal-500/20'
                          : 'hover:bg-black/3 dark:hover:bg-white/3 border border-transparent'
                      }`}
                    >
                      <input type="checkbox" checked={row.selected} readOnly className="w-3.5 h-3.5 text-teal-500 rounded" />
                      <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">{row.description}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatAmount(row.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setCsvData([]); if (fileRef.current) fileRef.current.value = ''; }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {importLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import {csvData.filter(r => r.selected).length} Expenses
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {importResult && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                importResult.success
                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
              }`}>
                {importResult.success ? (
                  <><CheckCircle2 className="w-4 h-4" /> Successfully imported {importResult.count} expenses</>
                ) : (
                  <><AlertCircle className="w-4 h-4" /> {importResult.error}</>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200/60 dark:bg-white/5"></div>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">or add manually</span>
        <div className="flex-1 h-px bg-gray-200/60 dark:bg-white/5"></div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Category Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.emoji}
                type="button"
                onClick={() => setCategory(c.emoji)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === c.emoji
                    ? 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border-2 border-teal-300 dark:border-teal-500/40 shadow-sm'
                    : 'bg-black/3 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-black/5 dark:hover:bg-white/8'
                }`}
              >
                <span className="text-lg">{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="e.g., Dinner at restaurant" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Amount ({currency.symbol})</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300 dark:text-surface-500">{currency.symbol}</span>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-field text-3xl font-bold pl-12 py-4" placeholder="0.00" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Group (optional)</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)} className="input-field">
            <option value="">No group (personal)</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Split Type</label>
          <div className="flex gap-2">
            {Object.entries(splitTypeLabels).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => { setSplitType(type); setCustomSplits({}); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  splitType === type
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                    : 'bg-black/4 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-black/6 dark:hover:bg-white/8'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Split Between</label>
          <div className="space-y-2">
            {availablePeople.map(p => (
              <div key={p.id} className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${
                selectedMembers.includes(p.id)
                  ? 'bg-teal-50/50 dark:bg-teal-500/10 border-2 border-teal-200 dark:border-teal-500/30'
                  : 'bg-black/2 dark:bg-white/3 border-2 border-transparent'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(p.id)}
                  onChange={() => toggleMember(p.id)}
                  className="w-4 h-4 text-teal-500 rounded border-gray-300 dark:border-surface-600 focus:ring-teal-500"
                />
                <div className={`avatar-sm bg-gradient-to-br ${getGrad(p.name)}`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{p.name}{p.id === user.id ? ' (you)' : ''}</span>

                {splitType === 'equal' && selectedMembers.includes(p.id) && amount && (
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/15 px-2.5 py-1 rounded-lg">
                    {formatAmount(parseFloat(amount) / selectedMembers.length)}
                  </span>
                )}

                {splitType === 'exact' && selectedMembers.includes(p.id) && (
                  <input
                    type="number" step="0.01" min="0"
                    value={customSplits[p.id] || ''}
                    onChange={e => handleSplitChange(p.id, e.target.value)}
                    className="w-28 px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-xl text-sm text-right font-semibold bg-white dark:bg-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                    placeholder="0.00"
                  />
                )}

                {splitType === 'percentage' && selectedMembers.includes(p.id) && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" step="0.1" min="0" max="100"
                      value={customSplits[p.id] || ''}
                      onChange={e => handleSplitChange(p.id, e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-200 dark:border-surface-600 rounded-xl text-sm text-right font-semibold bg-white dark:bg-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none"
                      placeholder="0"
                    />
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">%</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {availablePeople.length === 0 && !groupId && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 dark:text-surface-400">Add friends first or select a group to split with.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Receipt className="w-4 h-4" /> Add Expense</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
