import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, History, ArrowRight, CheckCircle2, Filter } from 'lucide-react';
import { Payment } from '../types';

import LoadingScreen from '../components/LoadingScreen';

export default function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments', { credentials: 'include' })
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

  if (loading) return <LoadingScreen />;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black text-natural-ink tracking-tight">Disbursement Registry</h2>
          <p className="text-slate-500 text-sm lg:text-base font-medium opacity-80 mt-1">Official ledger of executed fund movements and active liabilities.</p>
        </div>
      </motion.div>

      <motion.section variants={item} className="organic-card overflow-hidden">
        <div className="px-6 lg:px-10 py-6 lg:py-8 border-b border-natural-line flex items-center justify-between bg-[#FCFCFA]">
           <button className="flex items-center gap-3 text-xs lg:text-sm font-bold uppercase tracking-[0.2em] text-natural-ink">
             <Filter className="h-4 w-4 text-natural-sage" />
             Ledger Filters
           </button>
           <p className="text-[10px] hidden sm:block opacity-40 uppercase font-bold tracking-widest">System Time: {new Date().toLocaleDateString()}</p>
        </div>
        
        {payments.length === 0 ? (
          <div className="p-20 text-center">
            <div className="h-20 w-20 bg-natural-bg rounded-full flex items-center justify-center mx-auto mb-6 border border-natural-line">
              <Wallet className="h-10 w-10 text-natural-line" />
            </div>
            <p className="text-slate-500 font-medium text-lg">No disbursement records found in the registry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFCFA] border-b border-natural-line">
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Maturity Date</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Product Class</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Capital Value</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500">Compliance</th>
                  <th className="px-6 lg:px-10 py-5 text-micro font-medium normal-case text-slate-500 text-right">Serial Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-line">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-natural-bg/40 transition-colors group">
                    <td className="px-6 lg:px-10 py-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-natural-ink">{new Date(payment.datePaid).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </td>
                    <td className="px-6 lg:px-10 py-6 text-[9px] lg:text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                      Amortization
                    </td>
                    <td className="px-6 lg:px-10 py-6 text-base lg:text-lg font-black text-natural-ink font-display underline decoration-natural-sage/20 whitespace-nowrap">
                      ₱{payment.amountPaid.toLocaleString()}
                    </td>
                    <td className="px-6 lg:px-10 py-6">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 w-fit whitespace-nowrap">
                        <CheckCircle2 className="h-3 w-3" />
                        SETTLED
                      </span>
                    </td>
                    <td className="px-6 lg:px-10 py-6 text-right">
                      <span className="text-[10px] text-slate-300 font-mono">#{payment._id.slice(-8).toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
