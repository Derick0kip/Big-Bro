import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { useAuthStore, useFinanceStore } from '../store';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Trash2, Loader, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Liabilities() {
  const { user } = useAuthStore();
  const { addLiability, addXP } = useFinanceStore();
  const [liabilities, setLiabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'loan',
    amount: '',
    interestRate: '',
    dueDate: '',
    description: '',
  });

  // Fetch liabilities
  useEffect(() => {
    const fetchLiabilities = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'liabilities'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLiabilities(data);
      } catch (error) {
        console.error('Error fetching liabilities:', error);
        toast.error('Failed to load liabilities');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLiabilities();
    }
  }, [user]);

  const handleAddLiability = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const liabilityDoc = {
        name: formData.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate) || 0,
        dueDate: formData.dueDate,
        description: formData.description,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'liabilities'), liabilityDoc);
      
      setLiabilities([{ id: docRef.id, ...liabilityDoc }, ...liabilities]);
      addLiability({ id: docRef.id, ...liabilityDoc });
      addXP(40);

      setFormData({
        name: '',
        type: 'loan',
        amount: '',
        interestRate: '',
        dueDate: '',
        description: '',
      });

      setShowForm(false);
      toast.success('Liability recorded! +40 XP');
    } catch (error) {
      console.error('Error adding liability:', error);
      toast.error('Failed to add liability');
    }
  };

  const handleUpdateLiability = async (id, newAmount) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'liabilities', id), {
        amount: parseFloat(newAmount)
      });

      setLiabilities(liabilities.map(l => 
        l.id === id ? { ...l, amount: parseFloat(newAmount) } : l
      ));

      setEditingId(null);
      addXP(20);
      toast.success('Liability updated! +20 XP');
    } catch (error) {
      console.error('Error updating liability:', error);
      toast.error('Failed to update liability');
    }
  };

  const handleDeleteLiability = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'liabilities', id));
      setLiabilities(liabilities.filter(item => item.id !== id));
      toast.success('Liability deleted');
    } catch (error) {
      console.error('Error deleting liability:', error);
      toast.error('Failed to delete liability');
    }
  };

  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  
  const liabilitiesByType = {
    loan: liabilities.filter(l => l.type === 'loan').reduce((sum, l) => sum + l.amount, 0),
    mortgage: liabilities.filter(l => l.type === 'mortgage').reduce((sum, l) => sum + l.amount, 0),
    creditCard: liabilities.filter(l => l.type === 'creditCard').reduce((sum, l) => sum + l.amount, 0),
    debt: liabilities.filter(l => l.type === 'debt').reduce((sum, l) => sum + l.amount, 0),
    other: liabilities.filter(l => l.type === 'other').reduce((sum, l) => sum + l.amount, 0),
  };

  const liabilityTypes = [
    { id: 'loan', label: 'Personal Loan', icon: '📋', color: 'orange' },
    { id: 'mortgage', label: 'Mortgage', icon: '🏠', color: 'red' },
    { id: 'creditCard', label: 'Credit Card', icon: '💳', color: 'pink' },
    { id: 'debt', label: 'Debt', icon: '📊', color: 'purple' },
    { id: 'other', label: 'Other', icon: '⚠️', color: 'gray' },
  ];

  const getLiabilityIcon = (type) => {
    return liabilityTypes.find(t => t.id === type)?.icon || '📌';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Liabilities</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your debts and obligations</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Liability
          </button>
        </div>

        {/* Total Liabilities Card */}
        <div className="card mb-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900 dark:from-opacity-20 dark:to-orange-900 dark:to-opacity-20">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Liabilities</p>
            <p className="text-5xl font-bold text-red-600 mb-4">{formatCurrency(totalLiabilities)}</p>
            <p className="text-gray-600 dark:text-gray-400">{liabilities.length} liabilit{liabilities.length !== 1 ? 'ies' : 'y'}</p>
          </div>
        </div>

        {/* Liability Types Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {liabilityTypes.map(type => (
            <div key={type.id} className="card">
              <div className="text-center">
                <p className="text-3xl mb-2">{type.icon}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{type.label}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(liabilitiesByType[type.id])}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Liability Form */}
        {showForm && (
          <div className="card mb-8 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add New Liability</h2>
            <form onSubmit={handleAddLiability} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Liability Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Liability Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Car Loan, Credit Card"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                {/* Liability Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    {liabilityTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Amount Owed
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

                {/* Interest Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                  Add Liability
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

        {/* Liabilities List */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">All Liabilities</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin" size={32} />
            </div>
          ) : liabilities.length > 0 ? (
            <div className="space-y-4">
              {liabilities.map((liability) => (
                <div key={liability.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Side */}
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{getLiabilityIcon(liability.type)}</div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{liability.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{liability.type}</p>
                        {liability.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{liability.description}</p>
                        )}
                        {liability.dueDate && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Due: {formatDate(liability.dueDate)}</p>
                        )}
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                        {editingId === liability.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateLiability(liability.id, editAmount)}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 dark:text-green-400"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <p className="text-lg font-bold text-red-600">{formatCurrency(liability.amount)}</p>
                            <button
                              onClick={() => {
                                setEditingId(liability.id);
                                setEditAmount(liability.amount.toString());
                              }}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {liability.interestRate > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rate</p>
                          <p className="font-bold text-orange-600">{liability.interestRate}%</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteLiability(liability.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No liabilities recorded yet</p>
              <p>Add your first liability by clicking "Add Liability"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
