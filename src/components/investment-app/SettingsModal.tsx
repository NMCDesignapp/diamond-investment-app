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
    await handleSaveEventInfo();
    await handleSaveTiers();
    await store.saveDrawPrizes(
      drawPrizes.map(p => ({ name: p.name, quantity: parseInt(p.quantity) || 1 }))
    );
    setIsOpen(false);
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
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center rounded-full transition-all"
        title="Cài đặt"
        style={{
          width: '36px', height: '36px',
          border: '2px solid rgba(255,224,138,0.6)',
          background: 'rgba(20,42,82,0.8)',
          boxShadow: '0 0 8px rgba(255,224,138,0.15)',
        }}
      >
        <Settings className="w-4 h-4" style={{ color: '#ffe08a' }} />
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
              className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto shadow-2xl"
              style={{ background: '#0f2042', border: '2px solid rgba(212,168,67,0.4)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden p-4" style={{ background: 'linear-gradient(135deg, #0a1628, #162d50)', borderBottom: '1px solid rgba(212,168,67,0.3)' }}>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-5 h-5" style={{ color: '#f5d870' }} />
                    <h2 className="text-xl font-bold" style={{ color: '#f5d870' }}>Cài đặt</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" style={{ color: '#d4a843' }} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Event Info */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#d4a843' }}>
                    <span className="w-1.5 h-5 rounded-full" style={{ background: '#d4a843' }} />
                    Thông tin sự kiện
                  </h3>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(212,168,67,0.6)' }}>Tiêu đề chương trình</label>
                      <input
                        value={eventForm.name}
                        onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                        placeholder="Tiêu đề chương trình"
                        className="w-full p-2.5 rounded-lg outline-none transition-all"
                        style={inputStyle}
                      />
                    </div>
                    <input
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      placeholder="Ngày"
                      className="w-full p-2.5 rounded-lg outline-none transition-all"
                      style={inputStyle}
                    />
                    <input
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      placeholder="Địa điểm"
                      className="w-full p-2.5 rounded-lg outline-none transition-all"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Gift Tiers */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#d4a843' }}>
                    <span className="w-1.5 h-5 rounded-full" style={{ background: '#d4a843' }} />
                    Mức quà tặng (theo triệu)
                  </h3>
                  <div className="space-y-3">
                    {tiers.length === 0 && (
                      <p className="text-center py-4 rounded-lg" style={{ color: 'rgba(212,168,67,0.4)', background: 'rgba(10,22,40,0.5)' }}>
                        Chưa có cấu hình quà
                      </p>
                    )}
                    {tiers.map((tier, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-xl space-y-2"
                        style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(212,168,67,0.15)' }}
                      >
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Từ (triệu)"
                            value={tier.minFee}
                            onChange={(e) => updateTier(idx, 'minFee', e.target.value)}
                            className="w-1/3 p-2 rounded-lg outline-none transition-all text-sm"
                            style={inputStyle}
                          />
                          <input
                            type="number"
                            placeholder="Đến (triệu)"
                            value={tier.maxFee}
                            onChange={(e) => updateTier(idx, 'maxFee', e.target.value)}
                            className="w-1/3 p-2 rounded-lg outline-none transition-all text-sm"
                            style={inputStyle}
                          />
                          <input
                            placeholder="Tên quà"
                            value={tier.giftName}
                            onChange={(e) => updateTier(idx, 'giftName', e.target.value)}
                            className="flex-1 p-2 rounded-lg outline-none transition-all text-sm"
                            style={inputStyle}
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Giá trị VND"
                            value={tier.giftValue}
                            onChange={(e) => updateTier(idx, 'giftValue', e.target.value)}
                            className="flex-1 p-2 rounded-lg outline-none transition-all text-sm"
                            style={inputStyle}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeTier(idx)}
                            className="px-3 py-2 rounded-lg font-bold transition-colors shadow-sm"
                            style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
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
                    className="w-full mt-3 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}
                  >
                    <Plus className="w-4 h-4" /> Thêm mức
                  </motion.button>
                </div>

                {/* Draw Prizes */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#d4a843' }}>
                    <span className="w-1.5 h-5 rounded-full" style={{ background: '#10b981' }} />
                    Quà quay số (trang Quay Số)
                  </h3>
                  <p className="text-xs mb-2" style={{ color: 'rgba(212,168,67,0.35)' }}>Cài đặt riêng cho trang quay số, không liên quan quà tặng bên trang chính</p>
                  <div className="space-y-3">
                    {drawPrizes.length === 0 && (
                      <p className="text-center py-4 rounded-lg" style={{ color: 'rgba(13,90,63,0.6)', background: 'rgba(10,22,40,0.5)' }}>
                        Chưa có giải quay số
                      </p>
                    )}
                    {drawPrizes.map((prize, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-xl space-y-2"
                        style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(13,90,63,0.2)' }}
                      >
                        <div className="flex gap-2">
                          <input
                            placeholder="Tên giải (VD: Giải nhất)"
                            value={prize.name}
                            onChange={(e) => updateDrawPrize(idx, 'name', e.target.value)}
                            className="flex-1 p-2 rounded-lg outline-none transition-all text-sm"
                            style={inputStyle}
                          />
                          <input
                            type="number"
                            placeholder="Số lượng"
                            value={prize.quantity}
                            onChange={(e) => updateDrawPrize(idx, 'quantity', e.target.value)}
                            className="w-24 p-2 rounded-lg outline-none transition-all text-sm"
                            style={inputStyle}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeDrawPrize(idx)}
                            className="px-3 py-2 rounded-lg font-bold transition-colors shadow-sm"
                            style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
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
                    className="w-full mt-3 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}
                  >
                    <Plus className="w-4 h-4" /> Thêm giải
                  </motion.button>
                </div>

                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-lg font-semibold transition-colors mt-2"
                  style={{ background: 'rgba(212,168,67,0.08)', color: 'rgba(212,168,67,0.5)' }}
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
