import { create } from 'zustand';

export interface Customer {
  id: string;
  name: string;
  advisor: string;
  investmentFee: number;
  gift: string;
  giftValue: number;
  status: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftTier {
  id: string;
  minFee: number;
  maxFee: number;
  giftName: string;
  giftValue: number;
  order: number;
}

export interface EventInfo {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface InvestmentStore {
  // Data
  customers: Customer[];
  giftTiers: GiftTier[];
  eventInfo: EventInfo;
  isLoading: boolean;
  searchKeyword: string;
  statusFilter: string;

  // Actions
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: string) => void;
  loadAll: () => Promise<void>;
  saveCustomer: (customer: Partial<Customer> & { name: string }) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  toggleReceivedStatus: (id: string) => Promise<void>;
  saveEventInfo: (info: Partial<EventInfo>) => Promise<void>;
  saveGiftTiers: (tiers: Omit<GiftTier, 'id' | 'order'>[]) => Promise<void>;

  // Computed
  getFilteredCustomers: () => Customer[];
  getStats: () => { totalCustomers: number; totalFee: number; totalGiftValue: number };
  getGiftByFee: (fee: number) => { name: string; value: number };
}

export const useInvestmentStore = create<InvestmentStore>((set, get) => ({
  customers: [],
  giftTiers: [],
  eventInfo: { id: 'default', name: 'SỰ KIỆN ĐẦU TƯ 2025', date: '20/03/2025', location: 'TP. Hồ Chí Minh' },
  isLoading: true,
  searchKeyword: '',
  statusFilter: '',

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  loadAll: async () => {
    set({ isLoading: true });
    try {
      const [customersRes, tiersRes, eventRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/gift-tiers'),
        fetch('/api/event-info'),
      ]);

      const customersData = await customersRes.json();
      const tiersData = await tiersRes.json();
      const eventData = await eventRes.json();

      if (customersData.success) set({ customers: customersData.customers });
      if (tiersData.success) set({ giftTiers: tiersData.tiers });
      if (eventData.success) set({ eventInfo: eventData.eventInfo });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveCustomer: async (customer) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    const data = await res.json();
    if (data.success) {
      await get().loadAll();
    } else {
      throw new Error(data.error || 'Failed to save');
    }
  },

  deleteCustomer: async (id) => {
    const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await get().loadAll();
    } else {
      throw new Error(data.error || 'Failed to delete');
    }
  },

  toggleReceivedStatus: async (id) => {
    const customer = get().customers.find(c => c.id === id);
    if (!customer) return;
    const newStatus = customer.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà';
    await get().saveCustomer({ ...customer, status: newStatus });
  },

  saveEventInfo: async (info) => {
    const res = await fetch('/api/event-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    });
    const data = await res.json();
    if (data.success) {
      set({ eventInfo: data.eventInfo });
    }
  },

  saveGiftTiers: async (tiers) => {
    const res = await fetch('/api/gift-tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiers }),
    });
    const data = await res.json();
    if (data.success) {
      set({ giftTiers: data.tiers });
    }
  },

  getFilteredCustomers: () => {
    const { customers, searchKeyword, statusFilter } = get();
    return customers.filter(c => {
      const matchKeyword = !searchKeyword ||
        c.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        c.advisor.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchStatus = !statusFilter || c.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  },

  getStats: () => {
    const { customers } = get();
    return {
      totalCustomers: customers.length,
      totalFee: customers.reduce((s, c) => s + (c.investmentFee || 0), 0),
      totalGiftValue: customers.reduce((s, c) => s + (c.giftValue || 0), 0),
    };
  },

  getGiftByFee: (fee) => {
    const { giftTiers } = get();
    const tier = giftTiers.find(t => fee >= t.minFee && fee <= t.maxFee);
    return tier ? { name: tier.giftName, value: tier.giftValue } : { name: '', value: 0 };
  },
}));
