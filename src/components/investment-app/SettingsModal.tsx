'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Plus, Trash2, Diamond } from 'lucide-react';
import { useInvestmentStore, GiftTier } from '@/lib/investment-store';

interface TierFormData {
  minFee: string;
  maxFee: string;
  giftName: string;
  giftValue: string;
}

interface DrawPrizeFormData {
  name: string;
  quantity: string;
}

export function SettingsModal() {
  const store = useInvestmentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    location: '',
  });
  const [tiers, setTiers] = useState<TierFormData[]>([]);
  const [drawPrizes, setDrawPrizes] = useState<DrawPrizeFormData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEventForm({
        name: store.eventInfo.name,
        date: store.eventInfo.date,
        location: store.eventInfo.location,
      });
      setTiers(
        store.giftTiers.map(t => ({
          minFee: String(t.minFee),
          maxFee: String(t.maxFee),
          giftName: t.giftName,
          giftValue: String(t.giftValue),
        }))
      );
      setDrawPrizes(
        store.drawPrizes.map(p => ({
          name: p.name,
          quantity: String(p.quantity),
        }))
      );
    }
  }, [isOpen, store.eventInfo, store.giftTiers, store.drawPrizes]);

  const handleSaveEventInfo = async () => {
    setIsSaving(true);
    try {
      await store.saveEventInfo(eventForm);
    } catch (error) {
      console.error('Failed to save event info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTiers = async () => {
    setIsSaving(true);
    try {
      await store.saveGiftTiers(
        tiers.map(t => ({
          minFee: parseFloat(t.minFee) || 0,
          maxFee: parseFloat(t.maxFee) || 0,
          giftName: t.giftName,
          giftValue: parseFloat(t.giftValue) || 0,
        }))
      );
    } catch (error) {
      console.error('Failed to save tiers:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTier = () => {
    setTiers([...tiers, { minFee: '0', maxFee: '10', giftName: 'Quà mới', giftValue: '500000' }]);
  };

  const addDrawPrize = () => {
    setDrawPrizes([...drawPrizes, { name: 'Giải mới', quantity: '1' }]);
  };

  const removeDrawPrize = (idx: number) => {
    setDrawPrizes(drawPrizes.filter((_, i) => i !== idx));
  };

  const updateDrawPrize = (idx: number, field: keyof DrawPrizeFormData, value: string) => {
    const updated = [...drawPrizes];
    updated[idx] = { ...updated[idx], [field]: value };
    setDrawPrizes(updated);
  };

  const removeTier = (idx: number) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: keyof TierFormData, value: string) => {
    const updated = [...tiers];
    updated[idx] = { ...updated[idx], [field]: value };
    setTiers(updated);
  };

  const handleClose = async () => {
    // Save everything before closing
    await handleSaveEventInfo();
    await handleSaveTiers();
    await store.saveDrawPrizes(
      drawPrizes.map(p => ({ name: p.name, quantity: parseInt(p.quantity) || 1 }))
    );
    setIsOpen(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="p-0.5 hover:bg-amber-800/10 rounded transition-all"
        title="Cài đặt"
      >
        <Settings className="w-3.5 h-3.5 text-amber-900/50" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto border-4 border-amber-400 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-4">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMjBhMjAgMjAgMCAwIDEgMjAtMjB2NDBhMjAgMjAgMCAwIDEtMjAtMjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-5 h-5 text-amber-900/70" />
                    <h2 className="text-xl font-bold text-amber-900">Cài đặt</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-amber-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Event Info */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
                    Thông tin sự kiện
                  </h3>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs font-semibold text-amber-700 mb-1 block">Tiêu đề chương trình</label>
                      <input
                        value={eventForm.name}
                        onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                        placeholder="Tiêu đề chương trình (hiển thị trên trang quay số)"
                        className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                      />
                    </div>
                    <input
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      placeholder="Ngày"
                      className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    />
                    <input
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      placeholder="Địa điểm"
                      className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Gift Tiers */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
                    Mức quà tặng (theo triệu)
                  </h3>
                  <div className="space-y-3">
                    {tiers.length === 0 && (
                      <p className="text-center text-amber-600 py-4 bg-amber-50 rounded-lg">
                        Chưa có cấu hình quà
                      </p>
                    )}
                    {tiers.map((tier, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 border-2 border-amber-200 rounded-xl bg-amber-50/50 space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Từ (triệu)"
                            value={tier.minFee}
                            onChange={(e) => updateTier(idx, 'minFee', e.target.value)}
                            className="w-1/3 p-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 outline-none transition-all text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Đến (triệu)"
                            value={tier.maxFee}
                            onChange={(e) => updateTier(idx, 'maxFee', e.target.value)}
                            className="w-1/3 p-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 outline-none transition-all text-sm"
                          />
                          <input
                            placeholder="Tên quà"
                            value={tier.giftName}
                            onChange={(e) => updateTier(idx, 'giftName', e.target.value)}
                            className="flex-1 p-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 outline-none transition-all text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Giá trị VND"
                            value={tier.giftValue}
                            onChange={(e) => updateTier(idx, 'giftValue', e.target.value)}
                            className="flex-1 p-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 outline-none transition-all text-sm"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeTier(idx)}
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addTier}
                    className="w-full mt-3 bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 py-2.5 rounded-lg font-bold text-amber-900 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Thêm mức
                  </motion.button>
                </div>

                {/* Draw Prizes (for lucky draw page) */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-rose-400 rounded-full" />
                    Quà quay số (trang Quay Số)
                  </h3>
                  <p className="text-xs text-slate-400 mb-2">Cài đặt riêng cho trang quay số, không liên quan quà tặng bên trang chính</p>
                  <div className="space-y-3">
                    {drawPrizes.length === 0 && (
                      <p className="text-center text-rose-600 py-4 bg-rose-50 rounded-lg">
                        Chưa có giải quay số
                      </p>
                    )}
                    {drawPrizes.map((prize, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 border-2 border-rose-200 rounded-xl bg-rose-50/50 space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            placeholder="Tên giải (VD: Giải nhất)"
                            value={prize.name}
                            onChange={(e) => updateDrawPrize(idx, 'name', e.target.value)}
                            className="flex-1 p-2 border-2 border-rose-200 rounded-lg focus:border-rose-400 outline-none transition-all text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Số lượng"
                            value={prize.quantity}
                            onChange={(e) => updateDrawPrize(idx, 'quantity', e.target.value)}
                            className="w-24 p-2 border-2 border-rose-200 rounded-lg focus:border-rose-400 outline-none transition-all text-sm"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeDrawPrize(idx)}
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addDrawPrize}
                    className="w-full mt-3 bg-gradient-to-b from-rose-300 to-rose-500 hover:from-rose-400 hover:to-rose-600 py-2.5 rounded-lg font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Thêm giải
                  </motion.button>
                </div>

                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="w-full bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg font-semibold transition-colors mt-2"
                >
                  {isSaving ? 'Đang lưu...' : 'Đóng & Lưu'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
