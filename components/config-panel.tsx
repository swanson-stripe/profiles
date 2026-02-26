'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Company, PaymentMethod, companies } from '@/lib/data';
import { CardLayout } from './payment-card';
import { GradientVariant } from './animated-gradient-bg';

export type DisplayMode = 'modal' | 'profiles';

type ConfigPanelProps = {
  amountInCents: number;
  onAmountChange: (amountInCents: number) => void;
  senderCompany: Company;
  onSenderCompanyChange: (company: Company) => void;
  receiverCompany: Company;
  onReceiverCompanyChange: (company: Company) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  layout: CardLayout;
  onLayoutChange: (layout: CardLayout) => void;
  display: DisplayMode;
  onDisplayChange: (display: DisplayMode) => void;
  gradientVariant: GradientVariant;
  onGradientVariantChange: (variant: GradientVariant) => void;
  onReset: () => void;
};

// Convert cents to formatted dollars display
function formatCentsAsDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ConfigPanel({
  amountInCents,
  onAmountChange,
  senderCompany,
  onSenderCompanyChange,
  receiverCompany,
  onReceiverCompanyChange,
  paymentMethod: _paymentMethod,
  onPaymentMethodChange: _onPaymentMethodChange,
  layout,
  onLayoutChange,
  display,
  onDisplayChange,
  gradientVariant,
  onGradientVariantChange,
  onReset,
}: ConfigPanelProps) {
  const [displayValue, setDisplayValue] = useState(formatCentsAsDollars(amountInCents));
  const [isMinimized, setIsMinimized] = useState(false);

  const layouts: CardLayout[] = ['company', 'payment'];
  const displays: { value: DisplayMode; label: string }[] = [
    { value: 'modal', label: 'Payment modal' },
    { value: 'profiles', label: 'Profiles page' },
  ];

  // Sync display value when parent amount changes
  useEffect(() => {
    setDisplayValue(formatCentsAsDollars(amountInCents));
  }, [amountInCents]);

  function handleAmountInput(value: string) {
    // Remove all non-digit characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');

    // Handle multiple decimal points - keep only the first
    const parts = cleaned.split('.');
    const formatted = parts.length > 1
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned;

    // Limit decimal places to 2
    const [integerPart, decimalPart] = formatted.split('.');
    const limitedDecimal = decimalPart ? decimalPart.substring(0, 2) : '';

    // Parse to get cents
    const dollars = parseFloat(integerPart || '0');
    const cents = limitedDecimal ? parseInt(limitedDecimal.padEnd(2, '0'), 10) : 0;
    const totalCents = dollars * 100 + cents;

    // Update parent state
    onAmountChange(totalCents);

    // Format for display with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const displayVal = decimalPart !== undefined
      ? `${formattedInteger}.${limitedDecimal}`
      : formattedInteger;

    setDisplayValue(displayVal);
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Panel container */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
        style={{ width: isMinimized ? 'fit-content' : '268px', originY: 0, originX: 0 }}
      >
        {/* Header — always visible */}
        <div
          className={`flex items-center justify-between px-4 py-3${isMinimized ? ' cursor-pointer' : ''}`}
          onClick={isMinimized ? () => setIsMinimized(false) : undefined}
        >
          <span className="text-sm font-semibold text-gray-700 select-none whitespace-nowrap">Configuration</span>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized((v) => !v); }}
            className="flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
          >
            {isMinimized ? (
              // Chevron down (expand)
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // Chevron up (minimize)
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Collapsible content */}
        <AnimatePresence initial={false}>
          {!isMinimized && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 flex flex-col gap-4 border-t border-gray-100">

                {/* Display Segmented Control */}
                <div className="flex flex-col gap-1.5 pt-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Surface</label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {displays.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => onDisplayChange(d.value)}
                        className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          display === d.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="amount" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Amount
                  </label>
                  <input
                    type="text"
                    id="amount"
                    value={displayValue}
                    onChange={(e) => handleAmountInput(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tabular-nums bg-white"
                  />
                </div>

                {/* Sender Company Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sender-company" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sender
                  </label>
                  <select
                    id="sender-company"
                    value={senderCompany.id}
                    onChange={(e) => {
                      const selected = companies.find((c) => c.id === e.target.value);
                      if (selected) onSenderCompanyChange(selected);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receiver Company Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="receiver-company" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Receiver
                  </label>
                  <select
                    id="receiver-company"
                    value={receiverCompany.id}
                    onChange={(e) => {
                      const selected = companies.find((c) => c.id === e.target.value);
                      if (selected) onReceiverCompanyChange(selected);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Layout Segmented Control */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {layouts.map((l) => (
                      <button
                        key={l}
                        onClick={() => onLayoutChange(l)}
                        className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          layout === l
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Segmented Control */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Background</label>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    {(['drift', 'pulse'] as GradientVariant[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => onGradientVariantChange(v)}
                        className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                          gradientVariant === v
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={onReset}
                  className="w-full px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mt-1"
                >
                  Reset
                </button>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
