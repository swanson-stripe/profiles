'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Company, PaymentMethod, companies, paymentMethods } from '@/lib/data';
import { PaymentCard, CardLayout, SendingState } from './payment-card';
import { SlidingNumber } from './sliding-number';
import { Send, X, ArrowLeftRight, Globe, ArrowDownToLine, CreditCard, ReceiptText, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { AnimatedGradientBg, GradientVariant } from './animated-gradient-bg';
import { GlowEffect } from './motion-primitives/glow-effect';
import { Squircle, useSquircle } from './squircle';

type FlowState = 'select' | 'review' | 'sending' | 'sent';
type CardAnimationState = 'full' | 'sending' | 'minimal' | 'complete';

type PaymentFlowProps = {
  amountInCents: number;
  onAmountChange: (amountInCents: number) => void;
  senderCompany: Company;
  onSenderCompanyChange: (company: Company) => void;
  receiverCompany: Company;
  onReceiverCompanyChange: (company: Company) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  layout: CardLayout;
  isModal?: boolean;
  gradientVariant: GradientVariant;
};

type MethodTypeOption = { value: string; label: string; subtitle: string; iconPath: string | null; deliveryText: string; transferText: string };
const methodTypeOptions: MethodTypeOption[] = [
  { value: 'stripe-network', label: 'Stripe Network', subtitle: 'Arrives instantly · Free', iconPath: '/img/logo-24-stripe.svg', deliveryText: 'Receiving instantly', transferText: 'Funds will transfer instantly.' },
  { value: 'direct-bank', label: 'Direct Bank Transfer', subtitle: '1–3 business days · Free', iconPath: '/img/method-32-bank.svg', deliveryText: '1–3 business days', transferText: 'Funds will arrive in 1–3 business days.' },
  { value: 'link', label: 'Link', subtitle: 'Arrives instantly · Free', iconPath: '/img/method-32-link.svg', deliveryText: 'Receiving instantly', transferText: 'Funds will transfer instantly.' },
  { value: 'stablecoin', label: 'Stablecoin', subtitle: 'Arrives instantly · Fee varies', iconPath: '/img/method-32-stablecoin.svg', deliveryText: 'Receiving instantly', transferText: 'Funds will transfer instantly.' },
];

function brightenColor(hex: string, factor = 1.5): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const SEND_PANEL_BASE = 'send-panel';

// Recipient picker — shown inside the popover panel
type RecipientPickerProps = {
  senderCompany: Company;
  onSelectCompany: (company: Company) => void;
  onClose: () => void;
};

function RecipientPicker({ senderCompany, onSelectCompany, onClose }: RecipientPickerProps) {
  const [search, setSearch] = React.useState('');

  const recipients = companies
    .filter((c) => c.id !== senderCompany.id)
    .filter((c) =>
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (c.isCustomer && c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="flex flex-col" style={{ width: '340px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4" style={{ color: '#21252C' }} />
          <span className="text-sm font-semibold" style={{ color: '#21252C' }}>Send</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" style={{ color: '#596171' }} />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 border rounded-xl" style={{ borderColor: '#D8DEE4' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#8C96A4' }} />
          <input
            type="text"
            placeholder="Search by name or Stripe account"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            style={{ color: '#21252C' }}
            autoFocus
          />
        </div>
      </div>

      {/* Add new recipient */}
      <div className="pb-2">
        <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF0FF' }}>
            <Plus className="w-3.5 h-3.5" style={{ color: '#675DFF' }} />
          </div>
          <span className="text-sm font-medium" style={{ color: '#675DFF' }}>Add new recipient</span>
        </div>
      </div>

      {/* Section heading */}
      <div className="px-5 pb-2">
        <p className="text-sm font-medium" style={{ color: '#21252C' }}>Recent recipients</p>
      </div>
      <div className="pb-3">
        {recipients.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany(company)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            {company.isCustomer ? (
              <div className="w-6 h-6 rounded-lg flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: '#F5F6F8', color: '#596171', fontSize: '9px' }}>
                {company.icon}
              </div>
            ) : company.logoPath ? (
              <img src={company.logoPath} alt={company.name} className="w-6 h-6 object-contain flex-shrink-0" style={company.id === 'openai' ? { filter: 'brightness(0)' } : undefined} />
            ) : (
              <span className="text-sm font-bold flex-shrink-0" style={{ color: company.color }}>{company.icon}</span>
            )}
            <div className="flex items-center" style={{ gap: '8px' }}>
              <span className="font-medium text-sm" style={{ color: '#21252C' }}>{company.displayName}</span>
              {company.isCustomer ? (
                <span className="text-xs font-normal" style={{ color: '#596171' }}>{company.email}</span>
              ) : (
                <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F6F8', color: '#596171' }}>
                  @{company.name.toLowerCase().replace(/\s/g, '')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Convert cents to formatted dollars display
function formatCentsAsDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
// ─── Inline editable pill ─────────────────────────────────────────────────────

const PILL_BASE: React.CSSProperties = {
  display: 'inline',
  borderRadius: '4px',
  padding: '1px 5px',
  margin: '0 -3px',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.12s ease',
};

function EditablePill({
  isEditing,
  onOpen,
  displayContent,
  editContent,
}: {
  isEditing: boolean;
  onOpen: () => void;
  displayContent: React.ReactNode;
  editContent: React.ReactNode;
}) {
  if (isEditing) {
    return (
      <span style={{ ...PILL_BASE, backgroundColor: '#F0F1F3', cursor: 'default' }}>
        {editContent}
      </span>
    );
  }
  return (
    <span
      style={{ ...PILL_BASE, cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0F1F3')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      onClick={onOpen}
    >
      {displayContent}
    </span>
  );
}

// ─── Inline select pill helper ────────────────────────────────────────────────
// Renders visible label content with an invisible <select> overlaid on top.
function SelectPill({
  displayContent,
  selectValue,
  onSelectChange,
  onBlur,
  options,
}: {
  displayContent: React.ReactNode;
  selectValue: string;
  onSelectChange: (val: string) => void;
  onBlur: () => void;
  options: { value: string; label: string }[];
}) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {displayContent}
      <select
        autoFocus
        value={selectValue}
        onChange={(e) => onSelectChange(e.target.value)}
        onBlur={onBlur}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  );
}

// ─── Interactive sending summary paragraph ────────────────────────────────────
type SendingSummaryProps = {
  amountInCents: number;
  displayValue: string;
  onAmountInput: (val: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  receiverCompany: Company;
  onReceiverCompanyChange: (c: Company) => void;
  paymentMethodType: string;
  onMethodTypeChange: (t: string) => void;
  currentMethodType: MethodTypeOption;
  canEditMethod?: boolean;
};

function SendingSummary({
  amountInCents,
  displayValue,
  onAmountInput,
  paymentMethod,
  onPaymentMethodChange,
  receiverCompany,
  onReceiverCompanyChange,
  paymentMethodType,
  onMethodTypeChange,
  currentMethodType,
  canEditMethod = true,
}: SendingSummaryProps) {
  const [editing, setEditing] = React.useState<'amount' | 'source' | 'recipient' | 'method' | null>(null);
  const close = () => setEditing(null);

  const logoStyle = (id: string): React.CSSProperties => ({
    display: 'inline-block',
    height: '14px',
    width: '14px',
    verticalAlign: 'text-bottom',
    objectFit: 'contain',
    marginRight: '0.2em',
    ...(id === 'openai' ? { filter: 'brightness(0)' } : {}),
  });

  return (
    <p className="text-base" style={{ color: '#21252C', lineHeight: '1.7' }}>
      {'Sending '}
      {/* Amount */}
      <EditablePill
        isEditing={editing === 'amount'}
        onOpen={() => setEditing('amount')}
        displayContent={<span className="font-medium">${formatCentsAsDollars(amountInCents)}</span>}
        editContent={
          <input
            autoFocus
            type="text"
            value={displayValue}
            onChange={(e) => onAmountInput(e.target.value)}
            onBlur={close}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') close(); }}
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontWeight: 600, fontSize: 'inherit', color: '#21252C',
              padding: 0, width: `${Math.max(displayValue.length, 4)}ch`,
            }}
          />
        }
      />
      {' from '}
      {/* Funds source */}
      <EditablePill
        isEditing={editing === 'source'}
        onOpen={() => setEditing('source')}
        displayContent={
          <>
            {(paymentMethod.methodLogoPath || paymentMethod.logoPath) && (
              <img src={paymentMethod.methodLogoPath || paymentMethod.logoPath || ''} alt="" style={logoStyle('')} />
            )}
            <span className="font-medium">Main • {paymentMethod.displayName}</span>
          </>
        }
        editContent={
          <SelectPill
            displayContent={
              <>
                {(paymentMethod.methodLogoPath || paymentMethod.logoPath) && (
                  <img src={paymentMethod.methodLogoPath || paymentMethod.logoPath || ''} alt="" style={logoStyle('')} />
                )}
                <span className="font-medium">Main • {paymentMethod.displayName}</span>
              </>
            }
            selectValue={paymentMethod.id}
            onSelectChange={(val) => {
              const m = paymentMethods.find((p) => p.id === val);
              if (m) onPaymentMethodChange(m);
              close();
            }}
            onBlur={close}
            options={paymentMethods.map((p) => ({ value: p.id, label: `Main · ${p.displayName}` }))}
          />
        }
      />
      {' to '}
      {/* Recipient */}
      <EditablePill
        isEditing={editing === 'recipient'}
        onOpen={() => setEditing('recipient')}
        displayContent={
          <>
            {receiverCompany.logoPath && (
              <img src={receiverCompany.logoPath} alt="" style={logoStyle(receiverCompany.id)} />
            )}
            <span className="font-medium">{receiverCompany.displayName}</span>
          </>
        }
        editContent={
          <SelectPill
            displayContent={
              <>
                {receiverCompany.logoPath && (
                  <img src={receiverCompany.logoPath} alt="" style={logoStyle(receiverCompany.id)} />
                )}
                <span className="font-medium">{receiverCompany.displayName}</span>
              </>
            }
            selectValue={receiverCompany.id}
            onSelectChange={(val) => {
              const c = companies.find((co) => co.id === val);
              if (c) onReceiverCompanyChange(c);
              close();
            }}
            onBlur={close}
            options={companies.map((c) => ({ value: c.id, label: c.displayName }))}
          />
        }
      />
      {' via '}
      {/* Method */}
      {canEditMethod ? (
        <EditablePill
          isEditing={editing === 'method'}
          onOpen={() => setEditing('method')}
          displayContent={
            <>
              {currentMethodType.iconPath && (
                <img src={currentMethodType.iconPath} alt="" style={logoStyle('')} />
              )}
              <span className="font-medium">{currentMethodType.label}</span>
            </>
          }
          editContent={
            <SelectPill
              displayContent={
                <>
                  {currentMethodType.iconPath && (
                    <img src={currentMethodType.iconPath} alt="" style={logoStyle('')} />
                  )}
                  <span className="font-medium">{currentMethodType.label}</span>
                </>
              }
              selectValue={paymentMethodType}
              onSelectChange={(val) => { onMethodTypeChange(val); close(); }}
              onBlur={close}
              options={methodTypeOptions.map((m) => ({ value: m.value, label: m.label }))}
            />
          }
        />
      ) : (
        <>
          {currentMethodType.iconPath && (
            <img src={currentMethodType.iconPath} alt={currentMethodType.label} style={logoStyle('')} />
          )}
          <span className="font-medium">{currentMethodType.label}</span>
        </>
      )}
      {'. '}
      {currentMethodType.transferText}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function PaymentFlow({
  amountInCents,
  onAmountChange,
  senderCompany,
  onSenderCompanyChange,
  receiverCompany,
  onReceiverCompanyChange,
  paymentMethod,
  onPaymentMethodChange,
  layout,
  isModal = false,
  gradientVariant,
}: PaymentFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('select');
  const [cardAnimationState, setCardAnimationState] = useState<CardAnimationState>('full');
  const [paymentMethodType, setPaymentMethodType] = useState('stripe-network');
  const [displayValue, setDisplayValue] = useState(formatCentsAsDollars(amountInCents));
  // 'idle' | 'popover' | 'dialog'
  const [uiPhase, setUiPhase] = useState<'idle' | 'popover' | 'dialog'>('idle');
  // profiles-mode: show landing page or payment flow
  const [profilePhase, setProfilePhase] = useState<'profile' | 'payment'>('profile');
  // Rotates each time the dialog closes so the popover never inherits the dialog's layoutId position
  const [morphKey, setMorphKey] = useState(0);
  const SEND_PANEL_ID = `${SEND_PANEL_BASE}-${morphKey}`;
  const popoverRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLDivElement>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; left: number } | null>(null);
  const [glowHovered, setGlowHovered] = useState(false);
  const [profileReviewOpen, setProfileReviewOpen] = useState(false);
  const { ref: morphCardRef, clipPath: morphCardClipPath } = useSquircle(24, 1);

  const isPersonInvolved = !!(senderCompany.isCustomer || receiverCompany.isCustomer);

  const currency = paymentMethodType === 'stablecoin' ? 'USDC' : 'USD';
  const currentMethodType = methodTypeOptions.find((m) => m.value === paymentMethodType) ?? methodTypeOptions[0];

  // Lock method to Stripe Network + default source to Stripe balance for company-to-company flows; reset review popover
  useEffect(() => {
    if (!isPersonInvolved) {
      setPaymentMethodType('stripe-network');
      const stripeBalance = paymentMethods.find((p) => p.id === 'stripe');
      if (stripeBalance) onPaymentMethodChange(stripeBalance);
    }
    setProfileReviewOpen(false);
  }, [isPersonInvolved]);

  // Sync display value when parent amount changes
  useEffect(() => {
    setDisplayValue(formatCentsAsDollars(amountInCents));
  }, [amountInCents]);

  // Escape key closes popover or dialog
  useEffect(() => {
    if (!isModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (uiPhase === 'popover') {
          setUiPhase('idle');
        } else if (uiPhase === 'dialog') {
          setUiPhase('idle');
          setFlowState('select');
          setCardAnimationState('full');
          setMorphKey((k) => k + 1);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModal, uiPhase]);

  // Click-outside closes popover via mousedown listener (avoids z-index overlay issues)
  useEffect(() => {
    if (uiPhase !== 'popover') return;
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setUiPhase('idle');
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [uiPhase]);

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

  const handleReview = () => {
    if (amountInCents > 0) {
      setFlowState('review');
    }
  };

  const handleConfirmAndSend = () => {
    setFlowState('sending');
    setCardAnimationState('full');

    // t=600: trigger sending animations (text roll + connector flow)
    setTimeout(() => setCardAnimationState('sending'), 600);
    // t=3000: ~2.4s hold → transition to Sent/Received
    setTimeout(() => setCardAnimationState('minimal'), 3000);
    setTimeout(() => {
      setCardAnimationState('complete');
      setFlowState('sent');
    }, 4000);
  };

  const handleBack = () => {
    if (flowState === 'review') {
      setFlowState('select');
    } else if (flowState === 'sent' || flowState === 'sending') {
      setFlowState('select');
      setCardAnimationState('full');
    }
  };

  const handleCloseDialog = () => {
    setUiPhase('idle');
    setFlowState('select');
    setCardAnimationState('full');
    // Rotate the layoutId so the next popover open doesn't inherit the dialog's position
    setMorphKey((k) => k + 1);
  };

  const handleBackToProfile = () => {
    setProfilePhase('profile');
    setFlowState('select');
    setCardAnimationState('full');
  };

  const gradientColor = (company: typeof senderCompany) =>
    company.isCustomer ? '#D8DEE4' : company.color;

  const sendingState: SendingState =
    cardAnimationState === 'sending' ? 'sending'
    : (cardAnimationState === 'minimal' || cardAnimationState === 'complete') ? 'sent'
    : 'idle';

  const renderCardPreview = () => (
    <div className="flex flex-col items-center w-full">
      <PaymentCard
        company={senderCompany}
        paymentMethod={paymentMethod}
        amount={amountInCents / 100}
        layout={layout}
        sendingState={sendingState}
      />
      <MethodChipConnector methodType={currentMethodType} sendingState={sendingState} />
      <PaymentCard
        company={receiverCompany}
        paymentMethod={paymentMethod}
        amount={amountInCents / 100}
        layout={layout}
        isReceiver
        receiverDelivery={currentMethodType.deliveryText}
        sendingState={sendingState}
      />
    </div>
  );

  const renderModalFlowStates = () => (
    <AnimatePresence mode="wait">
      {flowState === 'select' && (
        <motion.div
          key="select"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex flex-col h-full"
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="mb-8">
              <div className="flex items-center justify-center">
                <span className="text-base" style={{ color: '#596171' }}>$</span>
                <input
                  type="text"
                  value={displayValue}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  className="tabular-nums border-none outline-none bg-transparent text-center"
                  style={{ color: '#21252C', fontSize: '54px', fontWeight: 500, width: `${Math.max(displayValue.length * 0.6, 3)}em` }}
                  placeholder="2,000.00"
                />
                <span className="text-base" style={{ color: '#596171' }}>
                  {currency}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">From</label>
              <div className="relative inline-block">
                <Squircle cornerRadius={8} cornerSmoothing={1} className="overflow-hidden" style={{ backgroundColor: '#F5F6F8' }}>
                  <div className="flex items-center gap-3 px-4 pointer-events-none" style={{ height: '48px' }}>
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                      {paymentMethod.methodLogoPath ? (
                        <img src={paymentMethod.methodLogoPath} alt={paymentMethod.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: paymentMethod.color }}>{paymentMethod.icon}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-normal" style={{ color: '#21252C', fontSize: '14px' }}>Main · {paymentMethod.displayName}</span>
                      <img src="/img/arrowUpDown.svg" alt="" className="opacity-50" style={{ width: '12px', height: '12px' }} />
                    </div>
                  </div>
                </Squircle>
                <select
                  value={paymentMethod.id}
                  onChange={(e) => {
                    const selected = paymentMethods.find((p) => p.id === e.target.value);
                    if (selected) onPaymentMethodChange(selected);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {paymentMethods.map((p) => (
                    <option key={p.id} value={p.id}>Main · {p.displayName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">To</label>
              <div className="relative inline-block">
                <Squircle cornerRadius={8} cornerSmoothing={1} className="overflow-hidden" style={{ backgroundColor: '#F5F6F8' }}>
                  <div className="flex items-center gap-3 px-4 pointer-events-none" style={{ height: '48px' }}>
                    <div className="w-8 h-8 flex-shrink-0">
                      {receiverCompany.isCustomer ? (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-semibold" style={{ backgroundColor: '#F5F6F8', color: '#596171', fontSize: '11px' }}>{receiverCompany.icon}</div>
                      ) : receiverCompany.logoPath ? (
                        <img src={receiverCompany.logoPath} alt={receiverCompany.name} className="w-8 h-8 object-contain rounded-xl" style={receiverCompany.id === 'openai' ? { filter: 'brightness(0)' } : undefined} />
                      ) : (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: receiverCompany.color }}>{receiverCompany.icon}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-normal" style={{ color: '#21252C', fontSize: '14px' }}>{receiverCompany.displayName}</span>
                      {receiverCompany.isCustomer ? (
                        <span className="font-normal flex-shrink-0" style={{ color: '#596171', fontSize: '12px' }}>{receiverCompany.email}</span>
                      ) : (
                        <span className="font-normal px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#D8DEE4', color: '#596171', fontSize: '12px' }}>
                          @{receiverCompany.name.toLowerCase().replace(/\s/g, '')}
                        </span>
                      )}
                      <img src="/img/arrowUpDown.svg" alt="" className="opacity-50 flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                    </div>
                  </div>
                </Squircle>
                <select
                  value={receiverCompany.id}
                  onChange={(e) => {
                    const selected = companies.find((c) => c.id === e.target.value);
                    if (selected) onReceiverCompanyChange(selected);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.displayName}</option>
                  ))}
                </select>
              </div>
            </div>

            {isPersonInvolved && (
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Method</label>
                <div className="relative inline-block">
                  <Squircle cornerRadius={8} cornerSmoothing={1} className="overflow-hidden" style={{ backgroundColor: '#F5F6F8' }}>
                    <div className="flex items-center gap-3 px-4 pointer-events-none" style={{ height: '48px' }}>
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        {currentMethodType.iconPath ? (
                          <img src={currentMethodType.iconPath} alt={currentMethodType.label} className="w-8 h-8 object-contain" />
                        ) : (
                          <svg className="w-5 h-5" style={{ color: '#596171' }} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="min-w-0">
                          <div className="font-normal" style={{ color: '#21252C', fontSize: '14px' }}>{currentMethodType.label}</div>
                          <div style={{ color: '#596171', fontSize: '12px' }}>{currentMethodType.subtitle}</div>
                        </div>
                        <img src="/img/arrowUpDown.svg" alt="" className="opacity-50 flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                      </div>
                    </div>
                  </Squircle>
                  <select
                    value={paymentMethodType}
                    onChange={(e) => setPaymentMethodType(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  >
                    {methodTypeOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Fixed buttons at bottom */}
          <div className="flex gap-4 shrink-0">
            <button className="flex-1 px-6 py-3 border text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors" style={{ borderColor: '#D8DEE4', borderRadius: '6px' }}>
              Back
            </button>
            <button
              onClick={handleReview}
              className="flex-1 px-6 py-3 text-white text-base font-semibold transition-colors"
              style={{ backgroundColor: '#675DFF', borderRadius: '6px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5549E6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#675DFF'}
            >
              Review
            </button>
          </div>
        </motion.div>
      )}

      {flowState === 'review' && (
        <motion.div
          key="review"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex flex-col h-full"
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <h2 className="text-lg font-bold mb-6" style={{ color: '#21252C' }}>Summary</h2>

            <div className="mb-6">
              <SendingSummary
                amountInCents={amountInCents}
                displayValue={displayValue}
                onAmountInput={handleAmountInput}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={onPaymentMethodChange}
                receiverCompany={receiverCompany}
                onReceiverCompanyChange={onReceiverCompanyChange}
                paymentMethodType={paymentMethodType}
                onMethodTypeChange={setPaymentMethodType}
                currentMethodType={currentMethodType}
                canEditMethod={isPersonInvolved}
              />
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                Add an internal note
                <span className="text-xs font-normal text-gray-500">Optional</span>
              </label>
              <textarea
                placeholder="Describe the purpose of sending funds."
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none h-32"
                style={{
                  borderColor: '#D8DEE4',
                  '--tw-ring-color': '#675DFF'
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Fixed buttons at bottom */}
          <div className="flex gap-4 shrink-0">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#D8DEE4', borderRadius: '6px' }}
            >
              Back
            </button>
            <button
              onClick={handleConfirmAndSend}
              className="flex-1 px-6 py-3 text-white text-base font-semibold transition-colors"
              style={{ backgroundColor: '#675DFF', borderRadius: '6px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5549E6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#675DFF'}
            >
              Confirm and send
            </button>
          </div>
        </motion.div>
      )}

      {(flowState === 'sending' || flowState === 'sent') && (
        <motion.div
          key="sending"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center flex-1"
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: '#21252C' }}>
              {flowState === 'sent' ? 'Payment Sent!' : 'Sending payment...'}
            </div>
            <div className="text-gray-600">
              {flowState === 'sent' ? 'Your payment has been successfully sent' : 'Please wait while we process your payment'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderProfilesFlowStates = () => (
    <AnimatePresence mode="wait">
      {flowState === 'select' && (
        <motion.div
          key="select"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex flex-col flex-1"
        >
          <div className="mb-8">
            <SendingSummary
              amountInCents={amountInCents}
              displayValue={displayValue}
              onAmountInput={handleAmountInput}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
              receiverCompany={receiverCompany}
              onReceiverCompanyChange={onReceiverCompanyChange}
              paymentMethodType={paymentMethodType}
              onMethodTypeChange={setPaymentMethodType}
              currentMethodType={currentMethodType}
              canEditMethod={isPersonInvolved}
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">From</label>
            <div className="relative inline-block">
              <Squircle cornerRadius={8} cornerSmoothing={1} className="overflow-hidden" style={{ backgroundColor: '#F5F6F8' }}>
                <div className="flex items-center gap-3 px-4 pointer-events-none" style={{ height: '48px' }}>
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {paymentMethod.methodLogoPath ? (
                      <img src={paymentMethod.methodLogoPath} alt={paymentMethod.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: paymentMethod.color }}>{paymentMethod.icon}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-normal" style={{ color: '#21252C', fontSize: '14px' }}>Main · {paymentMethod.displayName}</span>
                    <img src="/img/arrowUpDown.svg" alt="" className="opacity-50" style={{ width: '12px', height: '12px' }} />
                  </div>
                </div>
              </Squircle>
              <select
                value={paymentMethod.id}
                onChange={(e) => {
                  const selected = paymentMethods.find((p) => p.id === e.target.value);
                  if (selected) onPaymentMethodChange(selected);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>Main · {p.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          {isPersonInvolved && (
            <div className="mb-auto">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Method</label>
              <div className="relative inline-block">
                <Squircle cornerRadius={8} cornerSmoothing={1} className="overflow-hidden" style={{ backgroundColor: '#F5F6F8' }}>
                  <div className="flex items-center gap-3 px-4 pointer-events-none" style={{ height: '48px' }}>
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                      {currentMethodType.iconPath ? (
                        <img src={currentMethodType.iconPath} alt={currentMethodType.label} className="w-8 h-8 object-contain" />
                      ) : (
                        <svg className="w-5 h-5" style={{ color: '#596171' }} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className="font-normal" style={{ color: '#21252C', fontSize: '14px' }}>{currentMethodType.label}</div>
                        <div style={{ color: '#596171', fontSize: '12px' }}>{currentMethodType.subtitle}</div>
                      </div>
                      <img src="/img/arrowUpDown.svg" alt="" className="opacity-50 flex-shrink-0" style={{ width: '12px', height: '12px' }} />
                    </div>
                  </div>
                </Squircle>
                <select
                  value={paymentMethodType}
                  onChange={(e) => setPaymentMethodType(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {methodTypeOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <button
              onClick={handleBackToProfile}
              className="flex-1 px-6 py-3 border text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#D8DEE4', borderRadius: '6px' }}
            >
              Back
            </button>
            <button
              onClick={handleConfirmAndSend}
              className="flex-1 px-6 py-3 text-white text-base font-semibold transition-colors"
              style={{ backgroundColor: '#675DFF', borderRadius: '6px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5549E6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#675DFF'}
            >
              Confirm and send
            </button>
          </div>
        </motion.div>
      )}

      {flowState === 'review' && (
        <motion.div
          key="review"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex flex-col flex-1"
        >
          <div className="mb-6">
            <SendingSummary
              amountInCents={amountInCents}
              displayValue={displayValue}
              onAmountInput={handleAmountInput}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
              receiverCompany={receiverCompany}
              onReceiverCompanyChange={onReceiverCompanyChange}
              paymentMethodType={paymentMethodType}
              onMethodTypeChange={setPaymentMethodType}
              currentMethodType={currentMethodType}
              canEditMethod={isPersonInvolved}
            />
          </div>

          <div className="mb-auto">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Add an internal note
              <span className="text-xs font-normal text-gray-500">Optional</span>
            </label>
            <textarea
              placeholder="Describe the purpose of sending funds."
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none h-32"
              style={{
                borderColor: '#D8DEE4',
                '--tw-ring-color': '#675DFF'
              } as React.CSSProperties}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#D8DEE4', borderRadius: '6px' }}
            >
              Back
            </button>
            <button
              onClick={handleConfirmAndSend}
              className="flex-1 px-6 py-3 text-white text-base font-semibold transition-colors"
              style={{ backgroundColor: '#675DFF', borderRadius: '6px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5549E6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#675DFF'}
            >
              Confirm and send
            </button>
          </div>
        </motion.div>
      )}

      {(flowState === 'sending' || flowState === 'sent') && (
        <motion.div
          key="sending"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center flex-1"
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: '#21252C' }}>
              {flowState === 'sent' ? 'Payment Sent!' : 'Sending payment...'}
            </div>
            <div className="text-gray-600">
              {flowState === 'sent' ? 'Your payment has been successfully sent' : 'Please wait while we process your payment'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Payment options shown on the profile landing screen
  const profilePaymentOptions = [
    { value: 'stripe-network', label: 'Pay with your Stripe balance', subtitle: 'Arrives instantly · Free', primary: true },
    { value: 'direct-bank', label: 'Direct bank transfer', subtitle: null, primary: false },
    { value: 'stablecoin', label: 'Pay with stablecoins', subtitle: null, primary: false },
    { value: 'link', label: 'Pay with Link', subtitle: null, primary: false },
  ];

  const renderProfileLanding = () => (
    <AnimatedGradientBg
      color1={gradientColor(senderCompany)}
      color2={gradientColor(receiverCompany)}
      variant={gradientVariant}
      className="w-full h-full relative flex items-center justify-center p-8"
    >
      <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
        <img src="/img/stripe-logo.svg" alt="Stripe" style={{ width: '24px', height: 'auto' }} />
        <span style={{ fontSize: '14px', fontWeight: 400, color: '#21252C' }}>
          <a href="https://profiles.stripe.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>Profiles</a>
          {' '}powered by Stripe
        </span>
      </div>
      <motion.div layout transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.38 }} className="relative z-10 flex flex-col" style={{ width: '360px', gap: '32px' }}>
        {/* Profile card */}
        <motion.div layout transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.38 }}>
        <Squircle cornerRadius={24} cornerSmoothing={1} className="bg-white overflow-hidden" style={{ filter: 'drop-shadow(0 8px 24px rgba(53,58,68,0.10))' }}>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0" style={{ width: '44px', height: '44px' }}>
                {receiverCompany.isCustomer ? (
                  <div className="w-full h-full rounded-2xl flex items-center justify-center font-bold" style={{ backgroundColor: '#F5F6F8', color: '#596171', fontSize: '14px' }}>
                    {receiverCompany.icon}
                  </div>
                ) : receiverCompany.logoPath ? (
                  <img
                    src={receiverCompany.logoPath}
                    alt={receiverCompany.displayName}
                    className="w-full h-full object-contain"
                    style={receiverCompany.id === 'openai' ? { filter: 'brightness(0)' } : undefined}
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl flex items-center justify-center" style={{ backgroundColor: receiverCompany.color }}>
                    <span className="text-white text-xl font-bold">{receiverCompany.icon}</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-base" style={{ color: '#21252C' }}>{receiverCompany.displayName}</h1>
                <div className="flex items-center gap-1 mt-0.5">
                  {receiverCompany.isCustomer ? (
                    <span style={{ color: '#596171', fontSize: '12px' }}>{receiverCompany.email}</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F6F8', color: '#596171', fontSize: '12px' }}>
                      @{receiverCompany.name.toLowerCase().replace(/\s/g, '')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {receiverCompany.description && (
              <p style={{ color: '#21252C', lineHeight: '1.55', fontSize: '16px' }}>
                {receiverCompany.description}
              </p>
            )}
          </div>
        </Squircle>
        </motion.div>

        {/* Payment options card */}
        {!isPersonInvolved ? (
          <MotionConfig transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.38 }}>
            <div
              className="relative w-full"
              onMouseEnter={() => !profileReviewOpen && setGlowHovered(true)}
              onMouseLeave={() => setGlowHovered(false)}
            >
              {/* Glow — fades out when review form is open */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ inset: 0 }}
                animate={{ opacity: profileReviewOpen ? 0 : 1 }}
                transition={{ duration: 0.15 }}
              >
                <GlowEffect
                  colors={[
                    brightenColor(senderCompany.color, 1.6),
                    brightenColor(receiverCompany.color, 1.6),
                    brightenColor(senderCompany.color, 1.3),
                    brightenColor(receiverCompany.color, 1.3),
                  ]}
                  mode="rotate"
                  blur="soft"
                  duration={6}
                  scale={1}
                  style={{
                    inset: glowHovered ? '-10px' : '-8px',
                    borderRadius: '28px',
                    opacity: glowHovered ? 0.75 : 0.5,
                    transition: 'inset 0.3s ease, opacity 0.3s ease',
                  }}
                />
              </motion.div>

              {/* Morphing card: dark button → white review form */}
              <motion.div
                ref={morphCardRef}
                layout
                animate={{ backgroundColor: profileReviewOpen ? '#ffffff' : '#21252C' }}
                className="relative w-full overflow-hidden"
                style={{ clipPath: morphCardClipPath || undefined, cursor: profileReviewOpen ? 'default' : 'pointer' }}
                onClick={!profileReviewOpen ? () => { setGlowHovered(false); setProfileReviewOpen(true); } : undefined}
              >
                {/* Header — always present; colors animate dark→light as card opens */}
                <div style={{ padding: '18px 20px' }} className={profileReviewOpen ? '' : 'text-center'}>
                  <motion.div
                    animate={{ color: profileReviewOpen ? '#21252C' : '#ffffff' }}
                    className="font-semibold"
                    style={{ fontSize: '16px' }}
                  >
                    Review payment details
                  </motion.div>
                  <motion.div
                    animate={{ color: profileReviewOpen ? '#596171' : 'rgba(255,255,255,0.5)' }}
                    className="mt-1"
                    style={{ fontSize: '14px' }}
                  >
                    ${formatCentsAsDollars(amountInCents)} invoice received Feb 12
                  </motion.div>
                </div>

                {/* Form content — fades in below the header */}
                <AnimatePresence>
                  {profileReviewOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.15 }}
                      className="px-5 pb-5"
                    >
                      <div style={{ borderTop: '1px solid #E9EAEC', marginBottom: '20px' }} />

                      {/* Description */}
                      <div className="mb-6">
                        <SendingSummary
                          amountInCents={amountInCents}
                          displayValue={displayValue}
                          onAmountInput={handleAmountInput}
                          paymentMethod={paymentMethod}
                          onPaymentMethodChange={onPaymentMethodChange}
                          receiverCompany={receiverCompany}
                          onReceiverCompanyChange={onReceiverCompanyChange}
                          paymentMethodType={paymentMethodType}
                          onMethodTypeChange={setPaymentMethodType}
                          currentMethodType={currentMethodType}
                          canEditMethod={false}
                        />
                      </div>

                      {/* Confirm button */}
                      <button
                        onClick={() => {
                          setProfileReviewOpen(false);
                          handleConfirmAndSend();
                        }}
                        className="w-full px-6 py-3 text-white text-base font-semibold transition-colors"
                        style={{ backgroundColor: '#675DFF', borderRadius: '6px' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5549E6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#675DFF'}
                      >
                        Confirm and send
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </MotionConfig>
        ) : (
          <Squircle cornerRadius={24} cornerSmoothing={1} className="bg-white overflow-hidden" style={{ filter: 'drop-shadow(0 8px 24px rgba(53,58,68,0.10))' }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm" style={{ color: '#21252C' }}>
                  Pay {receiverCompany.displayName}
                </span>
                <span className="font-semibold text-sm tabular-nums" style={{ color: '#21252C' }}>
                  ${formatCentsAsDollars(amountInCents)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {profilePaymentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPaymentMethodType(opt.value);
                      setProfilePhase('payment');
                      setFlowState('select');
                    }}
                    className="w-full rounded-xl text-left transition-opacity hover:opacity-80"
                    style={
                      opt.primary
                        ? { backgroundColor: '#21252C', padding: '14px 16px' }
                        : { padding: '12px 16px', border: '1px solid #D8DEE4' }
                    }
                  >
                    {opt.primary ? (
                      <div>
                        <div className="text-sm font-semibold text-white">{opt.label}</div>
                        {opt.subtitle && (
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {opt.subtitle}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: '#596171' }}>{opt.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Squircle>
        )}
      </motion.div>
    </AnimatedGradientBg>
  );

  if (isModal) {
    return (
      <MotionConfig transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}>
        <div className="relative w-full h-full bg-white overflow-hidden">

          {/* Backdrop — fades in when dialog is open */}
          <AnimatePresence>
            {uiPhase === 'dialog' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: '#B6C0CD', zIndex: 30 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {/* Popover panel — fixed position bypasses overflow-hidden; anchor aligns "Send" text with button */}
          <AnimatePresence>
            {uiPhase === 'popover' && popoverAnchor && (
              <div
                className="pointer-events-none"
                style={{ position: 'fixed', inset: 0, zIndex: 50 }}
              >
                <motion.div
                  ref={popoverRef}
                  layoutId={SEND_PANEL_ID}
                  className="bg-white overflow-hidden pointer-events-auto"
                  style={{
                    position: 'absolute',
                    top: popoverAnchor.top,
                    left: popoverAnchor.left,
                    borderRadius: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <RecipientPicker
                    senderCompany={senderCompany}
                    onSelectCompany={(company) => {
                      onReceiverCompanyChange(company);
                      setFlowState('select');
                      setUiPhase('dialog');
                    }}
                    onClose={() => setUiPhase('idle')}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Action buttons — pinned to top with 120px padding */}
          <div className="absolute inset-x-0 top-0 flex justify-center" style={{ zIndex: 20, paddingTop: 120 }}>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-80" style={{ backgroundColor: '#F5F6F8', color: '#21252C', borderRadius: '100px' }}>
                <ArrowLeftRight className="w-4 h-4" />
                Transfer
              </button>

              {/* Send button — shares layoutId with popover panel for morph transition */}
              <motion.div
                ref={sendButtonRef}
                layoutId={SEND_PANEL_ID}
                style={{
                  borderRadius: '100px',
                  overflow: 'hidden',
                  backgroundColor: '#F5F6F8',
                  pointerEvents: uiPhase === 'idle' ? 'auto' : 'none',
                }}
                animate={{ opacity: uiPhase === 'idle' ? 1 : 0 }}
                transition={{ opacity: { duration: 0.1 } }}
              >
                <button
                  onClick={() => {
                    if (sendButtonRef.current) {
                      const rect = sendButtonRef.current.getBoundingClientRect();
                      // Offset so popover "Send" text (at px-5 + icon + gap = 44px, pt-5 + half-line = 30px)
                      // aligns with button "Send" text (at px-4 + icon + gap = 40px, center = height/2)
                      setPopoverAnchor({
                        top: rect.top + rect.height / 2 - 30,
                        left: rect.left - 4,
                      });
                    }
                    setUiPhase('popover');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ background: 'none', color: '#21252C' }}
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </motion.div>

              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-80" style={{ backgroundColor: '#F5F6F8', color: '#21252C', borderRadius: '100px' }}>
                <Globe className="w-4 h-4" />
                Convert
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-80" style={{ backgroundColor: '#F5F6F8', color: '#21252C', borderRadius: '100px' }}>
                <ArrowDownToLine className="w-4 h-4" />
                Deposit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-80" style={{ backgroundColor: '#F5F6F8', color: '#21252C', borderRadius: '100px' }}>
                <CreditCard className="w-4 h-4" />
                Create card
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-80" style={{ backgroundColor: '#F5F6F8', color: '#21252C', borderRadius: '100px' }}>
                <ReceiptText className="w-4 h-4" />
                Request
              </button>
            </div>
          </div>

          {/* Dialog panel — shares layoutId with the popover panel; morphs from popover position */}
          <AnimatePresence>
            {uiPhase === 'dialog' && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none px-6"
                style={{ zIndex: 40 }}
              >
                <motion.div
                  layoutId={SEND_PANEL_ID}
                  className="pointer-events-auto w-full max-w-[960px] bg-white shadow-2xl flex flex-col overflow-hidden relative"
                  style={{ borderRadius: '12px', maxHeight: 'calc(100vh - 48px)' }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <div className="p-6 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}>
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-6 shrink-0">
                      <div className="flex items-center gap-4">
                        <Send className="w-4 h-4" style={{ color: '#21252C' }} />
                        <h1 className="text-sm font-medium" style={{ color: '#21252C' }}>Send</h1>
                      </div>
                      <button
                        onClick={handleCloseDialog}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-4 h-4" style={{ color: '#596171' }} />
                      </button>
                    </div>

                    {/* Content row — form left, cards right */}
                    <div className="flex flex-1 gap-6 overflow-hidden">
                      {/* Left side — payment form */}
                      <div className="w-1/2 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {renderModalFlowStates()}
                        </div>
                      </div>

                      {/* Right side — card preview */}
                      <AnimatedGradientBg
                        color1={gradientColor(senderCompany)}
                        color2={gradientColor(receiverCompany)}
                        variant={gradientVariant}
                        className="w-1/2 flex items-center justify-center rounded-xl py-12"
                      >
                        {renderCardPreview()}
                      </AnimatedGradientBg>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </MotionConfig>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {profilePhase === 'profile' ? (
          <motion.div
            key="profile-landing"
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {renderProfileLanding()}
          </motion.div>
        ) : (
          <motion.div
            key="payment-flow"
            className="w-full h-full flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="w-full md:w-1/2 flex flex-col py-8 px-4 md:pr-20 md:px-8 bg-white items-end overflow-auto">
              <div className="w-full max-w-[560px] flex-1 flex items-center">
                {renderProfilesFlowStates()}
              </div>
              <div className="w-full max-w-[560px] shrink-0 flex items-center" style={{ gap: '8px' }}>
                <img src="/img/stripe-logo.svg" alt="Stripe" style={{ width: '24px', height: 'auto' }} />
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#21252C' }}>
                  <a href="https://profiles.stripe.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>Profiles</a>
                  {' '}powered by Stripe
                </span>
              </div>
            </div>

            <div className="hidden md:flex md:w-1/2 items-center justify-center bg-white" style={{ padding: '40px' }}>
              <AnimatedGradientBg
                color1={gradientColor(senderCompany)}
                color2={gradientColor(receiverCompany)}
                variant={gradientVariant}
                className="w-full h-full flex items-center justify-center rounded-2xl p-8"
              >
                {renderCardPreview()}
              </AnimatedGradientBg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MethodChipConnector({ methodType, sendingState }: { methodType: MethodTypeOption; sendingState: SendingState }) {
  const DOT_SIZE = 6;
  const DOT_GAP = 6;
  const CARD_GAP = 12;

  return (
    <div
      style={{
        position: 'relative',
        width: '256px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: `${CARD_GAP}px`,
        paddingBottom: `${CARD_GAP}px`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${DOT_GAP}px` }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: `${DOT_SIZE}px`,
              height: `${DOT_SIZE}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.65)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

type TransactionCardProps = {
  company: Company;
  paymentMethod: PaymentMethod;
  amount: number;
  status: 'sending' | 'sent' | 'receiving' | 'received';
  animationState: CardAnimationState;
  isSender: boolean;
};

function TransactionCard({
  company,
  paymentMethod,
  amount,
  status,
  animationState,
  isSender,
}: TransactionCardProps) {
  const getStatusText = () => {
    if (animationState === 'minimal' || animationState === 'complete') {
      return status === 'sent' || status === 'sending' ? 'Sent' : 'Received';
    }
    if (status === 'receiving') return 'Receiving...';
    if (status === 'received') return 'Received instantly';
    return null;
  };

  const showFullContent = animationState === 'full' || animationState === 'sending';
  const statusText = getStatusText();

  return (
    <motion.div
      layout
      className="w-64 rounded-2xl overflow-hidden shadow-lg bg-white"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <motion.div
        layout
        className="px-5 py-3 flex items-center gap-2.5"
        style={{ backgroundColor: company.color }}
      >
        <span className="text-white text-lg font-semibold">{company.icon}</span>
        <motion.span layout className="text-white text-sm font-semibold">
          {company.displayName}
        </motion.span>
      </motion.div>

      <motion.div layout className="px-5 py-5">
        <AnimatePresence mode="wait">
          {showFullContent ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-4xl font-bold text-gray-900 mb-4 tabular-nums">
                $<SlidingNumber value={amount} />
              </div>

              {statusText && animationState === 'sending' && (
                <div className="text-sm text-gray-600 mb-3">{statusText}</div>
              )}

              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: paymentMethod.color }}
                >
                  {paymentMethod.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 leading-tight">
                    {paymentMethod.displayName}
                  </span>
                  {paymentMethod.last4 && (
                    <span className="text-xs text-gray-600">••{paymentMethod.last4}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="minimal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl font-bold text-gray-900"
            >
              {statusText}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
