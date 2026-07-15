import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useAuthStore, useFinanceStore } from '../store';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, formatDate, calculateNetWorth, getLevelTitle, getXPForNextLevel } from '../utils/helpers';
import { TrendingUp, TrendingDown, PiggyBank, Briefcase, AlertCircle, Star } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { balance, level, xp, income, expenses, assets, liabilities } = useFinanceStore();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        // Fetch recent income
        const incomeQuery = query(
          collection(db, 'users', user.uid, 'income'),
          orderBy('date', 'desc'),
          limit(5)
        );
        const incomeSnapshot = await getDocs(incomeQuery);
        const incomeData = incomeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'income'
        }));

        // Fetch recent expenses
        const expenseQuery = query(
          collection(db, 'users', user.uid, 'expenses'),
          orderBy('date', 'desc'),
          limit(5)
        );
        const expenseSnapshot = await getDocs(expenseQuery);
        const expenseData = expenseSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'expense'
        }));

        // Combine and sort
        const combined = [...incomeData, ...expenseData]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setRecentTransactions(combined);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecentTransactions();
    }
  }, [user]);

  const netWorth = calculateNetWorth(assets, liabilities);
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const { progressXP, nextLevelXP, percentComplete } = getXPForNextLevel(xp);

  const stats = [
    { label: 'Balance', value: formatCurrency(balance), icon: PiggyBank, color: 'indigo' },
    { label: 'Net Worth', value: formatCurrency(netWorth), icon: Briefcase, color: 'purple' },
    { label: 'Total Assets', value: formatCurrency(totalAssets), icon: TrendingUp, color: 'green' },
    { label: 'Total Liabilities', value: formatCurrency(totalLiabilities), icon: AlertCircle, color: 'red' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Welcome, {user?.displayName || 'Player'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your finances and level up</p>
        </div>

        {/* Level & XP Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Star className="text-yellow-500" />
                Level {level}
              </h3>
              <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                {getLevelTitle(level)}
              </span>
            </div>
            
            {/* XP Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>XP Progress</span>
                <span>{progressXP} / {nextLevelXP}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total XP: {xp}
              </p>
            </div>
          </div>

          {/* Daily Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="card bg-green-50 dark:bg-green-900 dark:bg-opacity-20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-600" size={24} />
                <h3 className="font-semibold text-gray-800 dark:text-white">Income</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(income.reduce((sum, i) => sum + i.amount, 0))}</p>
            </div>
            
            <div className="card bg-red-50 dark:bg-red-900 dark:bg-opacity-20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="text-red-600" size={24} />
                <h3 className="font-semibold text-gray-800 dark:text-white">Expenses</h3>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              indigo: 'bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-20 text-indigo-600',
              purple: 'bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 text-purple-600',
              green: 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-600',
              red: 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-600',
            };

            return (
              <div key={index} className="card">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Transactions</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} size={20} />
                      ) : (
                        <TrendingDown className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white capitalize">{transaction.category}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No transactions yet. Start tracking your finances!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
