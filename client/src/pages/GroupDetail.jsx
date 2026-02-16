import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowLeft, Trash2, UserPlus, Receipt, ArrowLeftRight, Search, X, Sparkles } from 'lucide-react';

const GRADS = [
  'from-violet-500 to-purple-600', 'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500', 'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500', 'from-red-500 to-pink-500',
  'from-indigo-500 to-violet-500',
];
function getGrad(n) { return GRADS[(n || 'A').charCodeAt(0) % GRADS.length]; }

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { formatAmount, currency } = useCurrency();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSettle, setShowSettle] = useState(false);
  const [settleUser, setSettleUser] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => { fetchGroup(); }, [id]);

  const fetchGroup = () => {
    api.get(`/groups/${id}`).then(res => setGroup(res.data)).catch(() => navigate('/groups')).finally(() => setLoading(false));
  };

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/auth/users/search?q=${q}`);
      const memberIds = group.members.map(m => m.id);
      setSearchResults(res.data.filter(u => !memberIds.includes(u.id)));
    } catch (err) { console.error(err); }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/groups/${id}/members`, { user_id: userId });
      setShowAddMember(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchGroup();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add member'); }
  };

  const deleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try { await api.delete(`/groups/${id}`); navigate('/groups'); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete group'); }
  };

  const deleteExpense = async (expenseId) => {
    if (!confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${expenseId}`); fetchGroup(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settlements', { paid_to: settleUser.id, amount: parseFloat(settleAmount), group_id: parseInt(id) });
      setShowSettle(false); setSettleUser(null); setSettleAmount(''); fetchGroup();
    } catch (err) { alert(err.response?.data?.error || 'Failed to settle'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-surface-700"></div><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div></div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => navigate('/groups')} className="p-2.5 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-xl transition-colors self-start">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGrad(group.name)} flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0`}>
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
            {group.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{group.description}</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/add-expense?group=${id}`} className="btn-primary flex items-center gap-2 text-sm">
            <Receipt className="w-4 h-4" /> Add Expense
          </Link>
          {group.created_by === user.id && (
            <button onClick={deleteGroup} className="btn-danger flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">👥 Members <span className="badge-purple">{group.members.length}</span></h2>
          <button onClick={() => setShowAddMember(!showAddMember)} className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 flex items-center gap-1 font-medium">
            <UserPlus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.members.map(m => (
            <div key={m.id} className="flex items-center gap-2 bg-gray-50 dark:bg-surface-700/50 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-surface-700">
              <div className={`avatar-sm bg-gradient-to-br ${getGrad(m.name)} text-[10px]`}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}{m.id === user.id ? ' (you)' : ''}</span>
              {m.id !== user.id && (
                <button onClick={() => { setSettleUser(m); setShowSettle(true); }} className="ml-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 transition-colors" title="Settle up">
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {showAddMember && (
          <div className="mt-4 p-4 border border-gray-200 dark:border-surface-600 rounded-xl bg-gray-50 dark:bg-surface-700/30 animate-scale-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchQuery} onChange={e => searchUsers(e.target.value)} className="input-field pl-11" placeholder="Search users to add..." autoFocus />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 shadow-xl max-h-40 overflow-y-auto">
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => addMember(u.id)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-surface-700 text-sm flex items-center gap-3 transition-colors">
                    <div className={`avatar-sm bg-gradient-to-br ${getGrad(u.name)}`}>{u.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">{u.name}</span>
                      <p className="text-xs text-gray-500 dark:text-surface-400">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowAddMember(false)} className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white font-medium transition-colors">Cancel</button>
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {showSettle && settleUser && (
        <div className="modal-overlay" onClick={() => setShowSettle(false)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" /> Settle with {settleUser.name}
              </h2>
              <button onClick={() => setShowSettle(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSettle} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Amount ({currency.symbol})</label>
                <input type="number" step="0.01" min="0.01" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} className="input-field text-xl font-bold" placeholder="0.00" required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSettle(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Settle Up 🤝</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">💸 Expenses</h2>
        {group.expenses.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No expenses in this group yet</p>
            <Link to={`/add-expense?group=${id}`} className="text-primary-500 text-sm font-medium mt-1 inline-block hover:underline">Add one →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {group.expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-700/50 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white">{exp.description}</p>
                    <span className="badge-blue text-[10px]">{exp.split_type}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Paid by <span className="font-semibold text-gray-700 dark:text-gray-200">{exp.paid_by === user.id ? 'you' : exp.paid_by_name}</span>
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {exp.splits.map(s => (
                      <span key={s.id} className="text-xs text-gray-500 dark:text-surface-400 bg-gray-100 dark:bg-surface-600/50 px-2 py-0.5 rounded-full">
                        {s.user_id === user.id ? 'You' : s.user_name}: {formatAmount(s.amount)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{formatAmount(exp.amount)}</span>
                  {exp.paid_by === user.id && (
                    <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settlements */}
      {group.settlements.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">🤝 Settlements</h2>
          <div className="space-y-3">
            {group.settlements.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <p className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">{s.paid_by === user.id ? 'You' : s.paid_by_name}</span>
                  <span className="text-gray-500 dark:text-gray-400"> paid </span>
                  <span className="font-semibold text-gray-900 dark:text-white">{s.paid_to === user.id ? 'you' : s.paid_to_name}</span>
                </p>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
