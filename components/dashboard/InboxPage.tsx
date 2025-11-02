import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserData, Message } from '../../types';
import * as userDataService from '../../services/userDataService';
import DashboardPageLayout, { InteractiveCard } from './DashboardPageLayout';
import { MessageSquare, Mail } from 'lucide-react';

interface InboxPageProps {
    user: UserData;
}

const InboxPage: React.FC<InboxPageProps> = ({ user }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadMessages = useCallback(async () => {
        setIsLoading(true);
        const fetchedMessages = await userDataService.getMessages();
        // Filter messages: show broadcast (no recipientId) and messages for this user
        const userMessages = fetchedMessages.filter(msg => !msg.recipientId || msg.recipientId === user.id);
        setMessages(userMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
    }, [user.id]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    return (
        <DashboardPageLayout title="Inbox" icon={<MessageSquare size={28} />}>
            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : messages.length === 0 ? (
                <InteractiveCard className="p-8 text-center flex flex-col items-center justify-center h-48">
                    <Mail size={40} className="text-brand-text-secondary mb-4" />
                    <p className="text-brand-text-secondary">Your inbox is empty.</p>
                </InteractiveCard>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <InteractiveCard className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">{msg.title}</h3>
                                {msg.imageUrl && <img src={msg.imageUrl} alt="Message visual" className="my-4 rounded-lg max-h-64 w-auto" />}
                                {msg.videoUrl && <video src={msg.videoUrl} controls className="my-4 rounded-lg w-full max-w-sm" />}
                                <p className="text-brand-text-secondary whitespace-pre-wrap">{msg.text}</p>
                                <p className="text-xs text-brand-text-secondary/60 mt-4 text-right">
                                    {new Date(msg.createdAt).toLocaleString()}
                                </p>
                            </InteractiveCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </DashboardPageLayout>
    );
};

export default InboxPage;