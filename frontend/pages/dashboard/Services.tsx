import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { 
    ArrowLeft, 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    Download, 
    ChevronLeft, 
    ChevronRight,
    X,
    Wrench,
    Check,
    Loader2,
    RefreshCw,
    AlertTriangle,
    User,
    Smartphone,
    DollarSign,
    Calendar,
    Printer,
    FileText,
    Grid,
    Upload,
    CheckSquare,
    Square,
    Eye,
    ChevronDown,
    Filter,
    ChevronUp,
    Phone,
    Bell
} from 'lucide-react';
import { Service, Customer, InventoryItem, Technician } from '../../types';
import { API_ENDPOINTS, PAGINATION_CONFIG, fetcher, apiClient, sessionManager, getImageUrl } from '../../config';

// Custom types for Service Ticket
interface TicketAccessory {
  productId: number;
  code: string;
  name: string;
  image: string | null;
  price: number;
}

interface TicketPart {
  id?: number;
  productId: string | null;
  partName: string;
  qty: number;
  price: number;
  cost: number;
  isExternal: boolean;
  code?: string;
  image?: string | null;
}

interface ServiceTicket {
  id: string;
  ticketNo: string;
  customerId: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  technicianId?: number | null;
  technicianName?: string;
  deviceBrandModel: string;
  deviceColor: string;
  serialNumberImei: string;
  password?: string;
  problemType: string;
  technicianRemark?: string;
  estimatedCompletionDate: string | null;
  totalAmount: number;
  deposit: number;
  paidAmount?: number;
  status: 'Pending' | 'In-Progress' | 'Ready' | 'Picked-up';
  deviceImage: string | null;
  scratchCondition?: string;
  branchId: number | null;
  branchName?: string;
  createdAt: string;
  accessories?: TicketAccessory[];
  parts?: TicketPart[];
}

interface TicketsResponse {
    success: boolean;
    data: ServiceTicket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
}

interface ServicesResponse {
    success: boolean;
    data: Service[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
}

// Confirm Modal Component
interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
    confirmText = 'Delete',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-900/50 text-red-400">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 mb-6 text-sm">{message}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                        >
                            {isLoading && <Loader2 className="animate-spin" size={18} />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    <div className="flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className={`${sizeClass} bg-gray-955/80 border border-gray-700 rounded-2xl touch-none select-none`}
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

const Services: React.FC = () => {
  const navigate = useNavigate();
  const currentUserType = sessionManager.getUserType();
  const hasEditPermission = currentUserType === 'admin' || currentUserType === 'manager';
  


  // ==========================================
  // TAB 1: REPAIR TICKETS STATE & HANDLERS
  // ==========================================
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketLimit, setTicketLimit] = useState(10);

  // Tab control state
  const [activeTab, setActiveTab] = useState<'tickets' | 'today' | 'reminders'>('tickets');

  // Filter Expander State
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Temporary filter states
  const [tempFilterCustomerId, setTempFilterCustomerId] = useState('');
  const [tempFilterCustomerSearch, setTempFilterCustomerSearch] = useState('');
  const [tempFilterDeviceBrandModel, setTempFilterDeviceBrandModel] = useState('');
  const [tempFilterDeviceColor, setTempFilterDeviceColor] = useState('');
  const [tempFilterSerialNumberImei, setTempFilterSerialNumberImei] = useState('');
  const [isFilterCustomerDropdownOpen, setIsFilterCustomerDropdownOpen] = useState(false);
  const customerFilterRef = useRef<HTMLDivElement>(null);

  // Applied filter states
  const [appliedFilterCustomerId, setAppliedFilterCustomerId] = useState('');
  const [appliedFilterDeviceBrandModel, setAppliedFilterDeviceBrandModel] = useState('');
  const [appliedFilterDeviceColor, setAppliedFilterDeviceColor] = useState('');
  const [appliedFilterSerialNumberImei, setAppliedFilterSerialNumberImei] = useState('');

  // Handle Apply Filters
  const handleApplyFilters = () => {
    setAppliedFilterCustomerId(tempFilterCustomerId);
    setAppliedFilterDeviceBrandModel(tempFilterDeviceBrandModel);
    setAppliedFilterDeviceColor(tempFilterDeviceColor);
    setAppliedFilterSerialNumberImei(tempFilterSerialNumberImei);
    setTicketPage(1);
  };

  // Handle Clear Filters
  const handleClearFilters = () => {
    setTempFilterCustomerId('');
    setTempFilterCustomerSearch('');
    setTempFilterDeviceBrandModel('');
    setTempFilterDeviceColor('');
    setTempFilterSerialNumberImei('');
    setAppliedFilterCustomerId('');
    setAppliedFilterDeviceBrandModel('');
    setAppliedFilterDeviceColor('');
    setAppliedFilterSerialNumberImei('');
    setTicketPage(1);
  };

  // Click outside listener for searchable filter customer dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerFilterRef.current && !customerFilterRef.current.contains(event.target as Node)) {
        setIsFilterCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Intakes Form Modal (Stepper) State
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [stepperStep, setStepperStep] = useState(1); // Steps: 1, 2, 3
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const [passwordTab, setPasswordTab] = useState<'password' | 'pattern'>('password');

  const [localCondition, setLocalCondition] = useState('');
  const [hasSimCard, setHasSimCard] = useState(false);
  const [simCardQty, setSimCardQty] = useState(1);
  const [hasChargerCable, setHasChargerCable] = useState(false);
  const [hasChargerDock, setHasChargerDock] = useState(false);
  const [otherAccessories, setOtherAccessories] = useState('');


  // Service Provider (Technician) State & Handlers
  const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState(false);
  const [technicianSearch, setTechnicianSearch] = useState('');
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [technicianForm, setTechnicianForm] = useState({
    name: '',
    phone: '',
    specialty: '',
    note: '',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [isSubmittingTechnician, setIsSubmittingTechnician] = useState(false);
  const [technicianDeleteConfirm, setTechnicianDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [isDeletingTechnician, setIsDeletingTechnician] = useState(false);

  const [isFetchingTicketForEdit, setIsFetchingTicketForEdit] = useState(false);

  // Stepper Form Fields State
  const [ticketFormData, setTicketFormData] = useState({
      id: '' as string, // Empty for new, populated for edit
      customerId: '' as string,
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      technicianId: '' as string,
      deviceBrandModel: '',
      deviceColor: '',
      serialNumberImei: '',
      password: '',
      scratchCondition: '',
      deviceImage: '' as string | null,
      accessories: [] as string[], // Selected product IDs as strings
      parts: [] as TicketPart[], // Parts cart
      laborFee: 0, // Service / Labor Fee
      problemType: '',
      technicianRemark: '',
      estimatedCompletionDate: '',
      totalAmount: 0,
      deposit: 0,
      paidAmount: 0,
      status: 'Pending' as 'Pending' | 'In-Progress' | 'Ready' | 'Picked-up',
      branchId: ''
  });

  // Parts Cart Local States
  const [activeCartTab, setActiveCartTab] = useState<'shop' | 'external'>('shop');
  const [cartSearchTerm, setCartSearchTerm] = useState('');
  const [cartAddQty, setCartAddQty] = useState(1);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [extPartName, setExtPartName] = useState('');
  const [extPartCost, setExtPartCost] = useState(0);
  const [extPartPrice, setExtPartPrice] = useState(0);
  const [extPartQty, setExtPartQty] = useState(1);

  // Ticket Delete confirmation state
  const [ticketDeleteConfirm, setTicketDeleteConfirm] = useState<{ isOpen: boolean; id: string; ticketNo: string }>({
      isOpen: false,
      id: '',
      ticketNo: ''
  });
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);

  // Build Tickets Query
  const buildTicketsQuery = () => {
    const params = new URLSearchParams();
    params.append('page', ticketPage.toString());
    params.append('limit', ticketLimit.toString());
    if (ticketSearchTerm) params.append('search', ticketSearchTerm);
    if (ticketStatusFilter !== 'all') params.append('status', ticketStatusFilter);

    // Advanced filters
    if (appliedFilterCustomerId) {
      params.append('customerId', appliedFilterCustomerId);
    }
    if (appliedFilterDeviceBrandModel.trim()) {
      params.append('deviceBrandModel', appliedFilterDeviceBrandModel.trim());
    }
    if (appliedFilterDeviceColor.trim()) {
      params.append('deviceColor', appliedFilterDeviceColor.trim());
    }
    if (appliedFilterSerialNumberImei.trim()) {
      params.append('serialNumberImei', appliedFilterSerialNumberImei.trim());
    }

    // Reminders tab filters
    if (activeTab === 'reminders') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const localTom = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60 * 1000));
      const tomorrowStr = localTom.toISOString().split('T')[0];
      params.append('completionDate', tomorrowStr);
    } else if (activeTab === 'today') {
      const today = new Date();
      const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60 * 1000));
      const todayStr = localToday.toISOString().split('T')[0];
      params.append('completionDate', todayStr);
    }

    return `${API_ENDPOINTS.SERVICE_TICKETS}?${params.toString()}`;
  };

  // Fetch Tickets
  const { data: ticketsData, error: ticketsError, isLoading: ticketsLoading, mutate: mutateTickets } = useSWR<TicketsResponse>(
      buildTicketsQuery(),
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  // Helper dates for counts
  const getTodayStr = () => {
    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const localTom = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60 * 1000));
    return localTom.toISOString().split('T')[0];
  };

  const todayStrForCount = getTodayStr();
  const tomorrowStrForCount = getTomorrowStr();

  // SWR for today's ticket count
  const { data: todayCountData, mutate: mutateTodayCount } = useSWR<TicketsResponse>(
    `${API_ENDPOINTS.SERVICE_TICKETS}?limit=1&completionDate=${todayStrForCount}`,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 }
  );

  // SWR for tomorrow's ticket count
  const { data: tomorrowCountData, mutate: mutateTomorrowCount } = useSWR<TicketsResponse>(
    `${API_ENDPOINTS.SERVICE_TICKETS}?limit=1&completionDate=${tomorrowStrForCount}`,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 }
  );

  const todayCount = todayCountData?.pagination?.total || 0;
  const tomorrowCount = tomorrowCountData?.pagination?.total || 0;

  const refreshAll = () => {
    mutateTickets();
    mutateTodayCount();
    mutateTomorrowCount();
  };

  // Fetch Dropdown Customers (Always enabled for searchable filters & stepper)
  const { data: customersData } = useSWR<{success: boolean, data: Customer[]}>(
      API_ENDPOINTS.CUSTOMERS_DROPDOWN,
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const dropdownCustomers = customersData?.data || [];

  // Fetch Dropdown Technicians
  const { data: techDropdownData, mutate: mutateTechDropdown } = useSWR<{ success: boolean; data: any[] }>(
    API_ENDPOINTS.TECHNICIANS_DROPDOWN,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const dropdownTechnicians = techDropdownData?.data || [];

  // Fetch Full Technicians List for Manager Modal
  const { data: techniciansResponseData, mutate: mutateTechniciansList, isLoading: techniciansLoading } = useSWR<{ success: boolean; data: Technician[]; pagination: any }>(
    isTechnicianModalOpen ? `${API_ENDPOINTS.TECHNICIANS}?search=${encodeURIComponent(technicianSearch)}` : null,
    fetcher
  );
  const techniciansList = techniciansResponseData?.data || [];

  // Technician Save Handler
  const handleSaveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!technicianForm.name.trim()) {
      alert('Service ပြုလုပ်သူ အမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။');
      return;
    }

    setIsSubmittingTechnician(true);
    try {
      let res;
      if (editingTechnician) {
        res = await apiClient.put(API_ENDPOINTS.TECHNICIAN_BY_ID(editingTechnician.id), technicianForm);
      } else {
        res = await apiClient.post(API_ENDPOINTS.TECHNICIANS, technicianForm);
      }

      if (res.success) {
        mutateTechniciansList();
        mutateTechDropdown();
        setTechnicianForm({ name: '', phone: '', specialty: '', note: '', status: 'Active' });
        setEditingTechnician(null);
      } else {
        alert(res.message || 'Service ပြုလုပ်သူ သိမ်းဆည်းရန် မအောင်မြင်ပါ');
      }
    } catch (err) {
      console.error('Save technician error:', err);
      alert('Network error saving service provider.');
    } finally {
      setIsSubmittingTechnician(false);
    }
  };

  // Technician Edit Click Handler
  const handleEditTechnicianClick = (tech: Technician) => {
    setEditingTechnician(tech);
    setTechnicianForm({
      name: tech.name,
      phone: tech.phone || '',
      specialty: tech.specialty || '',
      note: tech.note || '',
      status: tech.status || 'Active'
    });
  };

  // Technician Delete Handler
  const handleDeleteTechnician = async () => {
    setIsDeletingTechnician(true);
    try {
      const res = await apiClient.delete(API_ENDPOINTS.TECHNICIAN_BY_ID(technicianDeleteConfirm.id));
      if (res.success) {
        mutateTechniciansList();
        mutateTechDropdown();
        setTechnicianDeleteConfirm({ isOpen: false, id: '', name: '' });
      } else {
        alert(res.message || 'Service ပြုလုပ်သူ ဖျက်ရန် မအောင်မြင်ပါ');
      }
    } catch (err) {
      console.error('Delete technician error:', err);
      alert('Network error deleting service provider.');
    } finally {
      setIsDeletingTechnician(false);
    }
  };

  // Fetch Accessories/Items from Inventory
  const { data: inventoryData } = useSWR<{success: boolean, data: InventoryItem[]}>(
      isStepperOpen ? `${API_ENDPOINTS.INVENTORY}?limit=100` : null,
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  const inventoryItems = inventoryData?.data || [];

  // Fetch Branches
  const branchesData = useSWR<{success: boolean, data: any[]}>(
      API_ENDPOINTS.BRANCHES,
      fetcher,
      { revalidateOnFocus: false, dedupingInterval: 30000 }
  ).data;
  const branches = branchesData?.data || [];

  // Fetch Services List (Catalog) for step 3 selector
  const { data: catalogData } = useSWR<ServicesResponse>(
      isStepperOpen ? `${API_ENDPOINTS.SERVICES}?limit=100` : null,
      fetcher
  );
  const catalogServices = catalogData?.data || [];

  const tickets = ticketsData?.data || [];
  const ticketsPagination = ticketsData?.pagination;

  // Search Ticket Handler
  const handleTicketSearch = () => {
      setTicketSearchTerm(ticketSearch);
      setTicketPage(1);
  };

  // Stepper customer selection change handler
  const handleCustomerSelect = (id: string) => {
    if (id === '') {
      setTicketFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
    } else {
      const selected = dropdownCustomers.find(c => c.id.toString() === id.toString());
      if (selected) {
        setTicketFormData(prev => ({
          ...prev,
          customerId: selected.id.toString(),
          customerName: selected.name,
          customerPhone: selected.phone,
          customerAddress: selected.address || ''
        }));
      }
    }
  };

  // Stepper condition photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    setIsUploadingImage(true);
    try {
      const response = await apiClient.postFormData(API_ENDPOINTS.SERVICE_TICKET_UPLOAD, formData);
      if (response.success && response.data?.imagePath) {
        setTicketFormData(prev => ({
          ...prev,
          deviceImage: response.data.imagePath
        }));
      } else {
        alert(response.message || 'Image upload failed');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Failed to upload image due to connection error.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Toggle accessory checkbox
  const handleAccessoryToggle = (productId: string) => {
    setTicketFormData(prev => {
      const isSelected = prev.accessories.includes(productId);
      if (isSelected) {
        return {
          ...prev,
          accessories: prev.accessories.filter(id => id !== productId)
        };
      } else {
        return {
          ...prev,
          accessories: [...prev.accessories, productId]
        };
      }
    });
  };

  // State flag for saving operations
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Stepper Submit
  const handleStepperSubmit = async () => {
    if (!ticketFormData.deviceBrandModel.trim()) {
      alert('ဖုန်းအမျိုးအစား/မော်ဒယ် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။');
      setStepperStep(2);
      return;
    }
    if (!ticketFormData.problemType.trim()) {
      alert('ချို့ယွင်းချက်အမျိုးအစားကို ရွေးချယ် သို့မဟုတ် ရေးသားရန် လိုအပ်ပါသည်။');
      setStepperStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: ticketFormData.customerId || null,
        technicianId: ticketFormData.technicianId ? Number(ticketFormData.technicianId) : null,
        customerName: ticketFormData.customerName,
        customerPhone: ticketFormData.customerPhone,
        customerAddress: ticketFormData.customerAddress,
        deviceBrandModel: ticketFormData.deviceBrandModel,
        deviceColor: ticketFormData.deviceColor,
        serialNumberImei: ticketFormData.serialNumberImei,
        password: ticketFormData.password,
        scratchCondition: JSON.stringify({
          condition: localCondition,
          hasSimCard,
          simCardQty,
          hasChargerCable,
          hasChargerDock,
          otherAccessories
        }),
        deviceImage: null,
        accessories: ticketFormData.accessories.map(id => parseInt(id)),
        parts: ticketFormData.parts.map(p => ({
          productId: p.productId ? Number(p.productId) : null,
          partName: p.partName,
          qty: p.qty,
          price: p.price,
          cost: p.cost,
          isExternal: p.isExternal ? 1 : 0
        })),
        problemType: ticketFormData.problemType,
        technicianRemark: ticketFormData.technicianRemark,
        estimatedCompletionDate: ticketFormData.estimatedCompletionDate || null,
        totalAmount: Number(ticketFormData.totalAmount) || 0,
        deposit: Number(ticketFormData.deposit) || 0,
        paidAmount: Number(ticketFormData.paidAmount) || 0,
        status: ticketFormData.status,
        branchId: currentUserType === 'admin' ? (ticketFormData.branchId || null) : null
      };

      let result;
      if (ticketFormData.id) {
        // Update
        result = await apiClient.put(API_ENDPOINTS.SERVICE_TICKET_BY_ID(ticketFormData.id), payload);
      } else {
        // Create
        result = await apiClient.post(API_ENDPOINTS.SERVICE_TICKETS, payload);
      }

      if (result.success) {
        refreshAll();
        setIsStepperOpen(false);
      } else {
        alert(result.message || 'ပြုပြင်မှုတိုကင် သိမ်းဆည်းရန် မအောင်မြင်ပါ');
      }
    } catch (err) {
      console.error('Stepper submit error:', err);
      alert('လိုင်းချိတ်ဆက်မှု ပြဿနာကြောင့် ပြုပြင်မှုတိုကင် သိမ်းဆည်းရန် မအောင်မြင်ပါ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Launch New Stepper Modal
  const openNewTicketStepper = () => {
    setTicketFormData({
      id: '',
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      technicianId: '',
      deviceBrandModel: '',
      deviceColor: '',
      serialNumberImei: '',
      password: '',
      scratchCondition: '',
      deviceImage: null,
      accessories: [],
      parts: [],
      laborFee: 0,
      problemType: '',
      technicianRemark: '',
      estimatedCompletionDate: '',
      totalAmount: 0,
      deposit: 0,
      paidAmount: 0,
      status: 'Pending',
      branchId: currentUserType === 'manager' ? (sessionManager.getBranchId() || '') : ''
    });
    setPasswordTab('password');
    setLocalCondition('');
    setHasSimCard(false);
    setSimCardQty(1);
    setHasChargerCable(false);
    setHasChargerDock(false);
    setOtherAccessories('');
    setStepperStep(1);
    setIsStepperOpen(true);
  };

  // Launch Edit Stepper Modal
  const openEditTicketStepper = (ticket: ServiceTicket) => {
    const parts = ticket.parts || [];
    const partsTotal = parts.reduce((sum, p) => sum + (p.price * p.qty), 0);
    const laborFee = Math.max(0, ticket.totalAmount - partsTotal);

    setTicketFormData({
      id: ticket.id,
      customerId: ticket.customerId ? ticket.customerId.toString() : '',
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      customerAddress: ticket.customerAddress,
      technicianId: ticket.technicianId ? ticket.technicianId.toString() : '',
      deviceBrandModel: ticket.deviceBrandModel,
      deviceColor: ticket.deviceColor || '',
      serialNumberImei: ticket.serialNumberImei || '',
      password: ticket.password || '',
      scratchCondition: ticket.scratchCondition || '',
      deviceImage: ticket.deviceImage,
      accessories: ticket.accessories ? ticket.accessories.map(a => a.productId.toString()) : [],
      parts: parts,
      laborFee: laborFee,
      problemType: ticket.problemType,
      technicianRemark: ticket.technicianRemark || '',
      estimatedCompletionDate: ticket.estimatedCompletionDate ? ticket.estimatedCompletionDate.substring(0, 16) : '',
      totalAmount: ticket.totalAmount,
      deposit: ticket.deposit,
      paidAmount: ticket.paidAmount || 0,
      status: ticket.status,
      branchId: ticket.branchId ? ticket.branchId.toString() : ''
    });
    setPasswordTab(ticket.password?.startsWith('[Pattern] ') ? 'pattern' : 'password');

    let parsed = {
      condition: '',
      hasSimCard: false,
      simCardQty: 1,
      hasChargerCable: false,
      hasChargerDock: false,
      otherAccessories: ''
    };
    if (ticket.scratchCondition) {
      try {
        if (ticket.scratchCondition.trim().startsWith('{')) {
          parsed = JSON.parse(ticket.scratchCondition);
        } else {
          parsed.condition = ticket.scratchCondition;
        }
      } catch (e) {
        parsed.condition = ticket.scratchCondition;
      }
    }
    setLocalCondition(parsed.condition || '');
    setHasSimCard(!!parsed.hasSimCard);
    setSimCardQty(parsed.simCardQty || 1);
    setHasChargerCable(!!parsed.hasChargerCable);
    setHasChargerDock(!!parsed.hasChargerDock);
    setOtherAccessories(parsed.otherAccessories || '');

    setStepperStep(1);
    setIsStepperOpen(true);
  };

  const handleEditClick = async (ticket: ServiceTicket) => {
    setIsFetchingTicketForEdit(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.SERVICE_TICKET_BY_ID(ticket.id));
      if (response.success && response.data) {
        openEditTicketStepper(response.data);
      } else {
        alert(response.message || 'Failed to fetch ticket details for editing.');
      }
    } catch (err) {
      console.error('Error fetching ticket details for edit:', err);
      alert('Error fetching ticket details.');
    } finally {
      setIsFetchingTicketForEdit(false);
    }
  };

  const handleDirectPrint = async (ticket: ServiceTicket) => {
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

  const addInventoryItemToCart = () => {
    if (!selectedInventoryItem) return;
    
    if (cartAddQty <= 0) {
      alert("အရေအတွက်သည် ၀ ထက် ကြီးရပါမည်");
      return;
    }

    if (cartAddQty > selectedInventoryItem.qty) {
      alert(`ဆိုင်တွင် လက်ကျန် ${selectedInventoryItem.qty} ခုသာ ရှိပါသည်။`);
      return;
    }

    setTicketFormData(prev => {
      const existingPartIndex = prev.parts.findIndex(p => p.productId === selectedInventoryItem.id);
      
      let updatedParts = [...prev.parts];
      if (existingPartIndex > -1) {
        const newQty = updatedParts[existingPartIndex].qty + cartAddQty;
        if (newQty > selectedInventoryItem.qty) {
          alert(`ထပ်ထည့်၍ မရတော့ပါ။ ဆိုင်လက်ကျန် ${selectedInventoryItem.qty} ခုသာ ရှိပါတော့သည်။`);
          return prev;
        }
        updatedParts[existingPartIndex] = {
          ...updatedParts[existingPartIndex],
          qty: newQty
        };
      } else {
        updatedParts.push({
          productId: selectedInventoryItem.id,
          partName: selectedInventoryItem.name,
          qty: cartAddQty,
          price: selectedInventoryItem.sellPrice,
          cost: selectedInventoryItem.purchasePrice,
          isExternal: false,
          code: selectedInventoryItem.code,
          image: selectedInventoryItem.image
        });
      }

      const partsTotal = updatedParts.reduce((sum, p) => sum + (p.price * p.qty), 0);
      const newTotal = prev.laborFee + partsTotal;

      return {
        ...prev,
        parts: updatedParts,
        totalAmount: newTotal
      };
    });

    setSelectedInventoryItem(null);
    setCartAddQty(1);
    setCartSearchTerm('');
  };

  const addExternalPartToCart = () => {
    if (!extPartName.trim()) {
      alert("ပစ္စည်းအမည် ဖြည့်သွင်းရန် လိုအပ်ပါသည်");
      return;
    }
    if (extPartQty <= 0) {
      alert("အရေအတွက်သည် ၀ ထက် ကြီးရပါမည်");
      return;
    }

    setTicketFormData(prev => {
      const updatedParts = [...prev.parts, {
        productId: null,
        partName: extPartName.trim(),
        qty: extPartQty,
        price: extPartPrice,
        cost: extPartCost,
        isExternal: true
      }];

      const partsTotal = updatedParts.reduce((sum, p) => sum + (p.price * p.qty), 0);
      const newTotal = prev.laborFee + partsTotal;

      return {
        ...prev,
        parts: updatedParts,
        totalAmount: newTotal
      };
    });

    setExtPartName('');
    setExtPartCost(0);
    setExtPartPrice(0);
    setExtPartQty(1);
  };

  const updateCartPartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartPart(index);
      return;
    }

    setTicketFormData(prev => {
      const part = prev.parts[index];
      
      if (!part.isExternal && part.productId) {
        const item = inventoryItems.find(i => i.id === part.productId);
        if (item && newQty > item.qty) {
          alert(`ဆိုင်တွင် လက်ကျန် ${item.qty} ခုသာ ရှိပါသည်။`);
          return prev;
        }
      }

      const updatedParts = [...prev.parts];
      updatedParts[index] = {
        ...part,
        qty: newQty
      };

      const partsTotal = updatedParts.reduce((sum, p) => sum + (p.price * p.qty), 0);
      const newTotal = prev.laborFee + partsTotal;

      return {
        ...prev,
        parts: updatedParts,
        totalAmount: newTotal
      };
    });
  };

  const removeCartPart = (index: number) => {
    setTicketFormData(prev => {
      const updatedParts = prev.parts.filter((_, i) => i !== index);
      const partsTotal = updatedParts.reduce((sum, p) => sum + (p.price * p.qty), 0);
      const newTotal = prev.laborFee + partsTotal;

      return {
        ...prev,
        parts: updatedParts,
        totalAmount: newTotal
      };
    });
  };

  const handleLaborFeeChange = (val: number) => {
    setTicketFormData(prev => {
      const partsTotal = prev.parts.reduce((sum, p) => sum + (p.price * p.qty), 0);
      return {
        ...prev,
        laborFee: val,
        totalAmount: val + partsTotal
      };
    });
  };

  // Open Ticket Details Modal
  const openTicketDetails = async (ticket: ServiceTicket) => {
    setIsDetailOpen(true);
    setSelectedTicket(ticket);
    
    // Fetch full ticket details (including accessories list)
    try {
      const response = await apiClient.get(API_ENDPOINTS.SERVICE_TICKET_BY_ID(ticket.id));
      if (response.success) {
        setSelectedTicket(response.data);
      }
    } catch (err) {
      console.error('Fetch ticket details error:', err);
    }
  };

  // Update Ticket Status Quick Action
  const handleStatusChange = async (status: 'Pending' | 'In-Progress' | 'Ready' | 'Picked-up') => {
    if (!selectedTicket) return;
    setIsStatusUpdating(true);
    try {
      const result = await apiClient.patch(API_ENDPOINTS.SERVICE_TICKET_STATUS(selectedTicket.id), { status });
      if (result.success) {
        setSelectedTicket(prev => {
          if (!prev) return null;
          const updated = { ...prev, status };
          if (status === 'Picked-up') {
            updated.paidAmount = Math.max(0, prev.totalAmount - prev.deposit);
          }
          return updated;
        });
        refreshAll();
      } else {
        alert(result.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status patch error:', err);
      alert('Error updating status.');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Open Delete Ticket Confirmation
  const openDeleteTicketConfirm = (id: string, ticketNo: string) => {
    setTicketDeleteConfirm({ isOpen: true, id, ticketNo });
  };

  // Perform Delete Ticket
  const handleDeleteTicket = async () => {
    setIsDeletingTicket(true);
    try {
      const result = await apiClient.delete(API_ENDPOINTS.SERVICE_TICKET_BY_ID(ticketDeleteConfirm.id));
      if (result.success) {
        refreshAll();
        setTicketDeleteConfirm({ isOpen: false, id: '', ticketNo: '' });
        setIsDetailOpen(false);
      } else {
        alert(result.message || 'Failed to delete ticket');
      }
    } catch (err) {
      console.error('Delete ticket error:', err);
      alert('Network error deleting ticket.');
    } finally {
      setIsDeletingTicket(false);
    }
  };

  // Print Receipt/Ticket method
  const handlePrintReceipt = (ticket: ServiceTicket) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const partsTotal = ticket.parts ? ticket.parts.reduce((sum, p) => sum + (p.price * p.qty), 0) : 0;
    const laborFee = Math.max(0, ticket.totalAmount - partsTotal);

    const partsListHtml = ticket.parts && ticket.parts.length > 0 
      ? ticket.parts.map(p => `
          <div class="row" style="font-size: 12px; font-style: italic; padding-left: 10px;">
            <span>- ${p.partName} x${p.qty} (${p.isExternal ? 'ပြင်ပဝယ်' : 'ဆိုင်ရှိ'})</span>
            <span class="value">${(p.price * p.qty).toLocaleString()} Ks</span>
          </div>
        `).join('')
      : '<div class="row" style="font-size: 12px; font-style: italic; padding-left: 10px;"><span>အသုံးပြုသည့် ပစ္စည်းမရှိပါ</span><span class="value">0 Ks</span></div>';

    const formattedDate = new Date(ticket.createdAt).toLocaleString();
    const formattedEstDate = ticket.estimatedCompletionDate 
      ? new Date(ticket.estimatedCompletionDate).toLocaleString() 
      : 'သတ်မှတ်မထားပါ';

    const netBalance = ticket.totalAmount - ticket.deposit;

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
              body { padding: 0; margin: 0; width: 80mm; } /* Receipt Printer width */
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
            <div class="row"><span class="label">ဖုန်း:</span><span class="value">${ticket.customerPhone}</span></div>
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
                  if (parsed.hasSimCard) accList.push(`SIM Card (${parsed.simCardQty}ခု)`);
                  if (parsed.hasChargerCable) accList.push('အားသွင်းကြိုး');
                  if (parsed.hasChargerDock) accList.push('အားသွင်းခုံ');
                  if (parsed.otherAccessories) accList.push(parsed.otherAccessories);
                  if (accList.length > 0) {
                    conditionText += ` <br/><span style="font-size: 12px; font-weight: normal;">(ပါဝင်သည့်ပစ္စည်း - ${accList.join(', ')})</span>`;
                  }
                } catch (e) {}
              }
              return conditionText;
            })()}</div>
          </div>

          <div class="section">
            <div class="section-title">ပြုပြင်ရန် အချက်</div>
            <div>ချို့ယွင်းချက်: ${ticket.problemType}</div>
            <div>Service ပြုလုပ်သူ: ${ticket.technicianName || '-'}</div>
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

  // Reset Filters for Tickets List
  const resetTicketsFilters = () => {
    setTicketSearch('');
    setTicketSearchTerm('');
    setTicketStatusFilter('all');
    handleClearFilters();
    setTicketPage(1);
    refreshAll();
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header - Fixed Top */}
      <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between border-b border-gray-700 z-40 shrink-0 h-16">
        <div className="flex items-center">
          <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors mr-4"
          >
              <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
              <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-500">
                  <Wrench size={20} />
              </div>
              <h1 className="text-xl font-bold">ဝန်ဆောင်မှုနှင့် ပြုပြင်ရေး စင်တာ</h1>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={resetTicketsFilters}
          className="p-2 rounded-full hover:bg-gray-750 text-gray-300 hover:text-white transition-colors"
          title="ပြန်လည်ခေါ်ယူရန်"
        >
          <RefreshCw size={20} className={ticketsLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* =========================================================================
          TAB 1: REPAIR JOBS (TICKETS)
          ========================================================================= */}
        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8 flex flex-col animate-fade-in">
          
          {/* Action Bar */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-700 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="တိုကင်နံပါတ်၊ ဝယ်ယူသူ၊ IMEI ဖြင့်ရှာဖွေရန်..." 
                            value={ticketSearch}
                            onChange={(e) => setTicketSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleTicketSearch()}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                    </div>
                    <button onClick={handleTicketSearch} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium">ရှာဖွေရန်</button>
                    
                    <button
                      type="button"
                      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-1.5 transition-all shrink-0 ${
                        isFilterExpanded 
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400' 
                          : 'bg-gray-900 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                      title="အဆင့်မြင့် စစ်ထုတ်မှုများ"
                    >
                      <Filter size={15} /> 
                      <span className="hidden sm:inline">စစ်ထုတ်ရန်</span>
                      {isFilterExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {/* Status filter */}
                    <select
                      value={ticketStatusFilter}
                      onChange={(e) => { setTicketStatusFilter(e.target.value); setTicketPage(1); }}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="all">အခြေအနေအားလုံး</option>
                      <option value="Pending">စောင့်ဆိုင်းဆဲ (Pending)</option>
                      <option value="In-Progress">ပြင်ဆင်ဆဲ (In-Progress)</option>
                      <option value="Ready">ပြီးစီး/ယူနိုင်ပြီ (Ready)</option>
                      <option value="Picked-up">အပ်နှံပြီး (Picked-up)</option>
                    </select>

                    <select 
                        value={ticketLimit}
                        onChange={(e) => { setTicketLimit(Number(e.target.value)); setTicketPage(1); }}
                        className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                        {PAGINATION_CONFIG.LIMIT_OPTIONS.slice(0, 4).map(opt => (
                            <option key={opt} value={opt}>{opt} လိုင်း</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    {hasEditPermission && (
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={() => setIsTechnicianModalOpen(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-purple-950 transition-all hover:scale-102"
                            >
                                <User size={18} /> service ပြုလုပ်သူ
                            </button>

                            <button 
                                onClick={openNewTicketStepper}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-cyan-950 transition-all hover:scale-102"
                            >
                                <Plus size={18} /> ပြုပြင်ရန်အသစ်လက်ခံရန်
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Expandable Advanced Filters Panel */}
            {isFilterExpanded && (
              <div className="bg-gray-800 rounded-xl p-4 shadow-lg mb-6 border border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-200 shrink-0">
                {/* Searchable customer dropdown */}
                <div className="relative font-sans text-xs" ref={customerFilterRef}>
                  <label className="block text-xs text-gray-400 mb-1">ဝယ်ယူသူ</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ဝယ်ယူသူအမည်/ဖုန်းဖြင့် ရှာရန်..."
                      value={tempFilterCustomerSearch}
                      onFocus={() => setIsFilterCustomerDropdownOpen(true)}
                      onChange={(e) => {
                        setTempFilterCustomerSearch(e.target.value);
                        setIsFilterCustomerDropdownOpen(true);
                        if (tempFilterCustomerId) {
                          setTempFilterCustomerId('');
                        }
                      }}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-3 pr-8 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                    {tempFilterCustomerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempFilterCustomerId('');
                          setTempFilterCustomerSearch('');
                        }}
                        className="absolute right-2 top-2 text-gray-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {isFilterCustomerDropdownOpen && (
                    <div className="absolute z-[110] left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-700 text-xs shadow-2xl">
                      {dropdownCustomers
                        .filter(c => 
                          !tempFilterCustomerSearch.trim() ||
                          c.name.toLowerCase().includes(tempFilterCustomerSearch.toLowerCase()) ||
                          c.phone.includes(tempFilterCustomerSearch)
                        )
                        .map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setTempFilterCustomerId(c.id.toString());
                              setTempFilterCustomerSearch(`${c.name} (${c.phone})`);
                              setIsFilterCustomerDropdownOpen(false);
                            }}
                            className="p-2 hover:bg-cyan-950/40 cursor-pointer flex justify-between items-center transition-colors text-white"
                          >
                            <span className="font-semibold">{c.name}</span>
                            <span className="text-gray-400">{c.phone}</span>
                          </div>
                        ))
                      }
                      {dropdownCustomers.filter(c => 
                        !tempFilterCustomerSearch.trim() ||
                        c.name.toLowerCase().includes(tempFilterCustomerSearch.toLowerCase()) ||
                        c.phone.includes(tempFilterCustomerSearch)
                      ).length === 0 && (
                        <p className="p-2 text-center text-gray-500 italic">ဝယ်ယူသူ မတွေ့ပါ။</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Model */}
                <div className="text-xs">
                  <label className="block text-xs text-gray-400 mb-1">ဖုန်းမော်ဒယ်</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 13"
                    value={tempFilterDeviceBrandModel}
                    onChange={(e) => setTempFilterDeviceBrandModel(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>

                {/* Color */}
                <div className="text-xs">
                  <label className="block text-xs text-gray-400 mb-1">အရောင်</label>
                  <input
                    type="text"
                    placeholder="e.g. Sierra Blue"
                    value={tempFilterDeviceColor}
                    onChange={(e) => setTempFilterDeviceColor(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>

                {/* IMEI */}
                <div className="text-xs">
                  <label className="block text-xs text-gray-400 mb-1">IMEI / Serial</label>
                  <input
                    type="text"
                    placeholder="IMEI နံပါတ်"
                    value={tempFilterSerialNumberImei}
                    onChange={(e) => setTempFilterSerialNumberImei(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>

                {/* Clear / Apply Buttons */}
                <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex bg-gray-800 border-b border-gray-700 shrink-0 mb-6 rounded-xl overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tickets');
                  setTicketPage(1);
                }}
                className={`flex-1 sm:flex-initial px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'tickets'
                    ? 'border-cyan-500 text-cyan-400 bg-gray-750/30'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                }`}
              >
                <Wrench size={16} /> ပြုပြင်မှုမှတ်တမ်းများ
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('today');
                  setTicketPage(1);
                }}
                className={`flex-1 sm:flex-initial px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'today'
                    ? 'border-cyan-500 text-cyan-400 bg-gray-750/30'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell size={16} className={activeTab === 'today' ? 'animate-bounce' : ''} />
                  <span>ယနေ့လာယူမည့်သူများ (Today)</span>
                  {todayCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-gray-900 shadow animate-pulse">
                      {todayCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reminders');
                  setTicketPage(1);
                }}
                className={`flex-1 sm:flex-initial px-6 py-3 font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'reminders'
                    ? 'border-cyan-500 text-cyan-400 bg-gray-750/30'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-750/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bell size={16} className={activeTab === 'reminders' ? 'animate-bounce' : ''} />
                  <span>မနက်ဖြန်လာယူမည့်သူများ (Tomorrow)</span>
                  {tomorrowCount > 0 && (
                    <span className="bg-amber-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-gray-900 shadow">
                      {tomorrowCount}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Loading / Error States */}
            {ticketsLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-cyan-500" size={40} />
                </div>
            )}

            {ticketsError && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
                        <p className="text-red-400 font-medium">Failed to load repair tickets.</p>
                        <button onClick={() => mutateTickets()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Retry</button>
                    </div>
                </div>
            )}

            {/* Service Tickets List */}
            {!ticketsLoading && !ticketsError && (
                <div className="flex-1 bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-700">
                                     <th className="p-4 w-28">တိုကင်နံပါတ်</th>
                                     <th className="p-4">ဝယ်ယူသူ</th>
                                     <th className="p-4">ဖုန်းမော်ဒယ်</th>
                                     <th className="p-4">ချို့ယွင်းချက်</th>
                                     <th className="p-4 text-right">ကျသင့်ငွေ</th>
                                     <th className="p-4 text-right">စရန်ငွေ</th>
                                     <th className="p-4 text-center">ပြီးစီးမည့်ရက်</th>
                                     <th className="p-4 text-center w-28">အခြေအနေ</th>
                                     <th className="p-4 text-center w-20">လုပ်ဆောင်ချက်</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {tickets.length > 0 ? (
                                    tickets.map((t) => (
                                        <tr 
                                          key={t.id} 
                                          className="hover:bg-gray-750 cursor-pointer transition-colors"
                                          onClick={() => openTicketDetails(t)}
                                        >
                                            <td className="p-4 font-mono text-cyan-400 text-sm font-semibold">
                                                {t.ticketNo}
                                            </td>
                                            <td className="p-4 font-medium text-white">
                                                <div className="text-white text-sm">{t.customerName}</div>
                                                <div className="flex items-center gap-2 mt-1 select-none">
                                                    <span className="text-xs text-gray-400 font-mono">{t.customerPhone}</span>
                                                    {t.customerPhone && (
                                                        <a
                                                            href={`tel:${t.customerPhone}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold text-white transition-all shadow-sm shrink-0"
                                                            title="ဖုန်းခေါ်ဆိုရန်"
                                                        >
                                                            <Phone size={10} /> ခေါ်ရန်
                                                        </a>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4 text-sm text-gray-200">
                                                <div className="font-semibold">{t.deviceBrandModel}</div>
                                                {t.deviceColor && <div className="text-xs text-gray-400">အရောင်: {t.deviceColor}</div>}
                                            </td>
                                            <td className="p-4 text-sm text-gray-300">
                                                <div>{t.problemType}</div>
                                                {t.technicianName && (
                                                  <div className="text-xs text-purple-400 font-medium mt-1 flex items-center gap-1">
                                                    <User size={12} /> {t.technicianName}
                                                  </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-bold text-yellow-500 text-sm">
                                                {t.totalAmount.toLocaleString()} Ks
                                            </td>
                                            <td className="p-4 text-right font-semibold text-emerald-400 text-sm">
                                                {t.deposit.toLocaleString()} Ks
                                            </td>
                                            <td className="p-4 text-center text-xs text-gray-400">
                                                {t.estimatedCompletionDate 
                                                  ? new Date(t.estimatedCompletionDate).toLocaleDateString()
                                                  : <span className="text-gray-600 italic">မသတ်မှတ်ရသေး</span>
                                                }
                                            </td>
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                  t.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                                                  t.status === 'In-Progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                                                  t.status === 'Ready' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                                  'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                }`}>
                                                  {t.status === 'Pending' ? 'စောင့်ဆိုင်းဆဲ' :
                                                   t.status === 'In-Progress' ? 'ပြင်ဆင်ဆဲ' :
                                                   t.status === 'Ready' ? 'ပြီးစီး (ယူနိုင်ပြီ)' :
                                                   'အပ်နှံပြီး (ယူသွားပြီ)'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-2">
                                                     {hasEditPermission && (
                                                       <button 
                                                         onClick={() => handleEditClick(t)} 
                                                         disabled={isFetchingTicketForEdit}
                                                         className="p-2 text-cyan-400 hover:bg-cyan-900/30 rounded-lg transition-colors disabled:opacity-50" 
                                                         title="ပြင်ဆင်ရန်"
                                                       >
                                                         {isFetchingTicketForEdit ? <Loader2 size={16} className="animate-spin" /> : <Edit size={16} />}
                                                       </button>
                                                     )}
                                                     <button onClick={() => openTicketDetails(t)} className="p-2 text-yellow-500 hover:bg-yellow-900/30 rounded-lg transition-colors" title="အသေးစိတ်ကြည့်ရန်"><Eye size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-gray-500">
                                            ပြုပြင်မှုမှတ်တမ်း မရှိပါ။
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Tickets Pagination */}
                    {ticketsPagination && ticketsPagination.total > 0 && (
                        <div className="mt-auto p-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800 shrink-0">
                            <span className="text-sm text-gray-400">
                                စာမျက်နှာ <span className="text-white font-medium">{ticketsPagination.page}</span> (စုစုပေါင်း <span className="text-white font-medium">{ticketsPagination.totalPages}</span> စာမျက်နှာ)
                                <span className="ml-2">(စုစုပေါင်း - {ticketsPagination.total} ခု)</span>
                            </span>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setTicketPage(ticketPage - 1)} 
                                    disabled={!ticketsPagination.hasPrev} 
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                
                                <button 
                                    onClick={() => setTicketPage(ticketPage + 1)} 
                                    disabled={!ticketsPagination.hasNext} 
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

      {/* =========================================================================
          MODAL: INTAKE STEPPER FORM (3 STEPS)
          ========================================================================= */}
      {isStepperOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 overflow-hidden animate-fade-in font-sans">
          
          {/* Modal Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-950 shrink-0 h-16">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wrench className="text-cyan-500"/> {ticketFormData.id ? 'ပြုပြင်မှုအချက်အလက် ပြင်ဆင်ရန်' : 'ဖုန်းပြုပြင်ရန် လက်ခံလွှာ'}
            </h2>
            <button onClick={() => setIsStepperOpen(false)} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"><X size={24} /></button>
          </div>

          {/* Stepper Steps Indicators */}
          <div className="bg-gray-950 py-4 px-6 border-b border-gray-850 flex justify-center items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${stepperStep >= 1 ? 'bg-cyan-600 text-white font-bold' : 'bg-gray-800 text-gray-500'}`}>1</div>
              <span className={`text-sm font-semibold ${stepperStep >= 1 ? 'text-white font-bold' : 'text-gray-500'}`}>ဝယ်ယူသူ အချက်အလက်</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-800"></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${stepperStep >= 2 ? 'bg-cyan-600 text-white font-bold' : 'bg-gray-800 text-gray-500'}`}>2</div>
              <span className={`text-sm font-semibold ${stepperStep >= 2 ? 'text-white font-bold' : 'text-gray-500'}`}>ဖုန်းနှင့် အခြေအနေ</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-800"></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${stepperStep >= 3 ? 'bg-cyan-600 text-white font-bold' : 'bg-gray-800 text-gray-500'}`}>3</div>
              <span className={`text-sm font-semibold ${stepperStep >= 3 ? 'text-white font-bold' : 'text-gray-500'}`}>ဝန်ဆောင်မှုခနှင့် ပစ္စည်းစာရင်း</span>
            </div>
          </div>

          {/* Stepper Body (Scrollable content) */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
            
            {/* STEP 1: CUSTOMER DETAILS */}
            {stepperStep === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-200 max-w-4xl mx-auto">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-750">
                  <h3 className="text-md font-bold text-cyan-400 mb-3 flex items-center gap-2"><User size={18}/> ရှိပြီးသား ဝယ်ယူသူ ရွေးချယ်ရန်</h3>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ဝယ်ယူသူ ရွေးချယ်ရန်</label>
                    <select
                      value={ticketFormData.customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-750 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    >
                      <option value="">-- သို့မဟုတ် ဝယ်ယူသူအသစ် ဖြည့်သွင်းရန် --</option>
                      {dropdownCustomers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-bold text-white">ဝယ်ယူသူ အချက်အလက်များ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">ဝယ်ယူသူ အမည် *</label>
                      <input 
                        type="text"
                        required
                        value={ticketFormData.customerName}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="အမည်"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        disabled={!!ticketFormData.customerId}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">ဖုန်းနံပါတ် *</label>
                      <input 
                        type="text"
                        required
                        value={ticketFormData.customerPhone}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="ဖုန်းနံပါတ်"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        disabled={!!ticketFormData.customerId}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">လိပ်စာ (ဖြည့်လိုပါက)</label>
                    <textarea 
                      value={ticketFormData.customerAddress}
                      onChange={(e) => setTicketFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                      placeholder="လိပ်စာ"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none h-20 resize-none"
                      disabled={!!ticketFormData.customerId}
                    />
                  </div>

                  {currentUserType === 'admin' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">တာဝန်ယူမည့် ဆိုင်ခွဲ</label>
                        <select
                            value={ticketFormData.branchId}
                            onChange={(e) => setTicketFormData(prev => ({ ...prev, branchId: e.target.value }))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="">ဆိုင်ခွဲအားလုံး</option>
                            {branches.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: DEVICE & CONDITION */}
            {stepperStep === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-200 max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-white flex items-center gap-2"><Smartphone size={18}/> ဖုန်း အချက်အလက်များ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">အမျိုးအစား/မော်ဒယ် *</label>
                      <input 
                        type="text"
                        required
                        value={ticketFormData.deviceBrandModel}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, deviceBrandModel: e.target.value }))}
                        placeholder="e.g. Apple iPhone 13 Pro"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">အရောင်</label>
                      <input 
                        type="text"
                        value={ticketFormData.deviceColor}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, deviceColor: e.target.value }))}
                        placeholder="e.g. Sierra Blue"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Serial နံပါတ်/IMEI</label>
                      <input 
                        type="text"
                        value={ticketFormData.serialNumberImei}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, serialNumberImei: e.target.value }))}
                        placeholder="IMEI နံပါတ်"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password & Condition */}
                  <div className="space-y-4">
                    <h3 className="text-md font-bold text-white">လက်ခံစဉ် ဖုန်းအခြေအနေ & လော့ခ်</h3>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium">လော့ခ်စကားဝှက် / ပုံစံ (ဖြည့်လိုပါက)</label>
                      <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-750 mb-3 w-fit text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordTab('password');
                            setTicketFormData(prev => ({ ...prev, password: prev.password.startsWith('[Pattern] ') ? '' : prev.password }));
                          }}
                          className={`px-3 py-1.5 rounded-md font-semibold transition-all ${passwordTab === 'password' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                          စကားဝှက် (Password)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordTab('pattern');
                            setTicketFormData(prev => ({ ...prev, password: prev.password.startsWith('[Pattern] ') ? prev.password : '[Pattern] ' }));
                          }}
                          className={`px-3 py-1.5 rounded-md font-semibold transition-all ${passwordTab === 'pattern' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                          ပုံစံဆွဲရန် (Pattern Lock)
                        </button>
                      </div>

                      {passwordTab === 'password' ? (
                        <input 
                          type="text"
                          value={ticketFormData.password}
                          onChange={(e) => setTicketFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="ဖုန်းဖွင့်ရန် စကားဝှက် (ဥပမာ- 1234)"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-3 text-xs text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                      ) : (
                        <div className="flex justify-center p-3 bg-gray-900/30 border border-gray-750 rounded-xl">
                          <PatternLock 
                            value={ticketFormData.password.replace('[Pattern] ', '')}
                            onChange={(val) => setTicketFormData(prev => ({ ...prev, password: val ? `[Pattern] ${val}` : '[Pattern] ' }))}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ဖုန်းအခြေအနေ (ခြစ်ရာ၊ ပိန်ရာ စသည်)</label>
                      <textarea 
                        value={localCondition}
                        onChange={(e) => setLocalCondition(e.target.value)}
                        placeholder="ခြစ်ရာ၊ ပိန်ရာ၊ ကွဲရာ အစရှိသည်"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-xs text-white focus:ring-2 focus:ring-cyan-500 outline-none h-20 resize-none"
                      />
                    </div>
                  </div>

                  {/* Accessories Brought Checkboxes */}
                  <div className="space-y-4">
                    <h3 className="text-md font-bold text-white">ပါလာသည့် အပိုပစ္စည်းများ</h3>
                    
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-750 space-y-4 text-sm">
                      {/* SIM Card Checkbox & Qty */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-white font-medium cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={hasSimCard}
                              onChange={(e) => setHasSimCard(e.target.checked)}
                              className="w-4 h-4 rounded text-cyan-600 bg-gray-900 border-gray-700 focus:ring-cyan-500"
                            />
                            SIM Card ပါဝင်သည်
                          </label>
                          {hasSimCard && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Qty:</span>
                              <input 
                                type="number"
                                min="1"
                                value={simCardQty}
                                onChange={(e) => setSimCardQty(Math.max(1, Number(e.target.value)))}
                                className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-center text-xs text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Charger Cable Checkbox */}
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-white font-medium cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={hasChargerCable}
                            onChange={(e) => setHasChargerCable(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-600 bg-gray-900 border-gray-700 focus:ring-cyan-500"
                          />
                          အားသွင်းကြိုး ပါဝင်သည်
                        </label>
                      </div>

                      {/* Charger Dock Checkbox */}
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 text-white font-medium cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={hasChargerDock}
                            onChange={(e) => setHasChargerDock(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-600 bg-gray-900 border-gray-700 focus:ring-cyan-500"
                          />
                          အားသွင်းခုံ (Adapter) ပါဝင်သည်
                        </label>
                      </div>

                      {/* Other Accessories Remark */}
                      <div className="pt-2 border-t border-gray-800">
                        <label className="block text-xs text-gray-400 mb-1">တခြားအပိုပစ္စည်းများ (Remark)</label>
                        <input 
                          type="text"
                          value={otherAccessories}
                          onChange={(e) => setOtherAccessories(e.target.value)}
                          placeholder="နားကြပ်၊ ကတ်ထည့်ဘူး စသည်..."
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SERVICE & PARTS CART */}
            {stepperStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right duration-200">
                
                {/* Left Column: Ticket Info & Financials */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700 space-y-4">
                    <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
                      <Wrench size={18} className="text-cyan-400"/> ပြုပြင်ရန် တောင်းဆိုချက် အချက်အလက်
                    </h3>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">ချို့ယွင်းချက် အမျိုးအစား / လုပ်ဆောင်ရန်အချက် *</label>
                      <textarea 
                        required
                        value={ticketFormData.problemType}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, problemType: e.target.value }))}
                        placeholder="ဥပမာ- မျက်နှာပြင်လဲလှယ်ရန်"
                        className="w-full bg-gray-900 border border-gray-750 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none h-20 resize-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium flex items-center gap-1"><Calendar size={14}/> ပြီးစီးမည့် ခန့်မှန်းရက်</label>
                      <input 
                        type="datetime-local"
                        value={ticketFormData.estimatedCompletionDate}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, estimatedCompletionDate: e.target.value }))}
                        className="w-full bg-gray-900 border border-gray-750 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-purple-400 mb-1.5 font-medium flex items-center gap-1">
                        <User size={14} /> service ပြုလုပ်သူ (Service Provider)
                      </label>
                      <select
                        value={ticketFormData.technicianId}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, technicianId: e.target.value }))}
                        className="w-full bg-gray-900 border border-purple-900/50 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium"
                      >
                        <option value="">-- ရွေးချယ်ပါ --</option>
                        {(dropdownTechnicians.length > 0 ? dropdownTechnicians : techniciansList).map(t => (
                          <option key={t.id} value={t.id.toString()}>{t.name} {t.phone ? `(${t.phone})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">စတင်မည့် အခြေအနေ</label>
                      <select
                        value={ticketFormData.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as any;
                          setTicketFormData(prev => {
                            const updated = { ...prev, status: newStatus };
                            if (newStatus === 'Picked-up') {
                              updated.paidAmount = Math.max(0, prev.totalAmount - prev.deposit);
                            }
                            return updated;
                          });
                        }}
                        className="w-full bg-gray-900 border border-gray-750 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
                      >
                        <option value="Pending">Pending (စောင့်ဆိုင်းဆဲ)</option>
                        <option value="In-Progress">In-Progress (ပြင်ဆင်ဆဲ)</option>
                        <option value="Ready">Ready (ပြီးစီး/ယူနိုင်ပြီ)</option>
                        <option value="Picked-up">Picked-up (အပ်နှံပြီး)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">နည်းပညာရှင် မှတ်ချက်</label>
                      <textarea 
                        value={ticketFormData.technicianRemark}
                        onChange={(e) => setTicketFormData(prev => ({ ...prev, technicianRemark: e.target.value }))}
                        placeholder="အချက်အလက်များ သို့မဟုတ် ညွှန်ကြားချက်များ..."
                        className="w-full bg-gray-900 border border-gray-750 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none h-20 resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700 space-y-4">
                    <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
                      <DollarSign size={18} className="text-emerald-400"/> ငွေစာရင်း အကျဉ်းချုပ်
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">လက်ခ / ဝန်ဆောင်မှုခ (Ks)</label>
                        <input 
                          type="number"
                          min="0"
                          value={ticketFormData.laborFee}
                          onChange={(e) => handleLaborFeeChange(Number(e.target.value))}
                          className="w-full bg-gray-900 border border-gray-750 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-bold text-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">စရန်ငွေ (Ks)</label>
                        <input 
                          type="number"
                          min="0"
                          value={ticketFormData.deposit}
                          onChange={(e) => setTicketFormData(prev => ({ ...prev, deposit: Number(e.target.value) }))}
                          className="w-full bg-gray-900 border border-gray-750 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-bold text-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">ရှင်းပြီးငွေ / ပေးငွေ (Ks)</label>
                        <input 
                          type="number"
                          min="0"
                          value={ticketFormData.paidAmount}
                          onChange={(e) => setTicketFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                          className="w-full bg-gray-900 border border-gray-750 rounded-xl py-2.5 px-3.5 text-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-bold text-blue-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-700/60 pt-4">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">စုစုပေါင်း ကျသင့်ငွေ</p>
                        <p className="text-xl font-extrabold text-yellow-500 font-mono mt-1">{ticketFormData.totalAmount.toLocaleString()} Ks</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">ပေးရန်ကျန်ငွေ</p>
                        <p className="text-xl font-extrabold text-cyan-400 font-mono mt-1">{(ticketFormData.totalAmount - ticketFormData.deposit - ticketFormData.paidAmount).toLocaleString()} Ks</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Repair Parts Cart */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-gray-800/80 p-5 rounded-2xl border border-gray-700 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                      <h3 className="text-md font-bold text-white flex items-center gap-2">
                        <Grid size={18} className="text-cyan-400"/> ပြုပြင်ရန် အသုံးပြုသည့် ပစ္စည်းများ
                      </h3>
                      
                      {/* Tabs to select parts source */}
                      <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-700">
                        <button
                          type="button"
                          onClick={() => { setActiveCartTab('shop'); setSelectedInventoryItem(null); }}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeCartTab === 'shop' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                          ဆိုင်ရှိ ပစ္စည်းစာရင်း
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveCartTab('external'); setSelectedInventoryItem(null); }}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeCartTab === 'external' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                          ပြင်ပမှ ဝယ်ယူသည့် ပစ္စည်း
                        </button>
                      </div>
                    </div>

                    {/* Add Part Forms */}
                    {activeCartTab === 'shop' ? (
                      <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-750 mb-5 space-y-3">
                        <div className="relative" ref={dropdownRef}>
                          <label className="block text-[10px] text-gray-400 mb-1">ဆိုင်ရှိ ပြုပြင်ရေးပစ္စည်း ရှာဖွေ/ရွေးချယ်ရန်</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                              type="text"
                              placeholder="အမည် သို့မဟုတ် ကုဒ် ဖြင့်ရှာဖွေရန်..."
                              value={cartSearchTerm}
                              onFocus={() => setIsDropdownOpen(true)}
                              onChange={(e) => {
                                  setCartSearchTerm(e.target.value);
                                  setIsDropdownOpen(true);
                                  setSelectedInventoryItem(null); // Clear selection if typing
                              }}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setIsDropdownOpen(prev => !prev)}
                              className="absolute right-3 top-2 text-gray-450 hover:text-white"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>

                          {/* Search result / dropdown list */}
                          {isDropdownOpen && (
                            <div className="absolute z-[100] left-0 right-0 mt-1 bg-gray-800 border border-gray-750 rounded-lg max-h-56 overflow-y-auto custom-scrollbar divide-y divide-gray-700 text-xs shadow-2xl">
                              {inventoryItems
                                .filter(item => item.isService && item.qty > 0 && (
                                  !cartSearchTerm.trim() ||
                                  item.name.toLowerCase().includes(cartSearchTerm.toLowerCase()) || 
                                  item.code.toLowerCase().includes(cartSearchTerm.toLowerCase())
                                ))
                                .map(item => (
                                  <div 
                                    key={item.id}
                                    onClick={() => { 
                                      setSelectedInventoryItem(item); 
                                      setCartAddQty(1); 
                                      setCartSearchTerm(item.name);
                                      setIsDropdownOpen(false); 
                                    }}
                                    className="p-2.5 hover:bg-cyan-950/40 cursor-pointer flex justify-between items-center transition-colors"
                                  >
                                    <div>
                                      <p className="font-semibold text-white">{item.name}</p>
                                      <p className="text-[10px] text-gray-400">{item.code}</p>
                                    </div>
                                    <div className="text-right text-gray-400">
                                      <p className="text-cyan-400 font-bold">{item.sellPrice.toLocaleString()} Ks</p>
                                      <p className="text-[10px]">လက်ကျန်: {item.qty} ခု</p>
                                    </div>
                                  </div>
                                ))
                              }
                              {inventoryItems.filter(item => item.isService && item.qty > 0 && (
                                !cartSearchTerm.trim() ||
                                item.name.toLowerCase().includes(cartSearchTerm.toLowerCase()) || 
                                item.code.toLowerCase().includes(cartSearchTerm.toLowerCase())
                              )).length === 0 && (
                                <p className="p-3 text-center text-gray-500 italic">ကိုက်ညီသော ဆိုင်ရှိ ပြုပြင်ရေးပစ္စည်းများ မတွေ့ပါ။</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Selected product details & quantity input */}
                        {selectedInventoryItem && (
                          <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
                            <div>
                              <p className="font-bold text-white text-xs">{selectedInventoryItem.name}</p>
                              <p className="text-[10px] text-gray-400">{selectedInventoryItem.code} | ဈေးနှုန်း - {selectedInventoryItem.sellPrice.toLocaleString()} Ks</p>
                              <p className="text-[10px] text-yellow-500">လက်ကျန် - {selectedInventoryItem.qty} ခု</p>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className="text-[10px] text-gray-400 font-semibold mr-1">အရေအတွက်:</span>
                              <input
                                type="number"
                                min="1"
                                max={selectedInventoryItem.qty}
                                value={cartAddQty}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setCartAddQty(Math.max(1, Math.min(selectedInventoryItem.qty, val)));
                                }}
                                className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-center text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              />
                              <button
                                type="button"
                                onClick={addInventoryItemToCart}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
                              >
                                ပစ္စည်းထည့်ရန်
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-750 mb-5 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[10px] text-gray-400 mb-1">ပစ္စည်းအမည် *</label>
                            <input
                              type="text"
                              placeholder="ဥပမာ- ဖုန်းနောက်ဖုံး (ပြင်ပမှသီးသန့်ဝယ်ယူခြင်း)"
                              value={extPartName}
                              onChange={(e) => setExtPartName(e.target.value)}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1">ဝယ်ရင်းဈေး (Ks)</label>
                            <input
                              type="number"
                              min="0"
                              value={extPartCost}
                              onChange={(e) => setExtPartCost(Number(e.target.value))}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white outline-none font-semibold text-orange-400 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1">ရောင်းဈေး (Ks)</label>
                            <input
                              type="number"
                              min="0"
                              value={extPartPrice}
                              onChange={(e) => setExtPartPrice(Number(e.target.value))}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white outline-none font-semibold text-blue-400 text-xs"
                            />
                          </div>
                          <div className="col-span-2 flex justify-between items-center border-t border-gray-800 pt-2.5 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">အရေအတွက်:</span>
                              <input
                                type="number"
                                min="1"
                                value={extPartQty}
                                onChange={(e) => setExtPartQty(Math.max(1, Number(e.target.value)))}
                                className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-center text-white text-xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addExternalPartToCart}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 px-4 rounded text-xs transition-colors"
                            >
                              ပြင်ပဝယ်ပစ္စည်း ထည့်ရန်
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cart Table List */}
                    <div className="flex-1 overflow-x-auto border border-gray-700 rounded-xl bg-gray-900/20 max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-900 text-gray-400 border-b border-gray-700">
                            <th className="p-3">ပစ္စည်းအမည်</th>
                            <th className="p-3 w-24 text-center">ရရှိရာနေရာ</th>
                            <th className="p-3 w-28 text-center">အရေအတွက်</th>
                            <th className="p-3 w-28 text-right">ဈေးနှုန်း</th>
                            <th className="p-3 w-28 text-right font-medium">စုစုပေါင်း</th>
                            <th className="p-3 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-750">
                          {ticketFormData.parts.length > 0 ? (
                            ticketFormData.parts.map((p, idx) => (
                              <tr key={idx} className="hover:bg-gray-800/45">
                                <td className="p-3">
                                  <p className="font-semibold text-white">{p.partName}</p>
                                  {p.code && <p className="text-[9px] text-gray-400">{p.code}</p>}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.isExternal ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {p.isExternal ? 'ပြင်ပဝယ်' : 'ဆိုင်ရှိ'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => updateCartPartQty(idx, p.qty - 1)}
                                      className="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center text-white font-semibold">{p.qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateCartPartQty(idx, p.qty + 1)}
                                      className="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-semibold text-gray-300">
                                  {p.price.toLocaleString()} Ks
                                </td>
                                <td className="p-3 text-right font-bold text-white">
                                  {(p.price * p.qty).toLocaleString()} Ks
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeCartPart(idx)}
                                    className="text-red-400 hover:text-red-350 hover:bg-red-950/30 p-1 rounded transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                                ပြုပြင်ရန် အသုံးပြုသည့် ပစ္စည်းစာရင်း မရှိသေးပါ။
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Stepper Footer Controls */}
          <div className="p-5 bg-gray-950 border-t border-gray-800 flex justify-between shrink-0 h-20 items-center">
            <button 
              type="button" 
              onClick={() => setStepperStep(prev => Math.max(1, prev - 1))}
              disabled={stepperStep === 1}
              className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              နောက်သို့
            </button>
            
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsStepperOpen(false)} 
                className="px-5 py-2.5 rounded-xl border border-gray-750 text-gray-400 hover:text-white text-sm hover:bg-gray-800"
              >
                မလုပ်တော့ပါ
              </button>
              {stepperStep < 3 ? (
                <button 
                  type="button"
                  onClick={() => {
                    if (stepperStep === 2 && !ticketFormData.deviceBrandModel.trim()) {
                      alert('ဖုန်းအမျိုးအစား/မော်ဒယ် ဖြည့်သွင်းရန် လိုအပ်ပါသည်။');
                      return;
                    }
                    setStepperStep(prev => prev + 1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 font-bold text-sm shadow-md transition-colors"
                >
                  ရှေ့သို့
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleStepperSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 font-bold text-sm shadow-lg flex items-center gap-2 transition-colors"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                  {ticketFormData.id ? 'ပြင်ဆင်မှု သိမ်းဆည်းရန်' : 'ပြုပြင်မှုအသစ် လက်ခံရန်'}
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          MODAL: TICKET DETAILS VIEW MODAL
          ========================================================================= */}
      {isDetailOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]">
            
            {/* Detail Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-750 rounded-t-2xl shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-cyan-500"/> ပြုပြင်မှုအသေးစိတ် အချက်အလက်
                </h2>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">တိုကင်နံပါတ်: {selectedTicket.ticketNo}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left side info */}
                <div className="space-y-4">
                  {/* Status update panel */}
                  <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-750">
                    <label className="block text-xs font-bold text-gray-450 uppercase mb-2">ပြုပြင်မှုအခြေအနေ ပြောင်းလဲရန်</label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        disabled={isStatusUpdating}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none flex-1"
                      >
                        <option value="Pending">Pending (စောင့်ဆိုင်းဆဲ)</option>
                        <option value="In-Progress">In-Progress (ပြင်ဆင်ဆဲ)</option>
                        <option value="Ready">Ready (ပြီးစီး/ယူနိုင်ပြီ)</option>
                        <option value="Picked-up">Picked-up (အပ်နှံပြီး)</option>
                      </select>
                      {isStatusUpdating && <Loader2 className="animate-spin text-cyan-500 shrink-0" size={18} />}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">ဝယ်ယူသူ အချက်အလက်</h3>
                    <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 space-y-1">
                      <p className="text-white font-bold text-md">{selectedTicket.customerName}</p>
                      <p className="text-sm text-gray-300">ဖုန်း: {selectedTicket.customerPhone}</p>
                      {selectedTicket.customerAddress && <p className="text-xs text-gray-400 mt-1">လိပ်စာ: {selectedTicket.customerAddress}</p>}
                    </div>
                  </div>

                  {/* Service Provider Info */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Service ပြုလုပ်သူ</h3>
                    <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 flex items-center gap-2">
                      <User size={16} className="text-purple-400" />
                      <span className="text-white font-bold text-sm">{selectedTicket.technicianName || 'သတ်မှတ်မထားပါ'}</span>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">ဖုန်းအချက်အလက်</h3>
                    <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-450 text-xs">မော်ဒယ်:</span> <p className="font-semibold text-white">{selectedTicket.deviceBrandModel}</p></div>
                        <div><span className="text-gray-450 text-xs">အရောင်:</span> <p className="font-semibold text-white">{selectedTicket.deviceColor || '-'}</p></div>
                        <div><span className="text-gray-450 text-xs">IMEI/Serial:</span> <p className="font-mono text-xs font-bold text-white">{selectedTicket.serialNumberImei || '-'}</p></div>
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
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">ဖုန်း၏ ရုပ်ပိုင်းဆိုင်ရာဓာတ်ပုံ</h3>
                      <div className="bg-gray-850 p-2 rounded-xl border border-gray-750 overflow-hidden aspect-video">
                        <img 
                          src={getImageUrl(selectedTicket.deviceImage) || ''} 
                          alt="Device condition" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Financial & Time */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">ငွေစာရင်းနှင့် အချိန်ကာလ</h3>
                    <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 text-sm space-y-2 font-sans">
                      <div className="flex justify-between"><span className="text-gray-400">ချို့ယွင်းချက်:</span> <span className="font-semibold text-white">{selectedTicket.problemType}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">ဝန်ဆောင်မှု လက်ခ:</span> <span className="font-semibold text-white">{(selectedTicket.totalAmount - (selectedTicket.parts || []).reduce((sum, p) => sum + (p.price * p.qty), 0)).toLocaleString()} Ks</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">ပစ္စည်းစုစုပေါင်း:</span> <span className="font-semibold text-white">{(selectedTicket.parts || []).reduce((sum, p) => sum + (p.price * p.qty), 0).toLocaleString()} Ks</span></div>
                      <div className="flex justify-between border-t border-gray-700 pt-1.5"><span className="text-gray-400 font-semibold">စုစုပေါင်း ကျသင့်ငွေ:</span> <span className="font-bold text-yellow-500">{selectedTicket.totalAmount.toLocaleString()} Ks</span></div>
                      <div className="flex justify-between"><span className="text-gray-400 font-semibold">စရန်ငွေ:</span> <span className="font-bold text-emerald-400">{selectedTicket.deposit.toLocaleString()} Ks</span></div>
                      <div className="flex justify-between"><span className="text-gray-400 font-semibold">ရှင်းပြီးငွေ / ပေးငွေ:</span> <span className="font-bold text-blue-400">{(selectedTicket.paidAmount || 0).toLocaleString()} Ks</span></div>
                      <div className="flex justify-between border-t border-gray-700 pt-1.5 font-bold"><span className="text-white">ပေးရန်ကျန်ငွေ:</span> <span className="text-cyan-400">{(selectedTicket.totalAmount - selectedTicket.deposit - (selectedTicket.paidAmount || 0)).toLocaleString()} Ks</span></div>
                      <div className="flex justify-between border-t border-gray-750 pt-1.5 text-xs text-gray-400">
                        <span>ပြီးစီးမည့် ခန့်မှန်းရက်:</span> 
                        <span>
                          {selectedTicket.estimatedCompletionDate 
                            ? new Date(selectedTicket.estimatedCompletionDate).toLocaleString() 
                            : 'သတ်မှတ်ထားခြင်းမရှိပါ'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>



              {/* Parts Used detail row */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">ပြုပြင်ရန် အသုံးပြုသည့် ပစ္စည်းများ</h3>
                <div className="bg-gray-850 p-4 rounded-xl border border-gray-750">
                  {selectedTicket.parts && selectedTicket.parts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-sans">
                        <thead>
                          <tr className="text-gray-405 border-b border-gray-700 pb-2">
                            <th className="pb-2 text-left">ပစ္စည်းအမည်</th>
                            <th className="pb-2 text-center w-24">ရရှိရာနေရာ</th>
                            <th className="pb-2 text-center w-16">အရေအတွက်</th>
                            <th className="pb-2 text-right w-24">ဈေးနှုန်း</th>
                            <th className="pb-2 text-right w-28">စုစုပေါင်း</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-750/50">
                          {selectedTicket.parts.map((part, idx) => (
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
                              <td className="py-2.5 text-center font-semibold text-white">{part.qty}</td>
                              <td className="py-2.5 text-right">{part.price.toLocaleString()} Ks</td>
                              <td className="py-2.5 text-right font-bold text-white">{(part.price * part.qty).toLocaleString()} Ks</td>
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
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">နည်းပညာရှင် မှတ်ချက်</h3>
                  <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-750 text-sm text-gray-250 font-sans whitespace-pre-wrap">
                    {selectedTicket.technicianRemark}
                  </div>
                </div>
              )}
            </div>

            {/* Detail Footer Controls */}
            <div className="p-4 bg-gray-750 border-t border-gray-700 flex justify-between shrink-0">
              {hasEditPermission && (
                <button 
                  onClick={() => openDeleteTicketConfirm(selectedTicket.id, selectedTicket.ticketNo)}
                  className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  တိုကင် ဖျက်ပစ်ရန်
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-650 text-gray-200 hover:text-white text-sm font-medium transition-colors"
                >
                  ပိတ်ရန်
                </button>
              </div>
            </div>

          </div>
        </div>
      )}



      {/* Ticket Delete Confirmation Modal */}
      <ConfirmModal
          isOpen={ticketDeleteConfirm.isOpen}
          title="ပြုပြင်မှုတိုကင် ဖျက်ရန်"
          message={`တိုကင်နံပါတ် "${ticketDeleteConfirm.ticketNo}" ကို ဖျက်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။`}
          onConfirm={handleDeleteTicket}
          onCancel={() => setTicketDeleteConfirm({ isOpen: false, id: '', ticketNo: '' })}
          isLoading={isDeletingTicket}
          confirmText="ဖျက်မည်"
          cancelText="မလုပ်တော့ပါ"
      />

      {/* Technician Management Modal */}
      {isTechnicianModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 font-sans">
            {/* Modal Header */}
            <div className="p-4 bg-gray-750 border-b border-gray-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-purple-400">
                <User size={22} />
                <h2 className="text-lg font-bold text-white">Service ပြုလုပ်သူများ စီမံရန် (Service Providers)</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTechnicianModalOpen(false);
                  setEditingTechnician(null);
                  setTechnicianForm({ name: '', phone: '', specialty: '', note: '', status: 'Active' });
                }}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="md:col-span-1 bg-gray-900/60 p-4 rounded-xl border border-gray-700 h-fit space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-gray-700 pb-2">
                  {editingTechnician ? 'Service ပြုလုပ်သူ ပြင်ဆင်ရန်' : 'Service ပြုလုပ်သူ အသစ်ထည့်ရန်'}
                </h3>
                <form onSubmit={handleSaveTechnician} className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">အမည် *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ကိုကျော်ကျော်"
                      value={technicianForm.name}
                      onChange={(e) => setTechnicianForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ဖုန်းနံပါတ်</label>
                    <input
                      type="text"
                      placeholder="e.g. 09123456789"
                      value={technicianForm.phone}
                      onChange={(e) => setTechnicianForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ကျွမ်းကျင်မှု / တာဝန်</label>
                    <input
                      type="text"
                      placeholder="e.g. Hardware, Software, LCD"
                      value={technicianForm.specialty}
                      onChange={(e) => setTechnicianForm(prev => ({ ...prev, specialty: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">မှတ်ချက်</label>
                    <textarea
                      placeholder="မှတ်ချက်..."
                      value={technicianForm.note}
                      onChange={(e) => setTechnicianForm(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none h-16 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">အခြေအနေ</label>
                    <select
                      value={technicianForm.status}
                      onChange={(e) => setTechnicianForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
                    >
                      <option value="Active">Active (လက်ရှိလုပ်ကိုင်နေသူ)</option>
                      <option value="Inactive">Inactive (ရပ်နားထားသူ)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingTechnician && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTechnician(null);
                          setTechnicianForm({ name: '', phone: '', specialty: '', note: '', status: 'Active' });
                        }}
                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-semibold"
                      >
                        မလုပ်တော့ပါ
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmittingTechnician}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {isSubmittingTechnician && <Loader2 size={14} className="animate-spin" />}
                      {editingTechnician ? 'ပြင်ဆင်မှုသိမ်းမည်' : 'အသစ်ထည့်မည်'}
                    </button>
                  </div>
                </form>
              </div>

              {/* List Section */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Service ပြုလုပ်သူ အမည်၊ ဖုန်း ဖြင့်ရှာရန်..."
                      value={technicianSearch}
                      onChange={(e) => setTechnicianSearch(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-750 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-800 text-gray-400 uppercase font-bold border-b border-gray-700">
                        <th className="p-3">အမည်</th>
                        <th className="p-3">ဖုန်းနံပါတ်</th>
                        <th className="p-3">ကျွမ်းကျင်မှု</th>
                        <th className="p-3 text-center">အခြေအနေ</th>
                        <th className="p-3 text-center">လုပ်ဆောင်ချက်</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {techniciansLoading ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-400">
                            <Loader2 className="animate-spin inline mr-2 text-purple-400" size={20} />
                            အချက်အလက် ခေါ်ယူနေပါသည်...
                          </td>
                        </tr>
                      ) : techniciansList.length > 0 ? (
                        techniciansList.map(tech => (
                          <tr key={tech.id} className="hover:bg-gray-850 transition-colors">
                            <td className="p-3 font-semibold text-white">{tech.name}</td>
                            <td className="p-3 text-gray-300 font-mono">{tech.phone || '-'}</td>
                            <td className="p-3 text-gray-300">{tech.specialty || '-'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tech.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                                {tech.status === 'Active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditTechnicianClick(tech)}
                                  className="p-1.5 text-cyan-400 hover:bg-cyan-950/40 rounded transition-colors"
                                  title="ပြင်ဆင်ရန်"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTechnicianDeleteConfirm({ isOpen: true, id: tech.id, name: tech.name })}
                                  className="p-1.5 text-red-400 hover:bg-red-950/40 rounded transition-colors"
                                  title="ဖျက်ပစ်ရန်"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500 italic">
                            Service ပြုလုပ်သူ စာရင်း မရှိသေးပါ။
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technician Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={technicianDeleteConfirm.isOpen}
        title="Service ပြုလုပ်သူ ဖျက်ရန်"
        message={`Service ပြုလုပ်သူ "${technicianDeleteConfirm.name}" ကို ဖျက်ရန် သေချာပါသလား?`}
        onConfirm={handleDeleteTechnician}
        onCancel={() => setTechnicianDeleteConfirm({ isOpen: false, id: '', name: '' })}
        isLoading={isDeletingTechnician}
        confirmText="ဖျက်မည်"
        cancelText="မလုပ်တော့ပါ"
      />
    </div>
  );
};

export default Services;
