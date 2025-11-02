
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { ChatMessage } from '../../types';
import { generateChatResponse } from '../../services/cerebrasService';

interface ChatWindowProps {
    onClose: () => void;
    onNewAiMessage: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, onNewAiMessage }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const sendInitialMessage = async () => {
            setIsTyping(true);
            try {
                // This is a "hidden" user message to prompt the AI. The response will be the first visible message.
                const prompt: ChatMessage[] = [{
                    role: 'user',
                    content: "Hello! Please introduce yourself and start a friendly conversation."
                }];
                
                const response = await generateChatResponse(prompt);
                const aiMessage: ChatMessage = { role: 'assistant', content: response };
                setMessages([aiMessage]);
            } catch (error) {
                console.error("Failed to get initial chat response:", error);
                const errorMessage: ChatMessage = { role: 'assistant', content: "Hello! I'm the TradePilot AI assistant. How can I help you today?" };
                setMessages([errorMessage]);
            } finally {
                setIsTyping(false);
            }
        };

        // Only run if there are no messages.
        if (messages.length === 0) {
            sendInitialMessage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(scrollToBottom, [messages, isTyping]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const handleSend = async () => {
        if (input.trim() === '' || isTyping) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            const response = await generateChatResponse(newMessages);
            const aiMessage: ChatMessage = { role: 'assistant', content: response };
            setMessages(prev => [...prev, aiMessage]);
            onNewAiMessage();
        } catch (error) {
            console.error("Failed to get chat response:", error);
            const errorMessage: ChatMessage = { role: 'assistant', content: "I'm having a bit of trouble thinking right now. Please give me a moment and try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex flex-col bg-brand-bg/80 backdrop-blur-2xl font-sans"
        >
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <motion.div 
                        className="relative"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, transition: { delay: 0.3 } }}
                    >
                         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="avatar-head-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1a1a2e"/>
                                    <stop offset="100%" stopColor="#0a0a1a"/>
                                </linearGradient>
                                <filter id="avatar-glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"/>
                                    <feMerge>
                                        <feMergeNode in="blur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <path d="M12 2C6.47715 2 2 6.47715 2 12V15C2 18.866 5.13401 22 9 22H15C18.866 22 22 18.866 22 15V12C22 6.47715 17.5228 2 12 2Z" fill="url(#avatar-head-grad)" stroke="#00f5ff" strokeWidth="1"/>
                            <rect x="7" y="9" width="2" height="2" rx="1" fill="#00f5ff" filter="url(#avatar-glow)"/>
                            <rect x="15" y="9" width="2" height="2" rx="1" fill="#00f5ff" filter="url(#avatar-glow)"/>
                            <path d="M9 15.5C9.5 16.5 10.6667 17 12 17C13.3333 17 14.5 16.5 15 15.5" stroke="#e040fb" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-brand-bg animate-pulse shadow-[0_0_8px_theme(colors.green.400)]"></div>
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">TradePilot AI</h3>
                </div>
                <motion.button 
                    onClick={onClose} 
                    className="p-2 rounded-full hover:bg-white/10 text-brand-text-secondary"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X size={24} />
                </motion.button>
            </header>

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-6">
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <motion.div 
                            key={index} 
                            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-brand-primary to-cyan-400 text-brand-bg rounded-br-none shadow-brand-primary/20' : 'bg-brand-surface border border-white/10 text-white rounded-bl-none shadow-black/30'}`}>
                               <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <AnimatePresence>
                    {isTyping && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-start"
                        >
                            <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-brand-surface border border-white/10 flex items-center gap-2 shadow-lg">
                                <motion.div className="w-2 h-2 bg-white/50 rounded-full" animate={{ y: [0,-4,0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}/>
                                <motion.div className="w-2 h-2 bg-white/50 rounded-full" animate={{ y: [0,-4,0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}/>
                                <motion.div className="w-2 h-2 bg-white/50 rounded-full" animate={{ y: [0,-4,0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}/>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <footer className="flex-shrink-0 p-4 border-t border-white/10">
                <div className="flex items-end gap-3 bg-brand-surface/50 p-2 rounded-2xl border border-white/10 focus-within:border-brand-primary transition-colors duration-300">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask anything..."
                        className="flex-grow w-full bg-transparent p-2 text-white placeholder-brand-text-secondary outline-none resize-none max-h-32"
                        rows={1}
                    />
                    <motion.button 
                        onClick={handleSend} 
                        className="w-11 h-11 flex-shrink-0 rounded-full bg-brand-primary text-brand-bg flex items-center justify-center disabled:opacity-50 disabled:scale-100" 
                        disabled={isTyping || input.trim() === ''}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Send message"
                    >
                        <Send size={20} />
                    </motion.button>
                </div>
            </footer>
        </motion.div>
    );
};

export default ChatWindow;