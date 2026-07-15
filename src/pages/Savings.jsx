import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { useAuthStore, useFinanceStore } from '../store';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { formatCurrency, formatDate, getGoalProgress } from '../utils/helpers';
import { Plus, Trash2, Loader, Target } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Savings() {
  const { user } = useAuthStore();
  const { addXP } = useFinanceStore();
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    goal: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'general',
  });

  // Fetch savings goals
  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'savings'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavings(data);
      } catch (error) {
        console.error('Error fetching savings:', error);
        toast.error('Failed to load savings goals');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSavings();
    }
  }, [user]);

  const handleAddSavingsGoal = async (e) => {
    e.preventDefault();

    if (!formData.goal || !formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const savingsDoc = {
        goal: formData.goal,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        deadline: formData.deadline,
        category: formData.category,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'savings'), savingsDoc);
      
      setSavings([{ id: docRef.id, ...savingsDoc }, ...savings]);
      addXP(100);

      setFormData({
        goal: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        category: 'general',
      });

      setShowForm(false);
      toast.success('Savings goal created! +100 XP');
    } catch (error) {
      console.error('Error adding savings goal:', error);
      toast.error('Failed to add savings goal');
    }
  };

  const handleUpdateAmount = async (id, newAmount) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'savings', id), {
        currentAmount: newAmount
      });

      setSavings(savings.map(s => 
        s.id === id ? { ...s, currentAmount: newAmount } : s
      ));

      addXP(25);
      toast.success('Progress updated! +25 XP');
    } catch (error) {
      console.error('Error updating savings:', error);
      toast.error('Failed to update savings');
    }
  };

  const handleDeleteSavings = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savings', id));
      setSavings(savings.filter(item => item.id !== id));
      toast.success('Savings goal deleted');
    } catch (error) {
      console.error('Error deleting savings:', error);
      toast.error('Failed to delete savings goal');
    }
  };

  const totalSaved = savings.reduce((sum, s) => sum + s.currentAmount, 0);
  const totalGoal = savings.reduce((sum, s) => sum + s.targetAmount, 0);
  const overallProgress = totalGoal > 0 ? (totalSaved / totalGoal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Savings Goals</h1>
            <p className="text-gray-600 dark:text-gray-300">Plan and track your savings</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            New Goal
          </button>
        </div>

        {/* Overall Progress */}
        <div className="card mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900 dark:from-opacity-20 dark:to-indigo-900 dark:to-opacity-20">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Saved</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalSaved)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Goal</p>
                <p className="text-3xl font-bold text-indigo-600">{formatCurrency(totalGoal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Progress</p>
                <p className="text-3xl font-bold text-purple-600">{overallProgress.toFixed(1)}%</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Savings Goal Form */}
        {showForm && (
          <div className="card mb-8 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Create New Savings Goal</h2>
            <form onSubmit={handleAddSavingsGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Goal Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    placeholder="e.g., Vacation, Car, House"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="general">General</option>
                    <option value="vacation">Vacation</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="education">Education</option>
                    <option value="emergency">Emergency Fund</option>
                    <option value="home">Home</option>
                  </select>
                </div>

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                {/* Current Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                {/* Deadline */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold"
                >
                  Create Goal
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

        {/* Savings Goals */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin" size={32} />
            </div>
          ) : savings.length > 0 ? (
            savings.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div key={goal.id} className="card hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <Target className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white capitalize">{goal.goal}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(goal.deadline)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSavings(goal.id)}
                      className="mt-4 md:mt-0 p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition text-red-600 dark:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Progress Info */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Saved</p>
                      <p className="font-bold text-purple-600">{formatCurrency(goal.currentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Goal</p>
                      <p className="font-bold text-gray-800 dark:text-white">{formatCurrency(goal.targetAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
                      <p className="font-bold text-indigo-600">{formatCurrency(remaining)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                      <span className="text-sm font-bold text-purple-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Add Amount Form */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 items-end">
                      <input
                        type="number"
                        placeholder="Add amount"
                        step="0.01"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const amount = parseFloat(e.target.value);
                            if (amount > 0) {
                              handleUpdateAmount(goal.id, goal.currentAmount + amount);
                              e.target.value = '';
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input');
                          const amount = parseFloat(input.value);
                          if (amount > 0) {
                            handleUpdateAmount(goal.id, goal.currentAmount + amount);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No savings goals yet</p>
              <p>Create your first savings goal to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
