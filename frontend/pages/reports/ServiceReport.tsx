import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight, 
    Filter, 
    RefreshCw, 
    Loader2,
    Calendar,
    Wrench,
    Check,
    ChevronDown,
    Smartphone,
    User,
    ShieldCheck,
    FileText,
    Eye,
    Printer,
    X
} from 'lucide-react';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, SWR_CONFIG, sessionManager, apiClient, getImageUrl } from '../../config';
import { exportStyledExcel } from '../../utils/excelHelper';

const DOTS = [
  { id: 0, x: 50, y: 50 },
  { id: 1, x: 150, y: 50 },
  { id: 2, x: 250, y: 50 },
  { id: 3, x: 50, y: 150 },
  { id: 4, x: 150, y: 150 },
  { id: 5, x: 250, y: 150 },
  { id: 6, x: 50, y: 250 },
  { id: 7, x: 150, y: 250 },
  { id: 8, x: 250, y: 250 },
];

const findDotNear = (pos: { x: number; y: number }) => {
  return DOTS.find(dot => {
    const dx = dot.x - pos.x;
    const dy = dot.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) < 25; // 25px radius
  });
};

const getMousePos = (
  e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>,
  svgRef: React.RefObject<SVGSVGElement | null>
) => {
  if (!svgRef.current) return null;
  const rect = svgRef.current.getBoundingClientRect();
  
  let clientX, clientY;
  if ('touches' in e) {
    if (e.touches.length === 0) return null;
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const x = ((clientX - rect.left) / rect.width) * 300;
  const y = ((clientY - rect.top) / rect.height) * 300;
  return { x, y };
};

interface PatternLockProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  sizeClass?: string;
}

const PatternLock: React.FC<PatternLockProps> = ({ value, onChange, readOnly = false, sizeClass = "w-60 h-60" }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTouchPos, setCurrentTouchPos] = useState<{ x: number; y: number } | null>(null);

  const path = value ? value.split('-').map(Number).filter(n => !isNaN(n)) : [];

  const handleStart = (pos: { x: number; y: number }) => {
    if (readOnly) return;
    const dot = findDotNear(pos);
    if (dot) {
      setIsDrawing(true);
      onChange(dot.id.toString());
    }
  };

  const handleMove = (pos: { x: number; y: number }) => {
    if (readOnly || !isDrawing) return;
    setCurrentTouchPos(pos);
    const dot = findDotNear(pos);
    if (dot && !path.includes(dot.id)) {
      const newPath = [...path, dot.id];
      onChange(newPath.join('-'));
    }
  };

  const handleEnd = () => {
    if (readOnly) return;
    setIsDrawing(false);
    setCurrentTouchPos(null);
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getMousePos(e, svgRef);
    if (pos) handleStart(pos);
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getMousePos(e, svgRef);
    if (pos) handleMove(pos);
  };

  const onTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    const pos = getMousePos(e, svgRef);
    if (pos) handleStart(pos);
  };

  const onTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    const pos = getMousePos(e, svgRef);
    if (pos) handleMove(pos);
  };

  return (
    <div className="flex flex-col items-center gap-3 font-sans">
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className={`${sizeClass} bg-gray-950/80 border border-gray-700 rounded-2xl touch-none select-none`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
      >
        {/* Draw lines */}
        {path.map((dotId, idx) => {
          if (idx === 0) return null;
          const prevDot = DOTS[path[idx - 1]];
          const currDot = DOTS[dotId];
          return (
            <line
              key={idx}
              x1={prevDot.x}
              y1={prevDot.y}
              x2={currDot.x}
              y2={currDot.y}
              stroke="#06b6d4"
              strokeWidth={8}
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            />
          );
        })}

        {/* Draw dragging line */}
        {isDrawing && path.length > 0 && currentTouchPos && (
          <line
            x1={DOTS[path[path.length - 1]].x}
            y1={DOTS[path[path.length - 1]].y}
            x2={currentTouchPos.x}
            y2={currentTouchPos.y}
            stroke="#22d3ee"
            strokeWidth={6}
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        )}

        {/* Draw dots */}
        {DOTS.map(dot => {
          const isActive = path.includes(dot.id);
          const isLast = path[path.length - 1] === dot.id;
          return (
            <g key={dot.id}>
              {isActive && (
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={22}
                  fill="none"
                  stroke={isLast ? '#22d3ee' : '#0891b2'}
                  strokeWidth={2}
                  className="animate-pulse"
                />
              )}
              <circle
                cx={dot.x}
                cy={dot.y}
                r={isActive ? 12 : 8}
                fill={isActive ? '#06b6d4' : '#4b5563'}
                className="transition-all duration-150 cursor-pointer"
              />
              {isActive && (
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={4}
                  fill="#ffffff"
                />
              )}
            </g>
          );
        })}
      </svg>
      
      {!readOnly && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-gray-400 hover:text-white px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg transition-colors"
        >
          ပုံစံပြန်ဆွဲရန် (Clear)
        </button>
      )}
    </div>
  );
};

// Searchable Dropdown for Customer
interface SearchableDropdownProps {
    options: { id: string, name: string; phone?: string }[];
    value: string;
    onChange: (id: string) => void;
    placeholder: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id.toString() === value.toString());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => 
        o.name.toLowerCase().includes(search.toLowerCase()) || 
        (o.phone && o.phone.includes(search))
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <div 
                className="w-full bg-gray-900 border border-gray-650 rounded-lg py-2 px-3 flex justify-between items-center cursor-pointer text-sm focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-white' : 'text-gray-400'}>
                    {selectedOption ? `${selectedOption.name} (${selectedOption.phone || ''})` : placeholder}
                </span>
                <ChevronDown size={16} className="text-gray-400"/>
            </div>
            
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                        <div className="flex items-center bg-gray-700 rounded px-2">
                            <Search size={14} className="text-gray-400 mr-2"/>
                            <input 
                                type="text"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1 text-white placeholder-gray-500 outline-none"
                                placeholder="Search customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div 
                                    key={option.id}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-600 hover:text-white flex justify-between items-center ${option.id.toString() === value.toString() ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span>{option.name} <span className="text-xs text-gray-450">({option.phone || 'No phone'})</span></span>
                                    {option.id.toString() === value.toString() && <Check size={14} />}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-gray-500 text-center">No customers found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ServiceReport: React.FC = () => {
    const navigate = useNavigate();
    const isAdmin = sessionManager.getUserType() === 'admin';

    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const openTicketDetails = async (ticket: any) => {
        setIsDetailOpen(true);
        setSelectedTicket(ticket);
        setIsDetailLoading(true);
        try {
            const response = await apiClient.get(API_ENDPOINTS.SERVICE_TICKET_BY_ID(ticket.id));
            if (response.success) {
                setSelectedTicket(response.data);
            }
        } catch (err) {
            console.error('Fetch ticket details error:', err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handlePrintReceipt = (ticket: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const partsTotal = ticket.parts ? ticket.parts.reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.qty || 0)), 0) : 0;
        const laborFee = Math.max(0, Number(ticket.totalAmount || 0) - partsTotal);

        const partsListHtml = ticket.parts && ticket.parts.length > 0 
          ? ticket.parts.map((p: any) => `
              <div class="row" style="font-size: 12px; font-style: italic; padding-left: 10px;">
                <span>- ${p.partName} x${p.qty} (${p.isExternal ? 'ပြင်ပဝယ်' : 'ဆိုင်ရှိ'})</span>
                <span class="value">${(Number(p.price || 0) * Number(p.qty || 0)).toLocaleString()} Ks</span>
              </div>
            `).join('')
          : '<div class="row" style="font-size: 12px; font-style: italic; padding-left: 10px;"><span>အသုံးပြုသည့် ပစ္စည်းမရှိပါ</span><span class="value">0 Ks</span></div>';

        const formattedDate = new Date(ticket.createdAt || ticket.date).toLocaleString();
        const formattedEstDate = ticket.estimatedCompletionDate 
          ? new Date(ticket.estimatedCompletionDate).toLocaleString() 
          : 'သတ်မှတ်မထားပါ';

        const netBalance = Number(ticket.totalAmount || 0) - Number(ticket.deposit || 0);

        printWindow.document.write(`
          <html>
            <head>
              <title>ပြုပြင်ရေးဘောက်ချာ #${ticket.ticketNo}</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 14px; padding: 20px; color: #000; }
                .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
                .title { font-size: 18px; font-weight: bold; }
                .section { margin-bottom: 12px; }
                .section-title { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; }
                .row { display: flex; justify-content: space-between; margin: 3px 0; }
                .label { font-weight: bold; }
                .value { text-align: right; }
                .footer { border-top: 2px dashed #000; margin-top: 20px; padding-top: 10px; text-align: center; font-size: 12px; }
                @media print {
                  body { padding: 0; margin: 0; width: 80mm; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">Marctober Phone & Service POS</div>
                <div>ဖုန်းအရောင်းနှင့် ပြုပြင်ရေးစင်တာ</div>
                <div>တိုကင်နံပါတ်: ${ticket.ticketNo}</div>
                <div>ရက်စွဲ: ${formattedDate}</div>
              </div>

              <div class="section">
                <div class="section-title">ဝယ်ယူသူ အချက်အလက်</div>
                <div class="row"><span class="label">အမည်:</span><span class="value">${ticket.customerName}</span></div>
                <div class="row"><span class="label">ဖုန်း:</span><span class="value">${ticket.customerPhone || '-'}</span></div>
              </div>

              <div class="section">
                <div class="section-title">ဖုန်းအချက်အလက်</div>
                <div class="row"><span class="label">မော်ဒယ်:</span><span class="value">${ticket.deviceBrandModel}</span></div>
                <div class="row"><span class="label">အရောင်:</span><span class="value">${ticket.deviceColor || '-'}</span></div>
                <div class="row"><span class="label">IMEI/Serial:</span><span class="value">${ticket.serialNumberImei || '-'}</span></div>
                <div class="row"><span class="label">Password:</span><span class="value">${ticket.password || '-'}</span></div>
              </div>

              <div class="section">
                <div class="section-title">လက်ခံစဉ် ဖုန်းအခြေအနေ</div>
                <div>အခြေအနေ: ${(() => {
                  let conditionText = ticket.scratchCondition || 'ပုံမှန်';
                  if (ticket.scratchCondition && ticket.scratchCondition.trim().startsWith('{')) {
                    try {
                      const parsed = JSON.parse(ticket.scratchCondition);
                      conditionText = parsed.condition || 'ပုံမှန်';
                      const accList = [];
                      if (parsed.hasSimCard) accList.push('SIM Card (' + parsed.simCardQty + 'ခု)');
                      if (parsed.hasChargerCable) accList.push('အားသွင်းကြိုး');
                      if (parsed.hasChargerDock) accList.push('အားသွင်းခုံ');
                      if (parsed.otherAccessories) accList.push(parsed.otherAccessories);
                      if (accList.length > 0) {
                        conditionText += ' <br/><span style="font-size: 12px; font-weight: normal;">(ပါဝင်သည့်ပစ္စည်း - ' + accList.join(', ') + ')</span>';
                      }
                    } catch (e) {}
                  }
                  return conditionText;
                })()}</div>
              </div>

              <div class="section">
                <div class="section-title">ပြုပြင်ရန် အချက်</div>
                <div>ချို့ယွင်းချက်: ${ticket.problemType}</div>
                <div>ပြီးစီးမည့်ရက်: ${formattedEstDate}</div>
              </div>

              <div class="section">
                <div class="section-title">ပစ္စည်းနှင့် ဝန်ဆောင်မှုခ</div>
                <div class="row"><span class="label">ဝန်ဆောင်မှု လက်ခ:</span><span class="value">${laborFee.toLocaleString()} Ks</span></div>
                <div class="row"><span class="label">ပစ္စည်း စုစုပေါင်း:</span><span class="value">${partsTotal.toLocaleString()} Ks</span></div>
                <div style="border-top: 1px dotted #000; margin: 5px 0;"></div>
                ${partsListHtml}
              </div>

              <div class="section">
                <div class="section-title">ငွေစာရင်း အကျဉ်းချုပ်</div>
                <div class="row"><span class="label">စုစုပေါင်း ကျသင့်ငွေ:</span><span class="value">${ticket.totalAmount.toLocaleString()} Ks</span></div>
                <div class="row"><span class="label">စရန်ငွေ ပေးချေမှု:</span><span class="value">${ticket.deposit.toLocaleString()} Ks</span></div>
                <div class="row" style="font-weight: bold; border-top: 1px dotted #000; padding-top: 3px;">
                  <span class="label">ပေးရန်ကျန်ငွေ:</span><span class="value">${netBalance.toLocaleString()} Ks</span>
                </div>
              </div>

              <div class="footer">
                <p>Marctober Phone & Service POS ကို ရွေးချယ်မှု ကျေးဇူးတင်ပါသည်!</p>
                <p>စက်ပစ္စည်း ပြန်လည်ထုတ်ယူရန် ဤဘောက်ချာပြသပေးပါ။</p>
              </div>
              
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
    };

    const handleDirectPrint = async (ticket: any) => {
        try {
            const response = await apiClient.get(API_ENDPOINTS.SERVICE_TICKET_BY_ID(ticket.id));
            if (response.success && response.data) {
                handlePrintReceipt(response.data);
            } else {
                alert(response.message || 'ဘောက်ချာထုတ်ရန် အချက်အလက် ခေါ်ယူခြင်း မအောင်မြင်ပါ');
            }
        } catch (err) {
            console.error('Error fetching ticket details for print:', err);
            handlePrintReceipt(ticket);
        }
    };

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [view, setView] = useState<'voucher' | 'item'>('voucher');

    // Filter panel states
    const [showFilters, setShowFilters] = useState(false);
    
    // Inputs (Temporary)
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [filterCustomerId, setFilterCustomerId] = useState('');
    const [filterDeviceModel, setFilterDeviceModel] = useState('');
    const [filterImei, setFilterImei] = useState('');
    const [filterVoucher, setFilterVoucher] = useState('');
    const [filterSearch, setFilterSearch] = useState('');

    // Applied states (triggers fetch)
    const [activeFromDate, setActiveFromDate] = useState('');
    const [activeToDate, setActiveToDate] = useState('');
    const [activeCustomerId, setActiveCustomerId] = useState('');
    const [activeDeviceModel, setActiveDeviceModel] = useState('');
    const [activeImei, setActiveImei] = useState('');
    const [activeVoucher, setActiveVoucher] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [activeBranchId, setActiveBranchId] = useState('');

    const buildQuery = () => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        params.append('view', view);

        if (activeSearch) params.append('search', activeSearch);
        if (activeFromDate) params.append('fromDate', activeFromDate);
        if (activeToDate) params.append('toDate', activeToDate);
        if (activeCustomerId && activeCustomerId !== 'all') params.append('customerId', activeCustomerId);
        if (activeDeviceModel.trim()) params.append('deviceBrandModel', activeDeviceModel.trim());
        if (activeImei.trim()) params.append('serialNumberImei', activeImei.trim());
        if (activeVoucher.trim()) params.append('ticketNo', activeVoucher.trim());
        if (activeBranchId && activeBranchId !== 'all') params.append('branchId', activeBranchId);

        return params.toString();
    };

    // SWR fetch report data
    // Note: Config includes backend routes mapped to "/reports/services" (from config.js is API_ENDPOINTS.REPORT_SERVICE_TICKETS)
    const { data, error, isLoading, mutate } = useSWR(
        `${(API_ENDPOINTS as any).REPORT_SERVICE_TICKETS}?${buildQuery()}`,
        fetcher,
        SWR_CONFIG
    );

    // Fetch branches (Admin only)
    const { data: branchData } = useSWR(
        isAdmin ? API_ENDPOINTS.BRANCHES : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    // Fetch customers dropdown
    const { data: customerData } = useSWR(
        API_ENDPOINTS.CUSTOMERS_DROPDOWN,
        fetcher,
        { revalidateOnFocus: false }
    );

    const reportRows = data?.data || [];
    const totals = data?.totals || { qty: 0, amount: 0, deposit: 0, partsCost: 0, profit: 0 };
    const pagination = data?.pagination || { total: 0, totalPages: 1 };
    const branches = branchData?.data || [];
    const customers = customerData?.data || [];

    const handleApplyFilters = () => {
        setActiveFromDate(filterFromDate);
        setActiveToDate(filterToDate);
        setActiveCustomerId(filterCustomerId);
        setActiveDeviceModel(filterDeviceModel);
        setActiveImei(filterImei);
        setActiveVoucher(filterVoucher);
        setActiveSearch(filterSearch);
        setPage(1);
    };

    const handleResetFilters = () => {
        setFilterFromDate('');
        setFilterToDate('');
        setFilterCustomerId('');
        setFilterDeviceModel('');
        setFilterImei('');
        setFilterVoucher('');
        setFilterSearch('');

        setActiveFromDate('');
        setActiveToDate('');
        setActiveCustomerId('');
        setActiveDeviceModel('');
        setActiveImei('');
        setActiveVoucher('');
        setActiveSearch('');
        setPage(1);
    };

    const handleExport = () => {
        if (reportRows.length === 0) return;

        const title = view === 'voucher' ? 'Service Report (Voucher-wise)' : 'Service Report (Service Items-wise)';
        let headers: string[] = [];
        let excelData: any[][] = [];

        if (view === 'voucher') {
            headers = ['Date Picked up', 'Ticket No', 'Customer Name', 'Phone No', 'Device Brand Model', 'Color', 'IMEI/Serial', 'Problem Type', 'Parts Price', 'Labor Fee', 'Total Amount', 'Deposit', 'Paid'];
            excelData = reportRows.map((row: any) => {
                const partsCost = row.partsCost || 0;
                const partsPrice = row.partsPrice || 0;
                const laborFee = Math.max(0, row.totalAmount - partsPrice);
                return [
                    row.date ? new Date(row.date).toLocaleDateString() : '',
                    row.ticketNo,
                    row.customerName,
                    row.customerPhone,
                    row.deviceBrandModel,
                    row.deviceColor || '-',
                    row.serialNumberImei || '-',
                    row.problemType,
                    partsPrice,
                    laborFee,
                    row.totalAmount,
                    row.deposit,
                    row.totalAmount - row.deposit
                ];
            });

            // Summary row
            excelData.push([
                '', 'TOTALS', totals.qty, '', '', '', '', '', 
                '', // partsPrice total (calculated in frontend if needed, or leave blank)
                '', // laborFee total
                totals.amount, 
                totals.deposit, 
                totals.amount - totals.deposit
            ]);
        } else {
            headers = ['Date Picked up', 'Ticket No', 'Customer Name', 'Item / Part Name', 'Qty', 'Unit Price', 'Total', 'Cost', 'Profit', 'Item Type'];
            excelData = reportRows.map((row: any) => [
                row.date ? new Date(row.date).toLocaleDateString() : '',
                row.ticketNo,
                row.customerName,
                row.itemName,
                row.qty,
                row.price,
                row.total,
                row.cost,
                row.profit,
                row.itemType
            ]);

            excelData.push([
                '', 'TOTALS', '', '', 
                totals.qty, 
                '', 
                totals.amount, 
                '', 
                totals.profit, 
                ''
            ]);
        }

        const timestamp = new Date().toISOString().split('T')[0];
        exportStyledExcel(title, headers, excelData, `service_report_${view}_${timestamp}.xlsx`, 'Service Report');
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col font-sans overflow-hidden">
            
            {/* Header */}
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 h-16 shrink-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/reports')} className="p-2 rounded-full hover:bg-gray-700 text-gray-300 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="bg-pink-500/20 p-2 rounded-lg text-pink-500">
                        <Wrench size={20} />
                    </div>
                    <h1 className="text-xl font-bold">Service Report (Status: Picked-up)</h1>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    {view === 'voucher' ? (
                        <>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs">Total Tickets</span>
                                <span className="font-bold text-pink-400">{Number(totals.qty || 0)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs">Total Charged</span>
                                <span className="font-bold text-blue-400">{Number(totals.amount || 0).toLocaleString()} KS</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs">Total Deposit</span>
                                <span className="font-bold text-yellow-500">{Number(totals.deposit || 0).toLocaleString()} KS</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs">Total Paid</span>
                                <span className="font-bold text-emerald-400">{(Number(totals.amount || 0) - Number(totals.deposit || 0)).toLocaleString()} KS</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs">Total Items Qty</span>
                                <span className="font-bold text-pink-400">{Number(totals.qty || 0)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs">Total Sales</span>
                                <span className="font-bold text-blue-400">{Number(totals.amount || 0).toLocaleString()} KS</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400 text-xs">Total Profit</span>
                                <span className="font-bold text-emerald-400">{Number(totals.profit || 0).toLocaleString()} KS</span>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                
                {/* Collapsible Sidebar Filters */}
                <aside className="w-full lg:w-80 bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-xl">
                    <div className="flex items-center justify-between text-blue-400 border-b border-gray-700 pb-2">
                        <div className="flex items-center gap-2">
                            <Filter size={20} />
                            <h2 className="font-bold text-lg">Filters</h2>
                        </div>
                        {(activeFromDate || activeToDate || activeCustomerId || activeDeviceModel || activeImei || activeVoucher || activeSearch || activeBranchId) && (
                            <button 
                                onClick={handleResetFilters}
                                className="text-xs text-red-400 hover:text-red-300 hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Branch (Admin Only) */}
                        {isAdmin && (
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">Branch</label>
                                <select 
                                    value={activeBranchId}
                                    onChange={(e) => { setActiveBranchId(e.target.value); setPage(1); }}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b: any) => (
                                        <option key={b.id} value={b.branchId}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Search keyword */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Keyword Search</label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text"
                                    value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                                    placeholder="Ticket, customer, problem..."
                                    className="w-full bg-gray-900 border border-gray-650 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Ticket / Voucher No */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Ticket Number</label>
                            <input 
                                type="text"
                                value={filterVoucher}
                                onChange={(e) => setFilterVoucher(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                                placeholder="st-1000xxx..."
                                className="w-full bg-gray-900 border border-gray-650 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Customer Searchable Dropdown */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Customer</label>
                            <SearchableDropdown
                                options={[{ id: '', name: 'All Customers' }, ...customers]}
                                value={filterCustomerId}
                                onChange={(id) => setFilterCustomerId(id)}
                                placeholder="Select Customer"
                            />
                        </div>

                        {/* Phone Model */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">Phone Model</label>
                            <input 
                                type="text"
                                value={filterDeviceModel}
                                onChange={(e) => setFilterDeviceModel(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                                placeholder="iPhone, Samsung..."
                                className="w-full bg-gray-900 border border-gray-650 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* IMEI */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 block mb-1">IMEI / Serial</label>
                            <input 
                                type="text"
                                value={filterImei}
                                onChange={(e) => setFilterImei(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                                placeholder="IMEI number..."
                                className="w-full bg-gray-900 border border-gray-650 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">From Date</label>
                                <input 
                                    type="date" 
                                    value={filterFromDate}
                                    onChange={(e) => setFilterFromDate(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 block mb-1">To Date</label>
                                <input 
                                    type="date" 
                                    value={filterToDate}
                                    onChange={(e) => setFilterToDate(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-2 space-y-2">
                            <button 
                                onClick={handleApplyFilters}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Search size={16} /> Search / Apply
                            </button>
                            <button 
                                onClick={handleExport}
                                disabled={reportRows.length === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Download size={16} /> Export Excel
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Right Content View */}
                <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative p-4 lg:p-6">
                    
                    {/* Tabs Navigation */}
                    <div className="flex bg-gray-800 border-b border-gray-700 rounded-xl overflow-hidden text-sm mb-6 shrink-0">
                        <button
                            type="button"
                            onClick={() => { setView('voucher'); setPage(1); }}
                            className={`flex-1 px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                                view === 'voucher'
                                    ? 'border-blue-500 text-blue-400 bg-gray-750/30'
                                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                            }`}
                        >
                            <FileText size={16} /> Voucher-wise Report
                        </button>
                        <button
                            type="button"
                            onClick={() => { setView('item'); setPage(1); }}
                            className={`flex-1 px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                                view === 'item'
                                    ? 'border-blue-500 text-blue-400 bg-gray-750/30'
                                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                            }`}
                        >
                            <Wrench size={16} /> Service Items-wise Report
                        </button>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto bg-gray-800 rounded-xl border border-gray-700 shadow-lg text-xs md:text-sm">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 size={40} className="animate-spin text-blue-500" />
                            </div>
                        ) : reportRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic">
                                <Wrench size={40} className="mb-2 opacity-20" />
                                No repair tickets or parts found matching the selected filters.
                            </div>
                        ) : (
                            view === 'voucher' ? (
                                <table className="w-full text-left border-collapse min-w-[1400px]">
                                    <thead className="bg-gray-900/50 sticky top-0 z-10 text-[10px] md:text-xs uppercase font-bold tracking-wider text-gray-400 border-b border-gray-700">
                                        <tr>
                                            <th className="p-4 text-center w-16">#</th>
                                            <th className="p-4">Date Picked Up</th>
                                            <th className="p-4">Ticket No</th>
                                            <th className="p-4">Customer Info</th>
                                            <th className="p-4">Device Model / Color</th>
                                            <th className="p-4">IMEI / Serial</th>
                                            <th className="p-4">Problem Type</th>
                                            <th className="p-4 text-right">Parts Price</th>
                                            <th className="p-4 text-right">Labor Fee</th>
                                            <th className="p-4 text-right font-bold">Grand Total</th>
                                            <th className="p-4 text-right text-yellow-500">Deposit</th>
                                            <th className="p-4 text-right font-bold text-emerald-450">Paid</th>
                                            <th className="p-4 text-center w-20">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {reportRows.map((item: any, index: number) => {
                                            const partsPrice = Number(item.partsPrice || 0);
                                            const laborFee = Math.max(0, Number(item.totalAmount || 0) - partsPrice);
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                                                    <td className="p-4 text-center text-xs text-gray-500">{(page - 1) * limit + index + 1}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5 text-gray-300">
                                                            <Calendar size={12} className="text-gray-550" />
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-blue-400">{item.ticketNo}</td>
                                                    <td className="p-4">
                                                        <div className="font-semibold text-white">{item.customerName || 'No Name'}</div>
                                                        <div className="text-xs text-gray-400">{item.customerPhone || '-'}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-semibold text-white">{item.deviceBrandModel}</div>
                                                        <div className="text-xs text-gray-400">{item.deviceColor || '-'}</div>
                                                    </td>
                                                    <td className="p-4 font-mono text-gray-300">{item.serialNumberImei || '-'}</td>
                                                    <td className="p-4 text-gray-300 truncate max-w-[200px]" title={item.problemType}>{item.problemType}</td>
                                                    <td className="p-4 text-right text-gray-400">{partsPrice.toLocaleString()}</td>
                                                    <td className="p-4 text-right text-gray-400">{laborFee.toLocaleString()}</td>
                                                    <td className="p-4 text-right font-bold text-white">{Number(item.totalAmount || 0).toLocaleString()}</td>
                                                    <td className="p-4 text-right text-yellow-500/80">{Number(item.deposit || 0).toLocaleString()}</td>
                                                    <td className="p-4 text-right font-bold text-emerald-400">{(Number(item.totalAmount || 0) - Number(item.deposit || 0)).toLocaleString()}</td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => openTicketDetails(item)} 
                                                            className="p-1.5 text-yellow-500 hover:bg-yellow-900/30 rounded transition-colors" 
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-gray-900/30 font-bold border-t border-gray-700 sticky bottom-0 z-10">
                                        <tr className="border-b border-gray-700/50">
                                            <td colSpan={7} className="p-4 text-right text-gray-400 uppercase text-xs">Page Total</td>
                                            <td className="p-4 text-right text-gray-300">
                                                {reportRows.reduce((sum: number, r: any) => sum + Number(r.partsPrice || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-gray-300">
                                                {reportRows.reduce((sum: number, r: any) => sum + Math.max(0, Number(r.totalAmount || 0) - Number(r.partsPrice || 0)), 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-blue-400">
                                                {reportRows.reduce((sum: number, r: any) => sum + Number(r.totalAmount || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-yellow-500">
                                                {reportRows.reduce((sum: number, r: any) => sum + Number(r.deposit || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-emerald-400">
                                                {reportRows.reduce((sum: number, r: any) => sum + (Number(r.totalAmount || 0) - Number(r.deposit || 0)), 0).toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr className="bg-gray-900/60">
                                            <td colSpan={7} className="p-4 text-right text-gray-400 uppercase text-xs">Grand Total</td>
                                            <td className="p-4 text-right text-gray-350">
                                                {/* Left blank / not direct summarized in totals */}
                                            </td>
                                            <td className="p-4 text-right text-gray-350">
                                                {/* Left blank */}
                                            </td>
                                            <td className="p-4 text-right text-blue-450">{Number(totals.amount || 0).toLocaleString()} KS</td>
                                            <td className="p-4 text-right text-yellow-450">{Number(totals.deposit || 0).toLocaleString()} KS</td>
                                            <td className="p-4 text-right text-emerald-450">{(Number(totals.amount || 0) - Number(totals.deposit || 0)).toLocaleString()} KS</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead className="bg-gray-900/50 sticky top-0 z-10 text-[10px] md:text-xs uppercase font-bold tracking-wider text-gray-400 border-b border-gray-700">
                                        <tr>
                                            <th className="p-4 text-center w-16">#</th>
                                            <th className="p-4">Date Picked Up</th>
                                            <th className="p-4">Ticket No</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Item / Part Name</th>
                                            <th className="p-4 text-center">Qty</th>
                                            <th className="p-4 text-right">Unit Price</th>
                                            <th className="p-4 text-right font-bold">Total</th>
                                            <th className="p-4 text-right">Cost</th>
                                            <th className="p-4 text-right font-bold text-emerald-450">Profit</th>
                                            <th className="p-4">Item Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {reportRows.map((item: any, index: number) => (
                                            <tr key={item.uniqueId} className="hover:bg-gray-750 transition-colors">
                                                <td className="p-4 text-center text-xs text-gray-500">{(page - 1) * limit + index + 1}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1.5 text-gray-300">
                                                        <Calendar size={12} className="text-gray-550" />
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono font-bold text-blue-400">{item.ticketNo}</td>
                                                <td className="p-4 text-white font-medium">{item.customerName || '-'}</td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-white">{item.itemName}</div>
                                                    <div className="text-xs text-gray-500">{item.deviceBrandModel}</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-0.5 bg-gray-700 text-gray-200 rounded text-xs font-bold">{Number(item.qty || 0)}</span>
                                                </td>
                                                <td className="p-4 text-right text-gray-400">{Number(item.price || 0).toLocaleString()}</td>
                                                <td className="p-4 text-right font-bold text-white">{Number(item.total || 0).toLocaleString()}</td>
                                                <td className="p-4 text-right text-gray-400">{Number(item.cost || 0).toLocaleString()}</td>
                                                <td className={`p-4 text-right font-bold ${Number(item.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {Number(item.profit || 0).toLocaleString()}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        item.itemType === 'Service / Labor' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50' : 
                                                        item.itemType === 'External Part' ? 'bg-purple-900/30 text-purple-400 border border-purple-800/50' : 
                                                        'bg-indigo-900/30 text-indigo-400 border border-indigo-800/50'
                                                    }`}>
                                                        {item.itemType}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-900/30 font-bold border-t border-gray-700 sticky bottom-0 z-10">
                                        <tr className="border-b border-gray-700/50">
                                            <td colSpan={5} className="p-4 text-right text-gray-400 uppercase text-xs">Page Total</td>
                                            <td className="p-4 text-center text-emerald-400">{reportRows.reduce((sum: number, r: any) => sum + Number(r.qty || 0), 0)}</td>
                                            <td className="p-4"></td>
                                            <td className="p-4 text-right text-blue-400">{reportRows.reduce((sum: number, r: any) => sum + Number(r.total || 0), 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-gray-400">{reportRows.reduce((sum: number, r: any) => sum + Number(r.cost || 0), 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-emerald-400">{reportRows.reduce((sum: number, r: any) => sum + Number(r.profit || 0), 0).toLocaleString()}</td>
                                            <td className="p-4"></td>
                                        </tr>
                                        <tr className="bg-gray-900/60">
                                            <td colSpan={5} className="p-4 text-right text-gray-400 uppercase text-xs">Grand Total</td>
                                            <td className="p-4 text-center text-pink-400">{Number(totals.qty || 0)}</td>
                                            <td className="p-4"></td>
                                            <td className="p-4 text-right text-blue-450">{Number(totals.amount || 0).toLocaleString()} KS</td>
                                            <td className="p-4"></td>
                                            <td className="p-4 text-right text-emerald-450">{Number(totals.profit || 0).toLocaleString()} KS</td>
                                            <td className="p-4"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )
                        )}
                    </div>

                    {/* Pagination Controls */}
                    <div className="mt-4 flex items-center justify-between shrink-0">
                        <div className="text-sm text-gray-500">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} entries
                        </div>
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                        let pageNum = page;
                                        if (page <= 3) pageNum = i + 1;
                                        else if (page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                                        else pageNum = page - 2 + i;

                                        if (pageNum <= 0 || pageNum > pagination.totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button 
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            {/* Detail Modal */}
            {isDetailOpen && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in text-sm text-left">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]">
                        
                        {/* Detail Header */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="text-blue-500"/> ပြုပြင်မှုအသေးစိတ် အချက်အလက်
                                </h2>
                                <p className="text-xs text-blue-400 font-mono mt-0.5">တိုကင်နံပါတ်: {selectedTicket.ticketNo}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleDirectPrint(selectedTicket)} 
                                    className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl transition-all font-semibold flex items-center gap-1 text-sm border border-yellow-500/20"
                                >
                                    <Printer size={16} /> ဘောက်ချာထုတ်ရန်
                                </button>
                                <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-white transition-colors p-2"><X size={24} /></button>
                            </div>
                        </div>

                        {/* Detail Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {isDetailLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* Left side info */}
                                        <div className="space-y-4">
                                            {/* Status Panel (Read-only) */}
                                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-750 flex items-center justify-between">
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-450 uppercase mb-1">ပြုပြင်မှုအခြေအနေ</span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-600 bg-gray-700/50 text-gray-300`}>
                                                      အပ်နှံပြီး (ယူသွားပြီ)
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-xs font-bold text-gray-450 uppercase mb-1">အပ်နှံသည့်နေ့စွဲ</span>
                                                    <span className="text-white text-xs font-semibold font-mono">
                                                        {selectedTicket.date ? new Date(selectedTicket.date).toLocaleDateString() : (selectedTicket.updatedAt ? new Date(selectedTicket.updatedAt).toLocaleDateString() : '-')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">ဝယ်ယူသူ အချက်အလက်</h3>
                                                <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 space-y-1">
                                                    <p className="text-white font-bold text-md">{selectedTicket.customerName}</p>
                                                    <p className="text-sm text-gray-300">ဖုန်း: {selectedTicket.customerPhone || '-'}</p>
                                                    {selectedTicket.customerAddress && <p className="text-xs text-gray-400 mt-1">လိပ်စာ: {selectedTicket.customerAddress}</p>}
                                                </div>
                                            </div>

                                            {/* Device Info */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">ဖုန်းအချက်အလက်</h3>
                                                <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 space-y-2">
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div><span className="text-gray-450 text-xs">မော်ဒယ်:</span> <p className="font-semibold text-white">{selectedTicket.deviceBrandModel}</p></div>
                                                        <div><span className="text-gray-450 text-xs">အရောင်:</span> <p className="font-semibold text-white">{selectedTicket.deviceColor || '-'}</p></div>
                                                        <div><span className="text-gray-455 text-xs">IMEI/Serial:</span> <p className="font-mono text-xs font-bold text-white">{selectedTicket.serialNumberImei || '-'}</p></div>
                                                        <div>
                                                            <span className="text-gray-455 text-xs">ဖုန်း Password/Pattern:</span>
                                                            {selectedTicket.password?.startsWith('[Pattern] ') ? (
                                                                <p className="font-semibold text-cyan-400 text-xs">ပုံဆွဲစကားဝှက် (Pattern)</p>
                                                            ) : (
                                                                <p className="font-semibold text-white text-xs">{selectedTicket.password || '-'}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedTicket.password?.startsWith('[Pattern] ') && (
                                                        <div className="border-t border-gray-750 pt-2 flex flex-col items-center">
                                                            <span className="block text-xs font-bold text-cyan-400 mb-1">ပုံစံ (Pattern Lock)</span>
                                                            <PatternLock 
                                                                value={selectedTicket.password.replace('[Pattern] ', '')} 
                                                                onChange={() => {}} 
                                                                readOnly={true} 
                                                                sizeClass="w-36 h-36" 
                                                            />
                                                        </div>
                                                    )}
                                                    {(() => {
                                                        let parsed = {
                                                            condition: '',
                                                            hasSimCard: false,
                                                            simCardQty: 1,
                                                            hasChargerCable: false,
                                                            hasChargerDock: false,
                                                            otherAccessories: ''
                                                        };
                                                        let isJson = false;
                                                        if (selectedTicket.scratchCondition) {
                                                            try {
                                                                if (selectedTicket.scratchCondition.trim().startsWith('{')) {
                                                                    parsed = JSON.parse(selectedTicket.scratchCondition);
                                                                    isJson = true;
                                                                }
                                                            } catch (e) {}
                                                        }

                                                        if (isJson) {
                                                            return (
                                                                <div className="border-t border-gray-750 pt-2 text-xs space-y-2">
                                                                    <div>
                                                                        <span className="font-bold text-gray-400">လက်ခံစဉ် ဖုန်းအခြေအနေ:</span>
                                                                        <p className="mt-0.5 text-gray-300">{parsed.condition || 'ခြစ်ရာ၊ ပိန်ရာ မရှိပါ (ပုံမှန်)'}</p>
                                                                    </div>
                                                                    <div className="bg-gray-900/40 p-2.5 rounded-lg border border-gray-750/50 space-y-1">
                                                                        <span className="font-bold text-cyan-400 block mb-1">ပါလာသည့် အပိုပစ္စည်းများ:</span>
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-350">
                                                                            <div>• SIM Card: <span className="font-bold text-white">{parsed.hasSimCard ? `ပါသည် (${parsed.simCardQty} ခု)` : 'မပါပါ'}</span></div>
                                                                            <div>• အားသွင်းကြိုး: <span className="font-bold text-white">{parsed.hasChargerCable ? 'ပါသည်' : 'မပါပါ'}</span></div>
                                                                            <div>• အားသွင်းခုံ: <span className="font-bold text-white">{parsed.hasChargerDock ? 'ပါသည်' : 'မပါပါ'}</span></div>
                                                                        </div>
                                                                        {parsed.otherAccessories && (
                                                                            <div className="border-t border-gray-800/60 pt-1 mt-1 text-gray-400">
                                                                                <span>တခြားအပိုပစ္စည်းများ:</span> <span className="text-white font-medium">{parsed.otherAccessories}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="border-t border-gray-750 pt-2 text-xs text-gray-350">
                                                                    <span className="font-bold text-gray-400">လက်ခံစဉ် ဖုန်းအခြေအနေ:</span>
                                                                    <p className="mt-1">{selectedTicket.scratchCondition || 'ခြစ်ရာ၊ ပိန်ရာ မရှိပါ (ပုံမှန်)'}</p>
                                                                </div>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right side info */}
                                        <div className="space-y-4">
                                            {/* Photo details */}
                                            {selectedTicket.deviceImage && (
                                                <div className="space-y-2">
                                                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">ဖုန်း၏ ရုပ်ပိုင်းဆိုင်ရာဓာတ်ပုံ</h3>
                                                    <div className="bg-gray-850 p-2 rounded-xl border border-gray-750 overflow-hidden aspect-video">
                                                        <img 
                                                            src={getImageUrl(selectedTicket.deviceImage) || ''} 
                                                            alt="Device condition" 
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Financial Summary */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">ငွေစာရင်းအကျဉ်းချုပ်</h3>
                                                <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 text-sm space-y-2 font-sans">
                                                    <div className="flex justify-between"><span className="text-gray-400">ချို့ယွင်းချက်:</span> <span className="font-semibold text-white">{selectedTicket.problemType}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400">ဝန်ဆောင်မှု လက်ခ:</span> <span className="font-semibold text-white">{(Number(selectedTicket.totalAmount || 0) - (selectedTicket.parts || []).reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.qty || 0)), 0)).toLocaleString()} Ks</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400">ပစ္စည်းစုစုပေါင်း:</span> <span className="font-semibold text-white">{(selectedTicket.parts || []).reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.qty || 0)), 0).toLocaleString()} Ks</span></div>
                                                    <div className="flex justify-between border-t border-gray-700 pt-1.5"><span className="text-gray-400 font-semibold">စုစုပေါင်း ကျသင့်ငွေ:</span> <span className="font-bold text-yellow-500">{Number(selectedTicket.totalAmount || 0).toLocaleString()} Ks</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400 font-semibold">စရန်ငွေ:</span> <span className="font-bold text-emerald-400">{Number(selectedTicket.deposit || 0).toLocaleString()} Ks</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-400 font-semibold">ရှင်းပြီးငွေ / ပေးငွေ:</span> <span className="font-bold text-blue-400">{(Number(selectedTicket.totalAmount || 0) - Number(selectedTicket.deposit || 0)).toLocaleString()} Ks</span></div>
                                                    <div className="flex justify-between border-t border-gray-700 pt-1.5 font-bold"><span className="text-white">ပေးရန်ကျန်ငွေ:</span> <span className="text-cyan-400">0 Ks</span></div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Parts Used detail row */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">ပြုပြင်ရန် အသုံးပြုသည့် ပစ္စည်းများ</h3>
                                        <div className="bg-gray-850 p-4 rounded-xl border border-gray-750">
                                            {selectedTicket.parts && selectedTicket.parts.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse text-xs font-sans">
                                                        <thead>
                                                            <tr className="text-gray-400 border-b border-gray-700 pb-2">
                                                                <th className="pb-2 text-left">ပစ္စည်းအမည်</th>
                                                                <th className="pb-2 text-center w-24">ရရှိရာနေရာ</th>
                                                                <th className="pb-2 text-center w-16">အရေအတွက်</th>
                                                                <th className="pb-2 text-right w-24">ဈေးနှုန်း</th>
                                                                <th className="pb-2 text-right w-28">စုစုပေါင်း</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-750/50">
                                                            {selectedTicket.parts.map((part: any, idx: number) => (
                                                                <tr key={idx} className="text-gray-300">
                                                                    <td className="py-2.5">
                                                                        <p className="font-semibold text-white">{part.partName}</p>
                                                                        {part.code && <p className="text-[10px] text-gray-500 font-mono">{part.code}</p>}
                                                                    </td>
                                                                    <td className="py-2.5 text-center">
                                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${part.isExternal ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                                            {part.isExternal ? 'ပြင်ပဝယ်' : 'ဆိုင်ရှိ'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2.5 text-center font-semibold text-white">{Number(part.qty || 0)}</td>
                                                                    <td className="py-2.5 text-right">{Number(part.price || 0).toLocaleString()} Ks</td>
                                                                    <td className="py-2.5 text-right font-bold text-white">{(Number(part.price || 0) * Number(part.qty || 0)).toLocaleString()} Ks</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-550 italic">ဤပြုပြင်မှုအတွက် ပစ္စည်းစာရင်း မရှိသေးပါ။</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Technician remark */}
                                    {selectedTicket.technicianRemark && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">နည်းပညာရှင် မှတ်ချက်</h3>
                                            <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 text-sm text-gray-200 font-sans whitespace-pre-wrap">
                                                {selectedTicket.technicianRemark}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Detail Footer Controls */}
                        <div className="p-4 bg-gray-750 border-t border-gray-700 flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsDetailOpen(false)}
                                className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-650 text-gray-200 hover:text-white text-sm font-medium transition-colors"
                            >
                                ပိတ်ရန်
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceReport;
