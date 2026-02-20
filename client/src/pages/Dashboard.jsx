import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Users, Receipt,
  PlusCircle, UserPlus, BarChart3, Calendar, ArrowUpRight, ArrowDownRight,
  LayoutDashboard, PieChart, Target, Flame, CreditCard, DollarSign,
  Zap, Sparkles, Brain, ChevronRight, Eye, Send, CheckCircle2,
  UserCheck, Wand2, MessageSquare, Lightbulb, Trophy, Rocket
} from 'lucide-react';
import Reveal from '../components/Reveal';

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

const CAT_HEX = {
  Food: '#f59e0b', Rent: '#6366f1', Transport: '#06b6d4', Entertainment: '#8b5cf6',
  Groceries: '#10b981', Travel: '#0ea5e9', Utilities: '#eab308', Other: '#94a3b8',
};

const CAT_EMOJIS = {
  Food: '🍕', Rent: '🏠', Transport: '🚗', Entertainment: '🎬',
  Groceries: '🛒', Travel: '✈️', Utilities: '💡', Other: '🎁',
};

function getGrad(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  if (h < 21) return { text: 'Good evening', emoji: '🌅' };
  return { text: 'Night owl mode', emoji: '🌙' };
}

/* ── SVG Donut Chart for categories ────────────── */
function CategoryDonut({ categories, formatAmount }) {
  if (!categories || categories.length === 0) return null;
  const total = categories.reduce((s, c) => s + c.amount, 0);
  let cumulative = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {categories.map((cat, i) => {
            const pct = total > 0 ? (cat.amount / total) * 100 : 0;
            const offset = cumulative;
            cumulative += pct;
            return (
              <circle
                key={cat.category}
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke={CAT_HEX[cat.category] || CAT_HEX.Other}
                strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-base font-extrabold text-gray-900 dark:text-white">{formatAmount(total)}</p>
          <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">total</p>
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {categories.slice(0, 5).map((cat) => {
          const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
          return (
            <div key={cat.category} className="flex items-center gap-2">
              <span className="text-sm">{CAT_EMOJIS[cat.category] || '🎁'}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{cat.category}</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mr-1">{pct}%</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{formatAmount(cat.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Pro tips that rotate ──────────────────────── */
const PRO_TIPS = [
  { emoji: '🧠', tip: 'Type "pizza 500 with Rahul" in Smart Add — AI parses it instantly!' },
  { emoji: '👥', tip: 'Create a group for your flat, trip crew, or office lunch gang.' },
  { emoji: '📊', tip: 'Check Monthly Tracker to see where your money goes each month.' },
  { emoji: '🔒', tip: 'Only friends can find you — your data stays private.' },
  { emoji: '⚡', tip: 'Smart Add auto-detects categories: "uber" → 🚗, "biryani" → 🍕' },
  { emoji: '🤝', tip: 'Settle up easily — tap on any balance to clear debts.' },
  { emoji: '📱', tip: 'Install SplitKaro as an app — works offline too!' },
  { emoji: '💡', tip: 'Mention multiple friends: "dinner 900 with Priya and Amit" → 3-way split.' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [balances, setBalances] = useState(null);
  const [groups, setGroups] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [tipIndex] = useState(() => Math.floor(Math.random() * PRO_TIPS.length));

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickText.trim() || quickLoading) return;
    setQuickLoading(true);
    setQuickResult(null);
    try {
      const res = await api.post('/expenses/quick', { text: quickText });
      setQuickResult({ success: true, data: res.data });
      setQuickText('');
      // Refresh expenses
      const expRes = await api.get('/expenses');
      setRecentExpenses(expRes.data.slice(0, 8));
      const balRes = await api.get('/balances');
      setBalances(balRes.data);
      setTimeout(() => setQuickResult(null), 4000);
    } catch (err) {
      setQuickResult({ success: false, error: err.response?.data?.error || 'Something went wrong' });
      setTimeout(() => setQuickResult(null), 3000);
    } finally {
      setQuickLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/balances'),
      api.get('/groups'),
      api.get('/expenses'),
      api.get('/expenses/monthly'),
    ]).then(([balRes, grpRes, expRes, monthRes]) => {
      setBalances(balRes.data);
      setGroups(grpRes.data.slice(0, 5));
      setRecentExpenses(expRes.data.slice(0, 8));
      setMonthlyData(monthRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center animate-fade-in">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-teal-100 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Loading your dashboard...</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Crunching numbers 🧮</p>
        </div>
      </div>
    );
  }

  const net = balances?.net_balance || 0;
  const greeting = getTimeGreeting();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, emoji: '📊' },
    { id: 'tracker', label: 'Monthly Tracker', icon: Calendar, emoji: '📅' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ───── Header ───── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{greeting.emoji}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {greeting.text}, <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Here's what's happening with your money today
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/add-expense" className="btn-primary flex items-center gap-2 text-sm py-2.5 group">
            <Zap className="w-4 h-4" /> Smart Add
            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">AI</span>
          </Link>
          <Link to="/friends" className="btn-secondary flex items-center gap-2 text-sm py-2.5">
            <UserPlus className="w-4 h-4" /> Add Friend
          </Link>
        </div>
      </div>

      {/* ───── Tab Navigation ───── */}
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
              <span className="text-sm">{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards — 4-column */}
          <Reveal stagger className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Owed to you */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-4 sm:p-5 group hover:shadow-xl hover:shadow-teal-500/20 transition-all">
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">💰</div>
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Owed to you</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-1">{formatAmount(balances?.total_owed_to_you || 0)}</p>
            </div>

            {/* You owe */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white p-4 sm:p-5 group hover:shadow-xl hover:shadow-rose-500/20 transition-all">
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">💸</div>
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">You owe</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-1">{formatAmount(balances?.total_you_owe || 0)}</p>
            </div>

            {/* Net balance */}
            <div className={`relative overflow-hidden rounded-3xl text-white p-4 sm:p-5 group hover:shadow-xl transition-all ${
              net >= 0
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:shadow-blue-500/20'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:shadow-amber-500/20'
            }`}>
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">{net >= 0 ? '🎉' : '😅'}</div>
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Net balance</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-1">{net >= 0 ? '+' : ''}{formatAmount(net)}</p>
            </div>

            {/* Active groups */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white p-4 sm:p-5 group hover:shadow-xl hover:shadow-violet-500/20 transition-all">
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">👥</div>
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Active groups</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-1">{groups.length}</p>
            </div>
          </Reveal>

          {/* ───── Inline Smart Add Bar ───── */}
          <Reveal animation="fade-up">
          <div className="rounded-3xl bg-gradient-to-r from-violet-500/[0.06] via-fuchsia-500/[0.04] to-violet-500/[0.06] dark:from-violet-500/[0.08] dark:via-fuchsia-500/[0.05] dark:to-violet-500/[0.08] border border-violet-200/30 dark:border-violet-500/10 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-extrabold text-gray-900 dark:text-white">Quick Smart Add</span>
              <span className="text-[9px] bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">AI</span>
            </div>
            <form onSubmit={handleQuickAdd} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  value={quickText}
                  onChange={e => setQuickText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 font-medium transition-all"
                  placeholder='Try "dinner 500 with Rahul" or "uber 250"'
                  disabled={quickLoading}
                />
              </div>
              <button
                type="submit"
                disabled={quickLoading || !quickText.trim()}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all ${
                  quickText.trim()
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500'
                }`}
              >
                {quickLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Add
              </button>
            </form>
            {/* Quick result feedback */}
            {quickResult && (
              <div className={`mt-3 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 animate-slide-up ${
                quickResult.success
                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200/50 dark:border-teal-500/20'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-500/20'
              }`}>
                {quickResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Added <strong>{quickResult.data.description}</strong> — {formatAmount(quickResult.data.amount)}
                  </>
                ) : (
                  <>⚠️ {quickResult.error}</>
                )}
              </div>
            )}
          </div>
          </Reveal>

          {/* ───── Getting Started (for new users) ───── */}
          {groups.length === 0 && recentExpenses.length < 3 && (
            <Reveal animation="fade-up"><div className="rounded-3xl bg-gradient-to-br from-teal-500/[0.05] via-emerald-500/[0.03] to-cyan-500/[0.05] dark:from-teal-500/[0.08] dark:via-emerald-500/[0.04] dark:to-cyan-500/[0.08] border border-teal-200/30 dark:border-teal-500/10 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚀</span>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Get Started with SplitKaro</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    done: recentExpenses.length > 0,
                    icon: Zap, emoji: '⚡', title: 'Add your first expense',
                    desc: 'Use the Smart Add bar above — just type naturally!',
                    action: null, gradient: 'from-violet-500 to-fuchsia-500',
                  },
                  {
                    done: false,
                    icon: UserPlus, emoji: '🤝', title: 'Add a friend',
                    desc: 'Search by email and start splitting together.',
                    action: '/friends', gradient: 'from-teal-500 to-emerald-500',
                  },
                  {
                    done: groups.length > 0,
                    icon: Users, emoji: '👥', title: 'Create a group',
                    desc: 'For your flat, trip, or squad expenses.',
                    action: '/groups', gradient: 'from-amber-500 to-orange-500',
                  },
                ].map((step) => {
                  const Icon = step.icon;
                  const content = (
                    <div className={`group flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/5 transition-all ${step.action ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''} ${step.done ? 'opacity-60' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-md shrink-0 ${step.done ? '' : 'group-hover:scale-110 group-hover:rotate-3'} transition-all`}>
                        {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {step.title} <span className="text-sm">{step.emoji}</span>
                          {step.done && <span className="text-[9px] bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full font-bold">DONE</span>}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                  return step.action ? <Link key={step.title} to={step.action}>{content}</Link> : <div key={step.title}>{content}</div>;
                })}
              </div>
            </div></Reveal>
          )}

          {/* ───── Balances ───── */}
          {balances?.balances?.length > 0 && (
            <Reveal animation="fade-up"><div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
                  <span className="text-xl">⚖️</span> Who owes who
                </h2>
                <span className="text-[10px] font-bold bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {balances.balances.length} people
                </span>
              </div>
              <div className="space-y-2">
                {balances.balances.map((b) => {
                  const isPositive = b.amount > 0;
                  const absAmount = Math.abs(b.amount);
                  const maxAmount = Math.max(...balances.balances.map(x => Math.abs(x.amount)));
                  const barWidth = maxAmount > 0 ? (absAmount / maxAmount) * 100 : 0;
                  return (
                    <div key={b.user_id} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGrad(b.user_name)} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                        {b.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">{b.user_name}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                              {isPositive ? 'owes you' : 'you owe'}
                            </span>
                          </div>
                          <span className={`font-bold text-sm flex items-center gap-1 ${isPositive ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {formatAmount(absAmount)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-black/[0.04] dark:bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isPositive ? 'bg-gradient-to-r from-teal-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-red-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div></Reveal>
          )}

          {/* ───── Pro Tip Banner ───── */}
          <Reveal animation="fade-left">
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/[0.06] dark:to-orange-500/[0.06] border border-amber-200/40 dark:border-amber-500/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Pro Tip {PRO_TIPS[tipIndex].emoji}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{PRO_TIPS[tipIndex].tip}</p>
            </div>
          </div>
          </Reveal>

          {/* ───── Groups + Recent Expenses ───── */}
          <Reveal stagger className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Groups */}
            <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-lg">🏘️</span> Your Squad
                </h2>
                <Link to="/groups" className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-0.5 font-bold">
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {groups.length === 0 ? (
                <div className="py-6">
                  <div className="text-center mb-5">
                    <div className="flex justify-center gap-2 mb-3">
                      {['🏠', '✈️', '🍕'].map((e, i) => (
                        <div key={e} className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${['from-teal-500 to-emerald-500', 'from-violet-500 to-purple-500', 'from-amber-500 to-orange-500'][i]} flex items-center justify-center text-xl shadow-lg animate-float-y`} style={{ animationDelay: `${i * 0.3}s` }}>
                          {e}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Create your first group!</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] mx-auto">For your flat, trip crew, office lunch gang, or anything</p>
                  </div>
                  <Link to="/groups" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all">
                    <Users className="w-4 h-4" /> Create Group
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {groups.map((g) => (
                    <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGrad(g.name)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                        {g.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{g.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{g.member_count} members</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Expenses */}
            <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-lg">⚡</span> Recent Expenses
                </h2>
                <Link to="/activity" className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-0.5 font-bold">
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {recentExpenses.length === 0 ? (
                <div className="py-6">
                  <div className="text-center mb-5">
                    <div className="relative w-16 h-16 mx-auto mb-3">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg animate-float-y">
                        <Brain className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">No expenses yet!</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[220px] mx-auto">Use the Smart Add bar above to add your first expense with AI</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Try these:</p>
                    {['"coffee 200"', '"uber home 350"', '"lunch 500 with Amit"'].map((example) => (
                      <button
                        key={example}
                        onClick={() => setQuickText(example.replace(/"/g, ''))}
                        className="w-full text-left px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-xs font-mono text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-500/15 transition-all cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 inline mr-1.5 text-violet-500" />{example}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentExpenses.map((exp) => {
                    const descEmoji = exp.description?.match(/^([\u{1F300}-\u{1FAD6}]|[\u{2600}-\u{27BF}])/u)?.[1] || '💳';
                    return (
                      <div key={exp.id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all">
                        <span className="text-xl w-8 text-center shrink-0">{descEmoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{exp.description?.replace(/^[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}]\s*/u, '')}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            {exp.paid_by === user.id ? '🫵 You paid' : `${exp.paid_by_name} paid`}
                          </p>
                        </div>
                        <span className="font-extrabold text-gray-900 dark:text-white text-sm whitespace-nowrap">{formatAmount(exp.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Reveal>

          {/* ───── Quick Actions Grid ───── */}
          <Reveal stagger className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/add-expense', icon: Brain, emoji: '🧠', label: 'Smart Add', desc: 'AI expense entry', gradient: 'from-violet-500 to-fuchsia-500', shadow: 'shadow-violet-500/20' },
              { to: '/groups', icon: Users, emoji: '👥', label: 'Groups', desc: 'Manage squads', gradient: 'from-teal-500 to-emerald-500', shadow: 'shadow-teal-500/20' },
              { to: '/friends', icon: UserPlus, emoji: '🤝', label: 'Friends', desc: 'Add people', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
              { to: '/activity', icon: Eye, emoji: '⚡', label: 'Activity', desc: 'Recent history', gradient: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/20' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-4 hover:shadow-xl ${item.shadow} transition-all hover:-translate-y-1`}>
                  <div className="absolute top-2 right-2 text-2xl opacity-10 group-hover:opacity-20 transition-opacity">{item.emoji}</div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg ${item.shadow} mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{item.desc}</p>
                </Link>
              );
            })}
          </Reveal>

          {/* ───── How Smart Add Works ───── */}
          <Reveal animation="scale">
          <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-white/[0.02] dark:to-white/[0.01] border border-black/5 dark:border-white/5 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🤖</span>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">How Smart Add Works</h2>
              <span className="text-[9px] bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-2 py-0.5 rounded-full font-bold">AI</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { input: '"dinner 500 with Rahul"', output: '🍕 Dinner — ₹250 each', tag: 'Auto-split' },
                { input: '"uber to office 250"', output: '🚗 Uber — personal expense', tag: 'Auto-categorize' },
                { input: '"movie 900 with Priya, Amit"', output: '🎬 Movie — ₹300 each', tag: '3-way split' },
              ].map((ex) => (
                <button
                  key={ex.input}
                  onClick={() => setQuickText(ex.input.replace(/"/g, ''))}
                  className="text-left p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/15 hover:shadow-md transition-all group cursor-pointer"
                >
                  <p className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 mb-1.5 group-hover:text-violet-700 dark:group-hover:text-violet-300">{ex.input}</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">{ex.output}</p>
                  <span className="inline-block mt-2 text-[9px] font-bold bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">{ex.tag}</span>
                </button>
              ))}
            </div>
          </div>
          </Reveal>

          {/* ───── Spending Snapshot / Fun Stats ───── */}
          <Reveal animation="fade-up">
          <div className="rounded-3xl bg-gradient-to-br from-teal-500/[0.04] via-emerald-500/[0.02] to-cyan-500/[0.04] dark:from-teal-500/[0.06] dark:via-emerald-500/[0.03] dark:to-cyan-500/[0.06] border border-teal-200/20 dark:border-teal-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📊</span>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Spending Snapshot</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  emoji: '🧾',
                  label: 'Total Expenses',
                  value: recentExpenses.length,
                  sub: 'all time',
                  color: 'text-teal-600 dark:text-teal-400',
                },
                {
                  emoji: '👥',
                  label: 'Active Groups',
                  value: groups.length,
                  sub: 'squads',
                  color: 'text-violet-600 dark:text-violet-400',
                },
                {
                  emoji: '💰',
                  label: 'Total Owed',
                  value: formatAmount(balances?.total_owed_to_you || 0),
                  sub: 'to you',
                  color: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  emoji: '🏆',
                  label: 'Top Category',
                  value: monthlyData?.categories?.[0]?.category || '—',
                  sub: monthlyData?.categories?.[0] ? formatAmount(monthlyData.categories[0].amount) : 'no data',
                  color: 'text-amber-600 dark:text-amber-400',
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/5 p-4 text-center hover:shadow-md transition-all group">
                  <span className="text-2xl block mb-1.5 group-hover:scale-110 transition-transform">{stat.emoji}</span>
                  <p className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
          </Reveal>

          {/* ───── Feature Highlights ───── */}
          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                emoji: '🔒',
                title: 'Privacy First',
                desc: 'Only friends can find you. Your data stays yours. No sneaky tracking.',
                gradient: 'from-rose-500/[0.06] to-pink-500/[0.06] dark:from-rose-500/[0.08] dark:to-pink-500/[0.08]',
                border: 'border-rose-200/30 dark:border-rose-500/10',
              },
              {
                emoji: '📱',
                title: 'Works Offline',
                desc: 'Install as an app. Add expenses offline — they sync automatically when you\'re back.',
                gradient: 'from-blue-500/[0.06] to-indigo-500/[0.06] dark:from-blue-500/[0.08] dark:to-indigo-500/[0.08]',
                border: 'border-blue-200/30 dark:border-blue-500/10',
              },
              {
                emoji: '⚡',
                title: 'Lightning Fast',
                desc: 'Type naturally, AI does the rest. No forms, no dropdowns, no hassle.',
                gradient: 'from-amber-500/[0.06] to-orange-500/[0.06] dark:from-amber-500/[0.08] dark:to-orange-500/[0.08]',
                border: 'border-amber-200/30 dark:border-amber-500/10',
              },
            ].map((f) => (
              <div key={f.title} className={`rounded-2xl bg-gradient-to-br ${f.gradient} border ${f.border} p-5 group hover:shadow-md transition-all`}>
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">{f.emoji}</span>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </Reveal>
        </div>
      )}

      {/* ========== MONTHLY TRACKER TAB ========== */}
      {activeTab === 'tracker' && monthlyData && (
        <div className="space-y-6">
          {/* Hero Stats Row */}
          <Reveal stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-4 sm:p-5 group hover:shadow-xl hover:shadow-teal-500/20 transition-all">
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">💳</div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                {monthlyData.current_month.change_percent !== 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                    {monthlyData.current_month.change_percent > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(monthlyData.current_month.change_percent)}%
                  </span>
                )}
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Total Spent</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-0.5">{formatAmount(monthlyData.current_month.total_paid)}</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white p-4 sm:p-5 group hover:shadow-xl hover:shadow-violet-500/20 transition-all">
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">🧾</div>
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Your Share</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-0.5">{formatAmount(monthlyData.current_month.your_share)}</p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 sm:p-5 group hover:shadow-xl hover:shadow-amber-500/20 transition-all">
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">🔥</div>
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
                <Flame className="w-4 h-4" />
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Daily Average</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
                {formatAmount(monthlyData.current_month.total_paid / Math.max(new Date().getDate(), 1))}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-4 sm:p-5 group hover:shadow-xl hover:shadow-cyan-500/20 transition-all">
              <div className="absolute top-2 right-2 text-3xl opacity-15 group-hover:opacity-25 transition-opacity">📝</div>
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-2">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Transactions</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-0.5">{monthlyData.current_month.expense_count}</p>
            </div>
          </Reveal>

          {/* Spending Trend Chart */}
          <Reveal animation="fade-up">
          <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-lg">📈</span> 12-Month Spending Trend
              </h2>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-teal-500/25 inline-block"></span> Paid</span>
                <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 inline-block"></span> Your Share</span>
              </div>
            </div>

            {/* Dual Bar Chart */}
            <div className="flex items-end gap-1.5 sm:gap-2 h-40 sm:h-48 mb-2">
              {(() => {
                const maxVal = Math.max(...monthlyData.monthly.map(m => Math.max(m.total_paid, m.your_share)), 1);
                const currentMonth = monthlyData.current_month.month;
                return monthlyData.monthly.map((m, idx) => {
                  const paidH = (m.total_paid / maxVal) * 100;
                  const shareH = (m.your_share / maxVal) * 100;
                  const isCurrent = m.month === currentMonth;
                  const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' });
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap shadow-xl space-y-0.5">
                          <div>💳 Paid: {formatAmount(m.total_paid)}</div>
                          <div>🧾 Share: {formatAmount(m.your_share)}</div>
                        </div>
                      </div>
                      <div className="w-full flex gap-[2px] items-end" style={{ height: '100%' }}>
                        <div
                          className={`flex-1 rounded-t-lg chart-bar transition-all ${
                            isCurrent ? 'bg-teal-500/30 dark:bg-teal-500/20' : 'bg-gray-200/80 dark:bg-white/[0.06] group-hover:bg-teal-500/15'
                          }`}
                          style={{ height: `${Math.max(paidH, 3)}%`, minHeight: '3px', animationDelay: `${idx * 0.05}s` }}
                        />
                        <div
                          className={`flex-1 rounded-t-lg chart-bar transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-t from-violet-500 to-fuchsia-400 shadow-md shadow-violet-500/20'
                              : m.your_share > 0
                                ? 'bg-violet-500/30 dark:bg-violet-500/20 group-hover:bg-violet-500/40'
                                : 'bg-black/[0.03] dark:bg-white/[0.03]'
                          }`}
                          style={{ height: `${Math.max(shareH, 3)}%`, minHeight: '3px', animationDelay: `${idx * 0.05 + 0.03}s` }}
                        />
                      </div>
                      <span className={`text-[8px] sm:text-[9px] font-semibold ${
                        isCurrent ? 'text-violet-600 dark:text-violet-400 font-extrabold' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {monthLabel}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          </Reveal>

          {/* Bottom Grid: Share Breakdown + Category Donut */}
          <Reveal stagger className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Your Share Analysis */}
            <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-5 sm:p-6">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                <span className="text-lg">💰</span> Share Breakdown
              </h2>
              <div className="space-y-3">
                {/* What you owe */}
                <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-500/[0.06] dark:to-emerald-500/[0.06] border border-teal-200/30 dark:border-teal-500/10 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Your share this month</span>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/15 px-2 py-0.5 rounded-full">
                      {monthlyData.current_month.total_paid > 0
                        ? Math.round((monthlyData.current_month.your_share / monthlyData.current_month.total_paid) * 100)
                        : 0}% of total
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{formatAmount(monthlyData.current_month.your_share)}</p>
                  <div className="h-2 bg-black/[0.04] dark:bg-white/5 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-1000"
                      style={{ width: `${monthlyData.current_month.total_paid > 0 ? (monthlyData.current_month.your_share / monthlyData.current_month.total_paid) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* You saved */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/[0.06] dark:to-green-500/[0.06] border border-emerald-200/30 dark:border-emerald-500/10 p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">🎉</span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">You Saved</span>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatAmount(Math.max(monthlyData.current_month.total_paid - monthlyData.current_month.your_share, 0))}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Others are covering this — nice!</p>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-3.5 text-center">
                    <p className="text-sm mb-1">🔺</p>
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Peak Month</p>
                    <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                      {formatAmount(Math.max(...monthlyData.monthly.map(m => m.your_share)))}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-3.5 text-center">
                    <p className="text-sm mb-1">📊</p>
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">12-Mo Avg</p>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white">
                      {(() => {
                        const nonZero = monthlyData.monthly.filter(m => m.your_share > 0);
                        return formatAmount(nonZero.length > 0 ? nonZero.reduce((s, m) => s + m.your_share, 0) / nonZero.length : 0);
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown with Donut */}
            <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-lg">🍕</span> Where your money goes
                </h2>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  {new Date(monthlyData.current_month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {monthlyData.categories.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No expenses this month yet</p>
                  <Link to="/add-expense" className="text-teal-600 dark:text-teal-400 text-xs font-bold mt-1 inline-block hover:underline">Add an expense →</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* SVG Donut Chart */}
                  <CategoryDonut categories={monthlyData.categories} formatAmount={formatAmount} />

                  {/* Category bars */}
                  <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                    {(() => {
                      const maxCat = Math.max(...monthlyData.categories.map(c => c.amount), 1);
                      return monthlyData.categories.map((cat) => (
                        <div key={cat.category} className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${CAT_COLORS[cat.category] || CAT_COLORS.Other} flex items-center justify-center text-xs shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                            {CAT_EMOJIS[cat.category] || '🎁'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{cat.category}</span>
                              <span className="text-xs font-extrabold text-gray-900 dark:text-white">{formatAmount(cat.amount)}</span>
                            </div>
                            <div className="h-1 bg-black/[0.04] dark:bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${CAT_COLORS[cat.category] || CAT_COLORS.Other} transition-all duration-1000`}
                                style={{ width: `${(cat.amount / maxCat) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* Month-by-month detail table */}
          <Reveal animation="fade-up">
          <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-5 sm:p-6">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
              <span className="text-lg">📅</span> Month-by-Month Details
            </h2>
            <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <th className="text-left py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="text-right py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="text-right py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Your Share</th>
                    <th className="text-right py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Saved 🎉</th>
                    <th className="text-right py-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"># Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthlyData.monthly].reverse().map((m) => {
                    const isCurrent = m.month === monthlyData.current_month.month;
                    const saved = Math.max(m.total_paid - m.your_share, 0);
                    const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    return (
                      <tr key={m.month} className={`border-b border-black/[0.03] dark:border-white/[0.03] transition-colors ${
                        isCurrent ? 'bg-gradient-to-r from-teal-50/60 to-transparent dark:from-teal-500/[0.04]' : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
                      }`}>
                        <td className="py-3.5 font-bold text-gray-900 dark:text-white text-sm">
                          <div className="flex items-center gap-2">
                            {isCurrent && <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-sm shadow-teal-500/50"></span>}
                            {monthLabel}
                            {isCurrent && <span className="text-[9px] bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full font-bold">NOW</span>}
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-semibold text-gray-600 dark:text-gray-300 text-sm">{formatAmount(m.total_paid)}</td>
                        <td className="py-3.5 text-right font-extrabold text-teal-600 dark:text-teal-400 text-sm">{formatAmount(m.your_share)}</td>
                        <td className="py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{saved > 0 ? formatAmount(saved) : '—'}</td>
                        <td className="py-3.5 text-right text-gray-500 dark:text-gray-400 font-medium">{m.expense_count || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </Reveal>
        </div>
      )}
    </div>
  );
}
