import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Users, Receipt,
  PlusCircle, UserPlus, Zap, Sparkles
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-red-500 to-pink-500',
  'from-indigo-500 to-violet-500',
];

function getGrad(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [balances, setBalances] = useState(null);
  const [groups, setGroups] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/balances'),
      api.get('/groups'),
      api.get('/expenses'),
    ]).then(([balRes, grpRes, expRes]) => {
      setBalances(balRes.data);
      setGroups(grpRes.data.slice(0, 5));
      setRecentExpenses(expRes.data.slice(0, 5));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center animate-fade-in">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-surface-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const net = balances?.net_balance || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hey, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary-500" />
            Here's your expense vibe check
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/add-expense" className="btn-primary flex items-center gap-2 text-sm py-2">
            <PlusCircle className="w-4 h-4" /> Add Expense
          </Link>
          <Link to="/friends" className="btn-secondary flex items-center gap-2 text-sm py-2">
            <UserPlus className="w-4 h-4" /> Add Friend
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-gradient bg-gradient-to-br from-emerald-500 to-teal-600 text-white animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="badge bg-white/20 backdrop-blur-sm text-white text-[10px]">INCOMING 💰</span>
          </div>
          <p className="text-white/70 text-sm font-medium">Owed to you</p>
          <p className="text-3xl font-bold mt-1">{formatAmount(balances?.total_owed_to_you || 0)}</p>
        </div>

        <div className="card-gradient bg-gradient-to-br from-rose-500 to-pink-600 text-white animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="badge bg-white/20 backdrop-blur-sm text-white text-[10px]">OUTGOING 💸</span>
          </div>
          <p className="text-white/70 text-sm font-medium">You owe</p>
          <p className="text-3xl font-bold mt-1">{formatAmount(balances?.total_you_owe || 0)}</p>
        </div>

        <div className={`card-gradient text-white animate-slide-up stagger-2 ${
          net >= 0
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'bg-gradient-to-br from-amber-500 to-orange-600'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="badge bg-white/20 backdrop-blur-sm text-white text-[10px]">
              {net >= 0 ? 'WINNING 🏆' : 'BEHIND 😅'}
            </span>
          </div>
          <p className="text-white/70 text-sm font-medium">Net balance</p>
          <p className="text-3xl font-bold mt-1">{formatAmount(net)}</p>
        </div>
      </div>

      {/* Balances with people */}
      {balances?.balances?.length > 0 && (
        <div className="card animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Who owes who
            </h2>
            <span className="badge-blue">{balances.balances.length} people</span>
          </div>
          <div className="space-y-3">
            {balances.balances.map((b) => {
              const isPositive = b.amount > 0;
              const absAmount = Math.abs(b.amount);
              const maxAmount = Math.max(...balances.balances.map(x => Math.abs(x.amount)));
              const barWidth = maxAmount > 0 ? (absAmount / maxAmount) * 100 : 0;
              return (
                <div key={b.user_id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700/30 transition-all">
                  <div className={`avatar-sm bg-gradient-to-br ${getGrad(b.user_name)}`}>
                    {b.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{b.user_name}</span>
                      <span className={`font-bold text-sm ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isPositive ? '+' : '-'}{formatAmount(absAmount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isPositive ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-pink-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-surface-400 mt-1">
                      {isPositive ? 'owes you' : 'you owe them'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Groups */}
        <div className="card animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              👥 Your Groups
            </h2>
            <Link to="/groups" className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-primary-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No groups yet</p>
              <Link to="/groups" className="text-primary-500 text-sm font-medium mt-1 inline-block hover:underline">
                Create your first group →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700/30 transition-all group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGrad(g.name)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{g.name}</p>
                    <p className="text-xs text-gray-500 dark:text-surface-400">{g.member_count} members</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-surface-600 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              💸 Recent Expenses
            </h2>
            <Link to="/activity" className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-7 h-7 text-orange-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No expenses yet</p>
              <Link to="/add-expense" className="text-primary-500 text-sm font-medium mt-1 inline-block hover:underline">
                Add your first expense →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700/30 transition-all">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-md">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{exp.description}</p>
                      <p className="text-xs text-gray-500 dark:text-surface-400">
                        Paid by {exp.paid_by === user.id ? 'you' : exp.paid_by_name}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm ml-3 whitespace-nowrap">{formatAmount(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
