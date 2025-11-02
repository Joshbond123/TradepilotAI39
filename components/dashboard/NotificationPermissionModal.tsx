
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { requestNotificationPermission } from '../../services/userDataService';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionResult: (permission: 'granted' | 'denied' | 'default') => void;
}

const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({ isOpen, onClose, onPermissionResult }) => {
  const handleAllow = async () => {
    const permission = await requestNotificationPermission();
    if (permission !== 'unsupported') {
      onPermissionResult(permission);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-brand-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl relative text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="flex justify-center mb-4">
                <div className="p-4 bg-brand-primary/10 rounded-full text-brand-primary shadow-[0_0_20px_theme(colors.brand.primary)]">
                    <Bell size={32} />
                </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Enable Notifications</h2>
            <p className="text-brand-text-secondary mb-6">
                Get real-time updates on AI profits, new messages, and account activity. Stay in the loop!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-white/10 text-white rounded-lg font-bold transition-colors hover:bg-white/20"
                >
                    Maybe Later
                </button>
                <button
                    onClick={handleAllow}
                    className="w-full px-4 py-3 bg-brand-primary text-brand-bg rounded-lg font-bold transition-transform hover:scale-105"
                >
                    Allow Notifications
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPermissionModal;