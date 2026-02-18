import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Users, PlusCircle, Activity, UserPlus,
  LogOut, Sun, Moon, Menu, X, Wallet, ChevronDown, Check
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

function getAvatarGradient(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { currency, currencies, changeCurrency } = useCurrency();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/add-expense', icon: PlusCircle, label: 'Add Expense' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { to: '/friends', icon: UserPlus, label: 'Friends' },
  ];

  const avatarGradient = getAvatarGradient(user?.name);

  const sidebar = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">SplitKaro</h1>
            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400">
              Made by VIRUS
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-teal-500/10 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/15 dark:border-teal-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-black/4 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-black/5 dark:border-white/5 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-black/4 dark:hover:bg-white/5 transition-all"
        >
          <span className="flex items-center gap-2.5">
            {dark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            {dark ? 'Dark Mode' : 'Light Mode'}
          </span>
          <div className={`w-9 h-5 rounded-full transition-colors ${dark ? 'bg-teal-500' : 'bg-gray-300'} relative`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${dark ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {/* Currency Selector */}
        <div className="px-2 relative">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 mb-1.5 px-2">Currency</label>
          <button
            onClick={() => setCurrencyOpen(!currencyOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-black/3 dark:bg-white/5 border border-black/6 dark:border-white/8 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/8 transition-all backdrop-blur-sm"
          >
            <span>{currency.symbol} {currency.code}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
          </button>
          {currencyOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
              <div className="absolute bottom-full left-2 right-2 mb-1 z-50 max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#1a2332] animate-scale-in">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { changeCurrency(c.code); setCurrencyOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-teal-50 dark:hover:bg-teal-500/10 ${
                      currency.code === c.code
                        ? 'text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-500/15'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{c.symbol} {c.code} — {c.name}</span>
                    {currency.code === c.code && <Check className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl glass-inner">
          <div className={`avatar-sm bg-gradient-to-br ${avatarGradient}`}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-500/8 dark:hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#f0f4f3] dark:bg-[#0a0f1a] gradient-mesh">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-nav px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/5" style={{ borderRight: 'none' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white tracking-tight">SplitKaro</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-72 h-full glass-nav flex flex-col animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] glass-nav flex-col fixed h-full z-30">
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[260px] pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
