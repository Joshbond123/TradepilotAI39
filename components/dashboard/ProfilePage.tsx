
import React, { useState, useMemo, useCallback } from 'react';
import { UserData, NotificationPreferences, LoginSession, LogEntry } from '../../types';
import { updateUserData, logoutAllSessions, deleteUser, requestNotificationPermission } from '../../services/userDataService';
import DashboardPageLayout, { InteractiveCard } from './DashboardPageLayout';
import { User as UserIcon, Shield, Bell, History, AlertTriangle, Check, X, LogOut, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ProfileTab = 'account' | 'security' | 'notifications' | 'logs' | 'actions';

const ProfilePage: React.FC<{ user: UserData; showToast: (msg: string, type?: 'success' | 'error') => void; onUpdate: () => void; onLogout: () => void; }> = ({ user, showToast, onUpdate, onLogout }) => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('account');

    const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
        { id: 'account', label: 'Account', icon: <UserIcon size={18} /> },
        { id: 'security', label: 'Security', icon: <Shield size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'logs', label: 'Logs', icon: <History size={18} /> },
        { id: 'actions', label: 'Actions', icon: <AlertTriangle size={18} /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'account': return <AccountSettings user={user} showToast={showToast} onUpdate={onUpdate} />;
            case 'security': return <SecuritySettings user={user} showToast={showToast} onUpdate={onUpdate} onLogoutAll={onLogout} />;
            case 'notifications': return <NotificationSettings user={user} showToast={showToast} onUpdate={onUpdate} />;
            case 'logs': return <LogsView user={user} />;
            case 'actions': return <AccountActions user={user} showToast={showToast} onLogout={onLogout} />;
            default: return null;
        }
    };

    return (
        <DashboardPageLayout title="Profile Settings" icon={<UserIcon size={28} />}>
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tab Navigation */}
                <aside className="lg:w-1/4">
                    <InteractiveCard className="p-4">
                        <nav className="flex lg:flex-col gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative w-full flex items-center gap-3 text-left p-3 rounded-lg transition-all duration-300 ${activeTab === tab.id ? 'text-white' : 'text-brand-text-secondary hover:bg-white/5 hover:text-white'}`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="profileTabIndicator"
                                            className="absolute inset-0 bg-brand-primary/10 rounded-lg z-0"
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                    <span className={`relative z-10 ${activeTab === tab.id ? 'text-brand-primary' : ''}`}>{tab.icon}</span>
                                    <span className="relative z-10 text-sm font-semibold">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </InteractiveCard>
                </aside>

                {/* Tab Content */}
                <main className="lg:w-3/4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <InteractiveCard className="p-6 md:p-8 min-h-[400px]">
                                {renderContent()}
                            </InteractiveCard>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </DashboardPageLayout>
    );
};

// --- Sub-components for each tab ---

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-xl font-bold text-white mb-6 border-b-2 border-brand-primary/30 pb-3">{title}</h2>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ReactNode }> = ({ label, icon, ...props }) => (
    <div>
        <label className="block text-brand-text-secondary mb-2 text-sm">{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary">{icon}</div>}
            <input {...props} className={`w-full bg-brand-bg/50 border-2 border-white/10 rounded-lg p-3 text-white placeholder-brand-text-secondary transition-all duration-300 glow-input ${icon ? 'pl-10' : ''}`} />
        </div>
    </div>
);

const ActionButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'secondary' }>(
    ({ children, variant = 'primary', className, ...props }, ref) => {
        const baseClasses = "px-6 py-2 font-bold rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed";
        const variantClasses = {
            primary: 'bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40',
            danger: 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40',
            secondary: 'bg-white/10 text-white hover:bg-white/20',
        };
        return <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>{children}</button>
    }
);


const AccountSettings: React.FC<{ user: UserData; showToast: (msg: string) => void; onUpdate: () => void; }> = ({ user, showToast, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [country, setCountry] = useState(user.country || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name || !email) {
            showToast("Name and email cannot be empty.", 'error');
            return;
        }
        setIsSaving(true);
        await updateUserData(user.id, { name, email, country });
        showToast('Profile Saved!');
        onUpdate();
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            <SectionTitle title="Account Information" />
            <div className="space-y-4">
                <FormInput label="Username" value={name} onChange={e => setName(e.target.value)} />
                <FormInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <FormInput label="Country" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. United States" />
            </div>
            <div className="mt-8 flex justify-end">
                <ActionButton onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : <><Save size={16} className="inline mr-2" /> Save Changes</>}
                </ActionButton>
            </div>
        </div>
    );
};

const SecuritySettings: React.FC<{ user: UserData; showToast: (msg: string, type?: 'success'|'error') => void; onUpdate: () => void; onLogoutAll: () => void; }> = ({ user, showToast, onUpdate, onLogoutAll }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleChangePassword = async () => {
        if(currentPassword !== user.password) {
            showToast("Incorrect current password.", 'error'); return;
        }
        if(!newPassword || newPassword.length < 6) {
            showToast("New password must be at least 6 characters.", 'error'); return;
        }
        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match.", 'error'); return;
        }
        setIsSaving(true);
        await updateUserData(user.id, { password: newPassword });
        showToast('Password updated successfully!');
        onUpdate();
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setIsSaving(false);
    }
    
    const handleLogoutAll = async () => {
        await logoutAllSessions(user.id);
        showToast("Logged out from all devices.");
        onLogoutAll();
    }

    return (
        <div className="space-y-8">
            <div>
                <SectionTitle title="Change Password" />
                <div className="space-y-4">
                    <FormInput label="Current Password" type={showPass ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    <FormInput label="New Password" type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <FormInput label="Confirm New Password" type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    <div className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={16}/> : <Eye size={16} />}
                        <span>{showPass ? 'Hide' : 'Show'} Passwords</span>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end">
                    <ActionButton onClick={handleChangePassword} disabled={isSaving}>
                        {isSaving ? 'Updating...' : 'Update Password'}
                    </ActionButton>
                </div>
            </div>
            <div>
                 <SectionTitle title="Active Sessions" />
                 <ul className="space-y-3">
                    {user.sessions?.map(session => (
                        <li key={session.id} className="flex justify-between items-center p-3 bg-brand-bg/30 rounded-lg">
                            <div>
                                <p className="font-semibold text-white">{session.device} {session.isCurrent && <span className="text-xs text-green-400">(Current)</span>}</p>
                                <p className="text-xs text-brand-text-secondary">IP: {session.ipAddress} - Logged in: {new Date(session.loggedInAt).toLocaleString()}</p>
                            </div>
                        </li>
                    ))}
                 </ul>
                 <div className="mt-6 flex justify-end">
                    <ActionButton variant="danger" onClick={() => setShowLogoutModal(true)}>
                        <LogOut size={16} className="inline mr-2" /> Logout From All Devices
                    </ActionButton>
                 </div>
            </div>
            <ConfirmationModal 
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogoutAll}
                title="Logout From All Devices?"
                message="This will sign you out of TradePilot AI on all other computers and devices. You will need to log in again."
            />
        </div>
    );
};

const NotificationSettings: React.FC<{ user: UserData; showToast: (msg: string, type?: 'success' | 'error') => void; onUpdate: () => void; }> = ({ user, showToast, onUpdate }) => {
    const [prefs, setPrefs] = useState<NotificationPreferences>(user.notificationPreferences);
    const [isSaving, setIsSaving] = useState(false);

    const handleToggle = (category: 'email' | 'push', type: keyof NotificationPreferences['email']) => {
        setPrefs(p => ({
            ...p,
            [category]: { ...p[category], [type]: !p[category][type] }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await updateUserData(user.id, { notificationPreferences: prefs });
        showToast('Notification settings saved!');
        onUpdate();
        setIsSaving(false);
    };

    const handleRequestPush = async () => {
        const permission = await requestNotificationPermission();
        // FIX: Handle the 'unsupported' case from requestNotificationPermission to prevent a type error.
        if (permission === 'unsupported') {
            showToast('This browser does not support notifications.', 'error');
            return;
        }

        if(permission === 'granted') showToast("Push notifications enabled!");
        if(permission === 'denied') showToast("Push notifications blocked by browser.", 'error');
        await updateUserData(user.id, { notificationPermission: permission });
        onUpdate();
    };
    
    const Toggle: React.FC<{ checked: boolean, onChange: () => void, label: string }> = ({ checked, onChange, label }) => (
        <div className="flex items-center justify-between p-3 bg-brand-bg/30 rounded-lg">
            <span className="text-white">{label}</span>
            <button onClick={onChange} className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-brand-primary' : 'bg-gray-600'}`}>
                <motion.div layout className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full`} style={{ x: checked ? '100%' : '0%' }}/>
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <SectionTitle title="Push Notifications" />
                {user.notificationPermission === 'denied' ? (
                     <div className="p-4 bg-yellow-500/10 border border-yellow-400/50 rounded-lg text-yellow-300 text-sm">
                        Notifications are blocked. You need to enable them in your browser settings.
                    </div>
                ) : user.notificationPermission !== 'granted' ? (
                    <ActionButton onClick={handleRequestPush}>Enable Browser Notifications</ActionButton>
                ) : (
                    <div className="space-y-2">
                        <Toggle checked={prefs.push.profitAlerts} onChange={() => handleToggle('push', 'profitAlerts')} label="Profit Alerts" />
                        <Toggle checked={prefs.push.systemAlerts} onChange={() => handleToggle('push', 'systemAlerts')} label="System Alerts" />
                        <Toggle checked={prefs.push.inboxMessages} onChange={() => handleToggle('push', 'inboxMessages')} label="New Inbox Messages" />
                    </div>
                )}
            </div>
            <div>
                <SectionTitle title="Email Notifications" />
                <div className="space-y-2">
                    <Toggle checked={prefs.email.profitAlerts} onChange={() => handleToggle('email', 'profitAlerts')} label="Profit Alerts" />
                    <Toggle checked={prefs.email.systemAlerts} onChange={() => handleToggle('email', 'systemAlerts')} label="System Alerts" />
                    <Toggle checked={prefs.email.inboxMessages} onChange={() => handleToggle('email', 'inboxMessages')} label="New Inbox Messages" />
                </div>
            </div>
             <div className="mt-8 flex justify-end">
                <ActionButton onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : <><Save size={16} className="inline mr-2" /> Save Preferences</>}
                </ActionButton>
            </div>
        </div>
    );
};

const LogsView: React.FC<{ user: UserData }> = ({ user }) => {
    const LogTable: React.FC<{ title: string; logs: LogEntry[] }> = ({ title, logs }) => (
        <div>
            <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
            <div className="max-h-60 overflow-y-auto pr-2">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-brand-text-secondary"><th className="p-2">Date</th><th className="p-2">Action</th><th className="p-2">Details</th></tr>
                    </thead>
                    <tbody>
                        {logs?.map(log => (
                            <tr key={log.id} className="border-b border-white/10 last:border-0"><td className="p-2 align-top">{new Date(log.date).toLocaleString()}</td><td className="p-2 align-top">{log.action}</td><td className="p-2 align-top">{log.details}</td></tr>
                        ))}
                    </tbody>
                </table>
                 {(!logs || logs.length === 0) && <p className="text-center text-brand-text-secondary p-8">No logs found.</p>}
            </div>
        </div>
    );
    return (
        <div className="space-y-8">
            <SectionTitle title="Account Logs" />
            <LogTable title="Login History" logs={user.loginHistory} />
            <LogTable title="Profile Update History" logs={user.updateHistory} />
        </div>
    );
};

const AccountActions: React.FC<{ user: UserData; showToast: (msg: string) => void; onLogout: () => void; }> = ({ user, showToast, onLogout }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleReset = () => {
        showToast("Account reset request submitted. Check your email.");
    };

    const handleDelete = async () => {
        await deleteUser(user.id);
        showToast("Account deleted successfully.");
        onLogout();
    };

    return (
        <div className="space-y-8">
            <SectionTitle title="Account Actions" />
            <div className="p-4 bg-yellow-500/10 border border-yellow-400/50 rounded-lg text-yellow-300">
                <p className="font-bold mb-2 flex items-center gap-2"><AlertTriangle/> Important Actions</p>
                <p className="text-sm">These actions are permanent and may result in data loss. Please proceed with caution.</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-brand-bg/30 rounded-lg">
                <div>
                    <h3 className="font-bold text-white">Request Account Reset</h3>
                    <p className="text-sm text-brand-text-secondary">This will send a reset link to your email. (Simulated)</p>
                </div>
                <ActionButton variant="secondary" onClick={handleReset} className="mt-4 md:mt-0">Request Reset</ActionButton>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-brand-bg/30 rounded-lg border border-red-500/50">
                <div>
                    <h3 className="font-bold text-red-400">Delete Account</h3>
                    <p className="text-sm text-brand-text-secondary">This will permanently delete your account and all associated data.</p>
                </div>
                <ActionButton variant="danger" onClick={() => setShowDeleteModal(true)} className="mt-4 md:mt-0">
                    <Trash2 size={16} className="inline mr-2" /> Delete Account
                </ActionButton>
            </div>
            <ConfirmationModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Permanently Delete Account?"
                message={`Are you sure you want to delete your account? All your data, including balance and transaction history, will be lost forever. This action cannot be undone.`}
                confirmText="Yes, Delete My Account"
                variant='danger'
            />
        </div>
    );
};


const ConfirmationModal: React.FC<{
    isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; variant?: 'primary' | 'danger';
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", variant = 'primary' }) => (
    <AnimatePresence>
    {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-brand-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
                 <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10"><X size={20} /></button>
                 <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                 <p className="text-brand-text-secondary mb-6">{message}</p>
                 <div className="flex justify-end gap-4">
                     <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
                     <ActionButton variant={variant} onClick={onConfirm}>{confirmText}</ActionButton>
                 </div>
            </motion.div>
        </motion.div>
    )}
    </AnimatePresence>
)

export default ProfilePage;