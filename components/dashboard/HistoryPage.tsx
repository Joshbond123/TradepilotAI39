
import React from 'react';
import { Transaction } from '../../types';
import DashboardPageLayout, { InteractiveCard } from './DashboardPageLayout';
import { LineChart as HistoryIcon } from 'lucide-react';

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const HistoryPage: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => (
    <DashboardPageLayout title="Transaction History" icon={<HistoryIcon size={28} />}>
        <InteractiveCard className="p-4 sm:p-6">
            {transactions.length === 0 ? (<p className="text-center text-brand-text-secondary py-12">No transactions yet.</p>) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead>
                        <tr className="border-b border-white/10 text-brand-text-secondary">
                            <th className="p-4">Type</th> <th className="p-4">Amount</th> <th className="p-4">Asset</th> <th className="p-4">Date</th> <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                            <tr key={tx.id} className="border-b border-white/10 last:border-b-0">
                                <td className="p-4">{tx.type}</td>
                                <td className={`p-4 font-mono ${tx.type === 'Deposit' || tx.type === 'Profit' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'Deposit' || tx.type === 'Profit' ? '+' : '-'}{formatCurrency(tx.usdValue || tx.amount)}</td>
                                <td className="p-4">{tx.asset}</td>
                                <td className="p-4 text-sm">{new Date(tx.date).toLocaleString()}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${tx.status === 'Confirmed' ? 'bg-green-500/20 text-green-400' : tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{tx.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </InteractiveCard>
    </DashboardPageLayout>
);

export default HistoryPage;
