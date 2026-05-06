'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useInvestmentStore } from '@/lib/investment-store';

interface DeleteConfirmModalProps {
  customerId: string;
  customerName: string;
}

export function DeleteConfirmModal({ customerId, customerName }: DeleteConfirmModalProps) {
  const store = useInvestmentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await store.deleteCustomer(customerId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="p-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-700 transition-colors shadow-sm"
        title="Xóa"
      >
        <Trash2 className="w-4 h-4" />
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl p-6 text-center border-2 border-amber-400 shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              </motion.div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">Xác nhận xóa</h3>
              <p className="text-slate-600 mb-4">
                Bạn có chắc muốn xóa khách hàng <strong className="text-slate-800">{customerName}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  Hủy
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-md"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
