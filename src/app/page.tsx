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
    'Đã nhận quà': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✓' },
    'Chưa nhận quà': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⏳' },
    'Không nhận quà': { bg: 'bg-rose-100', text: 'text-rose-800', icon: '✗' },
  };
  const c = config[status] || config['Chưa nhận quà'];
  return (
    <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] font-semibold ${c.bg} ${c.text} whitespace-nowrap`}>
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
        scrollPos = el.scrollHeight / 2; // half because we duplicate content
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20 overflow-hidden">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-900/10 to-blue-800/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-tr from-blue-800/5 to-blue-100/5 rounded-full blur-3xl" />
      </div>

      {/* === FIXED HEADER === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex-shrink-0 overflow-hidden rounded-b-2xl shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 opacity-95" />
        <div className="relative px-4 py-3 md:px-6 md:py-3.5 flex items-center justify-between">
          {/* Center title */}
          <div className="flex-1" />
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Diamond className="w-5 h-5 text-yellow-400 mx-auto" />
            </motion.div>
            <h1 className="text-lg md:text-xl font-black uppercase tracking-wider text-white drop-shadow-sm">
              {store.eventInfo.name}
            </h1>
            <p className="text-blue-200 font-medium text-[11px] md:text-xs">
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
                  className="p-0.5 hover:bg-white/10 rounded transition-all"
                >
                  <Dices className="w-3.5 h-3.5 text-white/60" />
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
          { label: 'Tổng KH', value: stats.totalCustomers, icon: Users, bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-700', valueColor: 'text-blue-900' },
          { label: 'Tổng phí', value: stats.totalFee * 1e6, icon: DollarSign, bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', valueColor: 'text-emerald-900' },
          { label: 'Tổng quà', value: stats.totalGiftValue, icon: Gift, bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-100', iconColor: 'text-green-700', valueColor: 'text-green-900' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * idx }}
            className={`flex items-center gap-1.5 md:gap-2 rounded-xl border ${stat.border} ${stat.bg} p-1.5 md:p-3 shadow-sm overflow-hidden`}
          >
            <div className={`${stat.iconBg} p-1 md:p-1.5 rounded-lg flex-shrink-0`}>
              <stat.icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className={`text-xs md:text-base font-black ${stat.valueColor} leading-tight`}>
                {/* Mobile: compact format, Desktop: full format */}
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
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full" />
            <p className="mt-3 text-blue-700 font-medium text-sm">Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Users className="w-12 h-12 text-blue-300 mb-2" />
            <p className="text-lg font-bold text-slate-500">Chưa có khách hàng</p>
            <p className="text-blue-500 text-sm">Nhấn &quot;+&quot; để thêm</p>
          </div>
        ) : (
          <div className="h-full rounded-lg border-2 border-yellow-600 shadow-lg bg-white/95 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Fixed table header */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
                  <th className="px-2 py-1.5 text-yellow-400 font-extrabold text-sm uppercase text-center w-12">STT</th>
                  <th className="px-2 py-1.5 text-yellow-400 font-extrabold text-sm uppercase text-center whitespace-nowrap">Khách Hàng</th>
                  <th className="px-2 py-1.5 text-yellow-400 font-extrabold text-sm uppercase text-center whitespace-nowrap">TVV</th>
                  <th className="px-2 py-1.5 text-yellow-400 font-extrabold text-sm uppercase text-center whitespace-nowrap">Phí Đầu Tư</th>
                  <th className="px-2 py-1.5 text-yellow-400 font-extrabold text-sm uppercase text-center">Quà Tặng</th>
                  <th className="px-2 py-1.5 text-yellow-400 font-extrabold text-sm uppercase text-center whitespace-nowrap">Giá Trị</th>
                  <th className="px-2 py-1.5 text-yellow-400 font-extrabold text-sm uppercase text-center w-24">Ghi Chú</th>
                </tr>
              </thead>
            </table>
            {/* Scrollable body - with duplicated rows for seamless auto-scroll */}
            <div
              ref={tableBodyRef}
              className={`flex-1 overflow-y-auto ${autoScroll ? 'overflow-y-hidden' : ''}`}
            >
              <table className="w-full border-collapse">
                <tbody>
                  {/* If auto-scrolling, duplicate for seamless loop */}
                  {(autoScroll ? [filtered, filtered] : [filtered]).flat().map((c, idx) => {
                    const realIdx = idx % filtered.length;
                    const realC = filtered[realIdx];
                    return (
                      <motion.tr
                        key={`${realC.id}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: realIdx * 0.02 }}
                        className="border-b border-yellow-600/20 hover:bg-blue-50/60 transition-colors duration-100"
                      >
                        <td className="px-2 py-1.5 text-center font-bold text-slate-400 text-sm w-12">{realIdx + 1}</td>
                        <td className="px-2 py-1.5 font-semibold text-slate-500 text-sm whitespace-nowrap">{titleCase(realC.name)}</td>
                        <td className="px-2 py-1.5 text-slate-500 text-sm whitespace-nowrap">{titleCase(realC.advisor) || '—'}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-emerald-700 font-semibold text-sm whitespace-nowrap">
                          {formatVND(realC.investmentFee * 1e6)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-semibold text-rose-700 text-sm">
                          <span className="inline-flex items-end justify-end gap-1 flex-wrap">
                            <Gift className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <span className="leading-tight">{realC.gift || '—'}</span>
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-rose-700 font-semibold text-sm whitespace-nowrap">
                          {formatVND(realC.giftValue)}
                        </td>
                        <td className="p-2 w-20">
                          <div className="flex flex-col items-center gap-1">
                            <StatusBadge status={realC.status} />
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => store.toggleReceivedStatus(realC.id)}
                              className={`p-1 rounded-md transition-colors ${
                                realC.status === 'Đã nhận quà'
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                              }`}
                              title={realC.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà'}
                            >
                              <Check className="w-3.5 h-3.5" />
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
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full" />
            <p className="mt-3 text-blue-700 font-medium text-sm">Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-blue-300 mb-2" />
            <p className="text-lg font-bold text-slate-500">Chưa có khách hàng</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="bg-white/90 backdrop-blur-sm rounded-xl border border-yellow-600/30 shadow-md overflow-hidden"
              >
                <div className="p-3 cursor-pointer" onClick={() => setExpandedMobile(expandedMobile === c.id ? null : c.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">#{idx + 1}</span>
                      <h3 className="font-bold text-base text-slate-800">{titleCase(c.name)}</h3>
                    </div>
                    {expandedMobile === c.id ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500">💼 {titleCase(c.advisor) || '—'}</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">{formatVND(c.investmentFee * 1e6)}</span>
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
                      <div className="px-3 pb-3 space-y-1.5 border-t border-blue-100 pt-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">🎁 Quà</span>
                          <span className="font-semibold text-slate-700">{c.gift || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">💎 Giá trị</span>
                          <span className="font-mono font-bold text-rose-700">{formatVND(c.giftValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">📝 Ghi chú</span>
                          <span className="text-slate-600">{c.note || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <StatusBadge status={c.status} />
                          <div className="flex gap-1.5">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => store.toggleReceivedStatus(c.id)} className="p-1.5 bg-emerald-100 rounded text-emerald-700"><Check className="w-3.5 h-3.5" /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const event = new CustomEvent('editCustomer', { detail: c }); window.dispatchEvent(event); }} className="p-1.5 bg-blue-100 rounded text-blue-700"><Pencil className="w-3.5 h-3.5" /></motion.button>
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
      <div className="flex-shrink-0 px-3 md:px-5 py-2 bg-white/80 backdrop-blur-md border-t border-yellow-600/30 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500" />
            <input
              type="text"
              placeholder="Tìm tên, TVV..."
              value={store.searchKeyword}
              onChange={(e) => store.setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-blue-200 bg-white/90 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
          <select
            value={store.statusFilter}
            onChange={(e) => store.setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white/90 text-sm focus:border-blue-400 outline-none transition-all cursor-pointer"
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
            className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
              autoScroll
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white/90 border-blue-200 text-slate-400 hover:text-blue-700'
            }`}
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
