import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, Wallet, Settings, LogOut, X, Menu, Search, Edit2, Trash2, Save, FileDown, RefreshCw, PlusCircle, MessageSquare, Mail, Eye, Bot, Star } from 'lucide-react';
import AuthBackground from '../auth/AuthBackground';
import { UserData, AdminTransaction, SystemSettings, WalletConfig, Wallet as WalletType, Message, Testimonial } from '../../types';
import * as userDataService from '../../services/userDataService';
import WelcomeMessageEditor from './WelcomeMessageEditor';
import WelcomePageEditor from './WelcomePageEditor';
import ChatbotSettings from './ChatbotSettings';

type AdminView = 'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'wallets' | 'settings' | 'messages' | 'welcome_message' | 'welcome_page' | 'chatbot' | 'testimonials';

// Helper Components
const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-brand-surface/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:border-brand-primary/50 transition-colors duration-300 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-brand-text-secondary">{title}</p>
                <p className="text-3xl font-bold text-white font-mono">{value}</p>
            </div>
            <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-full">{icon}</div>
        </div>
    </Card>
);

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const handleResize = () => setSidebarOpen(mediaQuery.matches);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderContent = () => {
        switch(activeView) {
            case 'dashboard': return <DashboardContent />;
            case 'users': return <UsersManagement />;
            case 'deposits': return <DepositsManagement />;
            case 'withdrawals': return <WithdrawalsManagement />;
            case 'wallets': return <WalletSettings />;
            case 'settings': return <SystemSettingsComponent />;
            case 'messages': return <MessagingManagement />;
            case 'welcome_message': return <WelcomeMessageEditor />;
            case 'welcome_page': return <WelcomePageEditor />;
            case 'chatbot': return <ChatbotSettings />;
            case 'testimonials': return <TestimonialsManagement />;
            default: return <DashboardContent />;
        }
    };
    
    const NavItem: React.FC<{ view: AdminView; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
        <button
            onClick={() => {
                setActiveView(view);
                if(window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-300 ${activeView === view ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-secondary hover:bg-white/10 hover:text-white'}`}
        >
            {icon}
            <span className="ml-4 whitespace-nowrap">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen bg-brand-bg font-sans text-white">
            <AuthBackground />
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                      onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
            
            <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-brand-surface/50 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col p-4 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-brand-primary">Admin Panel</h1>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-white/10"><X size={20} /></button>
                </div>
                <nav className="flex flex-col gap-2">
                    <NavItem view="dashboard" icon={<LayoutDashboard size={20}/>} label="Dashboard" />
                    <NavItem view="users" icon={<Users size={20}/>} label="Users" />
                    <NavItem view="testimonials" icon={<Star size={20}/>} label="Testimonials" />
                    <NavItem view="chatbot" icon={<Bot size={20} />} label="Chatbot Settings" />
                    <NavItem view="messages" icon={<MessageSquare size={20} />} label="Broadcasts" />
                    <NavItem view="welcome_page" icon={<Eye size={20} />} label="Welcome Page" />
                    <NavItem view="welcome_message" icon={<Mail size={20} />} label="Welcome Inbox Msg" />
                    <NavItem view="deposits" icon={<ArrowDownToLine size={20}/>} label="Deposits" />
                    <NavItem view="withdrawals" icon={<ArrowUpFromLine size={20}/>} label="Withdrawals" />
                    <NavItem view="wallets" icon={<Wallet size={20}/>} label="Wallets" />
                    <NavItem view="settings" icon={<Settings size={20}/>} label="Settings" />
                </nav>
                <div className="mt-auto">
                    <button onClick={onLogout} className="flex items-center w-full px-4 py-3 text-left rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                        <LogOut size={20}/>
                        <span className="ml-4">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
                 <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 absolute top-6 left-6 text-white z-20 ${isSidebarOpen ? 'hidden' : ''}`}>
                    <Menu size={28}/>
                </button>
                <div className="relative z-10 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};


// Admin Page Components
const DashboardContent: React.FC = () => {
    const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0, balance: 0, referrals: 0 });

    const fetchData = useCallback(async () => {
        const users = await userDataService.getAllUsersData();
        const txs = await userDataService.getAllTransactions();
        const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);
        const totalReferrals = users.reduce((sum, user) => sum + user.referrals.count, 0);
        
        setStats({
            users: users.length,
            deposits: txs.filter(t => t.type === 'Deposit' && t.status === 'Confirmed').reduce((sum, t) => sum + (t.usdValue || t.amount), 0),
            withdrawals: txs.filter(t => t.type === 'Withdrawal' && t.status === 'Pending').length,
            balance: totalBalance,
            referrals: totalReferrals,
        });
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={stats.users} icon={<Users />} />
                <StatCard title="Total Deposits (USD)" value={`$${stats.deposits.toLocaleString()}`} icon={<ArrowDownToLine />} />
                <StatCard title="Pending Withdrawals" value={stats.withdrawals} icon={<ArrowUpFromLine />} />
                <StatCard title="Total Referrals" value={stats.referrals} icon={<Users />} />
                <StatCard title="Platform Wallet Balance" value={`$${stats.balance.toLocaleString()}`} icon={<Wallet />} />
            </div>
        </div>
    );
};

const UsersManagement: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [addBalanceAmount, setAddBalanceAmount] = useState<number | ''>('');
    const [addBalanceAsset, setAddBalanceAsset] = useState('USDT');
    const [wallets, setWallets] = useState<WalletConfig>({});
    const [toast, setToast] = useState('');

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    const loadUsers = useCallback(async () => {
        const allUsers = await userDataService.getAllUsersData();
        setUsers(allUsers);
    }, []);

    useEffect(() => {
        userDataService.getWalletConfig().then(setWallets);
        loadUsers();
        const interval = setInterval(loadUsers, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [loadUsers]);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async () => {
        if (editingUser) {
            const updates: Partial<UserData> = {
                name: editingUser.name,
                email: editingUser.email,
            };
            if (newPassword) {
                updates.password = newPassword;
            }
            await userDataService.updateUserData(editingUser.id, updates);
            setNewPassword('');
            setEditingUser(null);
            showToast('User updated successfully!');
            loadUsers();
        }
    };
    
    const handleDelete = async (userId: string) => {
        if(window.confirm('Are you sure you want to delete this user? This action is irreversible.')){
            await userDataService.deleteUser(userId);
            showToast('User deleted.');
            loadUsers();
        }
    };

    const handleAddBalance = async () => {
        if (editingUser && typeof addBalanceAmount === 'number' && addBalanceAmount > 0) {
            const updatedUser = await userDataService.adminAddBalance(editingUser.id, addBalanceAmount, addBalanceAsset);
            if (updatedUser) {
                setEditingUser(updatedUser);
                showToast(`$${addBalanceAmount} added to ${updatedUser.name}.`);
                loadUsers(); // To refresh main list if needed
            }
            setAddBalanceAmount('');
        } else {
            showToast('Please enter a valid amount.');
        }
    };

    if (editingUser) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Edit User: {editingUser.name}</h1>
                <Card className="p-6 space-y-4">
                    <div><label className="text-sm text-brand-text-secondary">Username</label><input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/></div>
                    <div><label className="text-sm text-brand-text-secondary">Email</label><input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/></div>
                    <div><label className="text-sm text-brand-text-secondary">New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/></div>
                    <div className="flex gap-4 pt-4">
                        <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-brand-bg rounded font-bold">Save Changes</button>
                        <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-500 text-white rounded font-bold">Cancel</button>
                    </div>
                </Card>
                <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-bold">Balance Management</h2>
                    <p>Current Balance: <span className="font-mono font-bold">${editingUser.balance.toLocaleString()}</span></p>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-grow">
                            <label className="text-sm text-brand-text-secondary">Amount (USD) to Add</label>
                            <input type="number" value={addBalanceAmount} onChange={e => setAddBalanceAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="e.g., 100" className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/>
                        </div>
                        <div className="flex-grow">
                            <label className="text-sm text-brand-text-secondary">Deposit Asset</label>
                            <select value={addBalanceAsset} onChange={e => setAddBalanceAsset(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20">
                                {Object.keys(wallets).map(key => <option key={key} value={key}>{key}</option>)}
                            </select>
                        </div>
                        <button onClick={handleAddBalance} className="px-4 py-2 bg-green-500 text-white rounded font-bold w-full sm:w-auto"><PlusCircle size={16} className="inline mr-2"/>Add Balance</button>
                    </div>
                </Card>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <AnimatePresence>
            {toast && <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 20}} className="fixed top-20 right-5 bg-brand-primary text-brand-bg p-3 rounded-lg shadow-lg z-50">{toast}</motion.div>}
            </AnimatePresence>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Users Management</h1>
                <button onClick={loadUsers} className="p-2 hover:bg-white/10 rounded-full"><RefreshCw size={18} /></button>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={20}/>
                <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 bg-brand-surface rounded-lg border border-white/10"/>
            </div>
            <Card className="p-2 sm:p-4 overflow-x-auto">
                 <table className="w-full min-w-[800px] text-left">
                    <thead><tr className="border-b border-white/20"><th className="p-3">Username</th><th className="p-3">Email</th><th className="p-3">Balance</th><th className="p-3">Plan</th><th className="p-3">Registered</th><th className="p-3">Actions</th></tr></thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-white/10 last:border-b-0">
                                <td className="p-3">{user.name}</td><td className="p-3">{user.email}</td>
                                <td className="p-3 font-mono">${user.balance.toLocaleString()}</td>
                                <td className="p-3">{user.plan}</td>
                                <td className="p-3 text-sm">{new Date(user.registrationDate || 0).toLocaleDateString()}</td>
                                <td className="p-3"><div className="flex gap-2">
                                    <button onClick={() => setEditingUser(user)} className="p-2 hover:text-brand-primary"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 hover:text-red-500"><Trash2 size={16}/></button>
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 {filteredUsers.length === 0 && <p className="text-center p-8 text-brand-text-secondary">No users found.</p>}
            </Card>
        </div>
    );
};

const TransactionManagement: React.FC<{ type: 'Deposit' | 'Withdrawal' }> = ({ type }) => {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    
    const loadTransactions = useCallback(async () => {
        const allTxs = await userDataService.getAllTransactions();
        setTransactions(allTxs.filter(t => t.type === type));
    }, [type]);

    useEffect(() => {
        loadTransactions();
        const interval = setInterval(loadTransactions, 5000); // Auto-refresh
        return () => clearInterval(interval);
    }, [loadTransactions]);

    const handleStatusChange = async (tx: AdminTransaction, status: 'Confirmed' | 'Failed') => {
        await userDataService.updateTransactionStatus(tx.userId, tx.id, status);
        loadTransactions();
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{type}s Management</h1>
            <Card className="p-2 sm:p-4 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                    <thead><tr className="border-b border-white/20"><th className="p-3">User</th><th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Asset</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id} className="border-b border-white/10 last:border-b-0">
                                <td className="p-3">{tx.userName}</td><td className="p-3 text-sm">{new Date(tx.date).toLocaleString()}</td>
                                <td className="p-3 font-mono">${(tx.usdValue || tx.amount).toLocaleString()}</td><td>{tx.asset}</td>
                                <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${tx.status === 'Confirmed' ? 'bg-green-500/20 text-green-400' : tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{tx.status}</span></td>
                                <td className="p-3">
                                    {tx.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleStatusChange(tx, 'Confirmed')} className="px-3 py-1 bg-green-500/80 text-white text-xs rounded">Confirm</button>
                                            <button onClick={() => handleStatusChange(tx, 'Failed')} className="px-3 py-1 bg-red-500/80 text-white text-xs rounded">Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {transactions.length === 0 && <p className="text-center p-8 text-brand-text-secondary">No {type.toLowerCase()}s found.</p>}
            </Card>
        </div>
    );
};

const DepositsManagement: React.FC = () => <TransactionManagement type="Deposit" />;
const WithdrawalsManagement: React.FC = () => <TransactionManagement type="Withdrawal" />;

const MessagingManagement: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    const loadMessages = useCallback(async () => {
        setIsLoading(true);
        const fetchedMessages = await userDataService.getMessages();
        setMessages(fetchedMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const handleOpenModal = (message: Message | null = null) => {
        setEditingMessage(message);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMessage(null);
    };

    const handleSave = async (messageData: Omit<Message, 'id' | 'createdAt'>) => {
        if (editingMessage) {
            await userDataService.updateMessage(editingMessage.id, messageData);
        } else {
            await userDataService.addMessage(messageData);
        }
        loadMessages();
        handleCloseModal();
    };

    const handleDelete = async (messageId: string) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            await userDataService.deleteMessage(messageId);
            loadMessages();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Broadcast Messages</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-brand-bg rounded-lg font-bold"><PlusCircle size={18} /> New Message</button>
            </div>

            {isLoading ? <p>Loading messages...</p> : (
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <Card className="p-8 text-center text-brand-text-secondary">No messages yet. Create one!</Card>
                    ) : (
                        messages.map(msg => (
                            <Card key={msg.id} className="p-4 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{msg.title}</h3>
                                    <p className="text-sm text-brand-text-secondary mt-1">{msg.text.substring(0, 100)}...</p>
                                    <p className="text-xs text-brand-text-secondary/50 mt-2">
                                        Posted on {new Date(msg.createdAt).toLocaleString()}
                                        {msg.recipientId ? <span className="ml-2 font-bold text-yellow-400">[PRIVATE]</span> : <span className="ml-2 font-bold text-cyan-400">[BROADCAST]</span>}
                                        {msg.imageUrl && <span className="ml-2 font-bold">[Image]</span>}
                                        {msg.videoUrl && <span className="ml-2 font-bold">[Video]</span>}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0 ml-4">
                                    <button onClick={() => handleOpenModal(msg)} className="p-2 hover:text-brand-primary"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(msg.id)} className="p-2 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
            <MessageEditorModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} message={editingMessage} />
        </div>
    );
};

const MessageEditorModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: any) => void; message: Message | null; }> = ({ isOpen, onClose, onSave, message }) => {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [video, setVideo] = useState<string | null>(null);
    const [recipientId, setRecipientId] = useState<string>('');
    const [users, setUsers] = useState<UserData[]>([]);

    useEffect(() => {
        if (isOpen) {
            userDataService.getAllUsersData().then(setUsers);
            setTitle(message?.title || '');
            setText(message?.text || '');
            setImage(message?.imageUrl || null);
            setVideo(message?.videoUrl || null);
            setRecipientId(message?.recipientId || ''); // '' for broadcast
        }
    }, [message, isOpen]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            if (type === 'image') setImage(base64);
            if (type === 'video') setVideo(base64);
        }
    };
    
    const handleSubmit = () => {
        onSave({ title, text, imageUrl: image, videoUrl: video, recipientId: recipientId || undefined });
    };

    return (
        <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-4">
                    <h2 className="text-2xl font-bold">{message ? 'Edit' : 'Create'} Message</h2>
                    <div>
                        <label className="text-sm text-brand-text-secondary">Recipient</label>
                        <select value={recipientId} onChange={e => setRecipientId(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20">
                            <option value="">Broadcast to All Users</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                        </select>
                    </div>
                    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-brand-bg rounded border border-white/20"/>
                    <textarea placeholder="Text content..." value={text} onChange={e => setText(e.target.value)} rows={5} className="w-full p-2 bg-brand-bg rounded border border-white/20"/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-brand-text-secondary">Image (optional)</label>
                            <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'image')} className="w-full mt-1 p-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/40 text-sm text-brand-text-secondary bg-brand-bg rounded border border-white/20"/>
                            {image && <img src={image} alt="preview" className="mt-2 h-24 rounded"/>}
                        </div>
                         <div>
                            <label className="text-sm text-brand-text-secondary">Video (optional)</label>
                            <input type="file" accept="video/*" onChange={e => handleFileChange(e, 'video')} className="w-full mt-1 p-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/40 text-sm text-brand-text-secondary bg-brand-bg rounded border border-white/20"/>
                            {video && <video src={video} className="mt-2 h-24 rounded" controls />}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded font-bold">Cancel</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-brand-primary text-brand-bg rounded font-bold">Save</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};

const TestimonialsManagement: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

    const loadTestimonials = useCallback(async () => {
        setIsLoading(true);
        const data = await userDataService.getTestimonials();
        setTestimonials(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadTestimonials();
    }, [loadTestimonials]);

    const handleSave = async (testimonial: Testimonial) => {
        await userDataService.updateTestimonial(testimonial.id, testimonial);
        setEditingTestimonial(null);
        loadTestimonials();
    };

    const handleDelete = async (testimonialId: string) => {
        if (window.confirm('Are you sure you want to delete this testimonial?')) {
            await userDataService.deleteTestimonial(testimonialId);
            loadTestimonials();
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Testimonials Management</h1>
            {isLoading ? <p>Loading...</p> : (
                <Card className="p-2 sm:p-4 overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                        <thead><tr className="border-b border-white/20"><th className="p-3">Date</th><th className="p-3">Name</th><th className="p-3">Rating</th><th className="p-3">Text</th><th className="p-3">Reply</th><th className="p-3">Actions</th></tr></thead>
                        <tbody>
                            {testimonials.map(t => (
                                <tr key={t.id} className="border-b border-white/10 last:border-b-0">
                                    <td className="p-3 text-sm align-top">{new Date(t.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3 align-top">{t.name || 'Anonymous'}</td>
                                    <td className="p-3 align-top">{t.rating} ★</td>
                                    <td className="p-3 text-sm max-w-xs align-top truncate">{t.text}</td>
                                    <td className="p-3 text-sm max-w-xs align-top truncate">{t.adminReply || 'N/A'}</td>
                                    <td className="p-3 align-top">
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingTestimonial(t)} className="p-2 hover:text-brand-primary"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDelete(t.id)} className="p-2 hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
            <TestimonialEditorModal 
                isOpen={!!editingTestimonial}
                onClose={() => setEditingTestimonial(null)}
                onSave={handleSave}
                testimonial={editingTestimonial}
            />
        </div>
    );
};

const TestimonialEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Testimonial) => void;
    testimonial: Testimonial | null;
}> = ({ isOpen, onClose, onSave, testimonial }) => {
    const [editedTestimonial, setEditedTestimonial] = useState<Testimonial | null>(null);

    useEffect(() => {
        if (testimonial) {
            setEditedTestimonial({ ...testimonial });
        }
    }, [testimonial]);

    const handleSave = () => {
        if (editedTestimonial) {
            onSave(editedTestimonial);
        }
    };
    
    if (!editedTestimonial) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-4">
                        <h2 className="text-2xl font-bold">Edit Testimonial</h2>
                        <div>
                            <label className="text-sm text-brand-text-secondary">Text</label>
                            <textarea value={editedTestimonial.text} onChange={e => setEditedTestimonial({...editedTestimonial, text: e.target.value})} rows={4} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/>
                        </div>
                        <div>
                            <label className="text-sm text-brand-text-secondary">Admin Reply</label>
                            <textarea value={editedTestimonial.adminReply || ''} onChange={e => setEditedTestimonial({...editedTestimonial, adminReply: e.target.value})} rows={4} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded font-bold">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-brand-bg rounded font-bold">Save</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const WalletSettings: React.FC = () => {
    const [wallets, setWallets] = useState<WalletConfig>({});
    const [saveStatus, setSaveStatus] = useState('');
    
    useEffect(() => {
        userDataService.getWalletConfig().then(setWallets);
    }, []);

    const handleSave = async () => {
        await userDataService.saveWalletConfig(wallets);
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const handleWalletChange = (symbol: string, field: string, value: string) => {
        const isNumeric = ['minWithdrawal', 'withdrawalFee'].includes(field);
        setWallets(prev => ({
            ...prev,
            [symbol]: { ...prev[symbol], [field]: isNumeric ? parseFloat(value) || 0 : value }
        }));
    };
    
    const handleFileChange = (symbol: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleWalletChange(symbol, 'qrCodeUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Wallet Settings</h1>
            <div className="space-y-4">
                {Object.values(wallets).map((wallet: WalletType) => (
                    <Card key={wallet.symbol} className="p-6">
                        <h3 className="text-xl font-bold mb-4 text-brand-primary">{wallet.name} ({wallet.symbol})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div><label className="text-sm text-brand-text-secondary">Address</label><input type="text" value={wallet.address} onChange={e => handleWalletChange(wallet.symbol, 'address', e.target.value)} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/></div>
                                <div><label className="text-sm text-brand-text-secondary">Network</label><input type="text" value={wallet.network} onChange={e => handleWalletChange(wallet.symbol, 'network', e.target.value)} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/></div>
                                <div><label className="text-sm text-brand-text-secondary">Min Withdrawal ({wallet.symbol})</label><input type="number" step="any" value={wallet.minWithdrawal || ''} onChange={e => handleWalletChange(wallet.symbol, 'minWithdrawal', e.target.value)} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/></div>
                                <div><label className="text-sm text-brand-text-secondary">Withdrawal Fee ({wallet.symbol})</label><input type="number" step="any" value={wallet.withdrawalFee || ''} onChange={e => handleWalletChange(wallet.symbol, 'withdrawalFee', e.target.value)} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/></div>
                            </div>
                            <div className="space-y-2">
                                <div><label className="text-sm text-brand-text-secondary">QR Code Image</label><input type="file" accept="image/*" onChange={e => handleFileChange(wallet.symbol, e)} className="w-full mt-1 p-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/40 text-sm text-brand-text-secondary bg-brand-bg rounded border border-white/20"/></div>
                                {wallet.qrCodeUrl && <img src={wallet.qrCodeUrl} alt="QR Code" className="w-24 h-24 p-1 bg-white rounded-lg"/>}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="flex items-center gap-4">
                <button onClick={handleSave} className="px-6 py-3 bg-brand-primary text-brand-bg font-bold rounded-lg"><Save className="inline-block mr-2"/>Save Settings</button>
                {saveStatus && <span className="text-green-400">{saveStatus}</span>}
            </div>
        </div>
    );
};

const SystemSettingsComponent: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    useEffect(() => {
        userDataService.getSystemSettings().then(setSettings);
    }, []);

    if (!settings) return <div>Loading...</div>;

    const handleSave = async () => {
        await userDataService.saveSystemSettings(settings);
        alert('System settings saved!');
    };
    
    const handleBackup = () => {
        const backupData: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tradepilot_')) {
                backupData[key] = localStorage.getItem(key)!;
            }
        }
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tradepilot_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">System Settings</h1>
            <Card className="p-6 space-y-4">
                <div><label>Site Name</label><input type="text" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} className="w-full mt-1 p-2 bg-brand-bg rounded"/></div>
                <div><label>Description</label><textarea value={settings.description} onChange={e => setSettings({...settings, description: e.target.value})} className="w-full mt-1 p-2 bg-brand-bg rounded"/></div>
                <div><label>Logo URL</label><input type="text" value={settings.logoUrl} onChange={e => setSettings({...settings, logoUrl: e.target.value})} className="w-full mt-1 p-2 bg-brand-bg rounded"/></div>
                <div className="flex items-center justify-between"><label>Maintenance Mode</label><input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="w-5 h-5"/></div>
            </Card>
            
            <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-brand-primary">reCAPTCHA Settings</h2>
                <p className="text-sm text-brand-text-secondary">Enable reCAPTCHA to protect login and registration pages from bots.</p>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <label className="font-semibold">Enable reCAPTCHA</label>
                    <input type="checkbox" checked={settings.recaptchaEnabled || false} onChange={e => setSettings({...settings, recaptchaEnabled: e.target.checked})} className="w-5 h-5"/>
                </div>
                {settings.recaptchaEnabled && (
                    <>
                        <div>
                            <label className="text-sm text-brand-text-secondary">reCAPTCHA Site Key (Client-side)</label>
                            <input type="text" placeholder="6Lc..." value={settings.recaptchaSiteKey || ''} onChange={e => setSettings({...settings, recaptchaSiteKey: e.target.value})} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/>
                            <p className="text-xs text-brand-text-secondary mt-1">Get your keys from <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Google reCAPTCHA Admin</a></p>
                        </div>
                        <div>
                            <label className="text-sm text-brand-text-secondary">reCAPTCHA Secret Key (Server-side)</label>
                            <input type="password" placeholder="6Lc..." value={settings.recaptchaSecretKey || ''} onChange={e => setSettings({...settings, recaptchaSecretKey: e.target.value})} className="w-full mt-1 p-2 bg-brand-bg rounded border border-white/20"/>
                            <p className="text-xs text-brand-text-secondary mt-1">This key is used for server-side verification (kept private)</p>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-400/50 rounded-lg text-green-300 text-sm">
                            ✓ When enabled, users must complete reCAPTCHA verification on login and registration pages.
                        </div>
                    </>
                )}
                {!settings.recaptchaEnabled && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-400/50 rounded-lg text-yellow-300 text-sm">
                        ⚠ reCAPTCHA is currently disabled. Login and registration will work without verification.
                    </div>
                )}
            </Card>
            <div className="flex gap-4">
                 <button onClick={handleSave} className="px-6 py-3 bg-brand-primary text-brand-bg font-bold rounded-lg"><Save className="inline-block mr-2"/>Save Settings</button>
                 <button onClick={handleBackup} className="px-6 py-3 bg-brand-secondary text-white font-bold rounded-lg"><FileDown className="inline-block mr-2"/>Backup Data</button>
            </div>
        </div>
    );
};

export default AdminPanel;