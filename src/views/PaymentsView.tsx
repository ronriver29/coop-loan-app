import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, History, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Payment } from '../types';

export default function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setPayments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPayments([]);
        setLoading(false);
      });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-natural-ink">Financial Disbursements</h2>
          <p className="text-gray-500">Historical record of all fund movements and amortizations.</p>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-natural-line overflow-hidden">
        <div className="p-6 border-b border-natural-line flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-natural-ink flex items-center gap-2 uppercase text-xs tracking-widest">
            <History className="h-4 w-4 text-natural-sage" />
            Disbursement Ledger
          </h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-serif italic">Loading ledger...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 bg-natural-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-natural-line" />
            </div>
            <p className="text-gray-500 font-serif italic">No disbursement records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-natural-line">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-natural-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-natural-ink">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 uppercase tracking-widest text-[10px] font-bold text-gray-500">
                      Amortization
                    </td>
                    <td className="px-6 py-4 font-bold text-natural-ink italic font-serif">
                      ₱{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        Remitted
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] text-gray-400 font-mono">#{payment._id.slice(-8).toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
}
