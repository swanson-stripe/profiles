'use client';

import { Company, PaymentMethod, companies, paymentMethods } from '@/lib/data';
import { PaymentCard, CardLayout } from './payment-card';
import { SlidingNumber } from './sliding-number';
import { X, Send } from 'lucide-react';

type PaymentModalProps = {
  amount: number;
  onAmountChange: (amount: number) => void;
  company: Company;
  onCompanyChange: (company: Company) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  layout: CardLayout;
};

export function PaymentModal({
  amount,
  onAmountChange,
  company,
  onCompanyChange,
  paymentMethod,
  onPaymentMethodChange,
  layout,
}: PaymentModalProps) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[85vh] flex overflow-hidden">
      {/* Left Side - Inputs */}
      <div className="flex-1 flex flex-col p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6" />
            <h1 className="text-2xl font-bold text-gray-900">Send</h1>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Amount Display */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900 tabular-nums">
              $<SlidingNumber value={amount} />
            </span>
            <span className="text-2xl font-semibold text-gray-600">
              {paymentMethod.displayName}
            </span>
          </div>
        </div>

        {/* From Section */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            From
          </label>
          <select
            value={paymentMethod.id}
            onChange={(e) => {
              const selected = paymentMethods.find((p) => p.id === e.target.value);
              if (selected) onPaymentMethodChange(selected);
            }}
            className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
          >
            {paymentMethods.map((p) => (
              <option key={p.id} value={p.id}>
                Main • {p.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* To Section */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            To
          </label>
          <select
            value={company.id}
            onChange={(e) => {
              const selected = companies.find((c) => c.id === e.target.value);
              if (selected) onCompanyChange(selected);
            }}
            className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}, Inc.
              </option>
            ))}
          </select>
        </div>

        {/* Method Section */}
        <div className="mb-auto">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Method
          </label>
          <div className="px-4 py-4 border border-gray-200 rounded-xl bg-gray-50">
            <div className="text-base font-medium text-gray-900">Stripe Network</div>
            <div className="text-sm text-gray-600">Arrives instantly • Free</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors">
            Review
          </button>
        </div>
      </div>

      {/* Right Side - Card Preview */}
      <div className="w-[45%] bg-gradient-to-br from-teal-100 via-amber-100 to-rose-100 flex items-center justify-center p-8">
        <PaymentCard
          company={company}
          paymentMethod={paymentMethod}
          amount={amount}
          layout={layout}
        />
      </div>
    </div>
  );
}
