import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { useAuthStore, useFinanceStore } from '../store';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Trash2, Loader, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Assets() {
  const { user } = useAuthStore();
  const { addAsset, addXP } = useFinanceStore();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'savings',
    value: '',
    description: '',
  });

  // Fetch assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'assets'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAssets(data);
      } catch (error) {
        console.error('Error fetching assets:', error);
        toast.error('Failed to load assets');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAssets();
    }
  }, [user]);

  const handleAddAsset = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.value || parseFloat(formData.value) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const assetDoc = {
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value),
        description: formData.description,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'assets'), assetDoc);
      
      setAssets([{ id: docRef.id, ...assetDoc }, ...assets]);
      addAsset({ id: docRef.id, ...assetDoc });
      addXP(50);

      setFormData({
        name: '',
        type: 'savings',
        value: '',
        description: '',
      });

      setShowForm(false);
      toast.success('Asset added! +50 XP');
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    }
  };

  const handleUpdateAsset = async (id, newValue) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'assets', id), {
        value: parseFloat(newValue)
      });

      setAssets(assets.map(a => 
        a.id === id ? { ...a, value: parseFloat(newValue) } : a
      ));

      setEditingId(null);
      addXP(25);
      toast.success('Asset updated! +25 XP');
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'assets', id));
      setAssets(assets.filter(item => item.id !== id));
      toast.success('Asset deleted');
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  
  const assetsByType = {
    savings: assets.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.value, 0),
    investment: assets.filter(a => a.type === 'investment').reduce((sum, a) => sum + a.value, 0),
    property: assets.filter(a => a.type === 'property').reduce((sum, a) => sum + a.value, 0),
    vehicle: assets.filter(a => a.type === 'vehicle').reduce((sum, a) => sum + a.value, 0),
    other: assets.filter(a => a.type === 'other').reduce((sum, a) => sum + a.value, 0),
  };

  const assetTypes = [
    { id: 'savings', label: 'Savings', icon: '🏦', color: 'blue' },
    { id: 'investment', label: 'Investment', icon: '📈', color: 'green' },
    { id: 'property', label: 'Property', icon: '🏠', color: 'purple' },
    { id: 'vehicle', label: 'Vehicle', icon: '🚗', color: 'orange' },
    { id: 'other', label: 'Other', icon: '💎', color: 'gray' },
  ];

  const getAssetIcon = (type) => {
    return assetTypes.find(t => t.id === type)?.icon || '💰';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Assets</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your valuable possessions</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Add Asset
          </button>
        </div>

        {/* Total Assets Card */}
        <div className="card mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900 dark:from-opacity-20 dark:to-cyan-900 dark:to-opacity-20">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Assets Value</p>
            <p className="text-5xl font-bold text-blue-600 mb-4">{formatCurrency(totalAssets)}</p>
            <p className="text-gray-600 dark:text-gray-400">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Asset Types Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {assetTypes.map(type => (
            <div key={type.id} className="card">
              <div className="text-center">
                <p className="text-3xl mb-2">{type.icon}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{type.label}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(assetsByType[type.id])}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Asset Form */}
        {showForm && (
          <div className="card mb-8 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add New Asset</h2>
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asset Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Savings Account, Tesla, House"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    required
                  />
                </div>

                {/* Asset Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    {assetTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-semibold"
                >
                  Add Asset
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

        {/* Assets List */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">All Assets</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin" size={32} />
            </div>
          ) : assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Asset Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Value</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getAssetIcon(asset.type)}</span>
                          <span className="font-semibold text-gray-800 dark:text-white">{asset.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full text-sm capitalize">
                          {asset.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{asset.description || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        {editingId === asset.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateAsset(asset.id, editValue)}
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
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-blue-600">{formatCurrency(asset.value)}</span>
                            <button
                              onClick={() => {
                                setEditingId(asset.id);
                                setEditValue(asset.value.toString());
                              }}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
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
              <p className="text-lg mb-2">No assets recorded yet</p>
              <p>Add your first asset by clicking "Add Asset"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
