'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Diamond } from 'lucide-react';
import { useInvestmentStore, Customer } from '@/lib/investment-store';

export function CustomerFormModal() {
  const store = useInvestmentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: '',
    advisor: '',
    investmentFee: '',
    gift: '',
    giftValue: '',
    status: 'Chưa nhận quà',
    note: '',
  });
  const [isSaving, setIsSaving] = useState(false);

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
        setForm({
          name: '',
          advisor: '',
          investmentFee: '',
          gift: '',
          giftValue: '',
          status: 'Chưa nhận quà',
          note: '',
        });
      }
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
      setIsOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
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
        className="p-1 bg-amber-800/80 hover:bg-amber-900 rounded transition-all"
        title="Thêm khách hàng"
      >
        <Plus className="w-3.5 h-3.5 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto border-4 border-amber-400 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-4 rounded-t-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMjBhMjAgMjAgMCAwIDEgMjAtMjB2NDBhMjAgMjAgMCAwIDEtMjAtMjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-5 h-5 text-amber-900/70" />
                    <h2 className="text-xl font-bold text-amber-900">
                      {editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-amber-900" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Họ tên *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nhập họ tên khách hàng"
                    required
                    className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Tư vấn viên</label>
                  <input
                    value={form.advisor}
                    onChange={(e) => setForm({ ...form, advisor: e.target.value })}
                    placeholder="Tên tư vấn viên"
                    className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Phí đầu tư (triệu)</label>
                  <input
                    type="number"
                    step="1"
                    value={form.investmentFee}
                    onChange={(e) => autoFillGift(e.target.value)}
                    placeholder="VD: 100"
                    className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Trạng thái quà</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'Chưa nhận quà' })}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-all border-2 ${
                        form.status === 'Chưa nhận quà'
                          ? 'bg-amber-400 border-amber-500 text-amber-900 shadow-md'
                          : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      ⏳ Chưa nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'Không nhận quà' })}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-all border-2 ${
                        form.status === 'Không nhận quà'
                          ? 'bg-rose-400 border-rose-500 text-rose-900 shadow-md'
                          : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      ✗ Không nhận
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">Quà tặng</label>
                    <input
                      value={form.gift}
                      readOnly
                      placeholder="Tự động theo mức phí"
                      className="w-full p-2.5 bg-amber-50/80 border-2 border-amber-100 rounded-lg text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">Giá trị quà (VND)</label>
                    <input
                      type="number"
                      value={form.giftValue}
                      onChange={(e) => setForm({ ...form, giftValue: e.target.value })}
                      placeholder="Giá trị"
                      className="w-full p-2.5 bg-amber-50/80 border-2 border-amber-100 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Ghi chú</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows={2}
                    placeholder="Ghi chú thêm..."
                    className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg font-semibold transition-colors"
                  >
                    Hủy
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 py-2.5 rounded-lg font-bold text-amber-900 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
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
