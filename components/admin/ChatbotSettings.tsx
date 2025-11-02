
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatbotSettings, ApiKeyStats } from '../../types';
import { getChatbotSettings, saveChatbotSettings } from '../../services/userDataService';
import { Save, PlusCircle, Trash2 } from 'lucide-react';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-brand-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg ${className}`}>
        {children}
    </div>
);

const ChatbotSettings: React.FC = () => {
    const [settings, setSettings] = useState<ChatbotSettings | null>(null);
    const [newApiKey, setNewApiKey] = useState('');
    const [saveStatus, setSaveStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        const data = await getChatbotSettings();
        setSettings(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async () => {
        if (settings) {
            await saveChatbotSettings(settings);
            setSaveStatus('Settings saved successfully!');
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };
    
    const handleAddKey = () => {
        if (newApiKey.trim() && settings) {
            if (settings.apiKeys.some(k => k.key === newApiKey.trim())) {
                alert("This API key already exists.");
                return;
            }
            const newKeyStat: ApiKeyStats = {
                key: newApiKey.trim(),
                status: 'active',
                usageCount: 0,
                lastUsed: null
            };
            setSettings({ ...settings, apiKeys: [...settings.apiKeys, newKeyStat] });
            setNewApiKey('');
        }
    };
    
    const handleDeleteKey = (keyToDelete: string) => {
        if (settings) {
            setSettings({ ...settings, apiKeys: settings.apiKeys.filter(k => k.key !== keyToDelete) });
        }
    };

    if (isLoading || !settings) {
        return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>;
    }
    
    const StatusIndicator: React.FC<{status: ApiKeyStats['status']}> = ({ status }) => {
        const color = {
            active: 'bg-green-500',
            failed: 'bg-red-500',
            'rate-limited': 'bg-yellow-500'
        }[status];
        return <div className={`w-3 h-3 rounded-full ${color}`} title={status}/>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Chatbot Settings</h1>

            <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">AI Personality</h2>
                <p className="text-sm text-brand-text-secondary">This instruction defines the chatbot's persona and behavior. The AI will strictly follow these guidelines.</p>
                <textarea 
                    value={settings.personality}
                    onChange={(e) => setSettings({ ...settings, personality: e.target.value })}
                    rows={6}
                    className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20 font-mono text-sm"
                />
            </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Chat Icon Text</h2>
                 <p className="text-sm text-brand-text-secondary">The text displayed below the floating chat icon.</p>
                <input
                    type="text"
                    value={settings.iconText}
                    onChange={(e) => setSettings({ ...settings, iconText: e.target.value })}
                    className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"
                />
            </Card>

            <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Cerebras API Keys</h2>
                <p className="text-sm text-brand-text-secondary">The system automatically rotates keys for each request and skips failed keys.</p>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        placeholder="Enter new Cerebras API key (csk-...)"
                        className="flex-grow w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"
                    />
                    <button onClick={handleAddKey} className="px-4 py-2 bg-brand-primary text-brand-bg font-bold rounded-lg flex items-center gap-2"><PlusCircle size={16}/> Add Key</button>
                </div>
                
                <div className="max-h-72 overflow-y-auto pr-2">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-2">Status</th>
                                <th className="p-2">Key (Partial)</th>
                                <th className="p-2 text-center">Usage</th>
                                <th className="p-2">Last Used</th>
                                <th className="p-2 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {settings.apiKeys.map(apiKey => (
                                <tr key={apiKey.key} className="border-b border-white/10 last:border-0 font-mono">
                                    <td className="p-2"><div className="flex justify-center"><StatusIndicator status={apiKey.status} /></div></td>
                                    <td className="p-2">{`${apiKey.key.substring(0, 7)}...${apiKey.key.slice(-4)}`}</td>
                                    <td className="p-2 text-center">{apiKey.usageCount}</td>
                                    <td className="p-2">{apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : 'Never'}</td>
                                    <td className="p-2 text-right">
                                        <button onClick={() => handleDeleteKey(apiKey.key)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <div className="flex items-center gap-4">
                <button onClick={handleSave} className="px-6 py-3 bg-brand-primary text-brand-bg font-bold rounded-lg flex items-center gap-2 transition-transform hover:scale-105">
                    <Save size={18}/> Save All Settings
                </button>
                <AnimatePresence>
                {saveStatus && (
                    <motion.p initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-green-400">{saveStatus}</motion.p>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChatbotSettings;
