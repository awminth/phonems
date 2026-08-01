import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TransferTab from './TransferTab';

const TransferPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <div className="sticky top-0 z-40 bg-gray-800 shadow-md border-b border-gray-700">
          <div className="p-4 flex items-center">
            <button 
                onClick={() => navigate('/purchase')}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Item Transfer</h1>
          </div>
      </div>

      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <TransferTab />
      </div>
    </div>
  );
};

export default TransferPage;
