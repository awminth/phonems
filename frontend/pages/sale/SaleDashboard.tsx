
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    ShoppingCart, 
    CreditCard, 
    CornerUpLeft,
    Banknote,
    Wrench
} from 'lucide-react';

const SaleDashboard: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    { label: 'Cash Sale', icon: <Banknote size={32} />, color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', path: '/sale/cash' },
    { label: 'Credit Sale', icon: <CreditCard size={32} />, color: 'bg-blue-500', hover: 'hover:bg-blue-600', path: '/sale/credit' },
    { label: 'Sale Return', icon: <CornerUpLeft size={32} />, color: 'bg-red-500', hover: 'hover:bg-red-600', path: '/sale/return' },
    { label: 'Damage List', icon: <Wrench size={32} />, color: 'bg-orange-500', hover: 'hover:bg-orange-600', path: '/sale/damage' },
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
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500">
                <ShoppingCart size={20} />
            </div>
            <h1 className="text-xl font-bold">Sale Management</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 md:p-10 flex items-start justify-center overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
            {cards.map((item, index) => (
                <button 
                    key={index}
                    onClick={() => navigate(item.path)}
                    className={`${item.color} ${item.hover} p-6 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center text-white gap-4 h-56 border border-white/10`}
                >
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm shadow-inner">
                        {item.icon}
                    </div>
                    <span className="font-bold text-xl tracking-wide">{item.label}</span>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SaleDashboard;