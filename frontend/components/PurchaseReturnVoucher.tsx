import React from 'react';
import { sessionManager, getImageUrl } from '../config';

interface PurchaseReturnItem {
  itemName: string;
  codeNo: string;
  originalQty: number;
  price: number;
  returnQty: number;
  subTotal: number;
  imei1?: string;
  imei2?: string;
}

interface PurchaseReturnVoucherProps {
  voucher: {
    id: string;
    vno: string;
    supplierId: string;
    supplierName: string;
    reason: string;
    originalAmount: number;
    returnAmount: number;
    date: string;
    userId: string;
    userName: string;
  };
  items: PurchaseReturnItem[];
}

const PurchaseReturnVoucher: React.FC<PurchaseReturnVoucherProps> = ({ voucher, items }) => {
  // Get print settings from session
  const printSettings = sessionManager.getPrintSettings();
  
  const shopName = printSettings?.ShopName || 'KYU POS & LIQUOR';
  const address = printSettings?.Address || 'No. 123, Main Street, Yangon';
  const phoneNo = printSettings?.PhoneNo || '09-123456789';
  const logo = printSettings?.Logo || '';
  const showLogo = printSettings?.ChkLogo === 1 && logo;

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const totalQty = items.reduce((sum, item) => sum + item.returnQty, 0);

  return (
    <div className="p-6 overflow-y-auto font-mono text-sm leading-relaxed bg-white text-black receipt-content">
      <div className="text-center mb-4 text-black">
        {showLogo && (
          <div className="mb-3 flex justify-center">
            <img 
              src={getImageUrl(logo)} 
              alt="Shop Logo" 
              className="h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <h2 className="text-xl font-bold uppercase text-black">{shopName}</h2>
        <p className="text-xs text-gray-800">{address}</p>
        <p className="text-xs text-gray-800">Tel: {phoneNo}</p>
        <p className="text-xs text-red-600 font-bold mt-1">** PURCHASE RETURN **</p>
      </div>
      
      <div className="border-b border-dashed border-gray-400 mb-2 pb-2 text-black">
        <div className="flex justify-between text-xs">
          <span>Date: {formatDateTime(voucher.date)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>VNO: {voucher.vno}</span>
          <span>User: {voucher.userName || '-'}</span>
        </div>
      </div>

      {voucher.supplierName && (
        <div className="mb-4 text-xs text-black border-b border-dashed border-gray-400 pb-2">
          <p>Supplier: {voucher.supplierName}</p>
        </div>
      )}

      {voucher.reason && (
        <div className="mb-4 text-xs text-black border-b border-dashed border-gray-400 pb-2">
          <p>Reason: {voucher.reason}</p>
        </div>
      )}

      <table className="w-full mb-4 text-xs text-black">
        <thead>
          <tr className="border-b border-gray-400">
            <th className="text-left py-1 text-black">Item</th>
            <th className="text-center py-1 text-black">Code</th>
            <th className="text-center py-1 text-black">Original Qty</th>
            <th className="text-center py-1 text-black">Return Qty</th>
            <th className="text-right py-1 text-black">Price</th>
            <th className="text-right py-1 text-black">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 text-black">
                <div>{item.itemName || '-'}</div>
                {(item.imei1 || item.imei2) && (
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    IMEI: {item.imei1}{item.imei2 ? `, ${item.imei2}` : ''}
                  </div>
                )}
              </td>
              <td className="text-center py-1 text-black">{item.codeNo || '-'}</td>
              <td className="text-center py-1 text-black">{item.originalQty}</td>
              <td className="text-center py-1 text-black">{item.returnQty}</td>
              <td className="text-right py-1 text-black">{item.price.toLocaleString()}</td>
              <td className="text-right py-1 text-black">{item.subTotal.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-black">
        <div className="flex justify-between text-xs text-gray-800">
          <span>Total Items: {totalQty}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-800">
          <span>Original Amount</span>
          <span>{voucher.originalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold text-base text-red-600 mt-2 pt-2 border-t border-dashed border-gray-400">
          <span>Return Amount</span>
          <span>{voucher.returnAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-800">
        <p>*** Purchase Return Voucher ***</p>
        <p>Thank You!</p>
      </div>
    </div>
  );
};

export default PurchaseReturnVoucher;

