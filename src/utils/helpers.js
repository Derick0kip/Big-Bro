import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date) => {
  if (typeof date === 'string') {
    return format(parseISO(date), 'MMM dd, yyyy');
  }
  return format(date, 'MMM dd, yyyy');
};

export const formatTime = (date) => {
  if (typeof date === 'string') {
    return format(parseISO(date), 'HH:mm');
  }
  return format(date, 'HH:mm');
};

export const calculateNetWorth = (assets, liabilities) => {
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  return totalAssets - totalLiabilities;
};

export const calculateTotalAssets = (assets) => {
  return assets.reduce((sum, asset) => sum + asset.value, 0);
};

export const calculateTotalLiabilities = (liabilities) => {
  return liabilities.reduce((sum, liability) => sum + liability.amount, 0);
};

export const calculateSavingsProgress = (current, target) => {
  return Math.min((current / target) * 100, 100);
};

export const getLevelTitle = (level) => {
  if (level >= 20) return 'Financial Master';
  if (level >= 15) return 'Financial Guardian';
  if (level >= 10) return 'Wealth Builder';
  if (level >= 5) return 'Money Explorer';
  return 'Financial Beginner';
};

export const getXPForNextLevel = (currentXP) => {
  const xpPerLevel = 1000;
  const currentLevel = Math.floor(currentXP / xpPerLevel);
  const nextLevelXP = (currentLevel + 1) * xpPerLevel;
  const progressXP = currentXP % xpPerLevel;
  return { progressXP, nextLevelXP: xpPerLevel, percentComplete: (progressXP / xpPerLevel) * 100 };
};
