'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Gift, Crown, Settings, Plus, Trash2,
  Check, X, ChevronDown, ChevronUp, Send, Wifi, WifiOff,
  Play, Pause, RefreshCw, Edit3, Save, ToggleLeft, ToggleRight,
  Diamond, Star, Zap
} from 'lucide-react';
import Link from 'next/link';

// Types
interface Customer {
  id: string;
  name: string;
  advisor: string;
  investmentFee: number;
  gift: string;
  giftValue: number;
  status: string;
  note: string;
}

interface GiftTier {
  id: string;
  minFee: number;
  maxFee: number;
  giftName: string;
  giftValue: number;
  order: number;
}

interface DrawPrize {
  id: string;
  name: string;
  quantity: number;
  gift: string;
  order: number;
}

interface EventInfo {
  id: string;
  name: string;
  date: string;
  location: string;
}

function titleCase(str: string) {
  if (!str) return '';
  return str.split(/\s+/).map(word => {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

export default function RemotePage() {
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [giftTiers, setGiftTiers] = useState<GiftTier[]>([]);
  const [drawPrizes, setDrawPrizes] = useState<DrawPrize[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo>({ id: 'default', name: '', date: '', location: '' });
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'customers' | 'prizes' | 'control' | 'settings'>('customers');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [giftFilter, setGiftFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAdvisor, setFormAdvisor] = useState('');
  const [formFee, setFormFee] = useState('');
  const [formNote, setFormNote] = useState('');

  // Connection status
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Notification helper
  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  }, []);

  // Load all data
  const loadAll = useCallback(async () => {
    try {
      const [customersRes, tiersRes, prizesRes, eventRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/gift-tiers'),
        fetch('/api/draw-prizes'),
        fetch('/api/event-info'),
      ]);
      const customersData = await customersRes.json();
      const tiersData = await tiersRes.json();
      const prizesData = await prizesRes.json();
      const eventData = await eventRes.json();

      if (customersData.success) setCustomers(customersData.customers || []);
      if (tiersData.success) setGiftTiers(tiersData.tiers || []);
      if (prizesData.success) setDrawPrizes(prizesData.prizes || []);
      if (eventData.success) setEventInfo(eventData.eventInfo || { id: 'default', name: '', date: '', location: '' });
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(loadAll, 10000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // Send command to main app
  const sendCommand = useCallback(async (command: string, payload: Record<string, unknown> = {}) => {
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, payload }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Đã gửi lệnh: ${command}`);
      }
    } catch {
      notify('Lỗi gửi lệnh', 'error');
    }
  }, [notify]);

  // Save customer (add or edit)
  const saveCustomer = useCallback(async () => {
    if (!formName.trim()) {
      notify('Vui lòng nhập tên khách hàng', 'error');
      return;
    }
    try {
      const body: Record<string, unknown> = {
        name: formName.trim(),
        advisor: formAdvisor.trim(),
        investmentFee: parseFloat(formFee) || 0,
        note: formNote.trim(),
      };
      if (editingCustomer) {
        body.id = editingCustomer.id;
      }
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        notify(editingCustomer ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng');
        resetForm();
        loadAll();
      } else {
        notify(data.error || 'Lỗi lưu khách hàng', 'error');
      }
    } catch {
      notify('Lỗi kết nối', 'error');
    }
  }, [formName, formAdvisor, formFee, formNote, editingCustomer, notify, loadAll]);

  // Delete customer
  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify('Đã xóa khách hàng');
        loadAll();
      }
    } catch {
      notify('Lỗi xóa khách hàng', 'error');
    }
  }, [notify, loadAll]);

  // Toggle status
  const toggleStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        notify('Đã chuyển trạng thái');
        loadAll();
      }
    } catch {
      notify('Lỗi chuyển trạng thái', 'error');
    }
  }, [notify, loadAll]);

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormAdvisor('');
    setFormFee('');
    setFormNote('');
    setEditingCustomer(null);
    setShowAddForm(false);
  };

  // Start editing
  const startEdit = (c: Customer) => {
    setFormName(c.name);
    setFormAdvisor(c.advisor);
    setFormFee(String(c.investmentFee));
    setFormNote(c.note);
    setEditingCustomer(c);
    setShowAddForm(true);
  };

  // Get gift name by fee
  const getGiftByFee = (fee: number) => {
    const tier = giftTiers.find(t => fee >= t.minFee && fee <= t.maxFee);
    return tier ? tier.giftName : '';
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchSearch = !searchKeyword ||
      c.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.advisor.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchGift = !giftFilter || getGiftByFee(c.investmentFee) === giftFilter;
    return matchSearch && matchStatus && matchGift;
  });

  // Stats
  const totalFee = customers.reduce((s, c) => s + c.investmentFee, 0);
  const receivedCount = customers.filter(c => c.status === 'Đã nhận quà').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628, #0f2042, #162d50)' }}>
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Diamond className="w-10 h-10 mx-auto" style={{ color: '#ffe08a' }} />
          </motion.div>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,224,138,0.5)' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a1628, #0f2042, #162d50)' }}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-center text-sm font-bold"
            style={{
              background: notification.type === 'success' ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0f2042, #162d50)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>
        <div className="flex items-center gap-2">
          <Link href="/">
            <motion.button whileTap={{ scale: 0.9 }} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,224,138,0.1)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: '#ffe08a' }} />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-lg font-black uppercase tracking-wider" style={{ color: '#ffe08a' }}>REMOTE</h1>
            <p className="text-[10px]" style={{ color: 'rgba(255,224,138,0.4)' }}>Điều khiển từ xa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px]" style={{ background: 'rgba(16,185,129,0.15)', color: '#00e676' }}>
            {lastSync ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{lastSync ? `${lastSync.toLocaleTimeString('vi-VN')}` : 'Offline'}</span>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={loadAll} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,224,138,0.1)' }}>
            <RefreshCw className="w-4 h-4" style={{ color: '#ffe08a' }} />
          </motion.button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex-shrink-0 px-4 py-2 flex gap-2" style={{ background: 'rgba(15,34,64,0.6)', borderBottom: '1px solid rgba(212,168,67,0.15)' }}>
        <div className="flex-1 text-center px-2 py-1 rounded-lg" style={{ background: 'rgba(20,42,82,0.8)' }}>
          <div className="text-xs" style={{ color: 'rgba(255,224,138,0.5)' }}>Khách</div>
          <div className="text-base font-bold" style={{ color: '#ffe08a' }}>{customers.length}</div>
        </div>
        <div className="flex-1 text-center px-2 py-1 rounded-lg" style={{ background: 'rgba(20,42,82,0.8)' }}>
          <div className="text-xs" style={{ color: 'rgba(255,224,138,0.5)' }}>Đã nhận</div>
          <div className="text-base font-bold" style={{ color: '#00e676' }}>{receivedCount}</div>
        </div>
        <div className="flex-1 text-center px-2 py-1 rounded-lg" style={{ background: 'rgba(20,42,82,0.8)' }}>
          <div className="text-xs" style={{ color: 'rgba(255,224,138,0.5)' }}>Tổng phí</div>
          <div className="text-base font-bold" style={{ color: '#ffe08a' }}>{(totalFee / 1e6).toFixed(0)}tr</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex-shrink-0 flex gap-1 px-3 py-2" style={{ background: 'rgba(10,22,40,0.8)' }}>
        {([
          { key: 'customers' as const, label: 'Khách', icon: Users },
          { key: 'prizes' as const, label: 'Giải', icon: Crown },
          { key: 'control' as const, label: 'Điều khiển', icon: Zap },
          { key: 'settings' as const, label: 'Cài đặt', icon: Settings },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeTab === tab.key ? 'linear-gradient(135deg, #d4a843, #c9a227)' : 'rgba(20,42,82,0.6)',
              color: activeTab === tab.key ? '#0a1628' : 'rgba(212,168,67,0.5)',
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* === CUSTOMERS TAB === */}
        {activeTab === 'customers' && (
          <div className="p-3 space-y-2">
            {/* Search & filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Tìm tên, TVV..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(20,42,82,0.9)', color: '#ffe08a' }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(20,42,82,0.9)', color: '#ffe08a' }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đã nhận quà">Đã nhận</option>
                <option value="Chưa nhận quà">Chưa nhận</option>
                <option value="Không nhận quà">Không nhận</option>
              </select>
              <select
                value={giftFilter}
                onChange={(e) => setGiftFilter(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(20,42,82,0.9)', color: '#ffe08a' }}
              >
                <option value="">Tất cả quà</option>
                {giftTiers.map(t => (
                  <option key={t.id} value={t.giftName}>{t.giftName}</option>
                ))}
              </select>
            </div>

            {/* Add button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { resetForm(); setShowAddForm(true); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #d4a843, #c9a227)', color: '#0a1628' }}
            >
              <Plus className="w-4 h-4" /> Thêm khách hàng
            </motion.button>

            {/* Add/Edit form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-xl space-y-2 p-3"
                  style={{ background: 'rgba(15,34,64,0.95)', border: '1px solid rgba(212,168,67,0.3)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold" style={{ color: '#ffe08a' }}>
                      {editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
                    </span>
                    <button onClick={resetForm} className="p-1 rounded" style={{ color: 'rgba(212,168,67,0.5)' }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Tên khách hàng *"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#ffe08a' }}
                  />
                  <input
                    type="text"
                    placeholder="TVV (Tư vấn viên)"
                    value={formAdvisor}
                    onChange={(e) => setFormAdvisor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#ffe08a' }}
                  />
                  <input
                    type="number"
                    placeholder="Phí đầu tư (triệu)"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#ffe08a' }}
                  />
                  {formFee && giftTiers.length > 0 && (
                    <div className="px-2 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(16,185,129,0.1)', color: '#00e676' }}>
                      <Gift className="w-3 h-3 inline mr-1" />
                      Quà: {getGiftByFee(parseFloat(formFee) || 0) || 'Không thuộc khung nào'}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Ghi chú"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#ffe08a' }}
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={saveCustomer}
                      className="flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"
                      style={{ background: 'linear-gradient(135deg, #d4a843, #c9a227)', color: '#0a1628' }}
                    >
                      <Save className="w-3.5 h-3.5" /> {editingCustomer ? 'Cập nhật' : 'Thêm'}
                    </motion.button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid rgba(212,168,67,0.3)', color: 'rgba(212,168,67,0.5)' }}
                    >
                      Hủy
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Customer list */}
            <div className="space-y-1.5">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,168,67,0.2)' }} />
                  <p className="text-sm" style={{ color: 'rgba(212,168,67,0.3)' }}>Không có khách hàng</p>
                </div>
              ) : (
                filteredCustomers.map(c => {
                  const giftName = getGiftByFee(c.investmentFee);
                  const isReceived = c.status === 'Đã nhận quà';
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      className="rounded-xl p-3 space-y-1.5"
                      style={{
                        background: isReceived ? 'rgba(16,185,129,0.06)' : 'rgba(15,34,64,0.9)',
                        border: `1px solid ${isReceived ? 'rgba(16,185,129,0.2)' : 'rgba(212,168,67,0.15)'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold truncate" style={{ color: isReceived ? 'rgba(255,224,138,0.5)' : '#ffe08a', textDecoration: isReceived ? 'line-through' : 'none' }}>
                              {titleCase(c.name)}
                            </span>
                            {isReceived && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00e676' }} />}
                          </div>
                          {c.advisor && <p className="text-xs" style={{ color: 'rgba(212,168,67,0.4)' }}>TVV: {titleCase(c.advisor)}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => toggleStatus(c.id)}
                            className="p-1.5 rounded-lg"
                            style={{ background: isReceived ? 'rgba(16,185,129,0.15)' : 'rgba(245,216,112,0.1)' }}
                            title={isReceived ? 'Chưa nhận quà' : 'Đã nhận quà'}
                          >
                            {isReceived ? <ToggleRight className="w-4 h-4" style={{ color: '#00e676' }} /> : <ToggleLeft className="w-4 h-4" style={{ color: '#ffe08a' }} />}
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => startEdit(c)}
                            className="p-1.5 rounded-lg"
                            style={{ background: 'rgba(212,168,67,0.1)' }}
                          >
                            <Edit3 className="w-3.5 h-3.5" style={{ color: '#d4a843' }} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => { if (confirm(`Xóa ${c.name}?`)) deleteCustomer(c.id); }}
                            className="p-1.5 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.1)' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                          </motion.button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,168,67,0.1)', color: '#d4a843' }}>
                          {c.investmentFee}tr
                        </span>
                        {giftName && (
                          <span className="px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: 'rgba(16,185,129,0.1)', color: '#00e676' }}>
                            <Gift className="w-3 h-3" /> {giftName}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded ${isReceived ? '' : ''}`} style={{ background: isReceived ? 'rgba(16,185,129,0.15)' : 'rgba(245,216,112,0.1)', color: isReceived ? '#00e676' : '#ffe08a' }}>
                          {c.status.replace(' nhận quà', '')}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* === PRIZES TAB === */}
        {activeTab === 'prizes' && (
          <div className="p-3 space-y-2">
            <div className="text-center py-2">
              <Crown className="w-8 h-8 mx-auto mb-1" style={{ color: '#ffe08a' }} />
              <h2 className="text-base font-bold" style={{ color: '#ffe08a' }}>Giải Quay Số</h2>
              <p className="text-xs" style={{ color: 'rgba(212,168,67,0.4)' }}>{drawPrizes.length} giải</p>
            </div>
            {drawPrizes.map((prize, idx) => (
              <div key={prize.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(15,34,64,0.9)', border: '1px solid rgba(212,168,67,0.15)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black" style={{ background: idx === 0 ? 'linear-gradient(135deg, #d4a843, #c9a227)' : idx === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'linear-gradient(135deg, #b45309, #92400e)', color: '#0a1628' }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: '#ffe08a' }}>{prize.name}</div>
                  <div className="text-xs" style={{ color: 'rgba(212,168,67,0.4)' }}>Số lượng: {prize.quantity} {prize.gift ? `— ${prize.gift}` : ''}</div>
                </div>
              </div>
            ))}

            {/* Gift tiers */}
            <div className="pt-3">
              <div className="text-center py-2">
                <Gift className="w-8 h-8 mx-auto mb-1" style={{ color: '#00e676' }} />
                <h2 className="text-base font-bold" style={{ color: '#ffe08a' }}>Khung Quà Tặng</h2>
              </div>
              {giftTiers.map((tier) => (
                <div key={tier.id} className="rounded-xl p-3 mb-1.5" style={{ background: 'rgba(15,34,64,0.9)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold" style={{ color: '#00e676' }}>{tier.giftName}</div>
                      <div className="text-xs" style={{ color: 'rgba(212,168,67,0.4)' }}>{tier.minFee}tr — {tier.maxFee}tr</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: '#ffe08a' }}>
                      {(tier.giftValue / 1e6).toFixed(1)}tr
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === CONTROL TAB === */}
        {activeTab === 'control' && (
          <div className="p-3 space-y-3">
            <div className="text-center py-2">
              <Zap className="w-8 h-8 mx-auto mb-1" style={{ color: '#ffe08a' }} />
              <h2 className="text-base font-bold" style={{ color: '#ffe08a' }}>Điều Khiển Từ Xa</h2>
              <p className="text-xs" style={{ color: 'rgba(212,168,67,0.4)' }}>Gửi lệnh đến trang chính & trang quay số</p>
            </div>

            {/* Registration page controls */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(15,34,64,0.9)', border: '1px solid rgba(212,168,67,0.2)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(212,168,67,0.6)' }}>
                <Users className="w-3.5 h-3.5 inline mr-1" /> Trang Danh Sách
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendCommand('TOGGLE_AUTO_SCROLL')}
                  className="py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#00e676' }}
                >
                  <Play className="w-5 h-5" />
                  Bật/Tắt Cuộn
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendCommand('REFRESH_DATA')}
                  className="py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
                >
                  <RefreshCw className="w-5 h-5" />
                  Tải Lại Dữ Liệu
                </motion.button>
              </div>
            </div>

            {/* Lucky draw controls */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(15,34,64,0.9)', border: '1px solid rgba(212,168,67,0.2)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(212,168,67,0.6)' }}>
                <Diamond className="w-3.5 h-3.5 inline mr-1" /> Trang Quay Số
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendCommand('START_SPIN')}
                  className="py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1"
                  style={{ background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', color: '#ffe08a' }}
                >
                  <Star className="w-5 h-5" />
                  Bắt Đầu Quay
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendCommand('STOP_SPIN')}
                  className="py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                >
                  <Pause className="w-5 h-5" />
                  Dừng Quay
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendCommand('RESET_WINNERS')}
                  className="py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 col-span-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                >
                  <Trash2 className="w-5 h-5" />
                  Đặt Lại Kết Quả
                </motion.button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(15,34,64,0.9)', border: '1px solid rgba(212,168,67,0.2)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(212,168,67,0.6)' }}>
                <Send className="w-3.5 h-3.5 inline mr-1" /> Thao Tác Nhanh
              </h3>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => sendCommand('MARK_ALL_RECEIVED')}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#00e676' }}
              >
                <Check className="w-4 h-4" /> Đánh dấu tất cả đã nhận quà
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => sendCommand('MARK_ALL_NOT_RECEIVED')}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                style={{ background: 'rgba(245,216,112,0.1)', border: '1px solid rgba(245,216,112,0.2)', color: '#ffe08a' }}
              >
                <X className="w-4 h-4" /> Đánh dấu tất cả chưa nhận quà
              </motion.button>
            </div>

            {/* Info */}
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.1)' }}>
              <p className="text-[10px]" style={{ color: 'rgba(212,168,67,0.3)' }}>
                Lệnh sẽ được thực hiện trên trang chính trong vòng 2-3 giây.
                <br />Đảm bảo trang chính đang mở trên thiết bị khác.
              </p>
            </div>
          </div>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'settings' && (
          <div className="p-3 space-y-3">
            <div className="text-center py-2">
              <Settings className="w-8 h-8 mx-auto mb-1" style={{ color: '#ffe08a' }} />
              <h2 className="text-base font-bold" style={{ color: '#ffe08a' }}>Cài Đặt Sự Kiện</h2>
            </div>

            {/* Event info */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(15,34,64,0.9)', border: '1px solid rgba(212,168,67,0.2)' }}>
              <h3 className="text-xs font-bold uppercase" style={{ color: 'rgba(212,168,67,0.6)' }}>Thông tin sự kiện</h3>
              <input
                type="text"
                placeholder="Tên sự kiện"
                value={eventInfo.name}
                onChange={(e) => setEventInfo({ ...eventInfo, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#ffe08a' }}
              />
              <input
                type="text"
                placeholder="Ngày (VD: 20/03/2025)"
                value={eventInfo.date}
                onChange={(e) => setEventInfo({ ...eventInfo, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#ffe08a' }}
              />
              <input
                type="text"
                placeholder="Địa điểm"
                value={eventInfo.location}
                onChange={(e) => setEventInfo({ ...eventInfo, location: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#ffe08a' }}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  try {
                    const res = await fetch('/api/event-info', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(eventInfo),
                    });
                    const data = await res.json();
                    if (data.success) {
                      notify('Đã lưu thông tin sự kiện');
                      sendCommand('REFRESH_DATA');
                    }
                  } catch {
                    notify('Lỗi lưu sự kiện', 'error');
                  }
                }}
                className="w-full py-2 rounded-lg text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #d4a843, #c9a227)', color: '#0a1628' }}
              >
                <Save className="w-3.5 h-3.5 inline mr-1" /> Lưu thông tin
              </motion.button>
            </div>

            {/* Links */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(15,34,64,0.9)', border: '1px solid rgba(212,168,67,0.2)' }}>
              <h3 className="text-xs font-bold uppercase" style={{ color: 'rgba(212,168,67,0.6)' }}>Chuyển đến</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/">
                  <div className="py-2.5 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(20,42,82,0.8)', border: '1px solid rgba(212,168,67,0.2)', color: '#ffe08a' }}>
                    <Users className="w-4 h-4 mx-auto mb-1" /> Danh sách
                  </div>
                </Link>
                <Link href="/lucky-draw">
                  <div className="py-2.5 rounded-xl text-xs font-bold text-center" style={{ background: 'rgba(20,42,82,0.8)', border: '1px solid rgba(212,168,67,0.2)', color: '#ffe08a' }}>
                    <Diamond className="w-4 h-4 mx-auto mb-1" /> Quay số
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
