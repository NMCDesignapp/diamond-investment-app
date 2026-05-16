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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="p-0.5 rounded transition-colors"
        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        title="Xóa"
      >
        <Trash2 className="w-3 h-3" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="rounded-xl p-6 text-center shadow-2xl max-w-sm w-full"
              style={{ background: '#0f2042', border: '2px solid rgba(212,168,67,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: '#ef4444' }} />
              </motion.div>
              <h3 className="font-bold text-lg mb-1" style={{ color: '#f5d870' }}>Xác nhận xóa</h3>
              <p className="mb-4" style={{ color: 'rgba(212,168,67,0.5)' }}>
                Bạn có chắc muốn xóa khách hàng <strong style={{ color: '#f5d870' }}>{customerName}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 rounded-lg font-semibold transition-colors"
                  style={{ background: 'rgba(212,168,67,0.08)', color: 'rgba(212,168,67,0.5)' }}
                >
                  Hủy
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-md"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
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
