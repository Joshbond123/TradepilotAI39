

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  country?: string;
  plan: string;
  balance: number;
  totalProfit: number;
  hasSeenWelcome: boolean;
  registrationDate?: string;
  notificationPermission?: 'granted' | 'denied' | 'default';
  isVerified: boolean;
}

export interface Transaction {
  id:string;
  type: 'Deposit' | 'Withdrawal' | 'Profit' | 'Investment';
  amount: number;
  date: string;
  status: 'Pending' | 'Confirmed' | 'Failed';
  asset: string;
  fee?: number;
  txid?: string;
  usdValue?: number;
}

export interface AdminTransaction extends Transaction {
  userId: string;
  userName: string;
}

export interface Plan {
    name: string;
    price: string;
    features: string[];
    isCurrent: boolean;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface ReferralData {
    count: number;
    earnings: number;
    link: string;
}

export interface ActivePlan {
    name: string;
    investment: number;
    dailyReturn: number;
    duration: number;
    activationDate?: string;
    isActive: boolean;
    lastProfitDate?: string;
}

export interface LoginSession {
  id: string;
  loggedInAt: string;
  device: string; // e.g., "Chrome on Windows"
  ipAddress: string; // e.g., "192.168.1.1" (simulated)
  isCurrent: boolean;
}

export interface LogEntry {
  id: string;
  date: string;
  action: string;
  details: string;
}

export interface NotificationPreferences {
  email: {
    profitAlerts: boolean;
    systemAlerts: boolean;
    inboxMessages: boolean;
  };
  push: {
    profitAlerts: boolean;
    systemAlerts: boolean;
    inboxMessages: boolean;
  }
}

export interface UserData extends User {
    transactions: Transaction[];
    referrals: ReferralData;
    activePlan?: ActivePlan;
    sessions: LoginSession[];
    loginHistory: LogEntry[];
    updateHistory: LogEntry[];
    notificationPreferences: NotificationPreferences;
    verificationCode?: string;
    verificationCodeExpires?: string;
}

export interface SystemSettings {
    siteName: string;
    description: string;
    logoUrl: string;
    maintenanceMode: boolean;
    recaptchaEnabled: boolean;
    recaptchaSiteKey?: string;
    recaptchaSecretKey?: string;
}

export interface PublicSystemSettings {
    siteName: string;
    description: string;
    logoUrl: string;
    maintenanceMode: boolean;
    recaptchaEnabled: boolean;
    recaptchaSiteKey?: string;
}

export interface Wallet {
    name: string;
    symbol: string;
    address: string;
    qrCodeUrl: string;
    network: string;
    minDeposit?: number;
    minWithdrawal?: number;
    withdrawalFee?: number;
}

export interface WalletConfig {
    [key: string]: Wallet;
}

export interface Message {
  id: string;
  title: string;
  text: string;
  imageUrl?: string; // base64 encoded
  videoUrl?: string; // base64 encoded
  createdAt: string;
  recipientId?: string; // If undefined, it's a broadcast message
}

export interface WelcomePageTemplate {
  title: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface WelcomeInboxMessageTemplate {
  title: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface Testimonial {
    id: string;
    name?: string;
    email?: string;
    text: string;
    rating: number;
    createdAt: string;
    adminReply?: string;
    adminReplyAt?: string;
}


// --- Chatbot Types ---

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ApiKeyStatus = 'active' | 'failed' | 'rate-limited';

export interface ApiKeyStats {
  key: string;
  status: ApiKeyStatus;
  usageCount: number;
  lastUsed: string | null;
}

export interface ChatbotSettings {
  personality: string;
  apiKeys: ApiKeyStats[];
  iconText: string;
}