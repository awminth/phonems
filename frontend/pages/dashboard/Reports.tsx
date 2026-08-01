

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  CornerUpLeft,
  TrendingUp,
  FileBarChart,
  Wallet,
  TrendingDown,
  Users,
  ShieldCheck,
  AlertCircle,
  ArrowRightLeft,
  Settings,
  Smartphone,
  ShoppingBag,
  Wrench
} from 'lucide-react';


const Reports: React.FC = () => {
  const navigate = useNavigate();
  const userType = sessionStorage.getItem('userType');

  const reportCards = [
    { label: 'Cash Report', icon: <Banknote size={32} />, color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', path: '/reports/cash' },
    { label: 'Credit Report', icon: <CreditCard size={32} />, color: 'bg-blue-500', hover: 'hover:bg-blue-600', path: '/reports/credit' },
    { label: 'Salesperson Report', icon: <Users size={32} />, color: 'bg-teal-600', hover: 'hover:bg-teal-700', path: '/reports/salesperson' },
    { label: 'Service Report', icon: <Wrench size={32} />, color: 'bg-pink-600', hover: 'hover:bg-pink-700', path: '/reports/service' },
    { label: 'Sale Return Report', icon: <CornerUpLeft size={32} />, color: 'bg-red-500', hover: 'hover:bg-red-600', path: '/reports/return' },
    { label: 'IMEI History Check', icon: <ShieldCheck size={32} />, color: 'bg-teal-500', hover: 'hover:bg-teal-600', path: '/reports/imei-history' },
    { label: 'Payment Report', icon: <Wallet size={32} />, color: 'bg-indigo-500', hover: 'hover:bg-indigo-600', path: '/reports/payment' },
    { label: 'Damage Report', icon: <AlertCircle size={32} />, color: 'bg-orange-500', hover: 'hover:bg-orange-600', path: '/reports/damage' },
    { label: 'Sale Items Report', icon: <TrendingUp size={32} />, color: 'bg-emerald-600', hover: 'hover:bg-emerald-700', path: '/reports/sale-items' },
    { label: 'Phones & Accessories & Services', icon: <Smartphone size={32} />, color: 'bg-indigo-600', hover: 'hover:bg-indigo-700', path: '/reports/product-category' },
    { label: 'External Purchases Report', icon: <ShoppingBag size={32} />, color: 'bg-rose-500', hover: 'hover:bg-rose-600', path: '/reports/external-purchases' },
    { label: 'Stock Adjustment History', icon: <Settings size={32} />, color: 'bg-slate-500', hover: 'hover:bg-slate-600', path: '/reports/adjustment' },
    { label: 'Change Price History', icon: <Settings size={32} />, color: 'bg-indigo-600', hover: 'hover:bg-indigo-700', path: '/reports/selling-price' },
    { label: 'Top Items Report', icon: <TrendingUp size={32} />, color: 'bg-yellow-500', hover: 'hover:bg-yellow-600', path: '/reports/top-items' },
    { label: 'Payable Report', icon: <TrendingDown size={32} />, color: 'bg-red-500', hover: 'hover:bg-red-600', path: '/reports/payable' },
    { label: 'Receivable Report', icon: <Users size={32} />, color: 'bg-blue-600', hover: 'hover:bg-blue-700', path: '/reports/receivable' },
    { label: 'Transfer Report', icon: <ArrowRightLeft size={32} />, color: 'bg-cyan-500', hover: 'hover:bg-cyan-600', path: '/reports/transfer' },
    { label: 'Receive Report', icon: <FileBarChart size={32} />, color: 'bg-purple-500', hover: 'hover:bg-purple-600', path: '/reports/receive' },
    ...(userType === 'admin' ? [{ label: 'Brand Sales Analysis', icon: <TrendingUp size={32} />, color: 'bg-violet-600', hover: 'hover:bg-violet-700', path: '/reports/brand-analytics' }] : []),
  ];

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-40 shrink-0 h-16">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
            <FileBarChart size={20} />
          </div>
          <h1 className="text-xl font-bold">Reports</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 md:p-10 flex items-start justify-center overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {reportCards.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`${item.color} ${item.hover} p-6 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center text-white gap-4 h-48 border border-white/10`}
            >
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm shadow-inner">
                {item.icon}
              </div>
              <span className="font-bold text-lg tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;