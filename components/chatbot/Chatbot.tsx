
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatbotSettings, User, ChatMessage } from '../../types';
import { getChatbotSettings } from '../../services/userDataService';
import { generateChatResponse } from '../../services/cerebrasService';
import ChatIcon from './ChatIcon';
import ChatWindow from './ChatWindow';

interface ChatbotProps {
    user: User;
}

const Chatbot: React.FC<ChatbotProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const [settings, setSettings] = useState<ChatbotSettings | null>(null);

    // New state for the greeting bubble
    const [showGreetingBubble, setShowGreetingBubble] = useState(false);
    const [greetingMessage, setGreetingMessage] = useState('');

    useEffect(() => {
        getChatbotSettings().then(setSettings);
    }, []);

    // Effect to trigger the greeting bubble
    useEffect(() => {
        const greetingTimer = setTimeout(async () => {
            if (!isOpen) { // Show on every refresh if chat is not open
                try {
                    const prompt: ChatMessage[] = [{
                        role: 'user',
                        content: `Generate a short, friendly, and professional greeting for a user named "${user.name}" who has just logged into a crypto trading platform. The message should be welcoming, use their name, and invite them to ask questions. Keep it concise (under 20 words) and use one or two emojis. For example: "👋 Hey ${user.name}, great to see you! Need help or have questions? I'm always here for you 🤝🤖"`
                    }];
                    const response = await generateChatResponse(prompt);
                    setGreetingMessage(response);
                    setShowGreetingBubble(true);
                } catch (error) {
                    console.error("Failed to generate greeting:", error);
                    // Fallback greeting
                    setGreetingMessage(`Hi ${user.name}! Ready to explore the future of trading?`);
                    setShowGreetingBubble(true);
                }
            }
        }, 5000); // 5-second delay

        return () => clearTimeout(greetingTimer);
    }, [isOpen, user.name]);

    // Effect to hide the bubble after 8 seconds
    useEffect(() => {
        if (showGreetingBubble) {
            const hideTimer = setTimeout(() => {
                setShowGreetingBubble(false);
            }, 8000); // 8-second visibility

            return () => clearTimeout(hideTimer);
        }
    }, [showGreetingBubble]);

    const handleOpen = () => {
        setIsOpen(true);
        setHasNewMessage(false);
        setShowGreetingBubble(false); // Hide bubble when chat opens
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleNewAiMessage = () => {
        if (!isOpen) {
            setHasNewMessage(true);
        }
    };

    if (!settings) {
        return null; // Don't render anything until settings are loaded
    }

    return (
        <>
            <AnimatePresence>
                {isOpen ? (
                    <ChatWindow 
                        onClose={handleClose} 
                        onNewAiMessage={handleNewAiMessage}
                    />
                ) : (
                    <ChatIcon 
                        onClick={handleOpen} 
                        hasNewMessage={hasNewMessage}
                        text={settings.iconText}
                        showGreetingBubble={showGreetingBubble}
                        greetingMessage={greetingMessage}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;
