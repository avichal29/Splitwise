import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Users, PlusCircle, Activity, UserPlus,
  LogOut, Receipt, Sun, Moon, Menu, X, Sparkles, ChevronDown,
  Wallet
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', emoji: '📊' },
    { to: '/groups', icon: Users, label: 'Groups', emoji: '👥' },
    { to: '/add-expense', icon: PlusCircle, label: 'Add Expense', emoji: '💸' },
    { to: '/activity', icon: Activity, label: 'Activity', emoji: '📈' },
    { to: '/friends', icon: UserPlus, label: 'Friends', emoji: '🤝' },
  ];

  const avatarGradient = getAvatarGradient(user?.name);

  const sidebar = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-200/50 dark:border-surface-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Splitwise</h1>
            <p className="text-[10px] font-medium text-primary-500 dark:text-primary-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Split smart, stay friends
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, emoji }, i) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/10 to-emerald-500/10 dark:from-primary-500/20 dark:to-emerald-500/20 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-surface-700/50 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <span className="text-base">{emoji}</span>
            <span className="flex-1">{label}</span>
            <Icon className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-gray-200/50 dark:border-surface-700/50 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-700/50 transition-all"
        >
          <span className="flex items-center gap-2">
            {dark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            {dark ? 'Dark Mode' : 'Light Mode'}
          </span>
          <div className={`w-9 h-5 rounded-full transition-colors ${dark ? 'bg-indigo-500' : 'bg-gray-300'} relative`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${dark ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {/* Currency Selector */}
        <div className="px-2">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-surface-400 mb-1.5 px-2">Currency</label>
          <select
            value={currency.code}
            onChange={(e) => changeCurrency(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100/80 dark:bg-surface-700/50 border border-gray-200/50 dark:border-surface-600/50 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none cursor-pointer transition-all"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/80 dark:bg-surface-700/30">
          <div className={`avatar-sm bg-gradient-to-br ${avatarGradient}`}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-surface-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-surface-950 gradient-mesh">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-nav px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Splitwise</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-72 h-full glass-nav flex flex-col animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[270px] glass-nav flex-col fixed h-full z-30">
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[270px] pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
