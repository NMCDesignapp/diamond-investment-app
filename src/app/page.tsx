'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Check, Pencil, Settings, Plus,
  Users, DollarSign, Gift, ChevronDown, ChevronUp, Diamond, Sparkles, Dices,
  Pause, Play
} from 'lucide-react';
import Link from 'next/link';
import { useInvestmentStore } from '@/lib/investment-store';
import { CustomerFormModal } from '@/components/investment-app/CustomerFormModal';
import { SettingsModal } from '@/components/investment-app/SettingsModal';
import { DeleteConfirmModal } from '@/components/investment-app/DeleteConfirmModal';

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + '₫';
}

function formatCompactVND(value: number) {
  if (value >= 1e9) {
    const b = value / 1e9;
    return (b % 1 === 0 ? b.toFixed(0) : b.toFixed(1).replace(/\.0$/, '')) + ' tỷ';
  }
  if (value >= 1e6) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(value / 1e6)) + ' tr';
  }
  return new Intl.NumberFormat('vi-VN').format(value) + '₫';
}

function titleCase(str: string) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    'Đã nhận quà': { bg: 'rgba(13,90,63,0.2)', text: '#10b981', icon: '✓' },
    'Chưa nhận quà': { bg: 'rgba(212,168,67,0.15)', text: '#d4a843', icon: '⏳' },
    'Không nhận quà': { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', icon: '✗' },
  };
  const c = config[status] || config['Chưa nhận quà'];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-base font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}
    >
      <span>{c.icon}</span>{status.replace(' nhận quà', '')}
    </span>
  );
}

export default function InvestmentApp() {
  const store = useInvestmentStore();
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      store.loadAll();
    }
  }, []);

  const filtered = store.getFilteredCustomers();
  const stats = store.getStats();
  const isEmpty = filtered.length === 0;

  // Auto-scroll for desktop table (bottom to top)
  useEffect(() => {
    const el = tableBodyRef.current;
    if (!el || !autoScroll) return;
    let scrollPos = el.scrollHeight;
    el.scrollTop = scrollPos;
    const speed = 0.5;
    let animId: number;
    const scroll = () => {
      scrollPos -= speed;
      if (scrollPos <= 0) {
        scrollPos = el.scrollHeight / 2;
      }
      el.scrollTop = scrollPos;
      animId = requestAnimationFrame(scroll);
    };
    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, [autoScroll, filtered]);

  useEffect(() => {
    if (!autoScroll && tableBodyRef.current) {
      tableBodyRef.current.scrollTop = 0;
    }
  }, [autoScroll]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(212,168,67,0.05) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(13,90,63,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* === FIXED HEADER === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex-shrink-0 overflow-hidden rounded-b-2xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0f2042, #162d50, #0f2042)', borderBottom: '2px solid rgba(212,168,67,0.3)' }}
      >
        <div className="relative px-4 py-3 md:px-6 md:py-3.5 flex items-center justify-between">
          {/* Left: Logo + Center title */}
          <div className="flex-1 flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-[30px] md:h-[50px] w-auto object-contain" />
          </div>
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Diamond className="w-5 h-5 mx-auto" style={{ color: '#f5d870' }} />
            </motion.div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider" style={{ color: '#f5d870', textShadow: '0 0 20px rgba(212,168,67,0.2)' }}>
              {store.eventInfo.name}
            </h1>
            <p style={{ color: 'rgba(212,168,67,0.5)' }} className="font-medium text-[11px] md:text-xs">
              {store.eventInfo.date} &bull; {store.eventInfo.location}
            </p>
          </div>
          {/* Right: small icon buttons */}
          <div className="flex-1 flex flex-col items-end gap-1 pt-0.5">
            <div className="flex items-center gap-0.5">
              <Link href="/lucky-draw" title="Quay số may mắn">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-0.5 hover:bg-white/5 rounded transition-all"
                >
                  <Dices className="w-3.5 h-3.5" style={{ color: 'rgba(212,168,67,0.5)' }} />
                </motion.button>
              </Link>
              <SettingsModal />
            </div>
            <CustomerFormModal />
          </div>
        </div>
      </motion.div>

      {/* === STATS === */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-1.5 md:gap-3 px-2 md:px-5 pt-2 md:pt-3">
        {[
          { label: 'Tổng KH', value: stats.totalCustomers, icon: Users, accentColor: '#d4a843' },
          { label: 'Tổng phí', value: stats.totalFee * 1e6, icon: DollarSign, accentColor: '#10b981' },
          { label: 'Tổng quà', value: stats.totalGiftValue, icon: Gift, accentColor: '#f5d870' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * idx }}
            className="metallic-grain flex items-center gap-1.5 md:gap-2 rounded-xl p-1.5 md:p-3 shadow-sm overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #a8a8a8 0%, #c8c8c8 25%, #b8b8b8 50%, #d0d0d0 75%, #b0b0b0 100%)',
              border: '1px solid rgba(180,180,180,0.6)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.15)',
            }}
          >
            <div className="p-1 md:p-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }}>
              <stat.icon className="w-3 h-3 md:w-3.5 md:h-3.5" style={{ color: '#444' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide" style={{ color: '#555' }}>{stat.label}</p>
              <p className="text-xs md:text-base font-black leading-tight" style={{ color: stat.accentColor, textShadow: '0 0 8px rgba(212,168,67,0.3)' }}>
                <span className="md:hidden">{typeof stat.value === 'number' ? formatCompactVND(stat.value) : stat.value}</span>
                <span className="hidden md:inline">{typeof stat.value === 'number' ? formatVND(stat.value) : stat.value}</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* === SCROLLABLE TABLE AREA (desktop) === */}
      <div className="flex-1 min-h-0 px-3 md:px-5 pt-2.5 pb-1 hidden md:flex md:flex-col">
        {store.isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full"
              style={{ border: '4px solid rgba(212,168,67,0.2)', borderTopColor: '#d4a843' }} />
            <p className="mt-3 font-medium text-sm" style={{ color: '#d4a843' }}>Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Users className="w-12 h-12 mb-2" style={{ color: 'rgba(212,168,67,0.2)' }} />
            <p className="text-lg font-bold" style={{ color: 'rgba(212,168,67,0.5)' }}>Chưa có khách hàng</p>
            <p style={{ color: '#d4a843' }} className="text-sm">Nhấn &quot;+&quot; để thêm</p>
          </div>
        ) : (
          <div className="h-full rounded-lg shadow-lg flex flex-col overflow-hidden"
            style={{ background: 'rgba(15,32,66,0.9)', border: '2px solid rgba(212,168,67,0.3)' }}>
            {/* Single table with sticky header - ensures column alignment */}
            <div
              ref={tableBodyRef}
              className={`flex-1 overflow-y-auto ${autoScroll ? 'overflow-y-hidden' : ''}`}
              style={{ fontFamily: 'var(--font-roboto-condensed), "Roboto Condensed", sans-serif' }}
            >
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr style={{ background: 'linear-gradient(135deg, #0f2042, #162d50)' }}>
                    <th className="px-5 py-4 font-extrabold text-3xl uppercase text-center w-14" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.15)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>STT</th>
                    <th className="px-5 py-4 font-extrabold text-3xl uppercase text-center whitespace-nowrap" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.15)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>Khách Hàng</th>
                    <th className="px-5 py-4 font-extrabold text-3xl uppercase text-center whitespace-nowrap" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.15)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>TVV</th>
                    <th className="px-5 py-4 font-extrabold text-3xl uppercase text-center whitespace-nowrap" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.15)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>Phí Đầu Tư</th>
                    <th className="px-5 py-4 font-extrabold text-3xl uppercase text-center" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.15)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>Mức Quà</th>
                    <th className="px-5 py-4 font-extrabold text-3xl uppercase text-center whitespace-nowrap" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.15)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>Giá Trị</th>
                    <th className="px-5 py-4 font-extrabold text-3xl uppercase text-center w-28" style={{ color: '#f5d870', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {(autoScroll ? [filtered, filtered] : [filtered]).flat().map((c, idx) => {
                    const realIdx = idx % filtered.length;
                    const realC = filtered[realIdx];
                    return (
                      <motion.tr
                        key={`${realC.id}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: realIdx * 0.02 }}
                        className="transition-colors duration-100"
                        style={{
                          borderBottom: '1px solid rgba(212,168,67,0.12)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-5 py-4 text-center font-bold text-3xl w-14" style={{ color: 'rgba(212,168,67,0.3)', borderRight: '1px solid rgba(212,168,67,0.08)' }}>{realIdx + 1}</td>
                        <td className="px-5 py-4 text-left font-bold text-3xl whitespace-nowrap" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.08)' }}>{titleCase(realC.name)}</td>
                        <td className="px-5 py-4 text-left text-2xl whitespace-nowrap" style={{ color: '#f5d870', borderRight: '1px solid rgba(212,168,67,0.08)' }}>{titleCase(realC.advisor) || '—'}</td>
                        <td className="px-5 py-4 text-center font-bold text-3xl whitespace-nowrap" style={{ color: '#10b981', borderRight: '1px solid rgba(212,168,67,0.08)' }}>
                          {formatVND(realC.investmentFee * 1e6)}
                        </td>
                        <td className="px-5 py-4 text-left font-semibold text-2xl whitespace-nowrap" style={{ color: '#d4a843', borderRight: '1px solid rgba(212,168,67,0.08)' }}>
                          <span className="inline-flex items-center gap-2">
                            <Gift className="w-6 h-6 flex-shrink-0" style={{ color: 'rgba(212,168,67,0.5)' }} />
                            <span>{store.getGiftByFee(realC.investmentFee).name || '—'}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-3xl whitespace-nowrap" style={{ color: '#d4a843', borderRight: '1px solid rgba(212,168,67,0.08)' }}>
                          {formatVND(store.getGiftByFee(realC.investmentFee).value)}
                        </td>
                        <td className="px-5 py-4 w-28">
                          <div className="flex flex-col items-center gap-1.5">
                            <StatusBadge status={realC.status} />
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => store.toggleReceivedStatus(realC.id)}
                              className="p-1.5 rounded-md transition-colors"
                              style={{
                                background: realC.status === 'Đã nhận quà' ? 'rgba(13,90,63,0.2)' : 'rgba(212,168,67,0.08)',
                                color: realC.status === 'Đã nhận quà' ? '#10b981' : 'rgba(212,168,67,0.35)',
                              }}
                              title={realC.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà'}
                            >
                              <Check className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* === MOBILE CARDS (scrollable) === */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-1 md:hidden">
        {store.isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full"
              style={{ border: '4px solid rgba(212,168,67,0.2)', borderTopColor: '#d4a843' }} />
            <p className="mt-3 font-medium text-sm" style={{ color: '#d4a843' }}>Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 mb-2" style={{ color: 'rgba(212,168,67,0.2)' }} />
            <p className="text-lg font-bold" style={{ color: 'rgba(212,168,67,0.5)' }}>Chưa có khách hàng</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="rounded-xl shadow-md overflow-hidden"
                style={{ background: 'rgba(15,32,66,0.9)', border: '1px solid rgba(212,168,67,0.2)' }}
              >
                <div className="p-3 cursor-pointer" onClick={() => setExpandedMobile(expandedMobile === c.id ? null : c.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(212,168,67,0.1)', color: '#d4a843' }}>#{idx + 1}</span>
                      <h3 className="font-bold text-base" style={{ color: '#f5d870' }}>{titleCase(c.name)}</h3>
                    </div>
                    {expandedMobile === c.id ? <ChevronUp className="w-4 h-4" style={{ color: '#d4a843' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#d4a843' }} />}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(212,168,67,0.5)' }}>💼 {titleCase(c.advisor) || '—'}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: '#10b981' }}>{formatVND(c.investmentFee * 1e6)}</span>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedMobile === c.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-1.5 pt-2 text-xs" style={{ borderTop: '1px solid rgba(212,168,67,0.1)' }}>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(212,168,67,0.5)' }}>🎁 Quà</span>
                          <span className="font-semibold" style={{ color: '#d4a843' }}>{store.getGiftByFee(c.investmentFee).name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(212,168,67,0.5)' }}>💎 Giá trị</span>
                          <span className="font-mono font-bold" style={{ color: '#d4a843' }}>{formatVND(store.getGiftByFee(c.investmentFee).value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(212,168,67,0.5)' }}>📝 Ghi chú</span>
                          <span style={{ color: 'rgba(212,168,67,0.6)' }}>{c.note || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <StatusBadge status={c.status} />
                          <div className="flex gap-1.5">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => store.toggleReceivedStatus(c.id)}
                              className="p-1.5 rounded" style={{ background: 'rgba(13,90,63,0.2)', color: '#10b981' }}>
                              <Check className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const event = new CustomEvent('editCustomer', { detail: c }); window.dispatchEvent(event); }}
                              className="p-1.5 rounded" style={{ background: 'rgba(212,168,67,0.1)', color: '#d4a843' }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </motion.button>
                            <DeleteConfirmModal customerId={c.id} customerName={c.name} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* === FIXED BOTTOM: SEARCH, FILTER & SCROLL TOGGLE === */}
      <div className="flex-shrink-0 px-3 md:px-5 py-2" style={{ background: 'rgba(10,22,40,0.95)', borderTop: '1px solid rgba(212,168,67,0.2)' }}>
        <div className="max-w-7xl mx-auto flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#d4a843' }} />
            <input
              type="text"
              placeholder="Tìm tên, TVV..."
              value={store.searchKeyword}
              onChange={(e) => store.setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none transition-all"
              style={{
                border: '1px solid rgba(212,168,67,0.2)',
                background: 'rgba(15,32,66,0.8)',
                color: '#f5d870',
              }}
            />
          </div>
          <select
            value={store.statusFilter}
            onChange={(e) => store.setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-sm outline-none transition-all cursor-pointer"
            style={{
              border: '1px solid rgba(212,168,67,0.2)',
              background: 'rgba(15,32,66,0.8)',
              color: '#f5d870',
            }}
          >
            <option value="">Tất cả</option>
            <option value="Đã nhận quà">Đã nhận</option>
            <option value="Chưa nhận quà">Chưa nhận</option>
            <option value="Không nhận quà">Không nhận</option>
          </select>
          {/* Auto-scroll toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAutoScroll(!autoScroll)}
            className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all"
            style={{
              background: autoScroll ? 'rgba(13,90,63,0.2)' : 'rgba(15,32,66,0.8)',
              borderColor: autoScroll ? 'rgba(16,185,129,0.3)' : 'rgba(212,168,67,0.2)',
              color: autoScroll ? '#10b981' : 'rgba(212,168,67,0.4)',
            }}
            title={autoScroll ? 'Tắt cuộn tự động' : 'Bật cuộn tự động'}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-xs hidden md:inline">{autoScroll ? 'Dừng cuộn' : 'Cuộn tự động'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
