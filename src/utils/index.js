import { LEVEL_THRESHOLDS, LEVEL_TITLES } from '../constants';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatDateFull = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getLevel = (xp) => {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
};

export const getLevelTitle = (level) => {
  return LEVEL_TITLES[level] || 'Unknown';
};

export const getXPForNextLevel = (totalXP) => {
  const currentLevel = getLevel(totalXP);
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  
  const progressXP = totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const percentComplete = (progressXP / requiredXP) * 100;
  
  return {
    currentLevel,
    progressXP,
    nextLevelXP: requiredXP,
    percentComplete: Math.min(percentComplete, 100),
  };
};

export const getGoalProgress = (currentAmount, targetAmount) => {
  return (currentAmount / targetAmount) * 100;
};

export const calculateNetWorth = (assets, liabilities) => {
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  return totalAssets - totalLiabilities;
};

export const calculateTotalIncome = (incomeList) => {
  return incomeList.reduce((sum, item) => sum + item.amount, 0);
};

export const calculateTotalExpenses = (expenseList) => {
  return expenseList.reduce((sum, item) => sum + item.amount, 0);
};

export const calculateSavingsRate = (income, expenses) => {
  if (income === 0) return 0;
  return ((income - expenses) / income) * 100;
};

export const getMonthlyData = (transactions) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });
};

export const getYearlyData = (transactions) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  return transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getFullYear() === currentYear;
  });
};

export const getDaysUntil = (dateString) => {
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diff = targetDate - today;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return days;
};

export const isOverdue = (dateString) => {
  return getDaysUntil(dateString) < 0;
};

export const getDueStatus = (dateString) => {
  const days = getDaysUntil(dateString);
  
  if (days < 0) return { label: 'Overdue', color: 'red' };
  if (days === 0) return { label: 'Due Today', color: 'orange' };
  if (days <= 7) return { label: `Due in ${days} days`, color: 'yellow' };
  return { label: `Due in ${days} days`, color: 'green' };
};
