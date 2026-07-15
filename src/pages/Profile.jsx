import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { useAuthStore, useFinanceStore } from '../store';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { formatCurrency, getLevelTitle, getXPForNextLevel } from '../utils/helpers';
import { User, Mail, Lock, Settings, LogOut, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const { level, xp, balance } = useFinanceStore();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setProfileData(userDocSnap.data());
          }

          setFormData({
            displayName: user.displayName || '',
            email: user.email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      // Update Firebase Auth
      if (formData.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName,
        });
      }

      if (formData.email !== user.email) {
        await updateEmail(auth.currentUser, formData.email);
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        email: formData.email,
      });

      setEditing(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await updatePassword(auth.currentUser, passwordData.newPassword);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  const { progressXP, nextLevelXP, percentComplete } = getXPForNextLevel(xp);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Profile</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account settings</p>
        </div>

        {/* Profile Card */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avatar</p>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {user?.displayName || 'Player'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{user?.email}</p>
              
              {/* Level Badge */}
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                  <p className="font-semibold text-indigo-800 dark:text-indigo-200">
                    Level {level} - {getLevelTitle(level)}
                  </p>
                </div>
                <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <p className="font-semibold text-purple-800 dark:text-purple-200">
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Level</p>
            <p className="text-4xl font-bold text-indigo-600 mb-4">{level}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{getLevelTitle(level)}</p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total XP</p>
            <p className="text-4xl font-bold text-purple-600 mb-4">{xp}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Points Earned</p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Account Balance</p>
            <p className="text-4xl font-bold text-green-600 mb-4">{formatCurrency(balance)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Worth</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Level Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>XP to Next Level</span>
              <span>{progressXP} / {nextLevelXP}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {percentComplete.toFixed(1)}% progress to level {level + 1}
            </p>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Settings size={20} />
            Profile Settings
          </h3>

          {/* Display Name */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              {editing !== 'displayName' && (
                <button
                  onClick={() => {
                    setEditing('displayName');
                  }}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            {editing === 'displayName' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <button
                  onClick={handleUpdateProfile}
                  className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 dark:text-green-400"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-white font-semibold">{formData.displayName}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              {editing !== 'email' && (
                <button
                  onClick={() => setEditing('email')}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            {editing === 'email' ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <button
                  onClick={handleUpdateProfile}
                  className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 dark:text-green-400"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-white font-semibold flex items-center gap-2">
                <Mail size={16} />
                {formData.email}
              </p>
            )}
          </div>

          {/* Change Password */}
          <div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              <Lock size={16} />
              Change Password
            </button>

            {showPasswordForm && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition font-semibold"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(false)}
                    className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 font-semibold"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
