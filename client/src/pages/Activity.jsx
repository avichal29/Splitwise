import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Receipt, ArrowLeftRight, Trash2, PlusCircle, Activity as ActivityIcon } from 'lucide-react';

export default function Activity() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expenses');

  useEffect(() => {
    Promise.all([
      api.get('/expenses'),
      api.get('/settlements'),
    ]).then(([expRes, setRes]) => {
      setExpenses(expRes.data);
      setSettlements(setRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const deleteExpense = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-12 h-12"><div className="absolute inset-0 rounded-full border-4 border-teal-100 dark:border-white/10"></div><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-500 animate-spin"></div></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ActivityIcon className="w-7 h-7 text-teal-500" /> Activity
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your complete expense timeline</p>
        </div>
        <Link to="/add-expense" className="btn-primary flex items-center gap-2 text-sm self-start">
          <PlusCircle className="w-4 h-4" /> Add Expense
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit backdrop-blur-sm">
        <button
          onClick={() => setTab('expenses')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'expenses'
              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setTab('settlements')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'settlements'
              ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Settlements ({settlements.length})
        </button>
      </div>

      {tab === 'expenses' && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No expenses yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">Start tracking your shared expenses!</p>
              <Link to="/add-expense" className="btn-primary mt-5 inline-flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add First Expense
              </Link>
            </div>
          ) : (
            expenses.map((exp, i) => (
              <div key={exp.id} className="card animate-slide-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white shadow-md shrink-0 mt-0.5">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{exp.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Paid by <span className="font-semibold text-gray-700 dark:text-gray-200">{exp.paid_by === user.id ? 'you' : exp.paid_by_name}</span>
                        {exp.group_name && <span> in <span className="font-semibold text-teal-600 dark:text-teal-400">{exp.group_name}</span></span>}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {exp.splits.map(s => (
                          <span key={s.id} className="text-[11px] text-gray-500 dark:text-surface-400 bg-gray-100 dark:bg-surface-600/50 px-2 py-0.5 rounded-full font-medium">
                            {s.user_id === user.id ? 'You' : s.user_name}: {formatAmount(s.amount)}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-surface-500 mt-2 font-medium">{new Date(exp.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{formatAmount(exp.amount)}</span>
                    {exp.paid_by === user.id && (
                      <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settlements' && (
        <div className="space-y-3">
          {settlements.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No settlements yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">Settle up with friends to see payments here.</p>
            </div>
          ) : (
            settlements.map((s, i) => (
              <div key={s.id} className="card flex items-center justify-between animate-slide-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-md">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {s.paid_by === user.id ? 'You' : s.paid_by_name} paid {s.paid_to === user.id ? 'you' : s.paid_to_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-surface-400 mt-0.5 font-medium">
                      {s.group_name && <span>In {s.group_name} · </span>}
                      {new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(s.amount)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
