import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Wallet, ArrowRight, Users, Shield, Zap, Globe, Sparkles,
  Sun, Moon, CheckCircle2, Star, Brain, Bot, Wand2, MessageSquare,
  TrendingUp, PieChart, BarChart3, ArrowLeftRight, Eye, Lock,
  Smartphone, Download, ChevronRight
} from 'lucide-react';

/* ── Animated counter hook ─────────────────────── */
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return [count, ref];
}

/* ── Typing animation component ────────────────── */
function TypingDemo() {
  const demos = [
    { text: 'dinner 500 with Rahul', result: '🍕 Dinner', split: 'Split with Rahul — ₹250 each', cat: 'Food & Dining' },
    { text: 'uber home 250', result: '🚗 Uber Home', split: 'Personal expense — ₹250', cat: 'Transport' },
    { text: 'netflix 649 split with Priya', result: '🎬 Netflix', split: 'Split with Priya — ₹324.50 each', cat: 'Entertainment' },
    { text: 'groceries 1200 with Amit and Sneha', result: '🛒 Groceries', split: '3-way split — ₹400 each', cat: 'Shopping' },
  ];
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('typing'); // typing, result, pause
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const demo = demos[idx];
    if (phase === 'typing') {
      if (charIdx < demo.text.length) {
        const t = setTimeout(() => setCharIdx(c => c + 1), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('result'), 400);
        return () => clearTimeout(t);
      }
    } else if (phase === 'result') {
      const t = setTimeout(() => setPhase('pause'), 2500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setIdx((idx + 1) % demos.length);
        setCharIdx(0);
        setPhase('typing');
      }, 500);
      return () => clearTimeout(t);
    }
  }, [phase, charIdx, idx]);

  const demo = demos[idx];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-black/5 dark:border-white/5 bg-white dark:bg-[#111827] shadow-2xl">
      {/* Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-glow-pulse" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">AI Smart Add</span>
          <span className="text-[9px] bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
          <div className="ml-auto flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`w-1 bg-gradient-to-t from-violet-500 to-fuchsia-400 rounded-full wave-bar`} style={{ height: `${8 + Math.random() * 10}px` }} />
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 font-mono text-sm min-h-[44px] flex items-center">
            <span className="text-gray-900 dark:text-white">{demo.text.slice(0, charIdx)}</span>
            <span className="w-0.5 h-5 bg-violet-500 ml-0.5 animate-pulse rounded-full" />
          </div>
          <button className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
            phase === 'result' 
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25' 
              : 'bg-gray-100 dark:bg-white/5 text-gray-400'
          }`}>
            <Wand2 className="w-4 h-4" /> Add
          </button>
        </div>

        {/* AI Result */}
        <div className={`transition-all duration-500 ${phase === 'result' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10 border border-teal-200/50 dark:border-teal-500/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{demo.result}</span>
              <span className="ml-auto text-xs bg-white dark:bg-white/10 px-2 py-0.5 rounded-full font-medium text-gray-500 dark:text-gray-400">{demo.cat}</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400">
                {demo.split}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Animated Pie Chart (SVG) ──────────────────── */
function AnimatedPieChart() {
  const slices = [
    { pct: 35, color: '#14b8a6', label: '🍕 Food', amount: '₹4,200' },
    { pct: 20, color: '#8b5cf6', label: '🚗 Transport', amount: '₹2,400' },
    { pct: 18, color: '#f59e0b', label: '🛒 Groceries', amount: '₹2,160' },
    { pct: 15, color: '#3b82f6', label: '🎬 Entertainment', amount: '₹1,800' },
    { pct: 12, color: '#ec4899', label: '🏠 Rent & Bills', amount: '₹1,440' },
  ];

  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {slices.map((s, i) => {
            const offset = cumulative;
            cumulative += s.pct;
            return (
              <circle
                key={i}
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke={s.color}
                strokeWidth="3.5"
                strokeDasharray={`${s.pct} ${100 - s.pct}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">₹12K</p>
          <p className="text-[9px] text-gray-400 font-medium">this month</p>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{s.label}</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">{s.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Animated Bar Chart ────────────────────────── */
function AnimatedBarChart() {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const values = [45, 62, 38, 78, 55, 90, 72];
  const max = Math.max(...values);

  return (
    <div>
      <div className="flex items-end gap-2 h-32 mb-2">
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">
              {i === values.length - 1 ? `₹${(v * 100).toLocaleString()}` : ''}
            </span>
            <div
              className={`w-full rounded-t-lg chart-bar ${
                i === values.length - 1
                  ? 'bg-gradient-to-t from-violet-500 to-fuchsia-400 shadow-lg shadow-violet-500/20'
                  : i === values.length - 2
                  ? 'bg-gradient-to-t from-teal-500 to-emerald-400'
                  : 'bg-gray-200 dark:bg-white/10'
              }`}
              style={{ height: `${(v / max) * 100}%` }}
            />
            <span className="text-[9px] text-gray-400 font-medium">{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Landing Page ─────────────────────────── */
export default function Landing() {
  const { dark, toggleTheme } = useTheme();
  const [usersCount, usersRef] = useCounter(12847, 2000);
  const [splitsCount, splitsRef] = useCounter(98432, 2500);
  const [savedCount, savedRef] = useCounter(2847000, 2000);

  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0a0f1a] overflow-hidden">
      {/* ───── Navbar ───── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-[#0a0f1a]/80 border-b border-black/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 animate-gradient-shift bg-[length:200%_200%]">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Split<span className="text-teal-500">Karo</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
            <a href="#features" className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors px-2">Features</a>
            <a href="#ai" className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors px-2">AI</a>
            <Link to="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors px-3 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="pt-28 sm:pt-32 pb-8 px-6 relative">
        {/* Animated background glows */}
        <div className="hero-glow bg-teal-400 top-10 left-[10%] animate-float-y" />
        <div className="hero-glow bg-violet-400 top-40 right-[5%] animate-float-x" style={{ animationDelay: '1s' }} />
        <div className="hero-glow bg-fuchsia-400 bottom-0 left-[40%] animate-float-y" style={{ animationDelay: '2s', width: '300px', height: '300px' }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* AI badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-200/60 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-bold mb-6 animate-fade-in">
              <Bot className="w-3.5 h-3.5" />
              AI-Powered Expense Splitting
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.08] animate-slide-up">
              Split expenses{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent animate-gradient-shift">
                  automagically
                </span>
                <span className="absolute -top-2 -right-6 text-2xl animate-float-y">✨</span>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mt-6 max-w-2xl mx-auto leading-relaxed animate-slide-up stagger-1">
              Type <span className="font-semibold text-gray-700 dark:text-gray-300">"pizza 800 with Rahul"</span> and our AI handles the rest — 
              categorize, detect friends, split, done. No cap. 🚀
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-slide-up stagger-2">
              <Link to="/register" className="btn-primary text-base py-4 px-8 flex items-center gap-2 shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all group">
                Start Splitting Free 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/login" className="btn-secondary text-base py-4 px-8 flex items-center gap-2">
                <span>I have an account</span>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-8 mt-8 text-sm text-gray-400 dark:text-gray-500 animate-slide-up stagger-3">
              <span className="flex items-center gap-1.5"><span className="text-base">🤖</span> AI-Powered</span>
              <span className="flex items-center gap-1.5"><span className="text-base">🔒</span> Private</span>
              <span className="flex items-center gap-1.5"><span className="text-base">💸</span> Free Forever</span>
              <span className="flex items-center gap-1.5"><span className="text-base">📱</span> Mobile Ready</span>
            </div>
          </div>

          {/* ── Hero Dashboard Mockup ── */}
          <div className="mt-14 max-w-5xl mx-auto animate-slide-up stagger-4">
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 border border-black/5 dark:border-white/5 bg-white dark:bg-[#111827]">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-50/80 dark:bg-[#0d1117] border-b border-black/5 dark:border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-white dark:bg-white/5 text-[11px] text-gray-400 font-mono border border-black/5 dark:border-white/5 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-green-500" /> splitkaro.app/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5 sm:p-8">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { emoji: '💰', label: 'You are owed', value: '₹2,450', gradient: 'from-teal-500 to-emerald-600', trend: '+12%' },
                    { emoji: '💸', label: 'You owe', value: '₹850', gradient: 'from-rose-500 to-red-600', trend: '-8%' },
                    { emoji: '📊', label: 'Net balance', value: '+₹1,600', gradient: 'from-blue-500 to-indigo-600', trend: '+24%' },
                    { emoji: '👥', label: 'Active splits', value: '7', gradient: 'from-violet-500 to-purple-600', trend: '+3' },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.gradient} p-4 text-white relative overflow-hidden`}>
                      <div className="absolute top-2 right-2 text-2xl opacity-20">{s.emoji}</div>
                      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-extrabold mt-1">{s.value}</p>
                      <span className="text-[10px] text-white/70 font-medium bg-white/15 px-1.5 py-0.5 rounded-full mt-1 inline-block">{s.trend}</span>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Bar chart */}
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Monthly Spending 📈</span>
                      </div>
                      <span className="text-[9px] bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold">+18% vs last month</span>
                    </div>
                    <AnimatedBarChart />
                  </div>

                  {/* Pie chart */}
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChart className="w-4 h-4 text-teal-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Category Breakdown 🍕</span>
                    </div>
                    <AnimatedPieChart />
                  </div>
                </div>

                {/* Recent expenses */}
                <div className="mt-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-4">
                  <p className="text-xs font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">⚡ Recent Activity</p>
                  <div className="space-y-2">
                    {[
                      { emoji: '🍕', desc: 'Pizza Night', amount: '-₹400', with: 'with Rahul', time: '2m ago' },
                      { emoji: '🚗', desc: 'Uber to Office', amount: '-₹250', with: 'personal', time: '1h ago' },
                      { emoji: '💰', desc: 'Amit settled up', amount: '+₹1,200', with: '', time: '3h ago' },
                    ].map((e) => (
                      <div key={e.desc} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white dark:hover:bg-white/[0.03] transition-colors">
                        <span className="text-xl">{e.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.desc}</p>
                          <p className="text-[10px] text-gray-400">{e.with} {e.with && '·'} {e.time}</p>
                        </div>
                        <span className={`text-sm font-bold ${e.amount.startsWith('+') ? 'text-teal-500' : 'text-gray-900 dark:text-white'}`}>
                          {e.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Stats Counter ───── */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { ref: usersRef, value: usersCount, suffix: '+', label: 'Happy Users 😊', icon: '👥' },
              { ref: splitsRef, value: splitsCount, suffix: '+', label: 'Expenses Split 🎯', icon: '💸' },
              { ref: savedRef, value: savedCount, suffix: '', label: 'Amount Tracked 📊', icon: '₹', formatAsCurrency: true },
            ].map((s) => (
              <div key={s.label} ref={s.ref} className="text-center p-4 sm:p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                <p className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {s.formatAsCurrency ? `₹${(s.value / 100000).toFixed(1)}L` : s.value.toLocaleString()}{s.suffix}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── AI Section ───── */}
      <section id="ai" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 via-fuchsia-50/30 to-transparent dark:from-violet-500/[0.03] dark:via-fuchsia-500/[0.02] dark:to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-500/15 dark:to-fuchsia-500/15 text-violet-700 dark:text-violet-400 text-xs font-bold mb-4">
              <Brain className="w-3.5 h-3.5" /> AI-First Design <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Your expenses understand{' '}
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                themselves ✨
              </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
              No more manual category selection or amount splitting. 
              Just talk to SplitKaro like you'd text a friend. fr fr 💯
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Live typing demo */}
            <TypingDemo />

            {/* AI capabilities */}
            <div className="space-y-4">
              {[
                { icon: '🧠', title: 'Natural Language Parsing', desc: 'Type "chai 40 with Amit" — we get it. Amount, description, friends, all parsed instantly.', color: 'from-violet-500 to-purple-500' },
                { icon: '🏷️', title: 'Auto-Categorization', desc: '100+ keywords across 7 categories. "biryani" → 🍕 Food. "uber" → 🚗 Transport. Zero effort.', color: 'from-amber-500 to-orange-500' },
                { icon: '👥', title: 'Friend Detection', desc: 'Mention any friend\'s name and we auto-split with them. "dinner with Priya and Amit" → 3-way split.', color: 'from-teal-500 to-emerald-500' },
                { icon: '⚡', title: 'Instant Smart Split', desc: 'Equal splits calculated on the fly. No tapping through forms. One input, done.', color: 'from-rose-500 to-pink-500' },
              ].map((cap) => (
                <div key={cap.title} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                  <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{cap.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{cap.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features Grid ───── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Everything you need to split smart 🎯
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg max-w-xl mx-auto">
              Built for Gen-Z. No boomer spreadsheets. Just vibes. ✌️
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Brain, emoji: '🤖', title: 'AI Smart Add', desc: 'Type naturally. We parse amount, friends, category. It\'s giving... magic.', gradient: 'from-violet-500 to-fuchsia-500' },
              { icon: Users, emoji: '👥', title: 'Squad Groups', desc: 'Flat gang, trip crew, lunch buddies — create groups and track every rupee.', gradient: 'from-teal-500 to-emerald-500' },
              { icon: BarChart3, emoji: '📊', title: 'Sick Charts', desc: 'Bar charts, pie charts, trends — see exactly where your money goes each month.', gradient: 'from-amber-500 to-orange-500' },
              { icon: ArrowLeftRight, emoji: '🤝', title: 'Easy Settlements', desc: 'Settle up in one tap. No more "bro send me ₹200" texts. Clean slate.', gradient: 'from-cyan-500 to-blue-500' },
              { icon: Shield, emoji: '🔒', title: 'Privacy First', desc: 'Nobody can find you unless they know your email. Your data stays yours.', gradient: 'from-rose-500 to-pink-500' },
              { icon: Smartphone, emoji: '📱', title: 'Works Everywhere', desc: 'Install as an app on your phone. Looks native, feels native. No app store needed.', gradient: 'from-indigo-500 to-violet-500' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-teal-200 dark:hover:border-teal-500/20 hover:shadow-xl hover:shadow-teal-500/5 transition-all hover:-translate-y-1.5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl group-hover:animate-shake">{f.emoji}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-teal-50/40 to-transparent dark:via-teal-500/[0.03]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              3 steps. That's it. 🏃‍♂️💨
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', emoji: '✍️', title: 'Sign up in 10s', desc: 'Name, email, password. Boom. You\'re in. No OTPs, no verification essays.' },
              { num: '02', emoji: '🤝', title: 'Add your people', desc: 'Search by email, add friends, create groups. Your squad, your rules.' },
              { num: '03', emoji: '🚀', title: 'Start splitting', desc: 'Type expenses naturally or use the form. AI does the heavy lifting.' },
            ].map((step, i) => (
              <div key={step.num} className="text-center relative group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-teal-300 to-transparent dark:from-teal-500/30" />
                )}
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-500/25 text-white group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="text-3xl">{step.emoji}</span>
                </div>
                <div className="text-xs font-bold text-teal-500 mb-1">STEP {step.num}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              People are obsessed 🫶
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">Real users. Real splits. Real love.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Rahul S.', role: 'IIT Delhi · CS', text: '"chai 40 with Amit" and it just WORKS. This is the future of splitting. no cap. 🧠🔥', avatar: 'R', grad: 'from-teal-500 to-emerald-500' },
              { name: 'Priya M.', role: 'Software Engineer', text: 'The monthly charts are so aesthetic I screenshot them. My flat expenses have never been this organized. 📊✨', avatar: 'P', grad: 'from-violet-500 to-purple-500' },
              { name: 'Arjun K.', role: 'Content Creator', text: 'Used it on our Goa trip with 8 people. Zero fights about money. That\'s a first. 🏖️🤝', avatar: 'A', grad: 'from-cyan-500 to-blue-500' },
            ].map((t, i) => (
              <div key={t.name} className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.grad} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Install as App (PWA) ───── */}
      <section className="py-16 px-6 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-500/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
                <Smartphone className="w-3.5 h-3.5" /> Works on all devices
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                Install as an app 📲
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                Add SplitKaro to your home screen on iPhone or Android. 
                Works offline, looks native, no app store download needed. 
                Just tap the share button in your browser → "Add to Home Screen". That's it!
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">🍎 iPhone</span>
                <span className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">🤖 Android</span>
                <span className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">💻 Desktop</span>
                <span className="text-xs bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">🌐 Any Browser</span>
              </div>
            </div>
            <div className="relative shrink-0">
              <div className="w-48 h-80 rounded-[2rem] border-[3px] border-gray-800 dark:border-gray-600 bg-gray-50 dark:bg-[#111827] overflow-hidden shadow-2xl relative">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 dark:bg-gray-600 rounded-b-2xl z-10" />
                {/* Phone content */}
                <div className="pt-8 px-3 space-y-2">
                  <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-3 text-white">
                    <p className="text-[8px] text-white/60 font-bold">NET BALANCE</p>
                    <p className="text-lg font-extrabold">+₹1,600</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="flex-1 rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 p-2">
                      <p className="text-[7px] text-gray-400 font-bold">OWED</p>
                      <p className="text-[10px] font-bold text-teal-500">₹2,450</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 p-2">
                      <p className="text-[7px] text-gray-400 font-bold">OWE</p>
                      <p className="text-[10px] font-bold text-rose-500">₹850</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {['🍕 Pizza Night -₹400', '🚗 Uber -₹250', '💰 Amit +₹1.2K'].map((item) => (
                      <div key={item} className="rounded-lg bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 px-2 py-1.5">
                        <p className="text-[9px] font-semibold text-gray-700 dark:text-gray-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 animate-gradient-shift" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-40" />
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">🚀</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Stop chasing payments.<br />Start vibing.
              </h2>
              <p className="text-teal-100 text-lg max-w-xl mx-auto mb-8">
                Join the squad that splits smart. Free forever, no strings attached. 💯
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="px-8 py-4 rounded-2xl bg-white text-teal-700 font-bold text-base hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center gap-2">
                  Let's Go 🎉 <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="px-8 py-4 rounded-2xl bg-white/15 text-white font-semibold text-base hover:bg-white/25 transition-all border border-white/20 flex items-center gap-2 backdrop-blur-sm">
                  Already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="py-10 px-6 border-t border-black/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Split<span className="text-teal-500">Karo</span></span>
            <span className="text-xs text-gray-400 dark:text-gray-600">·</span>
            <span className="text-xs text-gray-400 dark:text-gray-600">Made with 💚 by VIRUS</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-600">
            <span>🤖 AI-Powered</span>
            <span>🔒 Privacy First</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
