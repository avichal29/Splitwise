import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { UserPlus, Search, X, Trash2, Users, Sparkles, ArrowLeftRight } from 'lucide-react';

const GRADS = [
  'from-violet-500 to-purple-600', 'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500', 'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500', 'from-red-500 to-pink-500',
  'from-indigo-500 to-violet-500',
];
function getGrad(n) { return GRADS[(n || 'A').charCodeAt(0) % GRADS.length]; }

export default function Friends() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSettle, setShowSettle] = useState(false);
  const [settleUser, setSettleUser] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => { fetchFriends(); }, []);

  const fetchFriends = () => {
    api.get('/friends').then(res => setFriends(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/auth/users/search?q=${q}`);
      const friendIds = friends.map(f => f.id);
      setSearchResults(res.data.filter(u => !friendIds.includes(u.id)));
    } catch (err) { console.error(err); }
  };

  const addFriend = async (friendId) => {
    try {
      await api.post('/friends', { friend_id: friendId });
      setSearchQuery('');
      setSearchResults([]);
      fetchFriends();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add friend');
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await api.delete(`/friends/${friendId}`);
      fetchFriends();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove friend');
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settlements', { paid_to: settleUser.id, amount: parseFloat(settleAmount) });
      setShowSettle(false);
      setSettleUser(null);
      setSettleAmount('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to settle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-surface-700"></div><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🤝 Friends
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your squad & settle ups</p>
      </div>

      {/* Search & Add */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary-500" /> Add a Friend
        </h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => searchUsers(e.target.value)}
            className="input-field pl-11"
            placeholder="Search by name or email..."
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-200 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 shadow-xl max-h-48 overflow-y-auto">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`avatar-sm bg-gradient-to-br ${getGrad(u.name)}`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-surface-400">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => addFriend(u.id)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List */}
      {friends.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No friends yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">Search for people above to add them to your squad!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {friends.map((f, i) => (
            <div key={f.id} className="card flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div className={`avatar-lg bg-gradient-to-br ${getGrad(f.name)}`}>
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-surface-800 rounded-full"></div>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{f.name}</p>
                  <p className="text-xs text-gray-500 dark:text-surface-400 truncate">{f.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={() => { setSettleUser(f); setShowSettle(true); }}
                  className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Settle
                </button>
                <button onClick={() => removeFriend(f.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-700/30 rounded-xl mb-5">
              <div className={`avatar-md bg-gradient-to-br ${getGrad(settleUser.name)}`}>
                {settleUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{settleUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-surface-400">{settleUser.email}</p>
              </div>
            </div>
            <form onSubmit={handleSettle} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Amount you paid ({currency.symbol})</label>
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
    </div>
  );
}
