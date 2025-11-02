
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserData, Message } from '../../types';
import * as userDataService from '../../services/userDataService';
import { X, ArrowLeft, Mail } from 'lucide-react';

interface MessagesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData;
}

const MessagesPanel: React.FC<MessagesPanelProps> = ({ isOpen, onClose, user }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    const loadMessages = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const fetchedMessages = await userDataService.getMessages();
        const userMessages = fetchedMessages
            .filter(msg => !msg.recipientId || msg.recipientId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMessages(userMessages);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            loadMessages();
        } else {
            // Reset view when panel is closed to ensure it opens to the list view next time
            const timer = setTimeout(() => setSelectedMessage(null), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, loadMessages]);

    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: '0%', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
        exit: { x: '100%', transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] } },
    };
    
    const viewVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    const renderMessageList = () => (
        <motion.div key="list" initial="hidden" animate="visible" exit="exit" variants={viewVariants} className="flex flex-col h-full">
            <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Inbox</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto">
            {isLoading ? (
                <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : messages.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-secondary p-4">
                    <Mail size={40} className="mb-4" />
                    <p>Your inbox is empty.</p>
                </div>
            ) : (
                <ul className="p-2">
                    {messages.map((msg, i) => (
                        <motion.li 
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                            onClick={() => setSelectedMessage(msg)}
                            className="cursor-pointer mb-2"
                        >
                            <div className="p-4 bg-brand-surface/30 hover:bg-brand-surface/60 border border-white/5 hover:border-brand-primary/50 rounded-lg transition-colors shadow-md hover:shadow-brand-primary/20">
                                <p className="font-bold text-white truncate">{msg.title}</p>
                                <p className="text-sm text-brand-text-secondary truncate mt-1">{msg.text}</p>
                                <p className="text-xs text-brand-text-secondary/60 mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            )}
            </div>
        </motion.div>
    );

    const renderMessageDetail = () => (
        <motion.div key="detail" initial="hidden" animate="visible" exit="exit" variants={viewVariants} className="flex flex-col h-full">
            <div className="flex-shrink-0 flex items-center p-4 border-b border-white/10">
                <motion.button 
                  onClick={() => setSelectedMessage(null)} 
                  className="p-2 rounded-full hover:bg-white/10 mr-2"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                    <ArrowLeft size={20} />
                </motion.button>
                <h2 className="text-xl font-bold text-white truncate">{selectedMessage?.title}</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
                {selectedMessage?.imageUrl && <img src={selectedMessage.imageUrl} alt="Message visual" className="mb-4 rounded-lg w-full" />}
                {selectedMessage?.videoUrl && <video src={selectedMessage.videoUrl} controls className="mb-4 rounded-lg w-full" />}
                <p className="text-brand-text-secondary whitespace-pre-wrap">{selectedMessage?.text}</p>
                <p className="text-xs text-brand-text-secondary/60 mt-6 text-right">
                    {new Date(selectedMessage?.createdAt || 0).toLocaleString()}
                </p>
            </div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-30" 
                        onClick={onClose}
                    />
                    <motion.div
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-surface/80 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col"
                    >
                       <AnimatePresence mode="wait">
                           {selectedMessage ? renderMessageDetail() : renderMessageList()}
                       </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MessagesPanel;
