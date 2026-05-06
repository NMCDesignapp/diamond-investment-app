'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Check, Pencil,
  Users, DollarSign, Gift, ChevronDown, ChevronUp, Diamond, Sparkles
} from 'lucide-react';
import { useInvestmentStore } from '@/lib/investment-store';
import { CustomerFormModal } from '@/components/investment-app/CustomerFormModal';
import { SettingsModal } from '@/components/investment-app/SettingsModal';
import { DeleteConfirmModal } from '@/components/investment-app/DeleteConfirmModal';

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + '₫';
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    'Đã nhận quà': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✓' },
    'Chưa nhận quà': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
    'Không nhận quà': { bg: 'bg-rose-100', text: 'text-rose-800', icon: '✗' },
  };
  const c = config[status] || config['Chưa nhận quà'];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text} shadow-sm`}>
      <span>{c.icon}</span> {status}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-yellow-100/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-tr from-amber-100/15 to-orange-100/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-bl from-yellow-100/10 to-amber-100/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 md:px-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-95" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMjBhMjAgMjAgMCAwIDEgMjAtMjB2NDBhMjAgMjAgMCAwIDEtMjAtMjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative p-5 md:p-7">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Diamond className="w-10 h-10 text-amber-900/70" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-amber-900 drop-shadow-sm">
                    {store.eventInfo.name}
                  </h1>
                  <p className="text-amber-800/80 font-medium text-sm md:text-base mt-0.5">
                    {store.eventInfo.date} &bull; {store.eventInfo.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 md:gap-3">
                <SettingsModal />
                <CustomerFormModal />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 my-5 md:my-7">
          {[
            {
              label: 'TỔNG KHÁCH HÀNG',
              value: stats.totalCustomers,
              icon: Users,
              color: 'from-amber-50 to-yellow-50',
              border: 'border-amber-300',
              iconBg: 'bg-amber-100',
              iconColor: 'text-amber-700',
              valueColor: 'text-amber-900',
            },
            {
              label: 'TỔNG PHÍ ĐẦU TƯ',
              value: formatVND(stats.totalFee * 1e6),
              icon: DollarSign,
              color: 'from-emerald-50 to-teal-50',
              border: 'border-emerald-300',
              iconBg: 'bg-emerald-100',
              iconColor: 'text-emerald-700',
              valueColor: 'text-emerald-900',
            },
            {
              label: 'TỔNG GIÁ TRỊ QUÀ',
              value: formatVND(stats.totalGiftValue),
              icon: Gift,
              color: 'from-rose-50 to-pink-50',
              border: 'border-rose-300',
              iconBg: 'bg-rose-100',
              iconColor: 'text-rose-700',
              valueColor: 'text-rose-900',
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-2xl border-2 ${stat.border} bg-gradient-to-br ${stat.color} p-5 shadow-lg hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="flex items-center gap-3">
                <div className={`${stat.iconBg} p-2.5 rounded-xl shadow-sm`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.valueColor} mt-0.5`}>
                    {stat.value}
                  </p>
                </div>
              </div>
              <Sparkles className="absolute -right-2 -bottom-2 w-16 h-16 opacity-5" />
            </motion.div>
          ))}
        </div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mb-5"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600" />
            <input
              type="text"
              placeholder="Tìm theo tên, tư vấn viên..."
              value={store.searchKeyword}
              onChange={(e) => store.setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-amber-200 bg-white/90 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all shadow-sm hover:shadow-md"
            />
          </div>
          <select
            value={store.statusFilter}
            onChange={(e) => store.setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-white/90 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đã nhận quà">Đã nhận quà</option>
            <option value="Chưa nhận quà">Chưa nhận quà</option>
            <option value="Không nhận quà">Không nhận quà</option>
          </select>
        </motion.div>

        {/* Loading State */}
        {store.isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-amber-300 border-t-amber-600 rounded-full"
            />
            <p className="mt-4 text-amber-700 font-medium">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Empty State */}
        {!store.isLoading && isEmpty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-amber-300"
          >
            <Users className="w-16 h-16 mx-auto text-amber-400 mb-3" />
            <p className="text-xl font-bold text-slate-700">Chưa có khách hàng</p>
            <p className="text-amber-600 mt-1">Nhấn &quot;Thêm KH&quot; để bắt đầu</p>
          </motion.div>
        )}

        {/* Desktop Table */}
        {!store.isLoading && !isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="hidden md:block overflow-x-auto rounded-2xl border-2 border-amber-300 shadow-xl bg-white/95 backdrop-blur-sm"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400">
                  <th className="p-3.5 text-amber-900 font-bold text-center">STT</th>
                  <th className="p-3.5 text-amber-900 font-bold text-left">Họ tên</th>
                  <th className="p-3.5 text-amber-900 font-bold text-left">Tư vấn viên</th>
                  <th className="p-3.5 text-amber-900 font-bold text-right">Phí đầu tư</th>
                  <th className="p-3.5 text-amber-900 font-bold text-left">Quà tặng</th>
                  <th className="p-3.5 text-amber-900 font-bold text-right">Giá trị</th>
                  <th className="p-3.5 text-amber-900 font-bold text-center">Trạng thái</th>
                  <th className="p-3.5 text-amber-900 font-bold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="border-b border-amber-100 hover:bg-amber-50/60 transition-colors duration-150"
                  >
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-800">{c.name}</td>
                    <td className="p-3 text-slate-600">{c.advisor || '—'}</td>
                    <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                      {formatVND(c.investmentFee * 1e6)}
                    </td>
                    <td className="p-3 text-slate-600">{c.gift || '—'}</td>
                    <td className="p-3 text-right font-mono text-rose-700 font-semibold">
                      {formatVND(c.giftValue)}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => store.toggleReceivedStatus(c.id)}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-700 transition-colors shadow-sm"
                          title={c.status === 'Đã nhận quà' ? 'Chưa nhận quà' : 'Đã nhận quà'}
                        >
                          <Check className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            // Open edit modal - handled by CustomerFormModal
                            const event = new CustomEvent('editCustomer', { detail: c });
                            window.dispatchEvent(event);
                          }}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-700 transition-colors shadow-sm"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <DeleteConfirmModal customerId={c.id} customerName={c.name} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Mobile Cards */}
        {!store.isLoading && !isEmpty && (
          <div className="md:hidden space-y-3">
            {filtered.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedMobile(expandedMobile === c.id ? null : c.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                      <h3 className="font-black text-lg text-slate-800">{c.name}</h3>
                    </div>
                    {expandedMobile === c.id ? (
                      <ChevronUp className="w-5 h-5 text-amber-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-500">💼 {c.advisor || '—'}</span>
                    <span className="text-sm font-mono font-bold text-emerald-700">
                      {formatVND(c.investmentFee * 1e6)}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedMobile === c.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2 border-t border-amber-100 pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">🎁 Quà tặng</span>
                          <span className="font-semibold text-slate-700">{c.gift || '—'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">💎 Giá trị</span>
                          <span className="font-mono font-bold text-rose-700">{formatVND(c.giftValue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">📝 Ghi chú</span>
                          <span className="text-slate-600">{c.note || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <StatusBadge status={c.status} />
                          <div className="flex gap-2">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => store.toggleReceivedStatus(c.id)}
                              className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-700 transition-colors shadow-sm"
                            >
                              <Check className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const event = new CustomEvent('editCustomer', { detail: c });
                                window.dispatchEvent(event);
                              }}
                              className="p-2 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-700 transition-colors shadow-sm"
                            >
                              <Pencil className="w-4 h-4" />
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
    </div>
  );
}
