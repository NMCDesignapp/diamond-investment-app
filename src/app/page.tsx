'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Check, Pencil, Settings, Plus,
  Users, DollarSign, Gift, ChevronDown, ChevronUp, Diamond, Sparkles
} from 'lucide-react';
import { useInvestmentStore } from '@/lib/investment-store';
import { CustomerFormModal } from '@/components/investment-app/CustomerFormModal';
import { SettingsModal } from '@/components/investment-app/SettingsModal';
import { DeleteConfirmModal } from '@/components/investment-app/DeleteConfirmModal';

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + '₫';
}

function titleCase(str: string) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    'Đã nhận quà': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✓' },
    'Chưa nhận quà': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
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

  useEffect(() => {
    store.loadAll();
  }, []);

  const filtered = store.getFilteredCustomers();
  const stats = store.getStats();
  const isEmpty = filtered.length === 0;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40 overflow-hidden">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-yellow-100/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-tr from-amber-100/15 to-orange-100/10 rounded-full blur-3xl" />
      </div>

      {/* === FIXED HEADER === */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex-shrink-0 overflow-hidden rounded-b-2xl shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 opacity-95" />
        <div className="relative px-4 py-3 md:px-6 md:py-3.5 flex items-center justify-between">
          {/* Center title */}
          <div className="flex-1" />
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Diamond className="w-5 h-5 text-amber-900/60 mx-auto" />
            </motion.div>
            <h1 className="text-lg md:text-xl font-black uppercase tracking-wider text-amber-900 drop-shadow-sm">
              {store.eventInfo.name}
            </h1>
            <p className="text-amber-800/70 font-medium text-[11px] md:text-xs">
              {store.eventInfo.date} &bull; {store.eventInfo.location}
            </p>
          </div>
          {/* Right: small icon buttons */}
          <div className="flex-1 flex justify-end items-start gap-1.5">
            <SettingsModal />
            <CustomerFormModal />
          </div>
        </div>
      </motion.div>

      {/* === STATS === */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-2 md:gap-3 px-3 md:px-5 pt-3">
        {[
          { label: 'Tổng KH', value: stats.totalCustomers, icon: Users, bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-700', valueColor: 'text-amber-900' },
          { label: 'Tổng phí', value: formatVND(stats.totalFee * 1e6), icon: DollarSign, bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', valueColor: 'text-emerald-900' },
          { label: 'Tổng quà', value: formatVND(stats.totalGiftValue), icon: Gift, bg: 'bg-rose-50', border: 'border-rose-200', iconBg: 'bg-rose-100', iconColor: 'text-rose-700', valueColor: 'text-rose-900' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * idx }}
            className={`flex items-center gap-2 rounded-xl border ${stat.border} ${stat.bg} p-2 md:p-3 shadow-sm`}
          >
            <div className={`${stat.iconBg} p-1.5 rounded-lg`}>
              <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className={`text-sm md:text-base font-black ${stat.valueColor} leading-tight`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* === SCROLLABLE TABLE AREA (desktop) === */}
      <div className="flex-1 min-h-0 px-3 md:px-5 pt-2.5 pb-1 hidden md:block">
        {store.isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-amber-300 border-t-amber-600 rounded-full" />
            <p className="mt-3 text-amber-700 font-medium text-sm">Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Users className="w-12 h-12 text-amber-300 mb-2" />
            <p className="text-lg font-bold text-slate-500">Chưa có khách hàng</p>
            <p className="text-amber-500 text-sm">Nhấn &quot;+&quot; để thêm</p>
          </div>
        ) : (
          <div className="h-full rounded-xl border-2 border-amber-300 shadow-lg bg-white/95 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Fixed table header */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400">
                  <th className="p-2 text-amber-900 font-extrabold text-[13px] uppercase text-center w-12">STT</th>
                  <th className="p-2 text-amber-900 font-extrabold text-[13px] uppercase text-center whitespace-nowrap">Khách Hàng</th>
                  <th className="p-2 text-amber-900 font-extrabold text-[13px] uppercase text-center whitespace-nowrap">Tư Vấn Viên</th>
                  <th className="p-2 text-amber-900 font-extrabold text-[13px] uppercase text-center whitespace-nowrap">Phí Đầu Tư</th>
                  <th className="p-2 text-amber-900 font-extrabold text-[13px] uppercase text-center">Quà Tặng</th>
                  <th className="p-2 text-amber-900 font-extrabold text-[13px] uppercase text-center whitespace-nowrap">Giá Trị</th>
                  <th className="p-2 text-amber-900 font-extrabold text-[13px] uppercase text-center w-24">Ghi Chú</th>
                </tr>
              </thead>
            </table>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {filtered.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.02 }}
                      className="border-b border-amber-100 hover:bg-amber-50/60 transition-colors duration-100"
                    >
                      <td className="p-2 text-center font-bold text-slate-400 text-xs w-12">{idx + 1}</td>
                      <td className="p-2 font-semibold text-slate-500 text-[13px] whitespace-nowrap">{titleCase(c.name)}</td>
                      <td className="p-2 text-slate-500 text-[13px] whitespace-nowrap">{titleCase(c.advisor) || '—'}</td>
                      <td className="p-2 text-right font-mono text-emerald-700 font-semibold text-[13px] whitespace-nowrap">
                        {formatVND(c.investmentFee * 1e6)}
                      </td>
                      <td className="p-2 text-right font-semibold text-rose-700 text-[13px]">
                        <span className="inline-flex items-end justify-end gap-1 flex-wrap">
                          <Gift className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span className="leading-tight">{c.gift || '—'}</span>
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono text-rose-700 font-semibold text-[13px] whitespace-nowrap">
                        {formatVND(c.giftValue)}
                      </td>
                      <td className="p-2 w-20">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={c.status} />
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => store.toggleReceivedStatus(c.id)}
                            className={`p-1 rounded-md transition-colors ${
                              c.status === 'Đã nhận quà'
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                            }`}
                            title={c.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
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
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-amber-300 border-t-amber-600 rounded-full" />
            <p className="mt-3 text-amber-700 font-medium text-sm">Đang tải...</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-amber-300 mb-2" />
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
                className="bg-white/90 backdrop-blur-sm rounded-xl border border-amber-200 shadow-md overflow-hidden"
              >
                <div className="p-3 cursor-pointer" onClick={() => setExpandedMobile(expandedMobile === c.id ? null : c.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">#{idx + 1}</span>
                      <h3 className="font-bold text-base text-slate-800">{titleCase(c.name)}</h3>
                    </div>
                    {expandedMobile === c.id ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
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
                      <div className="px-3 pb-3 space-y-1.5 border-t border-amber-100 pt-2 text-xs">
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
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const event = new CustomEvent('editCustomer', { detail: c }); window.dispatchEvent(event); }} className="p-1.5 bg-amber-100 rounded text-amber-700"><Pencil className="w-3.5 h-3.5" /></motion.button>
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

      {/* === FIXED BOTTOM: SEARCH & FILTER === */}
      <div className="flex-shrink-0 px-3 md:px-5 py-2 bg-white/80 backdrop-blur-md border-t border-amber-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />
            <input
              type="text"
              placeholder="Tìm tên, TVV..."
              value={store.searchKeyword}
              onChange={(e) => store.setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-amber-200 bg-white/90 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition-all"
            />
          </div>
          <select
            value={store.statusFilter}
            onChange={(e) => store.setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white/90 text-sm focus:border-amber-400 outline-none transition-all cursor-pointer"
          >
            <option value="">Tất cả</option>
            <option value="Đã nhận quà">Đã nhận</option>
            <option value="Chưa nhận quà">Chưa nhận</option>
            <option value="Không nhận quà">Không nhận</option>
          </select>
        </div>
      </div>
    </div>
  );
}
