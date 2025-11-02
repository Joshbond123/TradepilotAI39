import { User, UserData, Transaction, AdminTransaction, SystemSettings, PublicSystemSettings, WalletConfig, ActivePlan, Message, WelcomePageTemplate, WelcomeInboxMessageTemplate, LoginSession, LogEntry, ChatbotSettings, Testimonial } from '../types';

const API_BASE_URL = '/api/storage';

const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);
        
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'API call failed');
        }
        
        return result.data;
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
};

export const uploadMedia = async (type: 'welcome_page' | 'welcome_inbox', mediaType: 'image' | 'video', base64Data: string): Promise<string> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);
        
        const response = await fetch(`${API_BASE_URL}/upload-media`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({ type, mediaType, data: base64Data }),
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Media upload failed');
        }
        
        return result.url;
    } catch (error) {
        console.error('Failed to upload media:', error);
        throw error;
    }
};

export const findUserByEmailOrName = async (identifier: string): Promise<UserData | null> => {
    try {
        const users: UserData[] = await apiCall('/users');
        const user = users.find(u => 
            u.email.toLowerCase() === identifier.toLowerCase() || 
            u.name.toLowerCase() === identifier.toLowerCase()
        );
        return user || null;
    } catch (error) {
        console.error("Failed to find user:", error);
        return null;
    }
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
    try {
        return await apiCall(`/users/${userId}`);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return null;
        }
        console.error("Failed to get user data:", error);
        return null;
    }
};

export const saveUserData = async (userData: UserData): Promise<void> => {
    try {
        await apiCall(`/users/${userData.id}`, 'POST', userData);
    } catch (error) {
        console.error("Failed to save user data:", error);
        throw error;
    }
};

export const createInitialUserData = async (user: User): Promise<UserData> => {
    const existingData = await getUserData(user.id);
    if (existingData) {
        return existingData;
    }

    const initialData: UserData = {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        plan: user.plan,
        balance: user.balance,
        totalProfit: user.totalProfit,
        hasSeenWelcome: user.hasSeenWelcome,
        registrationDate: new Date().toISOString(),
        isVerified: true,
        transactions: [],
        referrals: {
            count: 0,
            earnings: 0,
            link: `${window.location.origin}/ref/${user.name.toLowerCase().replace(/\s/g, '')}${user.id.slice(-4)}`,
        },
        activePlan: undefined,
        sessions: [],
        loginHistory: [],
        updateHistory: [],
        notificationPreferences: {
            email: { profitAlerts: true, systemAlerts: true, inboxMessages: true },
            push: { profitAlerts: true, systemAlerts: true, inboxMessages: true },
        },
    };
    await saveUserData(initialData);

    try {
        const welcomeTemplate = await getWelcomeInboxMessageTemplate();
        const welcomeMessage: Message = {
            id: `msg-welcome-${user.id}-${Date.now()}`,
            ...welcomeTemplate,
            createdAt: new Date().toISOString(),
            recipientId: user.id,
        };
        const allMessages = await getMessages();
        allMessages.unshift(welcomeMessage);
        await saveMessages(allMessages);
    } catch (error) {
        console.error("Failed to create welcome message for new user:", error);
    }

    return initialData;
};

export const addTransaction = async (
    userId: string, 
    transactionData: Omit<Transaction, 'id' | 'date' | 'status'>
): Promise<UserData | null> => {
    const userData = await getUserData(userId);
    if (!userData) return null;

    const newTransaction: Transaction = {
        ...transactionData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        status: transactionData.type === 'Withdrawal' ? 'Pending' : 'Confirmed'
    };
    
    let newBalance = userData.balance;
    if(newTransaction.type === 'Deposit') {
        newBalance += (newTransaction.usdValue || newTransaction.amount);
    } else if (newTransaction.type === 'Withdrawal') {
        if (newBalance < newTransaction.amount) {
            console.error('Insufficient funds for withdrawal');
            return null;
        }
        newBalance -= newTransaction.amount;
    }

    userData.transactions.push(newTransaction);
    userData.balance = newBalance;
    
    await saveUserData(userData);
    return userData;
};

export const recordProfitAndUpdateDate = async (userId: string, profitAmount: number): Promise<UserData | null> => {
    const userData = await getUserData(userId);
    if (!userData || !userData.activePlan || !userData.activePlan.isActive) return null;

    const newTransaction: Transaction = {
        id: `tx-profit-${Date.now()}`,
        type: 'Profit',
        amount: profitAmount,
        date: new Date().toISOString(),
        status: 'Confirmed',
        asset: 'USD',
        usdValue: profitAmount,
    };

    userData.balance += profitAmount;
    userData.totalProfit += profitAmount;
    userData.transactions.push(newTransaction);
    if(userData.activePlan){
        userData.activePlan.lastProfitDate = new Date().toISOString();
    }

    await saveUserData(userData);
    return userData;
};

export const investInPlan = async (userId: string, plan: { name: string, duration: number, dailyReturn: number }, investment: number): Promise<UserData | null> => {
    const userData = await getUserData(userId);
    if (!userData || userData.balance < investment) return null;

    userData.balance -= investment;

    const newPlan: ActivePlan = {
        name: plan.name,
        investment: investment,
        dailyReturn: plan.dailyReturn,
        duration: plan.duration,
        isActive: false,
    };

    const newTransaction: Transaction = {
        id: `tx-invest-${Date.now()}`,
        type: 'Investment',
        amount: investment,
        date: new Date().toISOString(),
        status: 'Confirmed',
        asset: 'USD',
        usdValue: investment,
    };
    
    userData.activePlan = newPlan;
    userData.transactions.push(newTransaction);

    await saveUserData(userData);
    return userData;
};

export const activatePlan = async (userId: string): Promise<UserData | null> => {
    const userData = await getUserData(userId);
    if (!userData || !userData.activePlan) return null;

    const now = new Date().toISOString();
    userData.activePlan.isActive = true;
    userData.activePlan.activationDate = now;
    userData.activePlan.lastProfitDate = now;

    await saveUserData(userData);
    return userData;
};

const logProfileUpdate = (userData: UserData, updates: Partial<UserData>): UserData => {
    const changes: string[] = [];
    if ('name' in updates && updates.name !== userData.name) changes.push(`name to "${updates.name}"`);
    if ('email' in updates && updates.email !== userData.email) changes.push(`email to "${updates.email}"`);
    if ('country' in updates && updates.country !== userData.country) changes.push(`country to "${updates.country}"`);
    if ('password' in updates && updates.password) changes.push('password');
    if ('notificationPreferences' in updates) changes.push('notification preferences');

    if(changes.length > 0) {
        const updateLog: LogEntry = {
            id: `log-update-${Date.now()}`,
            date: new Date().toISOString(),
            action: 'Profile Update',
            details: `Changed ${changes.join(', ')}.`,
        };
        userData.updateHistory.unshift(updateLog);
        if (userData.updateHistory.length > 10) {
            userData.updateHistory.pop();
        }
    }
    return userData;
}

export const updateUserData = async (userId: string, updates: Partial<UserData>): Promise<UserData | null> => {
    let userData = await getUserData(userId);
    if (!userData) return null;

    userData = logProfileUpdate(userData, updates);
    
    const updatedData = { ...userData, ...updates };
    await saveUserData(updatedData);
    return updatedData;
};

const getDeviceString = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident")) browser = "Internet Explorer";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    
    let os = "Unknown OS";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("like Mac")) os = "iOS";

    return `${browser} on ${os}`;
};

export const logLogin = async (userId: string): Promise<UserData | null> => {
    const userData = await getUserData(userId);
    if (!userData) return null;

    userData.sessions = userData.sessions?.map(s => ({ ...s, isCurrent: false })) || [];
    
    const newSession: LoginSession = {
        id: `session-${Date.now()}`,
        loggedInAt: new Date().toISOString(),
        device: getDeviceString(),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        isCurrent: true,
    };
    userData.sessions.push(newSession);
    if(userData.sessions.length > 5) {
        userData.sessions.shift();
    }

    const loginLog: LogEntry = {
        id: `log-${Date.now()}`,
        date: new Date().toISOString(),
        action: 'Login',
        details: `Logged in from ${newSession.device} (IP: ${newSession.ipAddress})`,
    };
    userData.loginHistory.unshift(loginLog);
    if (userData.loginHistory.length > 10) {
        userData.loginHistory.pop();
    }

    await saveUserData(userData);
    return userData;
};

export const logoutAllSessions = async (userId: string): Promise<void> => {
    const userData = await getUserData(userId);
    if (userData) {
      userData.sessions = [];
      await saveUserData(userData);
    }
};

export const getAllUsersData = async (): Promise<UserData[]> => {
    try {
        return await apiCall('/users');
    } catch (error) {
        console.error("Failed to get all users:", error);
        return [];
    }
};

export const getAllTransactions = async (): Promise<AdminTransaction[]> => {
    const users = await getAllUsersData();
    const transactions: AdminTransaction[] = [];
    users.forEach(user => {
        user.transactions.forEach(tx => {
            transactions.push({
                ...tx,
                userId: user.id,
                userName: user.name,
            });
        });
    });
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        await apiCall(`/users/${userId}`, 'DELETE');
    } catch (error) {
        console.error(`Failed to delete user ${userId}:`, error);
        throw error;
    }
};

export const adminAddBalance = async (userId: string, amount: number, asset: string): Promise<UserData | null> => {
    return addTransaction(userId, {
        type: 'Deposit',
        amount: amount,
        asset: asset,
        usdValue: amount,
    });
};

export const updateTransactionStatus = async (userId: string, txId: string, status: 'Confirmed' | 'Failed'): Promise<UserData | null> => {
    const userData = await getUserData(userId);
    if (!userData) return null;

    const txIndex = userData.transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) return null;
    
    const transaction = userData.transactions[txIndex];
    
    if (transaction.type === 'Withdrawal' && transaction.status === 'Pending' && status === 'Failed') {
        userData.balance += transaction.amount;
    }

    userData.transactions[txIndex].status = status;
    await saveUserData(userData);
    return userData;
};

const DEFAULT_WALLET_CONFIG: WalletConfig = {
    BTC: { name: 'Bitcoin', symbol: 'BTC', network: 'Bitcoin (BTC)', address: 'bc1q60j2ze3t8jxvqlcar8c7h9mtmelqx7uprznhzy', qrCodeUrl: '', minDeposit: 0.0001, minWithdrawal: 0.0005, withdrawalFee: 0.0002 },
    ETH: { name: 'Ethereum', symbol: 'ETH', network: 'Ethereum (ERC20)', address: '0x8419B4226a55DE67b45Fcbf2a277FB7e75451E07', qrCodeUrl: '', minDeposit: 0.01, minWithdrawal: 0.01, withdrawalFee: 0.005 },
    USDT: { name: 'Tether', symbol: 'USDT', network: 'Tron (TRC20)', address: 'TU1bdYyAT95QvNG9v869LKUZWdb9FP3NCk', qrCodeUrl: '', minDeposit: 10, minWithdrawal: 20, withdrawalFee: 1 },
};

export const getWalletConfig = async (): Promise<WalletConfig> => {
    try {
        const settings = await apiCall('/settings');
        return settings.walletConfig || DEFAULT_WALLET_CONFIG;
    } catch (error) {
        console.error("Failed to get wallet config:", error);
        return DEFAULT_WALLET_CONFIG;
    }
};

export const saveWalletConfig = async (config: WalletConfig): Promise<void> => {
    try {
        const settings = await apiCall('/settings');
        settings.walletConfig = config;
        await apiCall('/settings', 'POST', settings);
    } catch (error) {
        console.error("Failed to save wallet config:", error);
        throw error;
    }
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    siteName: 'TradePilot AI',
    description: 'The future of automated crypto arbitrage.',
    logoUrl: '',
    maintenanceMode: false,
    recaptchaEnabled: false,
    recaptchaSiteKey: '',
    recaptchaSecretKey: '',
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
    try {
        const settings = await apiCall('/settings');
        return settings.systemSettings || DEFAULT_SYSTEM_SETTINGS;
    } catch (error) {
        console.error("Failed to get system settings:", error);
        return DEFAULT_SYSTEM_SETTINGS;
    }
};

export const getPublicSystemSettings = async (): Promise<PublicSystemSettings> => {
    const settings = await getSystemSettings();
    const { recaptchaSecretKey, ...publicSettings } = settings;
    return publicSettings;
};

export const saveSystemSettings = async (settings: SystemSettings): Promise<void> => {
    try {
        const allSettings = await apiCall('/settings');
        allSettings.systemSettings = settings;
        await apiCall('/settings', 'POST', allSettings);
    } catch (error) {
        console.error("Failed to save system settings:", error);
        throw error;
    }
};

export const sendVerificationEmail = async (userEmail: string, code: string): Promise<void> => {
    try {
        const response = await fetch('/api/send-verification-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userEmail, code }),
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to send verification email');
        }
    } catch (error) {
        throw error;
    }
};

export const verifyUserCode = async (userId: string, code: string): Promise<boolean> => {
    const userData = await getUserData(userId);
    if (!userData || !userData.verificationCode || !userData.verificationCodeExpires) {
        return false;
    }
    
    const isExpired = new Date() > new Date(userData.verificationCodeExpires);
    if (isExpired) {
        userData.verificationCode = undefined;
        userData.verificationCodeExpires = undefined;
        await saveUserData(userData);
        return false;
    }
    
    if (userData.verificationCode === code) {
        userData.isVerified = true;
        userData.verificationCode = undefined;
        userData.verificationCodeExpires = undefined;
        await saveUserData(userData);
        return true;
    }
    
    return false;
};

export const resendVerificationCode = async (userId: string): Promise<{ success: boolean; message: string }> => {
    const userData = await getUserData(userId);
    if (!userData) return { success: false, message: 'User not found.' };

    const newCode = Math.floor(10000 + Math.random() * 90000).toString();
    const newExpires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    userData.verificationCode = newCode;
    userData.verificationCodeExpires = newExpires;
    
    await saveUserData(userData);
    await sendVerificationEmail(userData.email, newCode);
    
    return { success: true, message: 'A new verification code has been sent.' };
};

const DEFAULT_WELCOME_PAGE_TEMPLATE: WelcomePageTemplate = {
    title: '🎉 Welcome to TradePilot AI!',
    text: `Your account is ready and the future of automated trading is at your fingertips.

We're thrilled to have you onboard. Please check your inbox for a quick start guide and important information about your new account.

Let's start your journey to passive income!`,
    imageUrl: ""
};

export const getWelcomePageTemplate = async (): Promise<WelcomePageTemplate> => {
    try {
        const settings = await apiCall('/settings');
        return settings.welcomePageTemplate || DEFAULT_WELCOME_PAGE_TEMPLATE;
    } catch (error) {
        console.error("Failed to get welcome page template:", error);
        return DEFAULT_WELCOME_PAGE_TEMPLATE;
    }
};

export const saveWelcomePageTemplate = async (template: WelcomePageTemplate): Promise<void> => {
    try {
        const settings = await apiCall('/settings');
        settings.welcomePageTemplate = template;
        await apiCall('/settings', 'POST', settings);
    } catch (error) {
        console.error("Failed to save welcome page template:", error);
        throw error;
    }
};

const DEFAULT_WELCOME_INBOX_TEMPLATE: WelcomeInboxMessageTemplate = {
    title: '🚀 Your Trading Journey Begins Now!',
    text: `Hello and welcome to TradePilot AI!

We are excited to have you with us. Your account has been successfully created.

Here are a few quick steps to get started:
1.  **Fund Your Account:** Go to the 'Deposit' section to add funds.
2.  **Choose Your AI:** Visit the 'AI Trading Plans' to select and activate your bot.
3.  **Watch it Grow:** Monitor your progress from your dashboard.

If you have any questions, our support team is ready to assist you.

Happy trading!
- The TradePilot AI Team`,
    imageUrl: '',
    videoUrl: '',
};

export const getWelcomeInboxMessageTemplate = async (): Promise<WelcomeInboxMessageTemplate> => {
    try {
        const settings = await apiCall('/settings');
        return settings.welcomeInboxTemplate || DEFAULT_WELCOME_INBOX_TEMPLATE;
    } catch (error) {
        console.error("Failed to get welcome inbox message template:", error);
        return DEFAULT_WELCOME_INBOX_TEMPLATE;
    }
};

export const saveWelcomeInboxMessageTemplate = async (template: WelcomeInboxMessageTemplate): Promise<void> => {
    try {
        const settings = await apiCall('/settings');
        settings.welcomeInboxTemplate = template;
        await apiCall('/settings', 'POST', settings);
    } catch (error) {
        console.error("Failed to save welcome inbox message template:", error);
        throw error;
    }
};

export const getMessages = async (): Promise<Message[]> => {
    try {
        return await apiCall('/messages');
    } catch (error) {
        console.error("Failed to get messages:", error);
        return [];
    }
};

export const saveMessages = async (messages: Message[]): Promise<void> => {
    try {
        await apiCall('/messages', 'POST', messages);
    } catch (error) {
        console.error("Failed to save messages:", error);
        throw error;
    }
};

export const addMessage = async (newMessageData: Omit<Message, 'id' | 'createdAt'>): Promise<Message> => {
    const messages = await getMessages();
    const newMessage: Message = {
        ...newMessageData,
        id: `msg-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    messages.unshift(newMessage);
    await saveMessages(messages);
    return newMessage;
};

export const updateMessage = async (messageId: string, updates: Partial<Message>): Promise<Message | null> => {
    const messages = await getMessages();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return null;

    messages[messageIndex] = { ...messages[messageIndex], ...updates };
    await saveMessages(messages);
    return messages[messageIndex];
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
    let messages = await getMessages();
    const initialLength = messages.length;
    messages = messages.filter(m => m.id !== messageId);
    if (messages.length < initialLength) {
        await saveMessages(messages);
        return true;
    }
    return false;
};

const seedTestimonials = async () => {
    const names = [
        "Liam Johnson", "Olivia Smith", "Noah Williams", "Emma Jones", "Oliver Brown",
        "Ava Davis", "Elijah Miller", "Charlotte Wilson", "James Moore", "Sophia Taylor",
        "William Anderson", "Isabella Thomas", "Henry Jackson", "Mia White", "Lucas Harris",
        "Amelia Martin", "Benjamin Thompson", "Harper Garcia", "Theodore Martinez", "Evelyn Robinson",
        "Alexander Clark", "Abigail Rodriguez", "Daniel Lewis", "Emily Lee", "Matthew Walker",
        "Elizabeth Hall", "Joseph Allen", "Sofia Young", "David Hernandez", "Avery King",
        "Samuel Wright", "Ella Lopez", "John Hill", "Grace Scott", "Robert Green"
    ];

    const fullReviews = [
        "Honestly, I was skeptical at first. But after three months of using TradePilot, I'm genuinely impressed. The bot found opportunities I never would have spotted manually, and my portfolio has grown consistently. The interface is clean and doesn't overwhelm you with unnecessary data. Highly recommend giving it a shot!",
        "This platform changed my approach to crypto entirely. I used to spend hours analyzing charts and still missed most arbitrage windows. Now the AI handles everything while I focus on my day job. The returns aren't crazy overnight gains, but they're steady and reliable, which is exactly what I wanted.",
        "Been trading crypto for years, tried several bots before this one. TradePilot is different - the execution speed is incredible and I can actually see each trade happening in real-time. No black box nonsense. Started with a small amount to test, now I've significantly increased my investment.",
        "As someone who works full-time and has a family, I needed something automated that actually works. TradePilot delivers. Set it up in under 10 minutes, and it's been running smoothly for months. The profits aren't huge every day, but they add up fast. Worth every penny.",
        "The transparency here is what won me over. You can literally track every single trade the AI makes, see the profit margins, understand the strategy. It's not just a magic money printer - it's a sophisticated tool that you can learn from. My only regret? Not starting sooner."
    ];

    const adminReplies = [
        "Thank you for sharing your experience! We're thrilled the platform is working well for you.",
        "We really appreciate your detailed feedback! Stories like yours make all our hard work worthwhile.",
        "That's wonderful to hear! We're committed to delivering consistent results for all our users.",
        "Thanks for the kind words! We're glad our technology is making a real difference in your portfolio.",
        "Your success is our success! Thank you for being part of the TradePilot AI community."
    ];

    const randomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    const testimonials: Testimonial[] = [];
    
    for (let i = 0; i < 5; i++) {
        const hasAdminReply = Math.random() < 0.3;
        const reviewDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        const testimonial: Testimonial = {
            id: `rev-${reviewDate.getTime()}-${i}`,
            name: randomElement(names),
            text: fullReviews[i],
            rating: Math.random() < 0.7 ? 5 : 4,
            createdAt: reviewDate.toISOString(),
            adminReply: hasAdminReply ? randomElement(adminReplies) : undefined,
            adminReplyAt: hasAdminReply ? new Date(reviewDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        };
        testimonials.push(testimonial);
    }
    await saveTestimonials(testimonials);
    return testimonials;
};

export const getTestimonials = async (): Promise<Testimonial[]> => {
    try {
        const settings = await apiCall('/settings');
        if (settings.testimonials && settings.testimonials.length > 0) {
            return settings.testimonials.sort((a: Testimonial, b: Testimonial) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return await seedTestimonials();
    } catch (error) {
        console.error("Failed to get testimonials:", error);
        return [];
    }
};

export const saveTestimonials = async (testimonials: Testimonial[]): Promise<void> => {
    try {
        const settings = await apiCall('/settings');
        settings.testimonials = testimonials;
        await apiCall('/settings', 'POST', settings);
    } catch (error) {
        console.error("Failed to save testimonials:", error);
        throw error;
    }
};

export const addTestimonial = async (testimonialData: Omit<Testimonial, 'id' | 'createdAt'>): Promise<Testimonial> => {
    const testimonials = await getTestimonials();
    const newTestimonial: Testimonial = {
        ...testimonialData,
        id: `rev-user-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    testimonials.unshift(newTestimonial);
    await saveTestimonials(testimonials);
    return newTestimonial;
};

export const updateTestimonial = async (testimonialId: string, updates: Partial<Testimonial>): Promise<Testimonial | null> => {
    const testimonials = await getTestimonials();
    const index = testimonials.findIndex(t => t.id === testimonialId);
    if (index === -1) return null;
    
    if('adminReply' in updates) {
        updates.adminReplyAt = new Date().toISOString();
    }

    testimonials[index] = { ...testimonials[index], ...updates };
    await saveTestimonials(testimonials);
    return testimonials[index];
};

export const deleteTestimonial = async (testimonialId: string): Promise<boolean> => {
    let testimonials = await getTestimonials();
    const initialLength = testimonials.length;
    testimonials = testimonials.filter(t => t.id !== testimonialId);
    if (testimonials.length < initialLength) {
        await saveTestimonials(testimonials);
        return true;
    }
    return false;
};

export const updateUserNotificationPermission = async (userId: string, permission: 'granted' | 'denied' | 'default'): Promise<UserData | null> => {
    const userData = await getUserData(userId);
    if (!userData) return null;

    userData.notificationPermission = permission;
    await saveUserData(userData);
    return userData;
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }
    
    const permission = await Notification.requestPermission();
    return permission;
};

const DEFAULT_CEREBRAS_KEYS: string[] = [
    'csk-fj5hkkykwtnnttrxj35nvrx5498drpnpjvwhr2yet36k6mte',
    'csk-pddjmh5wfv25dpwj6fxxn9kmmr26dcp55w29vv9rhx2xxdfr',
    'csk-k5mmn46rfjd6vhkxdwh69d3rxejhp86f9mxd2f39jrjkr33p'
];

const DEFAULT_CHATBOT_SETTINGS: ChatbotSettings = {
    personality: "You are TradePilot AI, a friendly and professional crypto trading assistant. You are knowledgeable about cryptocurrency, arbitrage, and the features of the TradePilot AI platform. Keep your answers concise, helpful, and optimistic. Do not give financial advice. Always promote the platform's features when relevant.",
    apiKeys: DEFAULT_CEREBRAS_KEYS.map(key => ({
        key,
        status: 'active',
        usageCount: 0,
        lastUsed: null,
    })),
    iconText: 'TradePilot AI'
};

export const getChatbotSettings = async (): Promise<ChatbotSettings> => {
    try {
        const settings = await apiCall('/settings');
        if (settings.chatbotSettings && Array.isArray(settings.chatbotSettings.apiKeys)) {
            return settings.chatbotSettings;
        }
        await saveChatbotSettings(DEFAULT_CHATBOT_SETTINGS);
        return DEFAULT_CHATBOT_SETTINGS;
    } catch (error) {
        console.error("Failed to get chatbot settings:", error);
        return DEFAULT_CHATBOT_SETTINGS;
    }
};

export const saveChatbotSettings = async (settings: ChatbotSettings): Promise<void> => {
    try {
        const allSettings = await apiCall('/settings');
        allSettings.chatbotSettings = settings;
        await apiCall('/settings', 'POST', allSettings);
    } catch (error) {
        console.error("Failed to save chatbot settings:", error);
        throw error;
    }
};
