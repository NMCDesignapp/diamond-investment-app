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

export interface DrawPrize {
  id: string;
  name: string;
  quantity: number;
  gift: string;
  order: number;
}

export interface LuckyDrawEventInfo {
  id: string;
  name: string;
  date: string;
  location: string;
}

interface InvestmentStore {
  // Data
  customers: Customer[];
  giftTiers: GiftTier[];
  drawPrizes: DrawPrize[];
  eventInfo: EventInfo;
  luckyDrawEvent: LuckyDrawEventInfo;
  isLoading: boolean;
  searchKeyword: string;
  statusFilter: string;

  // Actions
  setSearchKeyword: (keyword: string) => void;
  setStatusFilter: (status: string) => void;
  loadAll: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  saveCustomer: (customer: Partial<Customer> & { name: string }) => Promise<void>;
  saveCustomerSilent: (customer: Partial<Customer> & { name: string }) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  toggleReceivedStatus: (id: string) => Promise<void>;
  saveEventInfo: (info: Partial<EventInfo>) => Promise<void>;
  saveGiftTiers: (tiers: Omit<GiftTier, 'id' | 'order'>[]) => Promise<void>;
  saveDrawPrizes: (prizes: { name: string; quantity: number; gift?: string }[]) => Promise<void>;
  saveLuckyDrawEvent: (info: Partial<LuckyDrawEventInfo>) => Promise<void>;

  // Computed
  getFilteredCustomers: () => Customer[];
  getStats: () => { totalCustomers: number; totalFee: number; totalGiftValue: number };
  getGiftByFee: (fee: number) => { name: string; value: number };
}

export const useInvestmentStore = create<InvestmentStore>((set, get) => ({
  customers: [],
  giftTiers: [],
  drawPrizes: [],
  eventInfo: { id: 'default', name: 'SỰ KIỆN ĐẦU TƯ 2025', date: '20/03/2025', location: 'TP. Hồ Chí Minh' },
  luckyDrawEvent: { id: 'default', name: 'QUAY SỐ MAY MẮN', date: '', location: '' },
  isLoading: true,
  searchKeyword: '',
  statusFilter: '',

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  loadAll: async () => {
    set({ isLoading: true });
    try {
      const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) return res;
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            }
          } catch (err) {
            if (attempt === retries) throw err;
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          }
        }
        throw new Error(`Failed to fetch ${url} after retries`);
      };

      const [customersRes, tiersRes, eventRes, drawPrizesRes, luckyDrawEventRes] = await Promise.all([
        fetchWithRetry('/api/customers'),
        fetchWithRetry('/api/gift-tiers'),
        fetchWithRetry('/api/event-info'),
        fetchWithRetry('/api/draw-prizes'),
        fetchWithRetry('/api/lucky-draw-event'),
      ]);

      const customersData = await customersRes.json();
      const tiersData = await tiersRes.json();
      const eventData = await eventRes.json();
      const drawPrizesData = await drawPrizesRes.json();
      const luckyDrawEventData = await luckyDrawEventRes.json();

      if (customersData.success) set({ customers: customersData.customers || [] });
      if (tiersData.success) set({ giftTiers: tiersData.tiers || [] });
      if (eventData.success) set({ eventInfo: eventData.eventInfo || { id: 'default', name: 'SỰ KIỆN ĐẦU TƯ 2025', date: '20/03/2025', location: 'TP. Hồ Chí Minh' } });
      if (drawPrizesData.success) set({ drawPrizes: drawPrizesData.prizes || [] });
      if (luckyDrawEventData.success) set({ luckyDrawEvent: luckyDrawEventData.eventInfo || { id: 'default', name: 'QUAY SỐ MAY MẮN', date: '', location: '' } });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh customers silently (no loading spinner) - used for background sync after optimistic updates
  refreshCustomers: async () => {
    try {
      const res = await fetch('/api/customers', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        set({ customers: data.customers || [] });
      }
    } catch (error) {
      console.error('Failed to refresh customers:', error);
    }
  },

  // Save customer to API without triggering optimistic UI updates (used internally by toggleReceivedStatus)
  saveCustomerSilent: async (customer) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save');
    }
  },

  saveCustomer: async (customer) => {
    // Optimistic: update local state immediately to avoid flicker
    const isEdit = !!customer.id && get().customers.some(c => c.id === customer.id);
    if (isEdit) {
      // Update existing customer locally
      const gift = get().getGiftByFee(customer.investmentFee || 0);
      set({
        customers: get().customers.map(c =>
          c.id === customer.id
            ? { ...c, ...customer, gift: gift.name || c.gift, giftValue: gift.value || c.giftValue, updatedAt: new Date().toISOString() }
            : c
        ),
      });
    }

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    const data = await res.json();
    if (data.success) {
      if (isEdit) {
        // Already updated optimistically, refresh data silently in background (no loading spinner)
        get().refreshCustomers();
      } else {
        // New customer: add from API response to avoid full reload
        if (data.customer) {
          set({ customers: [...get().customers, data.customer] });
        } else {
          await get().refreshCustomers();
        }
      }
    } else {
      // Revert on failure
      if (isEdit) await get().refreshCustomers();
      throw new Error(data.error || 'Failed to save');
    }
  },

  deleteCustomer: async (id) => {
    // Optimistic: remove from local state immediately
    set({ customers: get().customers.filter(c => c.id !== id) });

    const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      // Already removed optimistically, no need for full reload
    } else {
      // Revert on failure: reload from server
      await get().refreshCustomers();
      throw new Error(data.error || 'Failed to delete');
    }
  },

  toggleReceivedStatus: async (id) => {
    const customer = get().customers.find(c => c.id === id);
    if (!customer) return;
    const newStatus = customer.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà';

    // Optimistic: update local state immediately
    set({
      customers: get().customers.map(c =>
        c.id === id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      ),
    });

    // Save to API in background (no await to avoid any delay)
    try {
      await get().saveCustomerSilent({ ...customer, status: newStatus });
    } catch {
      // Revert on failure
      set({
        customers: get().customers.map(c =>
          c.id === id ? { ...c, status: customer.status } : c
        ),
      });
    }
  },

  saveEventInfo: async (info) => {
    // Merge with existing eventInfo so partial updates don't wipe out other fields
    const current = get().eventInfo;
    const merged = {
      name: info.name ?? current.name,
      date: info.date ?? current.date,
      location: info.location ?? current.location,
    };
    const res = await fetch('/api/event-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
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

  saveDrawPrizes: async (prizes) => {
    const res = await fetch('/api/draw-prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prizes }),
    });
    const data = await res.json();
    if (data.success) {
      set({ drawPrizes: data.prizes });
    }
  },

  saveLuckyDrawEvent: async (info) => {
    const current = get().luckyDrawEvent;
    const merged = {
      name: info.name ?? current.name,
      date: info.date ?? current.date,
      location: info.location ?? current.location,
    };
    const res = await fetch('/api/lucky-draw-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    });
    const data = await res.json();
    if (data.success) {
      set({ luckyDrawEvent: data.eventInfo });
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
