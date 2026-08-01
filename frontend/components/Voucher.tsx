import React from 'react';
import { sessionManager, getImageUrl } from '../config';

interface VoucherItem {
  itemName: string;
  qty: number;
  sellPrice: number;
  amount?: number;
  codeNo?: string;
  imei?: string;
  specification?: string;
}

interface VoucherProps {
  voucher: {
    vno: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    totalQty: number;
    subTotal: number;
    discount: number;
    tax: number;
    otherAmt?: number;
    otherType?: string;
    otherValue?: number;
    total: number;
    cash?: number;
    refund?: number;
    credit?: number;
    cashier?: string;
    date: string;
    paymentType?: string;
    paymentMethod?: string;
    branchName?: string;
    branchInvoiceName?: string;
    branchAddress?: string;
    branchPhone?: string;
    branchLogo?: string;
    branchIncludeLogo?: number;
  };
  items: VoucherItem[];
  showReturnLabel?: boolean;
}

const Voucher: React.FC<VoucherProps> = ({ voucher, items, showReturnLabel = false }) => {
  const printSettings = sessionManager.getPrintSettings();
  const user = sessionManager.getUser();

  // Prefer branch info from the sale record, then current branch, then global settings
  const shopName = voucher.branchInvoiceName || voucher.branchName || printSettings?.ShopName || user?.branch?.name || 'KYU POS & LIQUOR';
  const address = voucher.branchAddress || printSettings?.Address || 'No. 123, Main Street, Yangon';
  const phoneNo = voucher.branchPhone || printSettings?.PhoneNo || '09-123456789';
  const logo = voucher.branchLogo || printSettings?.Logo || '';
  const showLogo = (voucher.branchIncludeLogo === 1 || (voucher.branchIncludeLogo === undefined && printSettings?.ChkLogo === 1)) && logo;

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <>
      <style>{`
        /* Browser margin များကို ဖယ်ရှားခြင်း */
        @page {
          margin: 0;
          size: auto;
        }

        @media print {
          /* Hides everything on the page except the voucher receipt itself */
          body * {
            visibility: hidden;
          }

          .receipt-content, .receipt-content * {
            visibility: visible;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
          }

          /* အဓိက Content ကို ဘေးနှစ်ဖက်ကပ်အောင်ဆွဲဆန့်ခြင်း */
          .receipt-content {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            padding-top: 2px !important; /* ထိပ်ဆုံးမှာ စာမပြတ်ရုံလေးပဲ ချန်ပါမယ် */
            position: absolute;
            left: 0;
            top: 0;
            background: white !important;
          }

          /* ပုံမှန် Browser တွေရဲ့ Header/Footer တွေကိုဖျောက်ဖို့ */
          header, footer {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container - w-full နဲ့ p-0 ကို သေချာပေးထားပါတယ် */}
      <div className="w-full bg-white text-black font-mono text-sm leading-none receipt-content p-3">

        {/* Header Section */}
        <div className="text-center w-full">
          {showLogo && (
            <div className="flex justify-center mb-1 pt-1">
              <img
                src={getImageUrl(logo)}
                alt="Logo"
                className="h-10 object-contain" // Logo အမြင့်ကို h-10 ထိလျှော့ထားပါတယ်
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Margin/Padding တွေကို အတတ်နိုင်ဆုံး လျှော့ချထားပါတယ် */}
          <h2 className="text-lg font-bold uppercase mb-0 mt-0 pt-0 leading-tight">{shopName}</h2>
          <p className="text-xs mt-0.5 mb-0 leading-tight">{address}</p>
          <p className="text-xs mt-0.5 mb-1 leading-tight">Tel: {phoneNo}</p>

          {showReturnLabel && (
            <p className="text-xs text-red-600 font-bold mb-1">** SALE RETURN **</p>
          )}
        </div>

        {/* Folio Details */}
        <div className="border-b border-dashed border-black mb-1 pb-1 w-full">
          <div className="flex justify-between text-xs">
            <span>{formatDateTime(voucher.date)}</span>
          </div>
          <div className="flex justify-between text-xs mt-0.5">
            <span>Folio No: {voucher.vno}</span>
            <span>Cashier: {voucher.cashier || 'Admin'}</span>
          </div>
          {voucher.paymentType && (
            <div className="flex justify-between text-xs mt-0.5">
              <span>Type: <span className="font-bold">{voucher.paymentType}</span></span>
            </div>
          )}
          {/* Fallback or additional method display if different */}
          {voucher.paymentMethod && voucher.paymentMethod !== voucher.paymentType && (
            <div className="flex justify-between text-xs mt-0.5">
              <span>Method: <span className="font-bold">{voucher.paymentMethod}</span></span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        {(voucher.customerName || voucher.customerPhone) && (
          <div className="mb-1 text-xs border-b border-dashed border-black pb-1 w-full">
            {voucher.customerName && <p className="leading-tight mt-0.5">Cus: {voucher.customerName}</p>}
            {voucher.customerPhone && <p className="leading-tight mt-0.5">Ph: {voucher.customerPhone}</p>}
            {voucher.customerAddress && <p className="leading-tight mt-0.5">Addr: {voucher.customerAddress}</p>}
          </div>
        )}

        {/* Items Table - w-full ပေးထားပါတယ် */}
        <table className="w-full mb-1 text-xs table-fixed">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-0.5 w-[40%]">Item</th>
              <th className="text-center py-0.5 w-[15%]">Qty</th>
              <th className="text-right py-0.5 w-[20%]">Price</th>
              <th className="text-right py-0.5 w-[25%]">Amt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td className="py-0.5 align-top break-words pr-1">{item.itemName}</td>
                  <td className="text-center py-0.5 align-top">{item.qty}</td>
                  <td className="text-right py-0.5 align-top">{(item.sellPrice || 0).toLocaleString()}</td>
                  <td className="text-right py-0.5 align-top">{((item.amount || ((item.qty || 0) * (item.sellPrice || 0)))).toLocaleString()}</td>
                </tr>
                {item.imei && (
                  <tr>
                    <td colSpan={4} className="text-[10px] text-gray-800 pl-2 pb-1 italic font-bold">
                      S/N: {item.imei}{item.specification ? ` (${item.specification})` : ''}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="border-t border-dashed border-black pt-1 w-full">
          <div className="flex justify-between text-xs mt-0.5">
            <span>SubTotal</span>
            <span>{(voucher.subTotal || 0).toLocaleString()}</span>
          </div>

          {(voucher.discount || 0) > 0 && (
            <div className="flex justify-between text-xs mt-0.5">
              <span>Discount</span>
              <span>-{(voucher.discount || 0).toLocaleString()}</span>
            </div>
          )}

          {(voucher.tax || 0) > 0 && (
            <div className="flex justify-between text-xs mt-0.5">
              <span>Tax</span>
              <span>+{(voucher.tax || 0).toLocaleString()}</span>
            </div>
          )}

          {(voucher.otherAmt || 0) > 0 && (
            <div className="flex justify-between text-xs mt-0.5">
              <span>Other</span>
              <span>+{(voucher.otherAmt || 0).toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-sm text-black mt-1 pt-1 border-t border-dashed border-black">
            <span>{showReturnLabel ? 'Refund Total' : 'Total'}</span>
            <span>{(voucher.total || 0).toLocaleString()}</span>
          </div>

          {showReturnLabel ? (
            <div className="flex justify-between text-xs font-bold mt-1">
              <span>Refund Amount</span>
              <span>{(voucher.refund || voucher.total || 0).toLocaleString()}</span>
            </div>
          ) : (
            <>
              {voucher.cash !== undefined && voucher.cash > 0 && (
                <div className="flex justify-between text-xs mt-1">
                  <span>Cash</span>
                  <span>{(voucher.cash || 0).toLocaleString()}</span>
                </div>
              )}

              {voucher.refund !== undefined && voucher.refund > 0 && (
                <div className="flex justify-between text-xs font-bold mt-0.5">
                  <span>Change</span>
                  <span>{voucher.refund.toLocaleString()}</span>
                </div>
              )}
            </>
          )}

          {voucher.credit !== undefined && voucher.credit > 0 && (
            <div className="flex justify-between text-xs text-orange-600 font-bold mt-0.5">
              <span>Credit</span>
              <span>{voucher.credit.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="mt-2 text-center text-xs pb-4">
          <p className="leading-tight">*** Thank You! ***</p>
          <p className="leading-tight">Please come again</p>
        </div>
      </div>
    </>
  );
};

export default Voucher;