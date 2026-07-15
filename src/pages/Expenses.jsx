import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { useAuthStore, useFinanceStore } from '../store';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { EXPENSE_CATEGORIES } from '../constants';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Expenses() {
  const { user } = useAuthStore();
  const { addExpense, addXP, expenses } = useFinanceStore();
  const [expenseList, setExpenseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'food',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch expenses from Firestore
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'expenses'),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExpenseList(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const expenseDoc = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        timestamp: new Date(),
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'expenses'), expenseDoc);
      
      // Update Zustand store
      addExpense({ id: docRef.id, ...expenseDoc });
      
      // Add XP
      addXP(30);

      // Add to local list
      setExpenseList([{ id: docRef.id, ...expenseDoc }, ...expenseList]);

      // Reset form
      setFormData({
        category: 'food',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      setShowForm(false);
      toast.success('Expense recorded! +30 XP');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
      setExpenseList(expenseList.filter(item => item.id !== id));
      toast.success('Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const totalExpenses = expenseList.reduce((sum, item) => sum + item.amount, 0);
  const getCategoryIcon = (categoryId) => {
    const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || '💸';
  };

  // Group expenses by category
  const expensesByCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenseList
      .filter(item => item.category === cat.id)
      .reduce((sum, item) => sum + item.amount, 0)
  })).filter(cat => cat.total > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Expenses</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your spending</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>

        {/* Summary Card */}
        <div className="card mb-8 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900 dark:from-opacity-20 dark:to-pink-900 dark:to-opacity-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(
                  expenseList
                    .filter(item => {
                      const itemDate = new Date(item.date);
                      const now = new Date();
                      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, item) => sum + item.amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
              <p className="text-3xl font-bold text-red-600">{expenseList.length}</p>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <div className="card mb-8 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add New Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional notes"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold"
                >
                  Save Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category Breakdown */}
        {expensesByCategory.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Breakdown by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expensesByCategory.map(cat => (
                <div key={cat.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{cat.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(cat.total)}</p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(cat.total / totalExpenses) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">All Expenses</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin" size={32} />
            </div>
          ) : expenseList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="py-3 px-4">
                        <span className="text-lg">{getCategoryIcon(item.category)}</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white ml-2 capitalize">
                          {EXPENSE_CATEGORIES.find(c => c.id === item.category)?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.description || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(item.date)}</td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">{formatCurrency(item.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(item.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition text-red-600 dark:text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No expenses recorded yet</p>
              <p>Start tracking your expenses by clicking "Add Expense"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
