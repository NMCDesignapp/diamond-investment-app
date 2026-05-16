'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Diamond, CheckCircle } from 'lucide-react';
import { useInvestmentStore, Customer } from '@/lib/investment-store';

const EMPTY_FORM = {
  name: '',
  advisor: '',
  investmentFee: '',
  gift: '',
  giftValue: '',
  status: 'Chưa nhận quà' as const,
  note: '',
};

export function CustomerFormModal() {
  const store = useInvestmentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Listen for edit events from the table
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Customer>;
      setEditingCustomer(customEvent.detail);
      setIsOpen(true);
    };
    window.addEventListener('editCustomer', handler);
    return () => window.removeEventListener('editCustomer', handler);
  }, []);

  // When opening or editing, populate form
  useEffect(() => {
    if (isOpen) {
      if (editingCustomer) {
        setForm({
          name: editingCustomer.name,
          advisor: editingCustomer.advisor,
          investmentFee: String(editingCustomer.investmentFee),
          gift: editingCustomer.gift,
          giftValue: String(editingCustomer.giftValue),
          status: editingCustomer.status,
          note: editingCustomer.note,
        });
      } else {
        setForm(prev => ({
          ...EMPTY_FORM,
          advisor: prev.advisor,
        }));
      }
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, editingCustomer]);

  // Auto-fill gift when fee changes
  const autoFillGift = useCallback((fee: string) => {
    const feeNum = parseFloat(fee) || 0;
    const giftInfo = store.getGiftByFee(feeNum);
    setForm(prev => ({
      ...prev,
      investmentFee: fee,
      gift: giftInfo.name,
      giftValue: giftInfo.name ? String(giftInfo.value) : '',
    }));
  }, [store]);

  const handleClose = () => {
    setIsOpen(false);
    setEditingCustomer(null);
    setSavedCount(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    try {
      await store.saveCustomer({
        ...(editingCustomer ? { id: editingCustomer.id } : {}),
        name: form.name.trim(),
        advisor: form.advisor.trim(),
        investmentFee: parseFloat(form.investmentFee) || 0,
        gift: form.gift,
        giftValue: parseFloat(form.giftValue) || 0,
        status: form.status,
        note: form.note,
      });

      if (editingCustomer) {
        setIsOpen(false);
        setEditingCustomer(null);
      } else {
        setSavedCount(prev => prev + 1);
        setShowSavedFeedback(true);
        setTimeout(() => setShowSavedFeedback(false), 1500);

        const lastAdvisor = form.advisor.trim();
        setForm({
          ...EMPTY_FORM,
          advisor: lastAdvisor,
        });
        setTimeout(() => nameInputRef.current?.focus(), 50);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    border: '1px solid rgba(212,168,67,0.25)',
    background: 'rgba(10,22,40,0.8)',
    color: '#f5d870',
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setEditingCustomer(null);
          setIsOpen(true);
        }}
        className="p-0.5 hover:bg-white/5 rounded transition-all"
        title="Thêm khách hàng"
      >
        <Plus className="w-3.5 h-3.5" style={{ color: 'rgba(212,168,67,0.5)' }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl"
              style={{ background: '#0f2042', border: '2px solid rgba(212,168,67,0.4)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden p-4" style={{ background: 'linear-gradient(135deg, #0a1628, #162d50)', borderBottom: '1px solid rgba(212,168,67,0.3)' }}>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-5 h-5" style={{ color: '#f5d870' }} />
                    <h2 className="text-xl font-bold" style={{ color: '#f5d870' }}>
                      {editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
                    </h2>
                    {!editingCustomer && savedCount > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(13,90,63,0.3)', color: '#10b981' }}>
                        +{savedCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" style={{ color: '#d4a843' }} />
                  </button>
                </div>
              </div>

              {/* Success feedback banner */}
              <AnimatePresence>
                {showSavedFeedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-2 py-2" style={{ background: 'rgba(13,90,63,0.15)', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                      <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Đã lưu! Nhập khách hàng tiếp theo</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-bold mb-1 block" style={{ color: '#d4a843' }}>Họ tên *</label>
                  <input
                    ref={nameInputRef}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nhập họ tên khách hàng"
                    required
                    className="w-full p-2.5 rounded-lg outline-none transition-all"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold mb-1 block" style={{ color: '#d4a843' }}>Tư vấn viên</label>
                  <input
                    value={form.advisor}
                    onChange={(e) => setForm({ ...form, advisor: e.target.value })}
                    placeholder="Tên tư vấn viên"
                    className="w-full p-2.5 rounded-lg outline-none transition-all"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold mb-1 block" style={{ color: '#d4a843' }}>Phí đầu tư (triệu)</label>
                  <input
                    type="number"
                    step="1"
                    value={form.investmentFee}
                    onChange={(e) => autoFillGift(e.target.value)}
                    placeholder="VD: 100"
                    className="w-full p-2.5 rounded-lg outline-none transition-all"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold mb-2 block" style={{ color: '#d4a843' }}>Trạng thái quà</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'Chưa nhận quà' })}
                      className="flex-1 py-2.5 rounded-lg font-semibold transition-all border"
                      style={{
                        background: form.status === 'Chưa nhận quà' ? 'rgba(212,168,67,0.2)' : 'rgba(10,22,40,0.5)',
                        borderColor: form.status === 'Chưa nhận quà' ? 'rgba(212,168,67,0.5)' : 'rgba(212,168,67,0.15)',
                        color: form.status === 'Chưa nhận quà' ? '#f5d870' : 'rgba(212,168,67,0.4)',
                      }}
                    >
                      Chưa nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'Không nhận quà' })}
                      className="flex-1 py-2.5 rounded-lg font-semibold transition-all border"
                      style={{
                        background: form.status === 'Không nhận quà' ? 'rgba(239,68,68,0.15)' : 'rgba(10,22,40,0.5)',
                        borderColor: form.status === 'Không nhận quà' ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.1)',
                        color: form.status === 'Không nhận quà' ? '#ef4444' : 'rgba(239,68,68,0.4)',
                      }}
                    >
                      Không nhận
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-bold mb-1 block" style={{ color: '#d4a843' }}>Quà tặng</label>
                    <input
                      value={form.gift}
                      readOnly
                      placeholder="Tự động theo mức phí"
                      className="w-full p-2.5 rounded-lg"
                      style={{ ...inputStyle, opacity: 0.7 }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1 block" style={{ color: '#d4a843' }}>Giá trị quà (VND)</label>
                    <input
                      type="number"
                      value={form.giftValue}
                      onChange={(e) => setForm({ ...form, giftValue: e.target.value })}
                      placeholder="Giá trị"
                      className="w-full p-2.5 rounded-lg outline-none transition-all"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold mb-1 block" style={{ color: '#d4a843' }}>Ghi chú</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows={2}
                    placeholder="Ghi chú thêm..."
                    className="w-full p-2.5 rounded-lg outline-none transition-all resize-none"
                    style={inputStyle}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-lg font-semibold transition-colors"
                    style={{ background: 'rgba(212,168,67,0.08)', color: 'rgba(212,168,67,0.5)' }}
                  >
                    Đóng
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}
                  >
                    {isSaving ? 'Đang lưu...' : editingCustomer ? 'Lưu' : 'Lưu & Tiếp tục'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
