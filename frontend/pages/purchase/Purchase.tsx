import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    ShoppingBag, 
    ClipboardList, 
    CornerUpLeft, 
    BellRing, 
    Tags, 
    Building2,
    ArrowRightLeft,
    DownloadCloud
} from 'lucide-react';
import { API_ENDPOINTS, fetcher } from '../../config';

const Purchase: React.FC = () => {
  const navigate = useNavigate();

  const { data } = useSWR<{ success: boolean; count: number }>(
    `${API_ENDPOINTS.INVENTORY_LOW_STOCK}?threshold=min`,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 }
  );

  const lowStockCount = data?.count || 0;

  const menuItems = [
    { label: 'Purchase List', icon: <ShoppingBag size={32} />, color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', path: '/purchase/list' },
    { label: 'Inventory List', icon: <ClipboardList size={32} />, color: 'bg-blue-500', hover: 'hover:bg-blue-600', path: '/purchase/inventory' },
    { label: 'Purchase Return', icon: <CornerUpLeft size={32} />, color: 'bg-red-500', hover: 'hover:bg-red-600', path: '/purchase/return-list' },
    { label: 'Remainder', icon: <BellRing size={32} />, color: 'bg-yellow-500', hover: 'hover:bg-yellow-600', path: '/purchase/remainder' },
    { label: 'Category', icon: <Tags size={32} />, color: 'bg-teal-500', hover: 'hover:bg-teal-600', path: '/purchase/category' },
    { label: 'Supplier', icon: <Building2 size={32} />, color: 'bg-indigo-500', hover: 'hover:bg-indigo-600', path: '/purchase/company' },
    { label: 'Transfer Item', icon: <ArrowRightLeft size={32} />, color: 'bg-emerald-600', hover: 'hover:bg-emerald-700', path: '/purchase/transfer' },
    { label: 'Receive Item', icon: <DownloadCloud size={32} />, color: 'bg-orange-500', hover: 'hover:bg-orange-600', path: '/purchase/receive' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header - Fixed Top */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center border-b border-gray-700 sticky top-0 z-50">
        <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
        >
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Purchase Management</h1>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 md:p-10 flex items-start justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl">
            {menuItems.map((item, index) => (
                <button 
                    key={index}
                    onClick={() => navigate(item.path)}
                    className={`${item.color} ${item.hover} relative p-6 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center text-white gap-4 aspect-square border border-white/10`}
                >
                    {item.label === 'Remainder' && lowStockCount > 0 && (
                        <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-md">
                            {lowStockCount}
                        </div>
                    )}
                    <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                        {item.icon}
                    </div>
                    <span className="font-semibold text-lg tracking-wide">{item.label}</span>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Purchase;
