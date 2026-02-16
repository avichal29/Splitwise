import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowLeft, Receipt, Sparkles } from 'lucide-react';

const GRADS = [
  'from-violet-500 to-purple-600', 'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500', 'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500', 'from-red-500 to-pink-500',
  'from-indigo-500 to-violet-500',
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            💸 Add Expense
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track what you spent</p>
        </div>
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
                    ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400 border-2 border-primary-300 dark:border-primary-500/40 shadow-sm'
                    : 'bg-gray-50 dark:bg-surface-700/50 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-surface-700'
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
                    ? 'bg-gradient-to-r from-primary-500 to-emerald-400 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-gray-100 dark:bg-surface-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-700'
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
                  ? 'bg-primary-50/50 dark:bg-primary-500/10 border-2 border-primary-200 dark:border-primary-500/30'
                  : 'bg-gray-50 dark:bg-surface-700/30 border-2 border-transparent'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(p.id)}
                  onChange={() => toggleMember(p.id)}
                  className="w-4 h-4 text-primary-500 rounded border-gray-300 dark:border-surface-600 focus:ring-primary-500"
                />
                <div className={`avatar-sm bg-gradient-to-br ${getGrad(p.name)}`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{p.name}{p.id === user.id ? ' (you)' : ''}</span>

                {splitType === 'equal' && selectedMembers.includes(p.id) && amount && (
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/15 px-2.5 py-1 rounded-lg">
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
              <><Sparkles className="w-4 h-4" /> Add Expense</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
