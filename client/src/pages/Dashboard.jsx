import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Users, Receipt,
  PlusCircle, UserPlus, BarChart3, Calendar, ArrowUpRight, ArrowDownRight,
  LayoutDashboard, PieChart, Target, Flame, CreditCard, DollarSign
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  'from-teal-500 to-emerald-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
  'from-emerald-500 to-green-500',
];

const CAT_COLORS = {
  Food: 'from-orange-400 to-amber-500',
  Rent: 'from-blue-400 to-indigo-500',
  Transport: 'from-cyan-400 to-blue-500',
  Entertainment: 'from-purple-400 to-violet-500',
  Groceries: 'from-green-400 to-emerald-500',
  Travel: 'from-sky-400 to-cyan-500',
  Utilities: 'from-yellow-400 to-amber-500',
  Other: 'from-gray-400 to-slate-500',
};

const CAT_EMOJIS = {
  Food: '🍕', Rent: '🏠', Transport: '🚗', Entertainment: '🎬',
  Groceries: '🛒', Travel: '✈️', Utilities: '💡', Other: '🎁',
};

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
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/balances'),
      api.get('/groups'),
      api.get('/expenses'),
      api.get('/expenses/monthly'),
    ]).then(([balRes, grpRes, expRes, monthRes]) => {
      setBalances(balRes.data);
      setGroups(grpRes.data.slice(0, 5));
      setRecentExpenses(expRes.data.slice(0, 5));
      setMonthlyData(monthRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center animate-fade-in">
          <div className="relative w-12 h-12 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full border-4 border-teal-100 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 animate-spin"></div>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const net = balances?.net_balance || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tracker', label: 'Monthly Tracker', icon: Calendar },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Here's your expense overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/add-expense" className="btn-primary flex items-center gap-2 text-sm py-2.5">
            <PlusCircle className="w-4 h-4" /> Add Expense
          </Link>
          <Link to="/friends" className="btn-secondary flex items-center gap-2 text-sm py-2.5">
            <UserPlus className="w-4 h-4" /> Add Friend
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-black/4 dark:bg-white/5 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-gradient bg-gradient-to-br from-teal-500 to-emerald-600 text-white animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Owed to you</span>
              </div>
              <p className="text-white/60 text-sm font-medium">You are owed</p>
              <p className="text-3xl font-bold mt-1">{formatAmount(balances?.total_owed_to_you || 0)}</p>
            </div>

            <div className="card-gradient bg-gradient-to-br from-rose-500 to-red-600 text-white animate-slide-up stagger-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">You owe</span>
              </div>
              <p className="text-white/60 text-sm font-medium">Total you owe</p>
              <p className="text-3xl font-bold mt-1">{formatAmount(balances?.total_you_owe || 0)}</p>
            </div>

            <div className={`card-gradient text-white animate-slide-up stagger-2 ${
              net >= 0
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                : 'bg-gradient-to-br from-amber-500 to-orange-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Net</span>
              </div>
              <p className="text-white/60 text-sm font-medium">Net balance</p>
              <p className="text-3xl font-bold mt-1">{formatAmount(net)}</p>
            </div>
          </div>

          {/* Balances */}
          {balances?.balances?.length > 0 && (
            <div className="card animate-slide-up stagger-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-teal-500" /> Balances
                </h2>
                <span className="badge-teal">{balances.balances.length} people</span>
              </div>
              <div className="space-y-3">
                {balances.balances.map((b) => {
                  const isPositive = b.amount > 0;
                  const absAmount = Math.abs(b.amount);
                  const maxAmount = Math.max(...balances.balances.map(x => Math.abs(x.amount)));
                  const barWidth = maxAmount > 0 ? (absAmount / maxAmount) * 100 : 0;
                  return (
                    <div key={b.user_id} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-black/3 dark:hover:bg-white/3 transition-all">
                      <div className={`avatar-sm bg-gradient-to-br ${getGrad(b.user_name)}`}>
                        {b.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{b.user_name}</span>
                          <span className={`font-bold text-sm ${isPositive ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isPositive ? '+' : '-'}{formatAmount(absAmount)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isPositive ? 'bg-gradient-to-r from-teal-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-red-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                          {isPositive ? 'owes you' : 'you owe them'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Groups + Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card animate-slide-up stagger-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-teal-500" /> Your Groups
                </h2>
                <Link to="/groups" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 font-medium">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/8 dark:bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-7 h-7 text-teal-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No groups yet</p>
                  <Link to="/groups" className="text-teal-600 dark:text-teal-400 text-sm font-medium mt-1 inline-block hover:underline">Create your first group</Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {groups.map((g) => (
                    <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-black/3 dark:hover:bg-white/3 transition-all group">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGrad(g.name)} flex items-center justify-center text-white font-bold text-sm`}>
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{g.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{g.member_count} members</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card animate-slide-up stagger-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-teal-500" /> Recent Expenses
                </h2>
                <Link to="/activity" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 font-medium">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {recentExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/8 dark:bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-7 h-7 text-orange-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No expenses yet</p>
                  <Link to="/add-expense" className="text-teal-600 dark:text-teal-400 text-sm font-medium mt-1 inline-block hover:underline">Add your first expense</Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentExpenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-black/3 dark:hover:bg-white/3 transition-all">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{exp.description}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
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
      )}

      {/* ========== MONTHLY TRACKER TAB ========== */}
      {activeTab === 'tracker' && monthlyData && (
        <div className="space-y-6 animate-fade-in">
          {/* Hero Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-gradient bg-gradient-to-br from-teal-500 to-emerald-600 text-white animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                {monthlyData.current_month.change_percent !== 0 && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    monthlyData.current_month.change_percent > 0 ? 'bg-white/20' : 'bg-white/20'
                  }`}>
                    {monthlyData.current_month.change_percent > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(monthlyData.current_month.change_percent)}%
                  </span>
                )}
              </div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Spent</p>
              <p className="text-2xl font-bold mt-0.5">{formatAmount(monthlyData.current_month.total_paid)}</p>
            </div>

            <div className="card-gradient bg-gradient-to-br from-violet-500 to-purple-600 text-white animate-slide-up stagger-1">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Your Share</p>
              <p className="text-2xl font-bold mt-0.5">{formatAmount(monthlyData.current_month.your_share)}</p>
            </div>

            <div className="card-gradient bg-gradient-to-br from-amber-500 to-orange-600 text-white animate-slide-up stagger-2">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
                <Flame className="w-4.5 h-4.5" />
              </div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Daily Average</p>
              <p className="text-2xl font-bold mt-0.5">
                {formatAmount(monthlyData.current_month.total_paid / Math.max(new Date().getDate(), 1))}
              </p>
            </div>

            <div className="card-gradient bg-gradient-to-br from-cyan-500 to-blue-600 text-white animate-slide-up stagger-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
                <Target className="w-4.5 h-4.5" />
              </div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Transactions</p>
              <p className="text-2xl font-bold mt-0.5">{monthlyData.current_month.expense_count}</p>
            </div>
          </div>

          {/* Spending Trend Chart */}
          <div className="card animate-slide-up stagger-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-teal-500" /> 12-Month Spending Trend
              </h2>
              <div className="flex items-center gap-4 text-[11px] font-medium">
                <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500/25 inline-block"></span> Paid</span>
                <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-teal-500 to-emerald-400 inline-block"></span> Your Share</span>
              </div>
            </div>

            {/* Dual Bar Chart */}
            <div className="flex items-end gap-2 h-44 mb-2">
              {(() => {
                const maxVal = Math.max(...monthlyData.monthly.map(m => Math.max(m.total_paid, m.your_share)), 1);
                const currentMonth = monthlyData.current_month.month;
                return monthlyData.monthly.map((m) => {
                  const paidH = (m.total_paid / maxVal) * 100;
                  const shareH = (m.your_share / maxVal) * 100;
                  const isCurrent = m.month === currentMonth;
                  const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' });
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg space-y-0.5">
                          <div>Paid: {formatAmount(m.total_paid)}</div>
                          <div>Share: {formatAmount(m.your_share)}</div>
                        </div>
                      </div>
                      <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
                        <div
                          className={`flex-1 rounded-t transition-all duration-500 ${
                            isCurrent ? 'bg-teal-500/30 dark:bg-teal-500/20' : 'bg-teal-500/12 dark:bg-teal-500/8 hover:bg-teal-500/20'
                          }`}
                          style={{ height: `${Math.max(paidH, 2)}%`, minHeight: '2px' }}
                        />
                        <div
                          className={`flex-1 rounded-t transition-all duration-500 ${
                            isCurrent
                              ? 'bg-gradient-to-t from-teal-500 to-emerald-400 shadow-sm shadow-teal-500/25'
                              : m.your_share > 0
                                ? 'bg-teal-500/40 dark:bg-teal-500/30 hover:bg-teal-500/50'
                                : 'bg-black/4 dark:bg-white/4'
                          }`}
                          style={{ height: `${Math.max(shareH, 2)}%`, minHeight: '2px' }}
                        />
                      </div>
                      <span className={`text-[9px] font-medium ${
                        isCurrent ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {monthLabel}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Bottom Grid: Your Share + Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Share Analysis */}
            <div className="card animate-slide-up stagger-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 mb-5">
                <Wallet className="w-5 h-5 text-teal-500" /> Share Breakdown
              </h2>
              <div className="space-y-4">
                <div className="glass-inner rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">What You Owe</span>
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                      {monthlyData.current_month.total_paid > 0
                        ? Math.round((monthlyData.current_month.your_share / monthlyData.current_month.total_paid) * 100)
                        : 0}% of total
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatAmount(monthlyData.current_month.your_share)}</p>
                  <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700"
                      style={{ width: `${monthlyData.current_month.total_paid > 0 ? (monthlyData.current_month.your_share / monthlyData.current_month.total_paid) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="glass-inner rounded-2xl p-4">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">You Saved</span>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatAmount(Math.max(monthlyData.current_month.total_paid - monthlyData.current_month.your_share, 0))}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Others are covering this portion</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-inner rounded-2xl p-3.5 text-center">
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Highest Month</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatAmount(Math.max(...monthlyData.monthly.map(m => m.your_share)))}
                    </p>
                  </div>
                  <div className="glass-inner rounded-2xl p-3.5 text-center">
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">12-Mo Avg</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {(() => {
                        const nonZero = monthlyData.monthly.filter(m => m.your_share > 0);
                        return formatAmount(nonZero.length > 0 ? nonZero.reduce((s, m) => s + m.your_share, 0) / nonZero.length : 0);
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="card animate-slide-up stagger-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                  <PieChart className="w-5 h-5 text-teal-500" /> By Category
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {new Date(monthlyData.current_month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {monthlyData.categories.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/8 dark:bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
                    <PieChart className="w-7 h-7 text-teal-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No expenses this month yet</p>
                  <Link to="/add-expense" className="text-teal-600 dark:text-teal-400 text-sm font-medium mt-1 inline-block hover:underline">Add an expense</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Visual category circles */}
                  <div className="flex justify-center gap-3 mb-4 flex-wrap">
                    {monthlyData.categories.map((cat) => {
                      const total = monthlyData.categories.reduce((s, c) => s + c.amount, 0);
                      const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
                      return (
                        <div key={cat.category} className="flex flex-col items-center gap-1.5">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${CAT_COLORS[cat.category] || CAT_COLORS.Other} flex items-center justify-center text-xl shadow-lg`}>
                            {CAT_EMOJIS[cat.category] || '🎁'}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Category bars */}
                  {(() => {
                    const maxCat = Math.max(...monthlyData.categories.map(c => c.amount), 1);
                    return monthlyData.categories.map((cat) => (
                      <div key={cat.category} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/2 dark:hover:bg-white/2 transition-all">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${CAT_COLORS[cat.category] || CAT_COLORS.Other} flex items-center justify-center text-sm shrink-0 shadow-sm`}>
                          {CAT_EMOJIS[cat.category] || '🎁'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{cat.category}</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{formatAmount(cat.amount)}</span>
                          </div>
                          <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${CAT_COLORS[cat.category] || CAT_COLORS.Other} transition-all duration-700`}
                              style={{ width: `${(cat.amount / maxCat) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Month-by-month detail table */}
          <div className="card animate-slide-up stagger-7">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5 mb-5">
              <Calendar className="w-5 h-5 text-teal-500" /> Month-by-Month Details
            </h2>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <th className="text-left py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="text-right py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="text-right py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Your Share</th>
                    <th className="text-right py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Saved</th>
                    <th className="text-right py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"># Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthlyData.monthly].reverse().map((m) => {
                    const isCurrent = m.month === monthlyData.current_month.month;
                    const saved = Math.max(m.total_paid - m.your_share, 0);
                    const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    return (
                      <tr key={m.month} className={`border-b border-black/3 dark:border-white/3 transition-colors ${
                        isCurrent ? 'bg-teal-50/50 dark:bg-teal-500/5' : 'hover:bg-black/2 dark:hover:bg-white/2'
                      }`}>
                        <td className="py-3 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>}
                          {monthLabel}
                        </td>
                        <td className="py-3 text-right font-medium text-gray-700 dark:text-gray-300">{formatAmount(m.total_paid)}</td>
                        <td className="py-3 text-right font-bold text-teal-600 dark:text-teal-400">{formatAmount(m.your_share)}</td>
                        <td className="py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{saved > 0 ? formatAmount(saved) : '—'}</td>
                        <td className="py-3 text-right text-gray-500 dark:text-gray-400">{m.expense_count || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
