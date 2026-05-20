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

// Fixed: Use split-by-space instead of \b\w which breaks Vietnamese diacritics
function titleCase(str: string) {
  if (!str) return '';
  return str.split(/\s+/).map(word => {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    'Đã nhận quà': { bg: 'rgba(16,185,129,0.15)', text: '#34d399', icon: '✓' },
    'Chưa nhận quà': { bg: 'rgba(245,216,112,0.12)', text: '#ffe08a', icon: '⏳' },
    'Không nhận quà': { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', icon: '✗' },
  };
  const c = config[status] || config['Chưa nhận quà'];
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
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

  // Auto-scroll for desktop table (bottom to top, loop)
  // Use translateY on inner wrapper for reliable direction control
  const scrollAnimRef = useRef<number>(0);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll) {
      // Stop any running scroll animation immediately
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
        scrollAnimRef.current = 0;
      }
      // Reset position
      if (scrollWrapperRef.current) {
        scrollWrapperRef.current.style.transform = 'translateY(0)';
      }
      return;
    }

    const wrapper = scrollWrapperRef.current;
    const container = tableBodyRef.current;
    if (!wrapper || !container) return;

    // Wait one frame for DOM to settle after content doubling
    const initRaf = requestAnimationFrame(() => {
      const wrapperHeight = wrapper.scrollHeight;
      const containerHeight = container.clientHeight;

      // Check if there's enough content to scroll
      if (wrapperHeight <= containerHeight + 10) return;

      // Start from bottom: translateY starts at negative offset
      // Single content height = wrapperHeight / 2 (content is doubled)
      const singleContentHeight = wrapperHeight / 2;
      // Bottom-to-top: start at 0, increase translateY to move content upward
      let scrollPos = 0;
      const speed = 0.8;

      const scroll = () => {
        scrollPos += speed;
        // When we've scrolled through one full copy, loop back to start
        if (scrollPos >= singleContentHeight) {
          scrollPos = 0;
        }
        wrapper.style.transform = `translateY(-${scrollPos}px)`;
        scrollAnimRef.current = requestAnimationFrame(scroll);
      };
      scrollAnimRef.current = requestAnimationFrame(scroll);
    });

    return () => {
      cancelAnimationFrame(initRaf);
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
        scrollAnimRef.current = 0;
      }
    };
  }, [autoScroll, filtered.length, store.customers]);



  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0f2240' }}>
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(232,184,74,0.1) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* === FIXED HEADER === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex-shrink-0 overflow-hidden rounded-b-2xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, #142a52, #1c3a6e, #142a52)', borderBottom: '2px solid rgba(255,224,138,0.5)' }}
      >
        <div className="relative px-4 py-2 md:px-6 md:py-2.5 flex items-center justify-between">
          {/* Left: Logo + Center title */}
          <div className="flex-1 flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-[30px] md:h-[50px] w-auto object-contain" />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider" style={{ color: '#ffe08a', textShadow: '0 0 20px rgba(255,224,138,0.3)' }}>
              {store.eventInfo.name}
            </h1>
            <p style={{ color: '#ffe08a', fontStyle: 'italic' }} className="font-medium text-[22px] md:text-2xl">
              {store.eventInfo.date} &bull; {store.eventInfo.location}
            </p>
          </div>
          {/* Right: icon buttons - horizontal layout */}
          <div className="flex-1 flex flex-row items-center justify-end gap-2">
            <Link href="/lucky-draw" title="Quay số may mắn">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: '36px', height: '36px',
                  border: '2px solid rgba(255,224,138,0.6)',
                  background: 'rgba(20,42,82,0.8)',
                  boxShadow: '0 0 8px rgba(255,224,138,0.15)',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <Dices className="w-4 h-4" style={{ color: '#ffe08a' }} />
                </motion.div>
              </motion.button>
            </Link>
            <SettingsModal />
            <CustomerFormModal />
          </div>
        </div>
      </motion.div>

      {/* === STATS - Horizontal 1-line layout, metrics prominent === */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-1.5 md:gap-3 px-2 md:px-5 pt-2 md:pt-3">
        {[
          { label: 'Tổng KH:', value: stats.totalCustomers, icon: Users, accentColor: '#ffe08a', unit: 'KH' },
          { label: 'Tổng phí:', value: stats.totalFee * 1e6, icon: DollarSign, accentColor: '#34d399' },
          { label: 'Tổng quà:', value: stats.totalGiftValue, icon: Gift, accentColor: '#ffe08a' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * idx }}
            className="metallic-grain flex items-center gap-1.5 md:gap-2 rounded-lg px-2 py-1.5 md:px-3 md:py-2 shadow-md overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1c3a6e 0%, #224a82 30%, #1a3560 60%, #254f8a 100%)',
              border: '2px solid rgba(255,224,138,0.5)',
              boxShadow: '0 0 20px rgba(255,224,138,0.15), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)',
            }}
          >
            <div className="p-0.5 md:p-1.5 rounded flex-shrink-0" style={{ background: 'rgba(255,224,138,0.15)' }}>
              <stat.icon className="w-3 h-3 md:w-5 md:h-5" style={{ color: '#ffe08a' }} />
            </div>
            <div className="min-w-0 flex items-baseline gap-1 md:gap-1.5 flex-nowrap whitespace-nowrap">
              <span className="text-[9px] md:text-sm font-bold uppercase tracking-wide" style={{ color: 'rgba(255,224,138,0.65)' }}>{stat.label}</span>
              <span className="text-base md:text-2xl font-black leading-none" style={{ color: stat.accentColor, textShadow: '0 0 15px rgba(255,224,138,0.3)' }}>
                {stat.unit ? (
                  <>{stat.value} <span className="text-xs md:text-lg font-bold">{stat.unit}</span></>
                ) : (
                  <>
                    <span className="md:hidden">{typeof stat.value === 'number' ? formatCompactVND(stat.value) : stat.value}</span>
                    <span className="hidden md:inline">{typeof stat.value === 'number' ? formatVND(stat.value) : stat.value}</span>
                  </>
                )}
              </span>
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
              style={{ border: '4px solid rgba(255,224,138,0.25)', borderTopColor: '#ffe08a' }} />
            <p className="mt-3 font-medium text-sm" style={{ color: '#ffe08a' }}>Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Users className="w-12 h-12 mb-2" style={{ color: 'rgba(255,224,138,0.25)' }} />
            <p className="text-lg font-bold" style={{ color: 'rgba(255,224,138,0.5)' }}>Chưa có khách hàng</p>
            <p style={{ color: '#ffe08a' }} className="text-sm">Nhấn &quot;+&quot; để thêm</p>
          </div>
        ) : (
          <div className="h-full rounded-lg shadow-lg flex flex-col overflow-hidden"
            style={{ background: 'rgba(55,90,140,0.92)', border: '2px solid rgba(255,224,138,0.6)', boxShadow: '0 0 30px rgba(255,224,138,0.12)' }}>
            {/* Fixed table header - always visible */}
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '3%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #1a3560, #224a82)' }}>
                  <th className="py-4 font-extrabold text-2xl uppercase text-center" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', borderBottom: '2px solid rgba(255,224,138,0.5)' }}>STT</th>
                  <th className="py-4 font-extrabold text-3xl uppercase text-center" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', borderBottom: '2px solid rgba(255,224,138,0.5)' }}>Khách Hàng</th>
                  <th className="py-4 font-extrabold text-3xl uppercase text-center" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', borderBottom: '2px solid rgba(255,224,138,0.5)' }}>TVV</th>
                  <th className="py-4 font-extrabold text-3xl uppercase text-center whitespace-nowrap" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', borderBottom: '2px solid rgba(255,224,138,0.5)' }}>Phí Đầu Tư</th>
                  <th className="py-4 font-extrabold text-3xl uppercase text-center" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', borderBottom: '2px solid rgba(255,224,138,0.5)' }}>Quà Tặng</th>
                  <th className="py-4 font-extrabold text-3xl uppercase text-center whitespace-nowrap" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', borderBottom: '2px solid rgba(255,224,138,0.5)' }}>Giá Trị</th>
                  <th className="py-4 font-extrabold text-3xl uppercase text-center" style={{ color: '#ffe08a', borderBottom: '2px solid rgba(255,224,138,0.5)' }}>Ghi Chú</th>
                </tr>
              </thead>
            </table>
            {/* Scroll viewport for table body */}
            <div
              ref={tableBodyRef}
              className="flex-1 min-h-0"
              style={{ overflowY: autoScroll ? 'hidden' : 'auto', fontFamily: 'var(--font-roboto-condensed), "Roboto Condensed", sans-serif' }}
            >
              {/* Inner wrapper moved with translateY for bottom-to-top scroll */}
              <div ref={scrollWrapperRef}>
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '19%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '8%' }} />
                  </colgroup>
                  <tbody>
                    {(autoScroll ? [filtered, filtered] : [filtered]).flat().map((c, idx) => {
                      const realIdx = idx % filtered.length;
                      const realC = filtered[realIdx];
                      return (
                        <tr
                          key={`${realC.id}-${idx}`}
                          className="transition-colors duration-100"
                          style={{
                            borderBottom: '1px solid rgba(255,224,138,0.22)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,224,138,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="py-3 px-2 text-center font-bold text-2xl" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)' }}>{realIdx + 1}</td>
                          <td className="py-3 px-3 text-left font-bold text-3xl" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titleCase(realC.name)}</td>
                          <td className="py-3 px-3 text-left text-3xl" style={{ color: '#ffe08a', borderRight: '1px solid rgba(255,224,138,0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titleCase(realC.advisor) || '—'}</td>
                          <td className="py-3 px-3 text-center font-bold text-3xl whitespace-nowrap" style={{ color: '#34d399', borderRight: '1px solid rgba(255,224,138,0.25)' }}>
                            {formatVND(realC.investmentFee * 1e6)}
                          </td>
                          <td className="py-3 px-3 text-left font-semibold text-3xl whitespace-nowrap" style={{ color: '#34d399', borderRight: '1px solid rgba(255,224,138,0.25)' }}>
                            <span className="inline-flex items-center gap-2">
                              <Gift className="w-5 h-5 flex-shrink-0" style={{ color: '#34d399' }} />
                              <span>{store.getGiftByFee(realC.investmentFee).name || '—'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-3xl whitespace-nowrap" style={{ color: '#34d399', borderRight: '1px solid rgba(255,224,138,0.25)' }}>
                            {formatVND(store.getGiftByFee(realC.investmentFee).value)}
                          </td>
                          <td className="py-1 px-2">
                            <div className="flex flex-col items-center gap-0.5">
                              <StatusBadge status={realC.status} />
                              <button
                                onClick={() => store.toggleReceivedStatus(realC.id)}
                                className="p-0.5 rounded transition-colors"
                                style={{
                                  background: realC.status === 'Đã nhận quà' ? 'rgba(16,185,129,0.2)' : 'rgba(255,224,138,0.1)',
                                  color: realC.status === 'Đã nhận quà' ? '#34d399' : 'rgba(255,224,138,0.4)',
                                }}
                                title={realC.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà'}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
              style={{ border: '4px solid rgba(255,224,138,0.25)', borderTopColor: '#ffe08a' }} />
            <p className="mt-3 font-medium text-sm" style={{ color: '#ffe08a' }}>Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 mb-2" style={{ color: 'rgba(255,224,138,0.25)' }} />
            <p className="text-lg font-bold" style={{ color: 'rgba(255,224,138,0.5)' }}>Chưa có khách hàng</p>
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
                style={{ background: 'rgba(25,52,95,0.92)', border: '1px solid rgba(255,224,138,0.3)' }}
              >
                <div className="p-3 cursor-pointer" onClick={() => setExpandedMobile(expandedMobile === c.id ? null : c.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,224,138,0.12)', color: '#ffe08a' }}>#{idx + 1}</span>
                      <h3 className="font-bold text-base" style={{ color: '#ffe08a' }}>{titleCase(c.name)}</h3>
                    </div>
                    {expandedMobile === c.id ? <ChevronUp className="w-4 h-4" style={{ color: '#ffe08a' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#ffe08a' }} />}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,224,138,0.6)' }}>{titleCase(c.advisor) || '—'}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: '#34d399' }}>{formatVND(c.investmentFee * 1e6)}</span>
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
                      <div className="px-3 pb-3 space-y-1.5 pt-2 text-xs" style={{ borderTop: '1px solid rgba(255,224,138,0.15)' }}>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(255,224,138,0.6)' }}>Quà</span>
                          <span className="font-semibold" style={{ color: '#e8b84a' }}>{store.getGiftByFee(c.investmentFee).name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(255,224,138,0.6)' }}>Giá trị</span>
                          <span className="font-mono font-bold" style={{ color: '#e8b84a' }}>{formatVND(store.getGiftByFee(c.investmentFee).value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(255,224,138,0.6)' }}>Ghi chú</span>
                          <span style={{ color: 'rgba(255,224,138,0.7)' }}>{c.note || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <StatusBadge status={c.status} />
                          <div className="flex gap-1.5">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => store.toggleReceivedStatus(c.id)}
                              className="p-1.5 rounded" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
                              <Check className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const event = new CustomEvent('editCustomer', { detail: c }); window.dispatchEvent(event); }}
                              className="p-1.5 rounded" style={{ background: 'rgba(255,224,138,0.1)', color: '#ffe08a' }}>
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

      {/* === FIXED BOTTOM: SEARCH, FILTER & SCROLL TOGGLE - Full Width === */}
      <div className="flex-shrink-0 px-2 md:px-5 py-2" style={{ background: 'rgba(15,34,64,0.96)', borderTop: '1px solid rgba(255,224,138,0.3)' }}>
        <div className="w-full flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#ffe08a' }} />
            <input
              type="text"
              placeholder="Tìm tên, TVV..."
              value={store.searchKeyword}
              onChange={(e) => store.setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{
                border: '1px solid rgba(255,224,138,0.3)',
                background: 'rgba(20,42,82,0.9)',
                color: '#ffe08a',
              }}
            />
          </div>
          <select
            value={store.statusFilter}
            onChange={(e) => store.setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none transition-all cursor-pointer"
            style={{
              border: '1px solid rgba(255,224,138,0.3)',
              background: 'rgba(20,42,82,0.9)',
              color: '#ffe08a',
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: autoScroll ? 'rgba(16,185,129,0.2)' : 'rgba(20,42,82,0.9)',
              borderColor: autoScroll ? 'rgba(52,211,153,0.4)' : 'rgba(255,224,138,0.3)',
              color: autoScroll ? '#34d399' : 'rgba(255,224,138,0.5)',
            }}
            title={autoScroll ? 'Tắt cuộn tự động' : 'Bật cuộn tự động'}
          >
            {autoScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="text-xs hidden md:inline">{autoScroll ? 'Dừng cuộn' : 'Cuộn tự động'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
