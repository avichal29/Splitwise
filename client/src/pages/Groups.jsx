import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Users, Plus, Search, X, ArrowRight } from 'lucide-react';

const GRADS = [
  'from-teal-500 to-emerald-500', 'from-violet-500 to-purple-500',
  'from-cyan-500 to-blue-500', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500', 'from-indigo-500 to-blue-500',
  'from-emerald-500 to-green-500',
];
function getGrad(n) { return GRADS[(n || 'A').charCodeAt(0) % GRADS.length]; }

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = () => {
    api.get('/groups').then(res => setGroups(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/auth/users/search?q=${q}`);
      setSearchResults(res.data.filter(u => !selectedMembers.find(m => m.id === u.id)));
    } catch (err) { console.error(err); }
  };

  const addMember = (user) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const removeMember = (id) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/groups', { name, description, member_ids: selectedMembers.map(m => m.id) });
      setShowCreate(false);
      setName('');
      setDescription('');
      setSelectedMembers([]);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-surface-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-teal-500" /> Groups
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your expense groups</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> New Group
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-500" /> Create Group
              </h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Group Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g., Weekend Trip Gang 🏖️" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="What's this group about?" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Add Members</label>
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
                  <div className="mt-2 border border-gray-200 dark:border-surface-600 rounded-xl bg-white dark:bg-surface-800 shadow-xl max-h-40 overflow-y-auto">
                    {searchResults.map(u => (
                      <button key={u.id} type="button" onClick={() => addMember(u)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-surface-700 text-sm flex items-center gap-3 transition-colors">
                        <div className={`avatar-sm bg-gradient-to-br ${getGrad(u.name)}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">{u.name}</span>
                          <p className="text-xs text-gray-500 dark:text-surface-400">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedMembers.map(m => (
                      <span key={m.id} className="inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-full text-sm font-medium">
                        {m.name}
                        <button type="button" onClick={() => removeMember(m.id)} className="hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/8 dark:bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-teal-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No groups yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">Create a group to start splitting expenses with your squad!</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-5 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g, i) => (
            <Link key={g.id} to={`/groups/${g.id}`} className="card group hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGrad(g.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">{g.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-teal">{g.member_count} members</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>
              {g.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 truncate pl-[4.5rem]">{g.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
